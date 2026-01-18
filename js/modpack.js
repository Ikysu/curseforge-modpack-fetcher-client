const downloadMod = async ({ modId, fileId, log }) => {
  const logWithPrefix = (text) => log(`[Mod: ${modId}/${fileId}] ${text}`);
  const fileCacheName = `mod-${modId}-${fileId}`;
  let fileResponse = await window.ModCache.match(fileCacheName);
  if (!fileResponse) {
    try {
      logWithPrefix(`Downloading`);
      fileResponse = await CF.download({
        modId,
        fileId,
      });
    } catch (error) {
      logWithPrefix(`Download response error: ${String(error)}`);
    }

    if (!fileResponse) {
      try {
        logWithPrefix(`Downloading via Cookie`);
        fileResponse = await CF.downloadAlt({
          modId,
          fileId,
        });
      } catch (error) {
        logWithPrefix(`Alt download response error: ${String(error)}`);
        return;
      }
    }

    const clonedFileResponse = fileResponse.clone();
    await window.ModCache.put(fileCacheName, clonedFileResponse);
  } else {
    logWithPrefix(`Reading from cache ${fileCacheName}`);
  }

  try {
    blob = await fileResponse.blob();
  } catch (error) {
    logWithPrefix(`Blob error: ${String(error)}`);
    return;
  }

  return {
    blob,
    displayName: fileResponse.headers.get("x-filename"),
    classId: fileResponse.headers.get("x-mod-classid"),
    subfolder: fileResponse.headers.get("x-subfolder"),
  };
};

const buildModpack = async ({ modpack, clear, log }) => {
  clear();
  const file = modpack.latestFiles.at(-1);

  let modpackBlob;
  try {
    log(`[Modpack] Downloading overrides`);
    const { blob } = await downloadMod({
      modId: file.modId,
      fileId: file.id,
      log,
    });
    modpackBlob = blob;
  } catch (error) {
    log(`[Modpack] Fail download overrides: ${error}`);
    return;
  }

  let modpackZip;
  try {
    log(`[Modpack] Reading zip`);
    modpackZip = await JSZip.loadAsync(blob);
  } catch (error) {
    log(`[Modpack] Reading zip error: ${String(error)}`);
    return;
  }

  window.modpackOriginalZip = modpackZip;

  let manifest;
  try {
    const manifestFile = await modpackZip.file("manifest.json").async("string");
    manifest = JSON.parse(manifestFile);
  } catch (error) {
    log(`[Modpack] Error reading manifest: ${String(error)}`);
  }

  console.info("Modpack ZIP:", modpackZip);

  console.info("Manifest: ", manifest);
  console.info("Modpack: ", modpack);

  const finalZip = new JSZip();
  let overridesCount = 0;
  for (const path in modpackZip.files) {
    if (!path.startsWith(manifest.overrides)) continue;
    overridesCount++;
    const file = modpackZip.files[path];
    let relativePath = path.slice(manifest.overrides.length);
    if (relativePath.startsWith("/")) relativePath = relativePath.slice(1);

    if (file.dir) {
      await finalZip.folder(relativePath);
    } else {
      const content = await file.async("uint8array");
      await finalZip.file(relativePath, content);
    }
  }

  log(
    `[Overrides] Copy done! ${
      Object.keys(finalZip.files).length
    }/${overridesCount}`,
  );

  for (const { projectID, fileID } of manifest.files) {
    const mod = await downloadMod({
      modId: projectID,
      fileId: fileID,
      log,
    });

    if (!mod) {
      log(`[Modpack] Stopped.`);
      return;
    }

    const fileName = decodeURIComponent(mod.displayName);
    finalZip.file(`${mod.subfolder}/${fileName}`, mod.blob);
  }

  log(`[Modpack] Done.`);
  const finalBlob = await finalZip.generateAsync({ type: "blob" });
  const exportUrl = URL.createObjectURL(finalBlob);
  // window.location.assign(exportUrl);

  const currentLoader = Number(document.getElementById("search-loader")?.value);
  const currentVersion = document.getElementById("search-version")?.value;
  const finalZipName = `[${
    window.mcLoaders.find(({ id }) => id === currentLoader)?.name || "Unknown"
  } ${currentVersion || "Unknown"}] ${manifest.name}.zip`;

  const link = document.createElement("a");
  link.href = exportUrl;
  link.download = finalZipName;
  link.click();

  link.remove();
  URL.revokeObjectURL(exportUrl);
};

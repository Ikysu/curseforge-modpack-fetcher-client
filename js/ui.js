const renderUI = async () => {
  window.ModCache = await caches.open("cfmp-fetcher");

  const disables = [
    // Find Minecraft modpack
    [
      () => {
        document.getElementById("cfkey").disabled = false;
      },
      () => {
        document.getElementById("cfkey").disabled = true;
      },
    ],
    [
      () => {
        const searchElement = document.getElementById("search-input");
        searchElement.disabled = false;
        document.getElementById("search-version").disabled = false;
        document.getElementById("search-loader").disabled = false;
      },
      () => {
        const searchElement = document.getElementById("search-input");
        searchElement.value = "";
        searchElement.disabled = true;
        document.getElementById("search-result").innerHTML = "";
        document.getElementById("search-version").disabled = true;
        document.getElementById("search-loader").disabled = true;
      },
    ],
    [
      () => {
        document.getElementById("build-btn").disabled = false;
      },
      () => {
        document.getElementById("build-btn").disabled = true;
      },
    ],
  ];
  const enableAfterStage = (stage) => disables[stage]?.[0]();
  const disableAfterStage = (stage) =>
    disables.slice(stage).forEach((func) => func[1]());

  // Stage: CurseForge API Key
  const cfkeyElement = document.getElementById("cfkey");
  cfkeyElement.value = localStorage.getItem("cfkey");

  const tokenCheck = async () => {
    disableAfterStage(1);
    cfkeyElement.style.borderColor = "";
    if (cfkeyElement.value?.length === 60) {
      localStorage.setItem("cfkey", cfkeyElement.value);
      try {
        await window.renderMCVersionsAndLoaders();
        cfkeyElement.style.borderColor = "green";
        enableAfterStage(1);
      } catch (error) {
        cfkeyElement.style.borderColor = "red";
        console.info("Token error:", error);
      }
    }
  };
  cfkeyElement.addEventListener("input", tokenCheck);

  const cookieElement = document.getElementById("cookie");
  cookieElement.value = localStorage.getItem("cf-cookie");
  const updateCookie = () =>
    localStorage.setItem("cf-cookie", cookieElement.value);
  cookieElement.addEventListener("input", updateCookie);

  // Stage: Find Minecraft modpack
  const searchElement = document.getElementById("search-input");
  const searchResultElement = document.getElementById("search-result");
  const searchVersionElement = document.getElementById("search-version");
  const searchLoaderElement = document.getElementById("search-loader");

  const renderMCVersionsAndLoaders = async () => {
    const { versions, loaders, classIds } = await CF.versionsAndLoaders();
    window.mcVersions = versions;
    window.mcLoaders = loaders;
    window.mcClassIds = classIds;
    searchVersionElement.innerHTML = versions.map(
      ({ versionString }) =>
        `<option value="${versionString}">${versionString}</option>`,
    );
    searchLoaderElement.innerHTML = loaders.map(
      ({ id, name }) => `<option value="${id}">${name}</option>`,
    );
  };

  const selectModpack = (modpack) => {
    document
      .querySelectorAll(".modpack")
      .forEach((el) => el.classList.remove("modpack-selected"));
    if (modpack) {
      document
        .getElementById(`mp-${modpack.id}`)
        .classList.add("modpack-selected");
      window.selectedModpack = modpack;
      enableAfterStage(2);
    } else {
      disableAfterStage(2);
    }
  };

  let searchTimer;
  const search = async () => {
    if (searchElement.value.length < 3) return;

    let modpacks;
    try {
      const result = await CF.searchModpack({
        query: searchElement.value,
        version: searchVersionElement.value,
        modLoader: searchLoaderElement.value,
      });
      modpacks = result.slice(0, 15);
    } catch (error) {
      searchResultElement.innerHTML = `<strong class="error-text">${error}</strong>`;
      return;
    }

    searchResultElement.innerHTML = "";
    modpacks.forEach((modpack) => {
      const modpackImage = document.createElement("img");
      modpackImage.src = modpack.logo.thumbnailUrl;

      const modpackTitle = document.createElement("strong");
      modpackTitle.innerText = modpack.name;

      const modpackAuthors = document.createElement("p");
      modpackAuthors.innerText = `by ${modpack.authors
        .map((author) => author.name)
        .join(", ")}`;

      const modpackInfo = document.createElement("div");
      modpackInfo.classList.add("modpack-info");
      modpackInfo.appendChild(modpackTitle);
      modpackInfo.appendChild(modpackAuthors);

      const modpackElement = document.createElement("div");
      modpackElement.classList.add("modpack");
      modpackElement.appendChild(modpackImage);
      modpackElement.appendChild(modpackInfo);
      modpackElement.id = `mp-${modpack.id}`;
      modpackElement.addEventListener("click", () => selectModpack(modpack));

      searchResultElement.appendChild(modpackElement);
    });
  };
  const searchUpdate = () => {
    if (searchElement.value.includes("/minecraft/modpacks/"))
      searchElement.value = searchElement.value.split(
        "/minecraft/modpacks/",
      )[1];
    selectModpack();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(search, 1000);
  };
  searchElement.addEventListener("input", searchUpdate);
  searchVersionElement.addEventListener("change", searchUpdate);
  searchLoaderElement.addEventListener("change", searchUpdate);

  // Stage: Build modpack
  const buildBtnElement = document.getElementById("build-btn");
  const buildResultElement = document.getElementById("build-result");

  buildBtnElement.addEventListener("click", () =>
    buildModpack({
      modpack: window.selectedModpack,
      clear: () => (buildResultElement.innerText = ""),
      log: (text) => {
        buildResultElement.innerText +=
          new Date().toLocaleTimeString() + " " + text + "\n";
        buildResultElement.scrollTop = buildResultElement.scrollHeight;
      },
    }),
  );

  await tokenCheck();
};

window.addEventListener("DOMContentLoaded", renderUI);

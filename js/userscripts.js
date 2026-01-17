// Just for testing btw

const clearModCacheByModId = async function (modId) {
  const reqs = await window.ModCache.keys();
  reqs
    .filter((req) => req.url.includes(`mod-${modId}`))
    .forEach(async (req) => {
      await window.ModCache.delete(req);
      console.info(`Cache deleted: ${req.url}`);
    });
};

const clearModCacheByFilename = async function (filename) {
  const reqs = await window.ModCache.keys();
  return reqs.filter((req) =>
    req.headers.get("x-filename")?.includes(filename),
  );
};

const clearModCacheAll = async function () {
  const reqs = await window.ModCache.keys();
  reqs.forEach(async (req) => {
    await window.ModCache.delete(req);
  });
};

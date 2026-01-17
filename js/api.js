class CurseForge {
  endpoint = `https://cfp.iky.su`;
  request = async (url) => {
    const call = await fetch(`${this.endpoint}/${url}`, {
      headers: { "x-api-key": localStorage.getItem("cfkey") },
      method: "GET",
    })
      .then((response) => ({ response, error: null }))
      .catch((error) => ({ response: null, error }));
    if (call.error) throw new Error(`Fetch error: ${call.error}`);
    let body, json;
    try {
      body = await call.response.text();
      json = JSON.parse(body);
    } catch {}
    if (call.response.status >= 400)
      throw new Error(`Response error ${call.response.status}: ${body}`);
    return json;
  };

  versionsAndLoaders = () => this.request("versions_and_loaders");
  searchModpack = ({ modLoader, version, query }) =>
    this.request(
      `search/${modLoader}/${version}?q=${encodeURIComponent(query)}`,
    );
  download = async ({ modId, fileId }) => {
    const call = await fetch(
      `${this.endpoint}/mods/${modId}/files/${fileId}/download`,
      {
        headers: {
          "x-api-key": localStorage.getItem("cfkey"),
        },
      },
    )
      .then((response) => ({ response, error: null }))
      .catch((error) => ({ response: null, error }));
    if (call.error) throw new Error(`Fetch error: ${call.error}`);
    if (call.response.status !== 200)
      throw new Error(await call.response.text());
    return call.response;
  };
  downloadAlt = async ({ modId, fileId }) => {
    const call = await fetch(
      `${this.endpoint}/mods/${modId}/files/${fileId}/download-alt`,
      {
        headers: {
          "x-api-key": localStorage.getItem("cfkey"),
          "x-cookie": localStorage.getItem("cf-cookie"),
        },
      },
    )
      .then((response) => ({ response, error: null }))
      .catch((error) => ({ response: null, error }));
    if (call.error) throw new Error(`Fetch error: ${call.error}`);
    if (call.response.status !== 200)
      throw new Error(await call.response.text());
    return call.response;
  };

  modInfo = ({ modId }) => this.request(`mods/${modId}`);
}

const CF = new CurseForge();

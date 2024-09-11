async function load({ url }) {
  const response = await fetch("https://mwmbl.org/search/?s=" + url.searchParams.get("q"));
  const results = await response.json();
  return {
    query: url.searchParams.get("q"),
    results
  };
}

var _page_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 3;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-C36n0JuB.js')).default;
const universal_id = "src/routes/search/+page.ts";
const imports = ["_app/immutable/nodes/3.B2iGf88w.js","_app/immutable/chunks/disclose-version.BRzlG74J.js","_app/immutable/chunks/runtime.DgZE306K.js","_app/immutable/chunks/index-client.v_PWYC5V.js","_app/immutable/chunks/index.DrZdYT6K.js","_app/immutable/chunks/lifecycle.DlRa8-Er.js","_app/immutable/chunks/index.-Uhmylzt.js","_app/immutable/chunks/svelte-component.D-74dLRT.js","_app/immutable/chunks/Search.CCBc3Vo9.js","_app/immutable/chunks/store.UMkAJlnv.js","_app/immutable/chunks/updater.B1bi36kw.js"];
const stylesheets = ["_app/immutable/assets/3.kWX5IfPJ.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page_ts as universal, universal_id };
//# sourceMappingURL=3-05x2eZ4J.js.map

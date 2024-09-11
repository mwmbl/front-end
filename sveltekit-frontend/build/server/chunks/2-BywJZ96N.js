import { r as redirect } from './index-DyoisQP2.js';

async function load({ url }) {
  const query = url.searchParams.get("q");
  if (url.searchParams.get("q") != null) {
    redirect(303, "/search?q=" + query);
  }
}

var _page_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 2;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BZ3pJK1G.js')).default;
const universal_id = "src/routes/+page.ts";
const imports = ["_app/immutable/nodes/2.CH1jFWBm.js","_app/immutable/chunks/control.CYgJF_JY.js","_app/immutable/chunks/disclose-version.BRzlG74J.js","_app/immutable/chunks/runtime.DgZE306K.js","_app/immutable/chunks/Search.CCBc3Vo9.js","_app/immutable/chunks/index-client.v_PWYC5V.js","_app/immutable/chunks/index.DrZdYT6K.js","_app/immutable/chunks/lifecycle.DlRa8-Er.js","_app/immutable/chunks/index.-Uhmylzt.js","_app/immutable/chunks/svelte-component.D-74dLRT.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page_ts as universal, universal_id };
//# sourceMappingURL=2-BywJZ96N.js.map

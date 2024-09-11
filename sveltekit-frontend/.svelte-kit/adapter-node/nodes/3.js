import * as universal from '../entries/pages/search/_page.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/search/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/search/+page.ts";
export const imports = ["_app/immutable/nodes/3.B2iGf88w.js","_app/immutable/chunks/disclose-version.BRzlG74J.js","_app/immutable/chunks/runtime.DgZE306K.js","_app/immutable/chunks/index-client.v_PWYC5V.js","_app/immutable/chunks/index.DrZdYT6K.js","_app/immutable/chunks/lifecycle.DlRa8-Er.js","_app/immutable/chunks/index.-Uhmylzt.js","_app/immutable/chunks/svelte-component.D-74dLRT.js","_app/immutable/chunks/Search.CCBc3Vo9.js","_app/immutable/chunks/store.UMkAJlnv.js","_app/immutable/chunks/updater.B1bi36kw.js"];
export const stylesheets = ["_app/immutable/assets/3.kWX5IfPJ.css"];
export const fonts = [];

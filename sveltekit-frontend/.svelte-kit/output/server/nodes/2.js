import * as universal from '../entries/pages/_page.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.CH1jFWBm.js","_app/immutable/chunks/control.CYgJF_JY.js","_app/immutable/chunks/disclose-version.BRzlG74J.js","_app/immutable/chunks/runtime.DgZE306K.js","_app/immutable/chunks/Search.CCBc3Vo9.js","_app/immutable/chunks/index-client.v_PWYC5V.js","_app/immutable/chunks/index.DrZdYT6K.js","_app/immutable/chunks/lifecycle.DlRa8-Er.js","_app/immutable/chunks/index.-Uhmylzt.js","_app/immutable/chunks/svelte-component.D-74dLRT.js"];
export const stylesheets = [];
export const fonts = [];

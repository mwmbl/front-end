const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","opensearch.xml"]),
	mimeTypes: {".png":"image/png",".xml":"text/xml"},
	_: {
		client: {"start":"_app/immutable/entry/start.CLpfxjvT.js","app":"_app/immutable/entry/app.B1jW5DRm.js","imports":["_app/immutable/entry/start.CLpfxjvT.js","_app/immutable/chunks/entry.BdADGiur.js","_app/immutable/chunks/runtime.DgZE306K.js","_app/immutable/chunks/index.-Uhmylzt.js","_app/immutable/chunks/control.CYgJF_JY.js","_app/immutable/entry/app.B1jW5DRm.js","_app/immutable/chunks/runtime.DgZE306K.js","_app/immutable/chunks/disclose-version.BRzlG74J.js","_app/immutable/chunks/index-client.v_PWYC5V.js","_app/immutable/chunks/svelte-component.D-74dLRT.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./chunks/0-DJu1qRCM.js')),
			__memo(() => import('./chunks/1-BEBbo8E3.js')),
			__memo(() => import('./chunks/2-BywJZ96N.js')),
			__memo(() => import('./chunks/3-05x2eZ4J.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/search",
				pattern: /^\/search\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map

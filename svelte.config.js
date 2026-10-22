import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		// Preload JS from <link> tags in the page head. With the default 'modulepreload' the
		// preloads only go in a Link response header, which hooks.server.ts removes.
		output: {
			preloadStrategy: 'preload-mjs'
		},
		alias: {
			'@/*': './src/lib/*'
		}
	}
};

export default config;

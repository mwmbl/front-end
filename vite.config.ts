import { defineConfig } from 'vite';

import { sveltekit } from '@sveltejs/kit/vite';
import Icons from 'unplugin-icons/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
	plugins: [
		sveltekit(),
		Icons({
			compiler: 'svelte'
		}),
		wasm(),
		topLevelAwait()
	]
});

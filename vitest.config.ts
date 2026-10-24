import { defineConfig } from 'vitest/config';

/**
 * Deliberately standalone, and deliberately plugin-free.
 *
 * Vitest prefers this file over `vite.config.ts`, so the unit tests never load `sveltekit()`,
 * Tailwind, wasm or unplugin-icons, and do not need `svelte-kit sync` to have run. The suite
 * covers plain TypeScript modules under `src/lib`, which import each other by relative path, so
 * there is no `$lib` alias to reproduce here either.
 *
 * `tsconfigRaw` is a string so that Vite's esbuild transform does not read `tsconfig.json`,
 * which extends the generated `.svelte-kit/tsconfig.json` and so fails on a fresh checkout.
 */
export default defineConfig({
	esbuild: {
		tsconfigRaw: '{}'
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});

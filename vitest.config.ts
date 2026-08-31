import { defineConfig } from 'vitest/config';

/**
 * Deliberately standalone, and deliberately plugin-free.
 *
 * Vitest prefers this file over `vite.config.ts`, so the unit tests never load `sveltekit()`,
 * Tailwind, wasm or unplugin-icons, and do not need `svelte-kit sync` to have run. The suite
 * covers plain TypeScript modules under `src/lib`, which import each other by relative path, so
 * there is no `$lib` alias to reproduce here either.
 */
export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});

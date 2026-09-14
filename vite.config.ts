import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// GitHub Pages serves project sites under /<repo>/; override with VITE_BASE if the repo is renamed.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/minimum-viable-dayan/',
  plugins: [svelte()],
  // Component tests run in jsdom and need Svelte's client build, not the SSR one.
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.svelte.ts'],
  },
});

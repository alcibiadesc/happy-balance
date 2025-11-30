import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/', '**/*.d.ts', '**/*.config.*', '**/types/**'],
    },
    alias: {
      $lib: path.resolve('./src/lib'),
      $app: path.resolve('./.svelte-kit/runtime/app'),
    },
  },
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
    },
  },
});

import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules/**', 'build/**', '.svelte-kit/**'],
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		globals: true,
		coverage: {
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.{js,ts}'],
			exclude: [
				'src/**/*.{test,spec}.{js,ts}',
				'src/test/**',
				'src/app.html',
				'src/app.d.ts'
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80
				}
			}
		},
		pool: 'threads',
		poolOptions: {
			threads: {
				singleThread: true
			}
		}
	}
});
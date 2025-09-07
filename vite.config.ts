import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: true,
		hmr: {
			port: 5173
		},
		watch: {
			usePolling: true,
			interval: 1000
		}
	},
	build: {
		target: 'esnext'
	},
	optimizeDeps: {
		include: ['@prisma/client', 'chart.js', 'date-fns']
	}
});

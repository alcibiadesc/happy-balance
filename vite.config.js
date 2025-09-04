import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	envDir: '.',
	envPrefix: ['VITE_', 'PUBLIC_'],
	define: {
		// Permitir acceso a process.env en cliente cuando sea necesario
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
	},
	server: {
		fs: {
			// Permitir acceso a archivos fuera del directorio raíz para Prisma
			allow: ['..']
		}
	}
});
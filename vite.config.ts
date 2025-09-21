import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    hmr: {
      port: 0,
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  build: {
    target: "esnext",
  },
});

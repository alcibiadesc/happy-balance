
import root from '../root.js';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env } from '../../../node_modules/.pnpm/@sveltejs+kit@2.39.1_@sveltejs+vite-plugin-svelte@6.2.0_svelte@5.38.10_vite@6.3.6_@types+node_h7zu7mitnprwif2turhfhzy7qu/node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	csrf_trusted_origins: [],
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	service_worker_options: undefined,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html lang=\"%lang%\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <link rel=\"icon\" href=\"" + assets + "/favicon.ico\" />\n    <link\n      rel=\"icon\"\n      href=\"" + assets + "/favicon.svg\"\n      type=\"image/svg+xml\"\n    />\n    <link\n      rel=\"icon\"\n      type=\"image/png\"\n      sizes=\"32x32\"\n      href=\"" + assets + "/favicon-32x32.png\"\n    />\n    <link\n      rel=\"icon\"\n      type=\"image/png\"\n      sizes=\"16x16\"\n      href=\"" + assets + "/favicon-16x16.png\"\n    />\n    <link\n      rel=\"apple-touch-icon\"\n      href=\"" + assets + "/apple-touch-icon.png\"\n    />\n    <link rel=\"manifest\" href=\"" + assets + "/site.webmanifest\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <meta name=\"theme-color\" content=\"#023c46\" />\n    <meta\n      name=\"description\"\n      content=\"Happy Balance - Personal finance management for a happier financial life\"\n    />\n    <script>\n      // Theme initialization (must run before page render to prevent flash)\n      const initTheme = () => {\n        // Check user preferences first, fallback to regular theme store\n        const userPrefs = localStorage.getItem(\"userPreferences\");\n        let saved = \"system\";\n\n        if (userPrefs) {\n          try {\n            const prefs = JSON.parse(userPrefs);\n            saved = prefs.theme || \"system\";\n          } catch (e) {\n            saved = localStorage.getItem(\"theme\") || \"system\";\n          }\n        } else {\n          saved = localStorage.getItem(\"theme\") || \"system\";\n        }\n\n        const systemDark = window.matchMedia(\n          \"(prefers-color-scheme: dark)\",\n        ).matches;\n        const isDark = saved === \"dark\" || (saved === \"system\" && systemDark);\n\n        if (isDark) {\n          document.documentElement.classList.add(\"dark\");\n          document.documentElement.setAttribute(\"data-theme\", \"dark\");\n        } else {\n          document.documentElement.classList.remove(\"dark\");\n          document.documentElement.setAttribute(\"data-theme\", \"light\");\n        }\n      };\n\n      // Apply theme immediately\n      initTheme();\n\n      // Update body class based on sidebar state\n      const updateSidebarClass = () => {\n        const sidebarCollapsed = JSON.parse(\n          localStorage.getItem(\"sidebar-collapsed\") || \"false\",\n        );\n        document.body.classList.toggle(\"sidebar-collapsed\", sidebarCollapsed);\n      };\n\n      // Apply on load\n      document.addEventListener(\"DOMContentLoaded\", updateSidebarClass);\n\n      // Listen for storage changes\n      window.addEventListener(\"storage\", (e) => {\n        if (e.key === \"sidebar-collapsed\") {\n          updateSidebarClass();\n        } else if (e.key === \"theme\" || e.key === \"userPreferences\") {\n          initTheme();\n        }\n      });\n    </script>\n    " + head + "\n  </head>\n  <body data-sveltekit-preload-data=\"hover\" class=\"%sveltekit.theme%\">\n    <div style=\"display: contents\">" + body + "</div>\n  </body>\n</html>\n",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "r1am62"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let handleValidationError;
	let init;
	

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		handleValidationError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation };

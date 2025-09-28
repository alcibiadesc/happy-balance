
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const VITE_API_URL: string;
	export const VITE_PORT: string;
	export const npm_package_devDependencies_prettier: string;
	export const npm_package_devDependencies_eslint_plugin_svelte: string;
	export const TERM_PROGRAM: string;
	export const NODE: string;
	export const npm_package_scripts_db_seed: string;
	export const INIT_CWD: string;
	export const npm_package_devDependencies_typescript: string;
	export const npm_package_devDependencies_prettier_plugin_svelte: string;
	export const npm_package_devDependencies_vite: string;
	export const SHELL: string;
	export const TERM: string;
	export const WARP_HONOR_PS1: string;
	export const npm_config_maxsockets: string;
	export const npm_package_scripts_db_stop: string;
	export const TMPDIR: string;
	export const HOMEBREW_REPOSITORY: string;
	export const npm_package_scripts_lint: string;
	export const npm_package_engines_pnpm: string;
	export const npm_package_devDependencies_concurrently: string;
	export const npm_package_scripts_dev_docker: string;
	export const TERM_PROGRAM_VERSION: string;
	export const npm_package_scripts_dev: string;
	export const npm_package_dependencies_lucide_svelte: string;
	export const npm_config_fetch_retries: string;
	export const npm_config_registry: string;
	export const npm_package_devDependencies__sveltejs_kit: string;
	export const npm_package_private: string;
	export const npm_package_repository_url: string;
	export const PNPM_HOME: string;
	export const npm_package_description: string;
	export const USER: string;
	export const npm_package_license: string;
	export const npm_package_scripts_db_setup: string;
	export const COMMAND_MODE: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const SSH_AUTH_SOCK: string;
	export const npm_package_devDependencies_postcss: string;
	export const npm_package_devDependencies_eslint: string;
	export const WARP_IS_LOCAL_SHELL_SESSION: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const npm_package_devDependencies_tslib: string;
	export const npm_package_devDependencies__typescript_eslint_eslint_plugin: string;
	export const npm_package_devDependencies_svelte: string;
	export const npm_package_scripts_start_frontend: string;
	export const npm_package_scripts_build_frontend: string;
	export const WARP_USE_SSH_WRAPPER: string;
	export const npm_config_frozen_lockfile: string;
	export const npm_package_devDependencies__typescript_eslint_parser: string;
	export const npm_package_scripts_lint_fix: string;
	export const PATH: string;
	export const npm_package_devDependencies__sveltejs_adapter_node: string;
	export const npm_package_scripts_typecheck: string;
	export const LaunchInstanceID: string;
	export const npm_package_author: string;
	export const npm_package_keywords_4: string;
	export const npm_package_scripts_db_reset: string;
	export const __CFBundleIdentifier: string;
	export const npm_command: string;
	export const npm_package_keywords_5: string;
	export const npm_package_devDependencies_tailwindcss: string;
	export const PWD: string;
	export const npm_package_keywords_6: string;
	export const npm_lifecycle_event: string;
	export const npm_package_keywords_7: string;
	export const npm_package_devDependencies_jsdom: string;
	export const npm_package_repository_type: string;
	export const npm_package_keywords_0: string;
	export const npm_package_packageManager: string;
	export const npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
	export const npm_package_name: string;
	export const LANG: string;
	export const npm_package_keywords_1: string;
	export const npm_package_scripts_db_start: string;
	export const NODE_PATH: string;
	export const npm_package_keywords_2: string;
	export const npm_package_scripts_start: string;
	export const npm_package_scripts_build: string;
	export const npm_package_keywords_3: string;
	export const npm_package_devDependencies_vitest: string;
	export const npm_package_scripts_start_backend: string;
	export const npm_package_scripts_build_backend: string;
	export const XPC_FLAGS: string;
	export const npm_package_engines_node: string;
	export const FORCE_COLOR: string;
	export const npm_config_node_gyp: string;
	export const npm_package_devDependencies_eslint_config_prettier: string;
	export const npm_package_scripts_db_migrate: string;
	export const npm_package_dependencies_chart_js: string;
	export const npm_package_version: string;
	export const XPC_SERVICE_NAME: string;
	export const npm_package_devDependencies_svelte_check: string;
	export const npm_package_devDependencies_daisyui: string;
	export const npm_package_devDependencies_autoprefixer: string;
	export const npm_package_devDependencies_playwright: string;
	export const npm_package_type: string;
	export const HOME: string;
	export const SHLVL: string;
	export const npm_package_scripts_test: string;
	export const HOMEBREW_PREFIX: string;
	export const LOGNAME: string;
	export const PNPM_PACKAGE_NAME: string;
	export const npm_lifecycle_script: string;
	export const npm_package_devDependencies_prettier_plugin_tailwindcss: string;
	export const LC_CTYPE: string;
	export const SSH_SOCKET_DIR: string;
	export const BUN_INSTALL: string;
	export const npm_config_user_agent: string;
	export const npm_package_devDependencies__types_node: string;
	export const npm_package_devDependencies__playwright_test: string;
	export const HOMEBREW_CELLAR: string;
	export const INFOPATH: string;
	export const OSLogRateLimit: string;
	export const npm_config_timeout: string;
	export const CONDA_CHANGEPS1: string;
	export const npm_package_scripts_clean: string;
	export const npm_package_scripts_setup: string;
	export const SECURITYSESSIONID: string;
	export const npm_package_workspaces_0: string;
	export const npm_node_execpath: string;
	export const npm_package_scripts_test_backend: string;
	export const npm_package_workspaces_1: string;
	export const COLORTERM: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		VITE_API_URL: string;
		VITE_PORT: string;
		npm_package_devDependencies_prettier: string;
		npm_package_devDependencies_eslint_plugin_svelte: string;
		TERM_PROGRAM: string;
		NODE: string;
		npm_package_scripts_db_seed: string;
		INIT_CWD: string;
		npm_package_devDependencies_typescript: string;
		npm_package_devDependencies_prettier_plugin_svelte: string;
		npm_package_devDependencies_vite: string;
		SHELL: string;
		TERM: string;
		WARP_HONOR_PS1: string;
		npm_config_maxsockets: string;
		npm_package_scripts_db_stop: string;
		TMPDIR: string;
		HOMEBREW_REPOSITORY: string;
		npm_package_scripts_lint: string;
		npm_package_engines_pnpm: string;
		npm_package_devDependencies_concurrently: string;
		npm_package_scripts_dev_docker: string;
		TERM_PROGRAM_VERSION: string;
		npm_package_scripts_dev: string;
		npm_package_dependencies_lucide_svelte: string;
		npm_config_fetch_retries: string;
		npm_config_registry: string;
		npm_package_devDependencies__sveltejs_kit: string;
		npm_package_private: string;
		npm_package_repository_url: string;
		PNPM_HOME: string;
		npm_package_description: string;
		USER: string;
		npm_package_license: string;
		npm_package_scripts_db_setup: string;
		COMMAND_MODE: string;
		PNPM_SCRIPT_SRC_DIR: string;
		SSH_AUTH_SOCK: string;
		npm_package_devDependencies_postcss: string;
		npm_package_devDependencies_eslint: string;
		WARP_IS_LOCAL_SHELL_SESSION: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		npm_package_devDependencies_tslib: string;
		npm_package_devDependencies__typescript_eslint_eslint_plugin: string;
		npm_package_devDependencies_svelte: string;
		npm_package_scripts_start_frontend: string;
		npm_package_scripts_build_frontend: string;
		WARP_USE_SSH_WRAPPER: string;
		npm_config_frozen_lockfile: string;
		npm_package_devDependencies__typescript_eslint_parser: string;
		npm_package_scripts_lint_fix: string;
		PATH: string;
		npm_package_devDependencies__sveltejs_adapter_node: string;
		npm_package_scripts_typecheck: string;
		LaunchInstanceID: string;
		npm_package_author: string;
		npm_package_keywords_4: string;
		npm_package_scripts_db_reset: string;
		__CFBundleIdentifier: string;
		npm_command: string;
		npm_package_keywords_5: string;
		npm_package_devDependencies_tailwindcss: string;
		PWD: string;
		npm_package_keywords_6: string;
		npm_lifecycle_event: string;
		npm_package_keywords_7: string;
		npm_package_devDependencies_jsdom: string;
		npm_package_repository_type: string;
		npm_package_keywords_0: string;
		npm_package_packageManager: string;
		npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
		npm_package_name: string;
		LANG: string;
		npm_package_keywords_1: string;
		npm_package_scripts_db_start: string;
		NODE_PATH: string;
		npm_package_keywords_2: string;
		npm_package_scripts_start: string;
		npm_package_scripts_build: string;
		npm_package_keywords_3: string;
		npm_package_devDependencies_vitest: string;
		npm_package_scripts_start_backend: string;
		npm_package_scripts_build_backend: string;
		XPC_FLAGS: string;
		npm_package_engines_node: string;
		FORCE_COLOR: string;
		npm_config_node_gyp: string;
		npm_package_devDependencies_eslint_config_prettier: string;
		npm_package_scripts_db_migrate: string;
		npm_package_dependencies_chart_js: string;
		npm_package_version: string;
		XPC_SERVICE_NAME: string;
		npm_package_devDependencies_svelte_check: string;
		npm_package_devDependencies_daisyui: string;
		npm_package_devDependencies_autoprefixer: string;
		npm_package_devDependencies_playwright: string;
		npm_package_type: string;
		HOME: string;
		SHLVL: string;
		npm_package_scripts_test: string;
		HOMEBREW_PREFIX: string;
		LOGNAME: string;
		PNPM_PACKAGE_NAME: string;
		npm_lifecycle_script: string;
		npm_package_devDependencies_prettier_plugin_tailwindcss: string;
		LC_CTYPE: string;
		SSH_SOCKET_DIR: string;
		BUN_INSTALL: string;
		npm_config_user_agent: string;
		npm_package_devDependencies__types_node: string;
		npm_package_devDependencies__playwright_test: string;
		HOMEBREW_CELLAR: string;
		INFOPATH: string;
		OSLogRateLimit: string;
		npm_config_timeout: string;
		CONDA_CHANGEPS1: string;
		npm_package_scripts_clean: string;
		npm_package_scripts_setup: string;
		SECURITYSESSIONID: string;
		npm_package_workspaces_0: string;
		npm_node_execpath: string;
		npm_package_scripts_test_backend: string;
		npm_package_workspaces_1: string;
		COLORTERM: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}

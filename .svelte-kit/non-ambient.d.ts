
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/admin" | "/admin/users" | "/categories" | "/import" | "/login" | "/settings" | "/transactions";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/admin": Record<string, never>;
			"/admin/users": Record<string, never>;
			"/categories": Record<string, never>;
			"/import": Record<string, never>;
			"/login": Record<string, never>;
			"/settings": Record<string, never>;
			"/transactions": Record<string, never>
		};
		Pathname(): "/" | "/admin" | "/admin/" | "/admin/users" | "/admin/users/" | "/categories" | "/categories/" | "/import" | "/import/" | "/login" | "/login/" | "/settings" | "/settings/" | "/transactions" | "/transactions/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/android-chrome-192x192.png" | "/android-chrome-512x512.png" | "/apple-touch-icon.png" | "/favicon-16x16.png" | "/favicon-32x32.png" | "/favicon.ico" | "/favicon.svg" | "/logo/happy-balance-logo-with-text.png" | "/logo/happy-balance-logo-without-text.png" | "/robots.txt" | "/screenshots/categories.png" | "/screenshots/dark-mode.png" | "/screenshots/dashboard.png" | "/screenshots/mobile-dashboard.png" | "/screenshots/settings.png" | "/screenshots/transactions.png" | "/site.webmanifest" | "/sw.js" | string & {};
	}
}
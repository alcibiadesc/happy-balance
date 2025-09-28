export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["android-chrome-192x192.png","android-chrome-512x512.png","apple-touch-icon.png","favicon-16x16.png","favicon-32x32.png","favicon.ico","favicon.svg","logo/happy-balance-logo-with-text.png","logo/happy-balance-logo-without-text.png","robots.txt","site.webmanifest"]),
	mimeTypes: {".png":"image/png",".svg":"image/svg+xml",".txt":"text/plain",".webmanifest":"application/manifest+json"},
	_: {
		client: {start:"_app/immutable/entry/start.Br4GAHHm.js",app:"_app/immutable/entry/app.CIBFDk7O.js",imports:["_app/immutable/entry/start.Br4GAHHm.js","_app/immutable/chunks/qLTqb0RQ.js","_app/immutable/chunks/J53a5pXB.js","_app/immutable/entry/app.CIBFDk7O.js","_app/immutable/chunks/J53a5pXB.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/CVWE5XDX.js","_app/immutable/chunks/CeGYYBmx.js","_app/immutable/chunks/CNdUi1S-.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/categories",
				pattern: /^\/categories\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/import",
				pattern: /^\/import\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/settings",
				pattern: /^\/settings\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/transactions",
				pattern: /^\/transactions\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

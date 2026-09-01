import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const DEMO_ROOT = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig(({ mode }) => {
	// Config-side only, so this may read unprefixed names. Anything the browser
	// needs has to be VITE_-prefixed and come through `import.meta.env`.
	const env = loadEnv(mode, DEMO_ROOT, '');

	return {
		// The demo root .env, the same file the backend loads. Only VITE_* names
		// from it reach the browser, which is what keeps TEXTQL_API_KEY out of the
		// bundle even though the two processes share one file.
		envDir: DEMO_ROOT,
		plugins: [tailwindcss(), react()],
		css: {
			modules: {
				localsConvention: 'camelCaseOnly'
			}
		},
		server: {
			// Same-origin in dev, so the browser never sees CORS and the API key
			// stays in the Python process.
			proxy: {
				'/v3': {
					target: env.BACKEND_URL || 'http://127.0.0.1:8787',
					changeOrigin: true,
					// SSE must not be buffered into one response.
					configure: (proxy) => {
						proxy.on('proxyRes', (proxyRes) => {
							proxyRes.headers['cache-control'] = 'no-cache, no-transform';
						});
					}
				}
			}
		}
	};
});

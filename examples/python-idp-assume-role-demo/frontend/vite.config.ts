import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const BACKEND = 'http://127.0.0.1:8787';

export default defineConfig({
	plugins: [tailwindcss(), react()],
	css: {
		modules: {
			localsConvention: 'camelCaseOnly'
		}
	},
	server: {
		// Off 5173 so it runs beside a TextQL dev frontend. The IdP redirect URI
		// (IDP_REDIRECT_URI) defaults to this port.
		port: 5175,
		strictPort: true,
		// Same origin as the backend in dev, so the session cookie and the
		// IdP client secret never leave it.
		proxy: {
			// The IdP redirect lands here, so the session cookie set on this
			// origin reaches the backend.
			'/callback': { target: BACKEND, changeOrigin: true },
			'/v3': {
				target: BACKEND,
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
});

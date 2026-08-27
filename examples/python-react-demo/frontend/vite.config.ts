import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), react()],
	server: {
		// Same-origin in dev, so the browser never sees CORS and the API key
		// stays in the Python process.
		proxy: {
			'/v3': {
				target: process.env.BACKEND_URL || 'http://127.0.0.1:8787',
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

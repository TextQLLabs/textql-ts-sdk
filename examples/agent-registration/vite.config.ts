import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';

import { api } from './server/routes';

/** Serves `/api/**` from the dev and preview servers, so the API key never reaches the browser. */
function registryApi(): Plugin {
	return {
		name: 'agent-registry-api',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				void api(req, res, next);
			});
		},
		configurePreviewServer(server) {
			server.middlewares.use((req, res, next) => {
				void api(req, res, next);
			});
		}
	};
}

export default defineConfig(({ mode }) => {
	// Handlers read process.env, so surface everything in .env, not just VITE_ keys.
	Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

	return {
		plugins: [tailwindcss(), react(), registryApi()],
		server: { port: 5176 },
		preview: { port: 5176 }
	};
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import type { Plugin, ProxyOptions } from 'vite';
import { defineConfig, loadEnv } from 'vite';

import { apiMiddleware } from './server/index';

/** Preview HTML is iframed; upstream CSP/XFO only allow the TextQL app origin. */
function stripFrameBlockingHeaders(): NonNullable<ProxyOptions['configure']> {
	return (proxy) => {
		proxy.on('proxyRes', (proxyRes) => {
			delete proxyRes.headers['x-frame-options'];
			proxyRes.headers['content-disposition'] = 'inline';
			const csp = proxyRes.headers['content-security-policy'];
			if (typeof csp === 'string') {
				proxyRes.headers['content-security-policy'] = csp
					.replace(/frame-ancestors[^;]*;?\s*/gi, '')
					.trim();
			}
		});
	};
}

const previewProxy = (target: string, ws = false): ProxyOptions => ({
	target,
	changeOrigin: true,
	secure: true,
	ws,
	configure: stripFrameBlockingHeaders()
});

const proxy: Record<string, ProxyOptions> = {
	// Signed sandbox assets / charts (PREVIEW_DOMAIN_URL)
	'/asset/proxy': previewProxy('https://textqlusercontent.com'),
	'/asset/apptree': previewProxy('https://textqlusercontent.com'),
	'/library/raw': previewProxy('https://textqlusercontent.com'),
	// Live sandbox embeds (streamlit etc.) live on the app origin
	'/sandbox/proxy': previewProxy('https://app.textql.com', true)
};

/**
 * Serves `src/routes/api/**`'s React counterpart (`server/routes/**`) from the
 * dev and preview servers, so the API key never reaches the browser — the same
 * arrangement SvelteKit gives the Svelte demo for free.
 */
function textqlApi(): Plugin {
	return {
		name: 'textql-api',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				void apiMiddleware(req, res, next);
			});
		},
		configurePreviewServer(server) {
			server.middlewares.use((req, res, next) => {
				void apiMiddleware(req, res, next);
			});
		}
	};
}

export default defineConfig(({ mode }) => {
	// Handlers read process.env (there is no SvelteKit $env here), so surface
	// everything in .env — not just VITE_-prefixed keys.
	Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

	return {
		plugins: [tailwindcss(), react(), textqlApi()],
		resolve: {
			alias: {
				$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
			}
		},
		css: {
			modules: {
				// `.chat-panel` → `styles.chatPanel`, so ported Svelte class names stay readable.
				localsConvention: 'camelCaseOnly'
			}
		},
		server: { proxy },
		preview: { proxy }
	};
});

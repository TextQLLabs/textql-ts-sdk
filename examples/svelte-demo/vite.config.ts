import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import type { ProxyOptions } from 'vite';
import { defineConfig } from 'vite';

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

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	],
	server: {
		proxy: {
			// Signed sandbox assets / charts (PREVIEW_DOMAIN_URL)
			'/asset/proxy': previewProxy('https://textqlusercontent.com'),
			'/asset/apptree': previewProxy('https://textqlusercontent.com'),
			'/library/raw': previewProxy('https://textqlusercontent.com'),
			// Live sandbox embeds (streamlit etc.) live on the app origin
			'/sandbox/proxy': previewProxy('https://app.textql.com', true)
		}
	}
});

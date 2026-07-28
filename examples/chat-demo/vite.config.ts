import adapterAuto from '@sveltejs/adapter-auto';
import adapterCloudflare from '@sveltejs/adapter-cloudflare';
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

/**
 * This config runs in Node, but the project doesn't pull in @types/node — so
 * reach the environment through globalThis rather than adding a dependency to
 * read one variable.
 */
const nodeEnv: Record<string, string | undefined> =
	(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

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

			// adapter-auto by default, so cloning this example gets you the same
			// platform detection (Vercel, Netlify, Cloudflare Pages, …) it always
			// had — nothing here presumes a host.
			//
			// `DEPLOY_TARGET=cloudflare` opts into a Cloudflare Workers build
			// instead, which is what the hosted instance uses; see wrangler.jsonc.
			// The SDK is pure fetch/Web Streams, so unary and streaming calls both
			// run on workerd unchanged.
			adapter: nodeEnv.DEPLOY_TARGET === 'cloudflare' ? adapterCloudflare() : adapterAuto()
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

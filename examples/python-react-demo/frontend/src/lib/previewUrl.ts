/**
 * Preview assets live on textqlusercontent.com (and some sandbox embeds on
 * app.textql.com). Those origins only allow framing from the main TextQL app,
 * so localhost iframes get "refused to connect". Rewrite to same-origin URLs
 * served through /v3/textql/preview-proxy, the FastAPI backend route Vite
 * proxies in dev.
 */

export const PREVIEW_PROXY_PATH = '/v3/textql/preview-proxy';

// From the demo root .env, the same file the backend reads. The VITE_ prefix is
// what makes a variable public: Vite exposes only those, so the API key sharing
// that file cannot reach the browser.
const usercontentHost = import.meta.env.VITE_USERCONTENT_HOST || 'textqlusercontent.com';
const appHost = import.meta.env.VITE_APP_HOST || 'app.textql.com';

const PROXY_PREFIXES = [
	'/asset/proxy/',
	'/asset/apptree/',
	'/library/raw/',
	'/sandbox/proxy/'
];

function isUserContentHost(hostname: string): boolean {
	return hostname === usercontentHost || hostname.endsWith(`.${usercontentHost}`);
}

function pathIsProxied(pathname: string): boolean {
	return PROXY_PREFIXES.some(
		(prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix)
	);
}

function proxyUrl(target: string): string {
	return `${PREVIEW_PROXY_PATH}?url=${encodeURIComponent(target)}`;
}

export function toEmbeddablePreviewUrl(url: string | null | undefined): string | null {
	if (!url) return null;

	try {
		const localOrigin =
			typeof window !== 'undefined' ? window.location.origin : 'http://local';
		const parsed = new URL(url, localOrigin);
		const pathWithQuery = `${parsed.pathname}${parsed.search}`;

		// Relative asset paths are upstream preview URLs, not application routes.
		if (parsed.origin === localOrigin) {
			if (pathIsProxied(parsed.pathname)) {
				const upstreamOrigin = parsed.pathname.startsWith('/sandbox/proxy')
					? `https://${appHost}`
					: `https://${usercontentHost}`;
				return proxyUrl(`${upstreamOrigin}${pathWithQuery}`);
			}
			return pathWithQuery;
		}

		if (isUserContentHost(parsed.hostname)) {
			return proxyUrl(parsed.href);
		}

		if (parsed.hostname === appHost && pathIsProxied(parsed.pathname)) {
			return proxyUrl(parsed.href);
		}

		return url;
	} catch {
		return url;
	}
}

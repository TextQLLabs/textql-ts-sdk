/**
 * Preview assets live on textqlusercontent.com (and some sandbox embeds on
 * app.textql.com). Those origins only allow framing from the main TextQL app,
 * so localhost iframes get "refused to connect". Rewrite to same-origin URLs
 * served through /api/preview-proxy in both development and production.
 */

const USERCONTENT_HOST = 'textqlusercontent.com';
const APP_HOST = 'app.textql.com';

const PROXY_PREFIXES = [
	'/asset/proxy/',
	'/asset/apptree/',
	'/library/raw/',
	'/sandbox/proxy/'
];

export function isUserContentHost(hostname: string): boolean {
	return hostname === USERCONTENT_HOST || hostname.endsWith(`.${USERCONTENT_HOST}`);
}

export function isAllowedPreviewHost(hostname: string): boolean {
	return isUserContentHost(hostname) || hostname === APP_HOST;
}

function pathIsProxied(pathname: string): boolean {
	return PROXY_PREFIXES.some(
		(prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix)
	);
}

function proxyUrl(target: string): string {
	return `/api/preview-proxy?url=${encodeURIComponent(target)}`;
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
					? `https://${APP_HOST}`
					: `https://${USERCONTENT_HOST}`;
				return proxyUrl(`${upstreamOrigin}${pathWithQuery}`);
			}
			return pathWithQuery;
		}

		if (isUserContentHost(parsed.hostname)) {
			return proxyUrl(parsed.href);
		}

		if (parsed.hostname === APP_HOST && pathIsProxied(parsed.pathname)) {
			return proxyUrl(parsed.href);
		}

		return url;
	} catch {
		return url;
	}
}

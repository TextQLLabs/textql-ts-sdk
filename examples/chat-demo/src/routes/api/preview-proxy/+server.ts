import { error } from '@sveltejs/kit';

import { isAllowedPreviewHost } from '$lib/previewUrl';
import { CHART_FIT_SHIM } from '$lib/chartFitShim';

import type { RequestHandler } from './$types';

function preparePreviewHeaders(headers: Headers) {
	headers.delete('x-frame-options');
	headers.delete('content-encoding');
	headers.delete('content-length');
	headers.delete('transfer-encoding');
	headers.set('content-disposition', 'inline');
	headers.set('content-security-policy', 'sandbox allow-scripts');
}

/**
 * Data-app HTML references its runtime with relative URLs (`./modules/app.js`, the
 * `./_runtime/...` importmap). Framed at app.textql.com those resolve against
 * textqlusercontent.com; framed through this same-origin proxy they'd resolve to
 * our host and 404. Injecting a <base> pointing at the upstream directory makes
 * every relative asset load straight from textqlusercontent.com again (its own CSP
 * allow-lists that directory and it serves `access-control-allow-origin: *`).
 */
function injectBaseHref(html: string, documentUrl: string): string {
	const baseHref = new URL('.', documentUrl).href;
	const baseTag = `<base href="${baseHref}">`;
	const headMatch = /<head[^>]*>/i.exec(html);
	if (headMatch) {
		const at = headMatch.index + headMatch[0].length;
		return html.slice(0, at) + baseTag + html.slice(at);
	}
	return baseTag + html;
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const target = url.searchParams.get('url');
	if (!target) error(400, 'Missing url');

	let parsed: URL;
	try {
		parsed = new URL(target);
	} catch {
		error(400, 'Invalid url');
	}

	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		error(400, 'Invalid protocol');
	}

	if (!isAllowedPreviewHost(parsed.hostname)) {
		error(403, 'Host not allowed');
	}

	const upstream = await fetch(parsed.href);
	const headers = new Headers(upstream.headers);
	preparePreviewHeaders(headers);

	// Rewrite only the top-level HTML document; its sub-resources then load direct from upstream.
	const contentType = upstream.headers.get('content-type') ?? '';
	if (upstream.ok && contentType.includes('text/html')) {
		let html = injectBaseHref(await upstream.text(), parsed.href);
		// Chart previews: inject the fit shim so ECharts resizes to the panel
		// instead of overflowing. Scoped to fit=chart so data-apps are untouched.
		if (url.searchParams.get('fit') === 'chart') {
			html = html.includes('</body>')
				? html.replace('</body>', `${CHART_FIT_SHIM}</body>`)
				: html + CHART_FIT_SHIM;
		}
		return new Response(html, { status: upstream.status, statusText: upstream.statusText, headers });
	}

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers
	});
};

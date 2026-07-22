import { error } from '@sveltejs/kit';

import { isAllowedPreviewHost } from '$lib/previewUrl';

import type { RequestHandler } from './$types';

function preparePreviewHeaders(headers: Headers) {
	headers.delete('x-frame-options');
	headers.delete('content-encoding');
	headers.delete('content-length');
	headers.delete('transfer-encoding');
	headers.set('content-disposition', 'inline');
	headers.set('content-security-policy', 'sandbox allow-scripts');
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

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers
	});
};

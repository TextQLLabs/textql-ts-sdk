import { withChartFitShim } from '../../src/lib/chartFitShim';
import { isAllowedPreviewHost } from '../../src/lib/previewUrl';
import { error, json } from '../kit';
import type { RequestHandler, RouteHandlers } from '../kit';
import { isConnectError, normalizeConnector, proxyError, textqlClients } from '../textql';
import type { TextqlRpcPublicConnectorConnector } from '@textql/sdk/models';
import { z } from 'zod';

// ─── /api/connectors ────────────────────────────────────────────────────────

const listConnectors: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.connectors.getConnectors({ body: {} });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to load connectors.' }, { status: 502 });
		}

		const connectors =
			'connectors' in result && Array.isArray(result.connectors) ? result.connectors : [];

		return json(
			{
				connectors: connectors
					.map(normalizeConnector)
					.filter((connector): connector is NonNullable<typeof connector> => connector !== null)
			},
			{
				headers: {
					'Cache-Control': 'private, max-age=60'
				}
			}
		);
	} catch (err) {
		return proxyError('Connectors list request', err);
	}
};

export const connectorsRoute: RouteHandlers = { GET: listConnectors };

// ─── /api/connectors/[id] ───────────────────────────────────────────────────

const getConnector: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	const connectorId = Number(params.id);
	if (!Number.isInteger(connectorId) || connectorId <= 0) {
		return json({ error: 'Invalid connector id.' }, { status: 400 });
	}

	try {
		const result = await client.connectors.get({ body: { connectorId } });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Connector not found.' }, { status: 404 });
		}

		const connector =
			'connector' in result && result.connector
				? (result.connector as TextqlRpcPublicConnectorConnector)
				: undefined;
		const normalized = connector ? normalizeConnector(connector) : null;

		if (!normalized) {
			return json({ error: 'Connector not found.' }, { status: 404 });
		}

		return json({ connector: normalized });
	} catch (err) {
		return proxyError('Connector request', err);
	}
};

export const connectorDetailRoute: RouteHandlers = { GET: getConnector };

// ─── /api/ontology ──────────────────────────────────────────────────────────

/** List the ontology's entries at a directory path (scoped by the API key's org). */
const listOntology: RequestHandler = async ({ url }) => {
	const { client } = textqlClients();
	const path = url.searchParams.get('path') ?? '';
	const recursive = url.searchParams.get('recursive') === '1';

	try {
		const res = await client.ontology.listEntries({ body: { path, recursive } });
		if (isConnectError(res)) {
			return json({ error: res.message ?? 'Failed to list the ontology.' }, { status: 502 });
		}
		const entries = (res.entries ?? [])
			.filter((e) => typeof e.path === 'string')
			.map((e) => ({
				path: e.path as string,
				name: e.name?.trim() || (e.path as string).split('/').pop() || (e.path as string),
				isDir: e.isDir === true,
				sizeBytes: Number(e.sizeBytes ?? 0)
			}))
			.sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name));
		return json({ path, entries });
	} catch (err) {
		return proxyError('Ontology listing', err);
	}
};

export const ontologyRoute: RouteHandlers = { GET: listOntology };

// ─── /api/ontology/file ─────────────────────────────────────────────────────

/** Fetch a single ontology file's contents for the code viewer. */
const getOntologyFile: RequestHandler = async ({ url }) => {
	const { client } = textqlClients();
	const path = url.searchParams.get('path');
	if (!path) return json({ error: 'A file path is required.' }, { status: 400 });

	try {
		const res = await client.ontology.getFile({ body: { path } });
		if (isConnectError(res)) {
			return json({ error: res.message ?? 'Failed to read the file.' }, { status: 502 });
		}
		const file = res.file;
		return json({
			path: file?.path ?? path,
			name: file?.name?.trim() || path.split('/').pop() || path,
			content: file?.content ?? ''
		});
	} catch (err) {
		return proxyError('Ontology file', err);
	}
};

export const ontologyFileRoute: RouteHandlers = { GET: getOntologyFile };

// ─── /api/questions ─────────────────────────────────────────────────────────

const AnswerSchema = z.object({
	selected: z.array(z.string()).default([]),
	custom: z.string().optional(),
	inputs: z.array(z.string()).default([]),
	provided: z.array(z.boolean()).default([])
});

const BodySchema = z.object({
	action: z.enum(['submit', 'dismiss']),
	cellId: z.string().trim().min(1, 'cellId is required.'),
	answers: z.array(AnswerSchema).default([])
});

const submitQuestions: RequestHandler = async ({ request }) => {
	const { client } = textqlClients();

	const parsed = BodySchema.safeParse(await request.json().catch(() => undefined));
	if (!parsed.success) {
		return json(
			{ error: parsed.error.issues[0]?.message ?? 'Invalid request body.' },
			{ status: 400 }
		);
	}
	const { action, cellId, answers } = parsed.data;

	try {
		const res =
			action === 'submit'
				? await client.chats.submitQuestions({ body: { cellId, answers } })
				: await client.chats.dismissQuestions({ body: { cellId, answers } });
		if (isConnectError(res)) {
			return json({ error: res.message ?? 'The chat service rejected the answers.' }, { status: 502 });
		}
		return json({ success: true });
	} catch (err) {
		return proxyError('Questions submission', err);
	}
};

export const questionsRoute: RouteHandlers = { POST: submitQuestions };

// ─── /api/slack/channels ────────────────────────────────────────────────────

const listSlackChannels: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.slack.listChannels({ body: {} });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to load Slack channels.' }, { status: 502 });
		}

		const channels = Array.isArray(result.channels) ? result.channels : [];

		return json(
			{
				channels: channels
					.map((channel) => {
						const channelId = typeof channel.channelId === 'string' ? channel.channelId.trim() : '';
						if (!channelId) return null;
						const name = typeof channel.name === 'string' ? channel.name.trim() : '';
						return { channelId, name: name || channelId };
					})
					.filter((channel): channel is NonNullable<typeof channel> => channel !== null)
			},
			{
				headers: {
					'Cache-Control': 'private, max-age=60'
				}
			}
		);
	} catch (err) {
		return proxyError('Slack channels list request', err);
	}
};

export const slackChannelsRoute: RouteHandlers = { GET: listSlackChannels };

// ─── /api/preview-proxy ─────────────────────────────────────────────────────

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

const previewProxy: RequestHandler = async ({ url }) => {
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
		// Chart previews: inject the fit shim so the chart reports its size and
		// fits the panel. Scoped to fit=chart so data-apps are untouched.
		if (url.searchParams.get('fit') === 'chart') {
			html = withChartFitShim(html);
		}
		return new Response(html, { status: upstream.status, statusText: upstream.statusText, headers });
	}

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers
	});
};

export const previewProxyRoute: RouteHandlers = { GET: previewProxy };

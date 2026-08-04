import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';

import { HttpError, type RouteHandlers } from './kit';
import { agentDetailRoute, agentRunRoute, agentsRoute } from './routes/agents';
import { appComputeRoute, appDetailRoute, appsMembersRoute, appsRoute } from './routes/apps';
import { chatRoute } from './routes/chat';
import { chatDetailRoute, chatMembersRoute, chatWatchRoute, chatsRoute } from './routes/chats';
import {
	connectorDetailRoute,
	connectorsRoute,
	ontologyFileRoute,
	ontologyRoute,
	previewProxyRoute,
	questionsRoute,
	slackChannelsRoute
} from './routes/misc';
import {
	playbookDeactivateRoute,
	playbookDeployRoute,
	playbookDetailRoute,
	playbookMembersRoute,
	playbooksRoute
} from './routes/playbooks';

/**
 * One entry per `src/routes/api/**\/+server.ts` in the SvelteKit demo.
 * `:name` segments become `params.name`, exactly like SvelteKit's `[name]`.
 */
const ROUTES: { pattern: string[]; handlers: RouteHandlers }[] = [
	{ pattern: ['api', 'agents'], handlers: agentsRoute },
	{ pattern: ['api', 'agents', ':id'], handlers: agentDetailRoute },
	{ pattern: ['api', 'agents', ':id', 'run', ':runId'], handlers: agentRunRoute },
	{ pattern: ['api', 'apps'], handlers: appsRoute },
	{ pattern: ['api', 'apps', 'members'], handlers: appsMembersRoute },
	{ pattern: ['api', 'apps', ':id'], handlers: appDetailRoute },
	{ pattern: ['api', 'apps', ':id', 'compute'], handlers: appComputeRoute },
	{ pattern: ['api', 'chat'], handlers: chatRoute },
	{ pattern: ['api', 'chats'], handlers: chatsRoute },
	{ pattern: ['api', 'chats', 'members'], handlers: chatMembersRoute },
	{ pattern: ['api', 'chats', ':id'], handlers: chatDetailRoute },
	{ pattern: ['api', 'chats', ':id', 'watch'], handlers: chatWatchRoute },
	{ pattern: ['api', 'connectors'], handlers: connectorsRoute },
	{ pattern: ['api', 'connectors', ':id'], handlers: connectorDetailRoute },
	{ pattern: ['api', 'ontology'], handlers: ontologyRoute },
	{ pattern: ['api', 'ontology', 'file'], handlers: ontologyFileRoute },
	{ pattern: ['api', 'playbooks'], handlers: playbooksRoute },
	{ pattern: ['api', 'playbooks', 'members'], handlers: playbookMembersRoute },
	{ pattern: ['api', 'playbooks', ':id'], handlers: playbookDetailRoute },
	{ pattern: ['api', 'playbooks', ':id', 'deploy'], handlers: playbookDeployRoute },
	{ pattern: ['api', 'playbooks', ':id', 'deactivate'], handlers: playbookDeactivateRoute },
	{ pattern: ['api', 'preview-proxy'], handlers: previewProxyRoute },
	{ pattern: ['api', 'questions'], handlers: questionsRoute },
	{ pattern: ['api', 'slack', 'channels'], handlers: slackChannelsRoute }
];

type Match = { handlers: RouteHandlers; params: Record<string, string> };

/** Static segments win over `:param` ones, so `/ontology/file` beats `/ontology/:x`. */
function matchRoute(pathname: string): Match | null {
	const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
	let fallback: Match | null = null;

	for (const route of ROUTES) {
		if (route.pattern.length !== segments.length) continue;
		const params: Record<string, string> = {};
		let exact = true;
		let ok = true;
		for (let i = 0; i < route.pattern.length; i += 1) {
			const part = route.pattern[i]!;
			if (part.startsWith(':')) {
				params[part.slice(1)] = segments[i]!;
				exact = false;
			} else if (part !== segments[i]) {
				ok = false;
				break;
			}
		}
		if (!ok) continue;
		if (exact) return { handlers: route.handlers, params };
		fallback ??= { handlers: route.handlers, params };
	}

	return fallback;
}

function toWebRequest(req: IncomingMessage, url: URL, signal: AbortSignal): Request {
	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (value === undefined) continue;
		if (Array.isArray(value)) for (const item of value) headers.append(key, item);
		else headers.set(key, value);
	}

	const method = (req.method ?? 'GET').toUpperCase();
	const hasBody = method !== 'GET' && method !== 'HEAD';

	return new Request(url, {
		method,
		headers,
		signal,
		...(hasBody
			? { body: Readable.toWeb(req) as ReadableStream<Uint8Array>, duplex: 'half' }
			: {})
	} as RequestInit & { duplex?: 'half' });
}

async function writeWebResponse(response: Response, res: ServerResponse): Promise<void> {
	res.statusCode = response.status;
	response.headers.forEach((value, key) => res.setHeader(key, value));

	if (!response.body) {
		res.end();
		return;
	}

	const reader = response.body.getReader();
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			// NDJSON streams must reach the browser line by line, not at close.
			res.write(value);
			res.flushHeaders?.();
		}
	} catch {
		// Client hung up mid-stream — nothing left to do but close.
	} finally {
		reader.releaseLock();
		res.end();
	}
}

/**
 * Connect-style middleware serving `/api/**`. Mounted on both the dev server and
 * `vite preview`, so the demo behaves identically in either mode.
 */
export async function apiMiddleware(
	req: IncomingMessage,
	res: ServerResponse,
	next: () => void
): Promise<void> {
	const rawUrl = req.url ?? '/';
	if (!rawUrl.startsWith('/api/')) {
		next();
		return;
	}

	const host = req.headers.host ?? 'localhost';
	const url = new URL(rawUrl, `http://${host}`);
	const match = matchRoute(url.pathname);

	if (!match) {
		res.statusCode = 404;
		res.setHeader('content-type', 'application/json; charset=utf-8');
		res.end(JSON.stringify({ message: `Not found: ${url.pathname}` }));
		return;
	}

	const method = (req.method ?? 'GET').toUpperCase() as keyof RouteHandlers;
	const handler = match.handlers[method];
	if (!handler) {
		res.statusCode = 405;
		res.setHeader('allow', Object.keys(match.handlers).join(', '));
		res.setHeader('content-type', 'application/json; charset=utf-8');
		res.end(JSON.stringify({ message: `${method} not allowed on ${url.pathname}` }));
		return;
	}

	// Give handlers the same abort semantics as SvelteKit's `request.signal`.
	const controller = new AbortController();
	const abort = () => controller.abort();
	res.on('close', abort);

	try {
		const response = await handler({
			params: match.params,
			url,
			request: toWebRequest(req, url, controller.signal)
		});
		await writeWebResponse(response, res);
	} catch (error) {
		if (res.headersSent) {
			res.end();
			return;
		}
		const status = error instanceof HttpError ? error.status : 500;
		const message =
			error instanceof HttpError
				? error.message
				: error instanceof Error
					? error.message
					: 'Internal error';
		if (status >= 500) console.error(`API ${url.pathname}`, error);
		res.statusCode = status;
		res.setHeader('content-type', 'application/json; charset=utf-8');
		res.end(JSON.stringify({ message }));
	} finally {
		res.off('close', abort);
	}
}

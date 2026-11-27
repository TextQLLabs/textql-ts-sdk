import type { IncomingMessage, ServerResponse } from 'node:http';

/** Thrown by a handler to answer with `status` and `{ message, ...details }`. */
export class HttpError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly details: Record<string, unknown> = {}
	) {
		super(message);
		this.name = 'HttpError';
	}
}

export type Handler = (request: { params: Record<string, string>; body: unknown }) => Promise<unknown>;

export type Route = { method: 'GET' | 'POST'; path: string; handler: Handler };

/** `/api/registrations/:id` against a pathname, capturing `:id` segments. */
function matchPath(pattern: string, pathname: string): Record<string, string> | null {
	const expected = pattern.split('/').filter(Boolean);
	const actual = pathname.split('/').filter(Boolean);
	if (expected.length !== actual.length) return null;

	const params: Record<string, string> = {};
	for (let i = 0; i < expected.length; i += 1) {
		const part = expected[i]!;
		const segment = decodeURIComponent(actual[i]!);
		if (part.startsWith(':')) params[part.slice(1)] = segment;
		else if (part !== segment) return null;
	}
	return params;
}

async function readJson(req: IncomingMessage): Promise<unknown> {
	const chunks: Buffer[] = [];
	for await (const chunk of req) chunks.push(chunk as Buffer);
	if (chunks.length === 0) return null;
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} catch {
		throw new HttpError(400, 'The request body must be JSON.');
	}
}

function send(res: ServerResponse, status: number, body: unknown) {
	res.statusCode = status;
	res.setHeader('content-type', 'application/json; charset=utf-8');
	res.end(JSON.stringify(body));
}

/** Connect-style middleware serving `routes` under `/api/` and passing everything else on. */
export function createApi(routes: Route[]) {
	return async (req: IncomingMessage, res: ServerResponse, next: () => void): Promise<void> => {
		const url = new URL(req.url ?? '/', 'http://localhost');
		if (!url.pathname.startsWith('/api/')) {
			next();
			return;
		}

		const method = (req.method ?? 'GET').toUpperCase();
		const matches = routes.flatMap((route) => {
			const params = matchPath(route.path, url.pathname);
			return params ? [{ route, params }] : [];
		});
		if (matches.length === 0) {
			send(res, 404, { message: `Not found: ${url.pathname}` });
			return;
		}
		const match = matches.find(({ route }) => route.method === method);
		if (!match) {
			send(res, 405, { message: `${method} is not allowed on ${url.pathname}` });
			return;
		}

		try {
			const body = method === 'POST' ? await readJson(req) : null;
			send(res, 200, await match.route.handler({ params: match.params, body }));
		} catch (error) {
			if (error instanceof HttpError) {
				send(res, error.status, { message: error.message, ...error.details });
				return;
			}
			console.error(`API ${method} ${url.pathname}`, error);
			send(res, 500, { message: error instanceof Error ? error.message : 'Internal error' });
		}
	};
}

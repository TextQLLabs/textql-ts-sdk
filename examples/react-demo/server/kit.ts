/**
 * A hair-thin stand-in for the handful of `@sveltejs/kit` primitives the API
 * routes use. Keeping the same shapes means every route body is a straight port
 * of its SvelteKit counterpart in ../../svelte-demo/src/routes/api.
 */

export type RequestEvent = {
	/** Path parameters captured by the router (`/api/agents/:id` → `{ id }`). */
	params: Record<string, string>;
	url: URL;
	request: Request;
};

export type RequestHandler = (event: RequestEvent) => Response | Promise<Response>;

export type RouteHandlers = Partial<Record<'GET' | 'POST' | 'PUT' | 'DELETE', RequestHandler>>;

/** JSON response helper — the same signature as SvelteKit's `json()`. */
export function json(data: unknown, init?: ResponseInit): Response {
	const headers = new Headers(init?.headers);
	if (!headers.has('content-type')) {
		headers.set('content-type', 'application/json; charset=utf-8');
	}
	return new Response(JSON.stringify(data), { ...init, headers });
}

/**
 * SvelteKit's `error()` throws; the router below catches HttpError and turns it
 * into a `{ message }` JSON response, matching SvelteKit's default behaviour
 * (which is what the client's `apiErrorDetail` already tolerates).
 */
export class HttpError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
		this.name = 'HttpError';
	}
}

export function error(status: number, message: string): never {
	throw new HttpError(status, message);
}

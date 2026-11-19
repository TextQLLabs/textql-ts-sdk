/** A failed `/api` call. `errors` carries per-field messages when the server rejected the form. */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly payload: Record<string, unknown>
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
	const response = await fetch(path, {
		method: body === undefined ? 'GET' : 'POST',
		headers: body === undefined ? undefined : { 'content-type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	const payload: unknown = await response.json().catch(() => ({}));
	const record = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};

	if (!response.ok) {
		const message = typeof record.message === 'string' ? record.message : `Request failed (${response.status}).`;
		throw new ApiError(response.status, message, record);
	}
	return payload as T;
}

export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'Something went wrong.';
}

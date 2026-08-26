import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import type { Textql } from '@textql/sdk';

import { errorMessage, textqlClient } from '$lib/server/admin';

export function field(data: FormData, key: string): string {
	return String(data.get(key) ?? '').trim();
}

export function csv(value: string): string[] {
	return value.split(',').map((item) => item.trim()).filter(Boolean);
}

type ActionResult = string | ActionFailure<{ message: string }>;

/**
 * One boundary for every write: resolve the client, run the body, and turn a
 * thrown SDK error into a form failure. Per-action code returns either its
 * success message or its own `fail` for a validation problem.
 */
export function adminAction(
	verb: string,
	run: (client: Textql, data: FormData) => Promise<ActionResult>
) {
	return async ({ request }: RequestEvent) => {
		const client = textqlClient();
		if (!client) return fail(400, { message: `Configure TEXTQL_API_KEY before ${verb}.` });
		try {
			const result = await run(client, await request.formData());
			return typeof result === 'string' ? { message: result } : result;
		} catch (cause) {
			return fail(400, { message: errorMessage(cause) });
		}
	};
}

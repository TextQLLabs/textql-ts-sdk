import { Textql } from '@textql/sdk';
import type { ConnectError } from '@textql/sdk/models';

import { HttpError } from './http';

let client: Textql | undefined;

/** One SDK client per process. Fails the request with a 503 when TEXTQL_API_KEY is unset. */
export function textql(): Textql {
	const apiKey = process.env.TEXTQL_API_KEY;
	if (!apiKey) throw new HttpError(503, 'TEXTQL_API_KEY is not configured.');
	client ??= new Textql({ apiKey, serverURL: process.env.TEXTQL_SERVER_URL || undefined });
	return client;
}

// Unary calls resolve to either the response or a ConnectError, and both are
// all-optional objects, so narrow with a predicate rather than `in` at each call.
export function isConnectError(response: object): response is ConnectError {
	return 'code' in response || 'details' in response;
}

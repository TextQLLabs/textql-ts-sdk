import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { Textql } from '@textql/sdk';
import type { ConnectError, TextqlRpcPublicConnectorConnector } from '@textql/sdk/models';
import { createStreamingClient, type StreamingClient } from '@textql/sdk/streaming';

type Clients = { client: Textql; streaming: StreamingClient };

let cached: Clients | undefined;

/** Shared per-process SDK clients. Fails the request with a 503 when TEXTQL_API_KEY is unset. */
export function textqlClients(): Clients {
	const apiKey = env.TEXTQL_API_KEY;
	if (!apiKey) error(503, 'TEXTQL_API_KEY is not configured.');
	if (!cached) {
		const client = new Textql({ apiKey, serverURL: env.TEXTQL_SERVER_URL ?? undefined });
		cached = { client, streaming: createStreamingClient(client) };
	}
	return cached;
}

export function isConnectError(response: object): response is ConnectError {
	return 'code' in response || 'details' in response;
}

export function proxyError(label: string, cause: unknown): Response {
	console.error(label, cause);
	return json({ error: `The ${label.toLowerCase()} failed.` }, { status: 502 });
}

export function normalizeConnector(connector: TextqlRpcPublicConnectorConnector) {
	if (
		typeof connector.id !== 'number' ||
		typeof connector.name !== 'string' ||
		!connector.name.trim()
	) {
		return null;
	}

	return {
		id: connector.id,
		name: connector.name.trim(),
		type: typeof connector.connectorType === 'string' ? connector.connectorType : 'UNKNOWN'
	};
}

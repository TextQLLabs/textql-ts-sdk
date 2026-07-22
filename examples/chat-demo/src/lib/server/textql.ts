import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { Textql } from '@textql/sdk';
import { createStreamingClient, type StreamingClient } from '@textql/sdk/streaming';

const RPC_SERVER_URL = 'https://app.textql.com/rpc/public';

type Clients = { client: Textql; streaming: StreamingClient };

let cached: Clients | undefined;

/** Shared per-process SDK clients. Fails the request with a 503 when TEXTQL_API_KEY is unset. */
export function textqlClients(): Clients {
	const apiKey = env.TEXTQL_API_KEY;
	if (!apiKey) error(503, 'TEXTQL_API_KEY is not configured.');
	cached ??= {
		client: new Textql({ apiKey, serverURL: RPC_SERVER_URL }),
		streaming: createStreamingClient({ apiKey })
	};
	return cached;
}

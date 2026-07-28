import { isConnectError, proxyError, textqlClients } from '$lib/server/textql';
import { isRecord } from '$lib/utils';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

/**
 * Relays a data app's ana.compute call to the backend. The browser bridge can't
 * hold the API key, so compute.run round-trips through here: the app posts a
 * function name + params, this invokes it via the SDK and returns the raw
 * resultJson for the bridge to hand back to the sandboxed app.
 */
export const POST: RequestHandler = async ({ params, request }) => {
	const { client } = textqlClients();

	try {
		const body: unknown = await request.json();
		if (!isRecord(body) || typeof body.functionName !== 'string') {
			return json({ error: 'functionName is required.' }, { status: 400 });
		}
		const paramsJson = typeof body.paramsJson === 'string' ? body.paramsJson : '{}';

		const result = await client.apps.invokeComputeFunction({
			body: { appId: params.id, functionName: body.functionName, paramsJson }
		});

		if (isConnectError(result)) {
			return json(
				{ error: result.message ?? 'Compute function failed.' },
				{ status: 502 }
			);
		}

		return json({ resultJson: typeof result.resultJson === 'string' ? result.resultJson : 'null' });
	} catch (error) {
		return proxyError('App compute request', error);
	}
};

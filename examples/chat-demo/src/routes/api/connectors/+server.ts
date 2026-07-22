import { isConnectError, normalizeConnector, proxyError, textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
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
	} catch (error) {
		return proxyError('Connectors list request', error);
	}
};

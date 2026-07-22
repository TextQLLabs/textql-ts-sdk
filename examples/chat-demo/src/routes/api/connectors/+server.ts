import { textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';

import type { TextqlRpcPublicConnectorConnector } from '@textql/sdk/models';
import type { RequestHandler } from './$types';

function normalizeConnector(connector: TextqlRpcPublicConnectorConnector) {
	if (typeof connector.id !== 'number' || typeof connector.name !== 'string' || !connector.name.trim()) {
		return null;
	}

	return {
		id: connector.id,
		name: connector.name.trim(),
		type: typeof connector.connectorType === 'string' ? connector.connectorType : 'UNKNOWN'
	};
}

export const GET: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.connectors.getConnectors({ body: {} });

		if ('code' in result) {
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
		console.error('Connectors list request failed', error);
		return json({ error: 'The connectors list request failed.' }, { status: 502 });
	}
};

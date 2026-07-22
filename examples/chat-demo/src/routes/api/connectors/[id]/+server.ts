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

export const GET: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	const connectorId = Number(params.id);
	if (!Number.isInteger(connectorId) || connectorId <= 0) {
		return json({ error: 'Invalid connector id.' }, { status: 400 });
	}

	try {
		const result = await client.connectors.get({ body: { connectorId } });

		if ('code' in result) {
			return json({ error: result.message ?? 'Connector not found.' }, { status: 404 });
		}

		const connector =
			'connector' in result && result.connector
				? (result.connector as TextqlRpcPublicConnectorConnector)
				: undefined;
		const normalized = connector ? normalizeConnector(connector) : null;

		if (!normalized) {
			return json({ error: 'Connector not found.' }, { status: 404 });
		}

		return json({ connector: normalized });
	} catch (error) {
		console.error('Connector request failed', error);
		return json({ error: 'The connector request failed.' }, { status: 502 });
	}
};

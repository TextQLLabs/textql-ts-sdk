import { isConnectError, normalizeConnector, proxyError, textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';

import type { TextqlRpcPublicConnectorConnector } from '@textql/sdk/models';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	const connectorId = Number(params.id);
	if (!Number.isInteger(connectorId) || connectorId <= 0) {
		return json({ error: 'Invalid connector id.' }, { status: 400 });
	}

	try {
		const result = await client.connectors.get({ body: { connectorId } });

		if (isConnectError(result)) {
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
		return proxyError('Connector request', error);
	}
};

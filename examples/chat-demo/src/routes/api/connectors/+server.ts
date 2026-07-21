import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { Textql } from '@textql/sdk';

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
	const apiKey = env.TEXTQL_API_KEY;
	if (!apiKey) {
		return json({ error: 'TEXTQL_API_KEY is not configured.' }, { status: 503 });
	}

	const client = new Textql({ apiKey, serverURL: 'https://app.textql.com/rpc/public' });

	try {
		const result = await client.connectors.getConnectors({ body: {} });

		if ('code' in result) {
			return json({ error: result.message ?? 'Unable to load connectors.' }, { status: 502 });
		}

		// Proto3 JSON omits empty fields, so an org with no connectors gets `{}` back.
		const connectors =
			'connectors' in result && Array.isArray(result.connectors) ? result.connectors : [];

		return json({
			connectors: connectors
				.map(normalizeConnector)
				.filter((connector): connector is NonNullable<typeof connector> => connector !== null)
		});
	} catch (error) {
		console.error('Connectors list request failed', error);
		return json({ error: 'The connectors list request failed.' }, { status: 502 });
	}
};

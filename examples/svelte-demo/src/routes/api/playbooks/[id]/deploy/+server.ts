import { isConnectError, proxyError, textqlClients, toIsoString } from '$lib/server/textql';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.playbooks.deploy({
			body: { playbookId: params.id }
		});

		if (isConnectError(result)) {
			return json(
				{ error: result.message ?? 'Unable to deploy playbook.' },
				{ status: 502 }
			);
		}

		return json({
			ok: true,
			id: typeof result.playbookId === 'string' ? result.playbookId : params.id,
			deployedAt: toIsoString(result.deployedAt)
		});
	} catch (error) {
		return proxyError('Playbook deploy request', error);
	}
};


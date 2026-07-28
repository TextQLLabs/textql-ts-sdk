import { isConnectError, proxyError, textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.playbooks.deactivate({
			body: { playbookId: params.id }
		});

		if (isConnectError(result)) {
			return json(
				{ error: result.message ?? 'Unable to deactivate playbook.' },
				{ status: 502 }
			);
		}

		return json({
			ok: true,
			id: params.id
		});
	} catch (error) {
		return proxyError('Playbook deactivate request', error);
	}
};

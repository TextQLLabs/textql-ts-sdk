import { memberOptions, proxyError, textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

/**
 * Creator facet options for the playbooks toolbar. Every member who owns a
 * playbook, so the facet lists people the list can actually be narrowed to.
 */
export const GET: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.playbooks.getMembersWith({ body: {} });

		return json({ members: memberOptions('members' in result ? result.members : undefined) });
	} catch (error) {
		return proxyError('Playbook members request', error);
	}
};

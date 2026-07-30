import { memberOptions, proxyError, textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

/**
 * Creator facet options for the threads toolbar. Every member who has authored
 * a chat, so the facet lists people the list can actually be narrowed to.
 */
export const GET: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.chats.getMembersWithChats({ body: {} });

		return json({ members: memberOptions('members' in result ? result.members : undefined) });
	} catch (error) {
		return proxyError('Chat members request', error);
	}
};

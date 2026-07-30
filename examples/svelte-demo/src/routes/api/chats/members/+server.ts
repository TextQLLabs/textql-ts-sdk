import { proxyError, textqlClients } from '$lib/server/textql';
import { trimmedOrNull } from '$lib/utils';
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
		const members = 'members' in result && Array.isArray(result.members) ? result.members : [];

		return json({
			members: members
				.filter((member) => typeof member.memberId === 'string')
				.map((member) => ({
					id: member.memberId,
					name: trimmedOrNull(member.memberName),
					email: trimmedOrNull(member.memberEmail),
					pictureUrl: trimmedOrNull(member.memberPictureUrl)
				}))
		});
	} catch (error) {
		return proxyError('Chat members request', error);
	}
};

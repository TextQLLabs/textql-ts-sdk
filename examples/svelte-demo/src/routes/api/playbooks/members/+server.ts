import { proxyError, textqlClients } from '$lib/server/textql';
import { trimmedOrNull } from '$lib/utils';
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
		return proxyError('Playbook members request', error);
	}
};

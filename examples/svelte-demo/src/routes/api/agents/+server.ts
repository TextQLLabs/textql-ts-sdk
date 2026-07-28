import { isConnectError, proxyError, textqlClients, toIsoString } from '$lib/server/textql';
import { json } from '@sveltejs/kit';
import type { TextqlRpcPublicAgentAgent } from '@textql/sdk/models';

import type { RequestHandler } from './$types';

function toListItem(agent: TextqlRpcPublicAgentAgent) {
	if (typeof agent.id !== 'string') return null;
	return {
		id: agent.id,
		name: agent.name?.trim() || 'Untitled agent',
		prompt: typeof agent.prompt === 'string' ? agent.prompt : '',
		isActive: agent.isActive === true,
		profileImageUrl:
			typeof agent.profileImageUrl === 'string' ? agent.profileImageUrl.trim() || null : null,
		ownerName: typeof agent.memberName === 'string' ? agent.memberName.trim() || null : null,
		llmModel: typeof agent.llmModel === 'string' ? agent.llmModel : null,
		schedules: Array.isArray(agent.postingFrequencyCrons) ? agent.postingFrequencyCrons : [],
		lastPostAt: toIsoString(agent.lastPostAt)
	};
}

export const GET: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.agents.list({ body: { includeInactive: true } });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to list agents.' }, { status: 502 });
		}

		const agents = Array.isArray(result.agents) ? result.agents : [];
		return json({ agents: agents.map(toListItem).filter((item) => item !== null) });
	} catch (error) {
		return proxyError('Agent list request', error);
	}
};

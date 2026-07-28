import { isConnectError, proxyError, textqlClients, toIsoString } from '$lib/server/textql';
import { isRecord } from '$lib/utils';
import { json } from '@sveltejs/kit';
import {
	TextqlRpcParadigmParamsParadigmType,
	TextqlRpcPublicChatLlmModel,
	TextqlRpcPublicPlaybookPlaybookTriggerType,
	type TextqlRpcPublicPlaybookPlaybook
} from '@textql/sdk/models';

import type { RequestHandler } from './$types';

const LLM_MODELS = new Set<string>(Object.values(TextqlRpcPublicChatLlmModel));

function serializePlaybook(playbook: TextqlRpcPublicPlaybookPlaybook) {
	const connectorIds = Array.isArray(playbook.connectorIds)
		? playbook.connectorIds.filter(
				(id): id is number => typeof id === 'number' && Number.isInteger(id)
			)
		: [];

	return {
		id: playbook.id,
		name: playbook.name?.trim() || 'Untitled playbook',
		prompt: typeof playbook.prompt === 'string' ? playbook.prompt : '',
		status: typeof playbook.status === 'string' ? playbook.status : 'STATUS_UNKNOWN',
		triggerType:
			typeof playbook.triggerType === 'string' ? playbook.triggerType : 'TRIGGER_TYPE_UNKNOWN',
		cronString: typeof playbook.cronString === 'string' ? playbook.cronString : '',
		llmModel: typeof playbook.llmModel === 'string' ? playbook.llmModel : null,
		connectorIds,
		emailAddresses: Array.isArray(playbook.emailAddresses) ? playbook.emailAddresses : [],
		slackChannelId:
			typeof playbook.slackChannelId === 'string' ? playbook.slackChannelId : null,
		isRunning: playbook.isRunning === true,
		updatedAt: toIsoString(playbook.updatedAt),
		createdAt: toIsoString(playbook.createdAt)
	};
}

export const GET: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.playbooks.fetch({
			body: { playbookId: params.id }
		});

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Playbook not found.' }, { status: 404 });
		}

		if (!result.playbook || typeof result.playbook.id !== 'string') {
			return json({ error: 'Playbook not found.' }, { status: 404 });
		}

		return json({ playbook: serializePlaybook(result.playbook) });
	} catch (error) {
		return proxyError('Playbook request', error);
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { client } = textqlClients();

	try {
		const body: unknown = await request.json();
		if (!isRecord(body)) {
			return json({ error: 'Invalid request body.' }, { status: 400 });
		}

		const name = typeof body.name === 'string' ? body.name.trim() : '';
		const prompt = typeof body.prompt === 'string' ? body.prompt : '';
		const cronString =
			typeof body.cronString === 'string' ? body.cronString.trim() : '';
		const llmModel =
			typeof body.llmModel === 'string' && LLM_MODELS.has(body.llmModel)
				? (body.llmModel as TextqlRpcPublicChatLlmModel)
				: undefined;
		const connectorIds = Array.isArray(body.connectorIds)
			? body.connectorIds.filter(
					(id): id is number => typeof id === 'number' && Number.isInteger(id)
				)
			: [];
		const emailAddresses = Array.isArray(body.emailAddresses)
			? body.emailAddresses.filter(
					(email): email is string => typeof email === 'string' && email.trim().length > 0
				)
			: [];
		const slackChannelId =
			typeof body.slackChannelId === 'string' && body.slackChannelId.trim()
				? body.slackChannelId.trim()
				: null;

		const result = await client.playbooks.update({
			body: {
				playbookId: params.id,
				name: name || 'Untitled playbook',
				prompt,
				triggerType: cronString
					? TextqlRpcPublicPlaybookPlaybookTriggerType.TriggerTypeCron
					: TextqlRpcPublicPlaybookPlaybookTriggerType.TriggerTypeUnknown,
				cronString: cronString || null,
				llmModel,
				paradigmType: TextqlRpcParadigmParamsParadigmType.TypeUniversal,
				paradigmOptions: {
					universal: {
						sqlEnabled: true,
						pythonEnabled: true,
						connectorIds
					}
				},
				connectorIds: { items: connectorIds },
				emailAddresses: { items: emailAddresses },
				slackChannelId
			}
		});

		if (isConnectError(result)) {
			return json(
				{ error: result.message ?? 'Unable to update playbook.' },
				{ status: 502 }
			);
		}

		if (!result.playbook || typeof result.playbook.id !== 'string') {
			return json({ error: 'Update returned no playbook.' }, { status: 502 });
		}

		return json({ playbook: serializePlaybook(result.playbook) });
	} catch (error) {
		return proxyError('Playbook update request', error);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.playbooks.delete({
			body: { playbookId: params.id }
		});

		if (isConnectError(result)) {
			return json(
				{ error: result.message ?? 'Unable to delete playbook.' },
				{ status: 404 }
			);
		}

		return json({ ok: true, id: params.id });
	} catch (error) {
		return proxyError('Playbook delete request', error);
	}
};

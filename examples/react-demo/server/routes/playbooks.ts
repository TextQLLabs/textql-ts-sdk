import { isRecord } from '../../src/lib/utils';
import { json } from '../kit';
import type { RequestHandler, RouteHandlers } from '../kit';
import { isConnectError, proxyError, textqlClients, toIsoString } from '../textql';
import {
	TextqlRpcParadigmParamsParadigmType,
	TextqlRpcPublicChatLlmModel,
	TextqlRpcPublicCommonSortDirection,
	TextqlRpcPublicPlaybookPlaybookSortField,
	TextqlRpcPublicPlaybookPlaybookTriggerType,
	type TextqlRpcPublicPlaybookPlaybook
} from '@textql/sdk/models';

const LLM_MODELS = new Set<string>(Object.values(TextqlRpcPublicChatLlmModel));

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

// ─── /api/playbooks ─────────────────────────────────────────────────────────

function ownerLabel(playbook: TextqlRpcPublicPlaybookPlaybook): string | null {
	const owner = playbook.owner;
	if (!owner) return null;
	const name = typeof owner.memberName === 'string' ? owner.memberName.trim() : '';
	if (name) return name;
	const email = typeof owner.memberEmail === 'string' ? owner.memberEmail.trim() : '';
	return email || null;
}

function toListItem(playbook: TextqlRpcPublicPlaybookPlaybook) {
	if (typeof playbook.id !== 'string') return null;
	return {
		id: playbook.id,
		name: playbook.name?.trim() || 'Untitled playbook',
		status: typeof playbook.status === 'string' ? playbook.status : 'STATUS_UNKNOWN',
		cronString: typeof playbook.cronString === 'string' ? playbook.cronString : null,
		ownerName: ownerLabel(playbook),
		updatedAt: toIsoString(playbook.updatedAt) ?? toIsoString(playbook.createdAt),
		isRunning: playbook.isRunning === true
	};
}

const listPlaybooks: RequestHandler = async () => {
	const { client } = textqlClients();

	const getPage = async (page: number) => {
		const result = await client.playbooks.get({
			body: {
				// Org-wide: surface everyone's playbooks, not just the caller's.
				memberOnly: false,
				limit: PAGE_SIZE,
				offset: page * PAGE_SIZE,
				sortBy: TextqlRpcPublicPlaybookPlaybookSortField.SortFieldUpdatedAt,
				sortDirection: TextqlRpcPublicCommonSortDirection.SortDirectionDesc
			}
		});

		if (isConnectError(result)) {
			throw new Error(result.message ?? 'Unable to list playbooks.');
		}

		return {
			playbooks: Array.isArray(result.playbooks) ? result.playbooks : [],
			totalCount: typeof result.totalCount === 'number' ? result.totalCount : undefined
		};
	};

	try {
		const first = await getPage(0);
		const playbooks: TextqlRpcPublicPlaybookPlaybook[] = [...first.playbooks];
		let totalCount = first.totalCount;

		if (
			totalCount !== undefined &&
			totalCount > playbooks.length &&
			first.playbooks.length === PAGE_SIZE
		) {
			const pageCount = Math.min(MAX_PAGES, Math.ceil(totalCount / PAGE_SIZE));
			const rest = await Promise.all(
				Array.from({ length: pageCount - 1 }, (_, i) => getPage(i + 1))
			);
			for (const page of rest) playbooks.push(...page.playbooks);
		} else if (totalCount === undefined && first.playbooks.length === PAGE_SIZE) {
			for (let page = 1; page < MAX_PAGES; page += 1) {
				const next = await getPage(page);
				playbooks.push(...next.playbooks);
				totalCount = next.totalCount ?? totalCount;
				if (next.playbooks.length < PAGE_SIZE) break;
			}
		}

		return json({
			playbooks: playbooks.map(toListItem).filter((item) => item !== null),
			totalCount: totalCount ?? playbooks.length
		});
	} catch (error) {
		return proxyError('Playbook list request', error);
	}
};

const createPlaybook: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const created = await client.playbooks.createPlaybook({ body: {} });
		if (isConnectError(created)) {
			return json({ error: created.message ?? 'Unable to create playbook.' }, { status: 502 });
		}

		const playbook = created.playbook;
		if (!playbook || typeof playbook.id !== 'string') {
			return json({ error: 'Create playbook returned no id.' }, { status: 502 });
		}

		return json({ playbook: toListItem(playbook) }, { status: 201 });
	} catch (error) {
		return proxyError('Playbook create request', error);
	}
};

export const playbooksRoute: RouteHandlers = { GET: listPlaybooks, POST: createPlaybook };

// ─── /api/playbooks/[id] ────────────────────────────────────────────────────

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
		slackChannelId: typeof playbook.slackChannelId === 'string' ? playbook.slackChannelId : null,
		isRunning: playbook.isRunning === true,
		updatedAt: toIsoString(playbook.updatedAt),
		createdAt: toIsoString(playbook.createdAt)
	};
}

const getPlaybook: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.playbooks.fetch({ body: { playbookId: params.id } });

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

const updatePlaybook: RequestHandler = async ({ params, request }) => {
	const { client } = textqlClients();

	try {
		const body: unknown = await request.json();
		if (!isRecord(body)) {
			return json({ error: 'Invalid request body.' }, { status: 400 });
		}

		const name = typeof body.name === 'string' ? body.name.trim() : '';
		const prompt = typeof body.prompt === 'string' ? body.prompt : '';
		const cronString = typeof body.cronString === 'string' ? body.cronString.trim() : '';
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
			return json({ error: result.message ?? 'Unable to update playbook.' }, { status: 502 });
		}

		if (!result.playbook || typeof result.playbook.id !== 'string') {
			return json({ error: 'Update returned no playbook.' }, { status: 502 });
		}

		return json({ playbook: serializePlaybook(result.playbook) });
	} catch (error) {
		return proxyError('Playbook update request', error);
	}
};

const deletePlaybook: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.playbooks.delete({ body: { playbookId: params.id } });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to delete playbook.' }, { status: 404 });
		}

		return json({ ok: true, id: params.id });
	} catch (error) {
		return proxyError('Playbook delete request', error);
	}
};

export const playbookDetailRoute: RouteHandlers = {
	GET: getPlaybook,
	PUT: updatePlaybook,
	DELETE: deletePlaybook
};

// ─── /api/playbooks/[id]/deploy ─────────────────────────────────────────────

const deployPlaybook: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.playbooks.deploy({ body: { playbookId: params.id } });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to deploy playbook.' }, { status: 502 });
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

export const playbookDeployRoute: RouteHandlers = { POST: deployPlaybook };

// ─── /api/playbooks/[id]/deactivate ─────────────────────────────────────────

const deactivatePlaybook: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.playbooks.deactivate({ body: { playbookId: params.id } });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to deactivate playbook.' }, { status: 502 });
		}

		return json({ ok: true, id: params.id });
	} catch (error) {
		return proxyError('Playbook deactivate request', error);
	}
};

export const playbookDeactivateRoute: RouteHandlers = { POST: deactivatePlaybook };

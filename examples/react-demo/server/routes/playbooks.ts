import { isRecord } from '../../src/lib/utils';
import { json } from '../kit';
import type { RequestHandler, RouteHandlers } from '../kit';
import {
	isConnectError,
	pagingFields,
	proxyError,
	readPaging,
	textqlClients,
	toIsoString
} from '../textql';
import {
	TextqlRpcParadigmParamsParadigmType,
	TextqlRpcPublicChatLlmModel,
	TextqlRpcPublicCommonSortDirection,
	TextqlRpcPublicPlaybookPlaybookSortField,
	TextqlRpcPublicPlaybookPlaybookStatus,
	TextqlRpcPublicPlaybookPlaybookTriggerType,
	type TextqlRpcPublicPlaybookPlaybook
} from '@textql/sdk/models';

const LLM_MODELS = new Set<string>(Object.values(TextqlRpcPublicChatLlmModel));

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

const SORT_FIELDS: Record<string, TextqlRpcPublicPlaybookPlaybookSortField> = {
	updated: TextqlRpcPublicPlaybookPlaybookSortField.SortFieldUpdatedAt,
	created: TextqlRpcPublicPlaybookPlaybookSortField.SortFieldCreatedAt,
	name: TextqlRpcPublicPlaybookPlaybookSortField.SortFieldName,
	schedule: TextqlRpcPublicPlaybookPlaybookSortField.SortFieldSchedule
};

const listPlaybooks: RequestHandler = async ({ url }) => {
	const { client } = textqlClients();

	const paging = readPaging(url);

	// Facet values from the FilterToolbar, applied server-side so they span the
	// whole list rather than the page already loaded.
	const searchTerm = url.searchParams.get('q')?.trim() || undefined;
	const creatorMemberIds = url.searchParams.getAll('creator').filter(Boolean);
	const knownStatuses = new Set<string>(Object.values(TextqlRpcPublicPlaybookPlaybookStatus));
	const statuses = url.searchParams
		.getAll('status')
		.filter((status): status is TextqlRpcPublicPlaybookPlaybookStatus =>
			knownStatuses.has(status)
		);
	const scope = url.searchParams.getAll('scope');
	const sortBy = SORT_FIELDS[url.searchParams.get('sort') ?? ''] ?? SORT_FIELDS.updated;
	const sortDirection =
		url.searchParams.get('dir') === 'asc'
			? TextqlRpcPublicCommonSortDirection.SortDirectionAsc
			: TextqlRpcPublicCommonSortDirection.SortDirectionDesc;

	try {
		const result = await client.playbooks.get({
			body: {
				// Org-wide: surface everyone's playbooks, not just the caller's.
				memberOnly: false,
				limit: paging.pageSize,
				offset: paging.offset,
				sortBy,
				sortDirection,
				searchTerm,
				...(creatorMemberIds.length ? { creatorMemberIds } : {}),
				...(statuses.length ? { statuses } : {}),
				onlySubscribed: scope.includes('subscribed') || undefined,
				sharedWithMe: scope.includes('shared') || undefined
			}
		});

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to list playbooks.' }, { status: 502 });
		}

		const playbooks: TextqlRpcPublicPlaybookPlaybook[] = Array.isArray(result.playbooks)
			? result.playbooks
			: [];
		const totalCount = typeof result.totalCount === 'number' ? result.totalCount : undefined;

		return json({
			playbooks: playbooks.map(toListItem).filter((item) => item !== null),
			...pagingFields(paging, totalCount, playbooks.length)
		});
	} catch (error) {
		return proxyError('Playbook list request', error);
	}
};

// ─── /api/playbooks/members ─────────────────────────────────────────────────

/**
 * Creator facet options for the playbooks toolbar. Every member who owns a
 * playbook, so the facet lists people the list can actually be narrowed to.
 */
const listPlaybookMembers: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.playbooks.getMembersWith({ body: {} });
		const members = 'members' in result && Array.isArray(result.members) ? result.members : [];

		return json({
			members: members
				.filter((member) => typeof member.memberId === 'string')
				.map((member) => ({
					id: member.memberId,
					name: member.memberName?.trim() || null,
					email: member.memberEmail?.trim() || null,
					pictureUrl: member.memberPictureUrl?.trim() || null
				}))
		});
	} catch (error) {
		return proxyError('Playbook members request', error);
	}
};

export const playbookMembersRoute: RouteHandlers = { GET: listPlaybookMembers };

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

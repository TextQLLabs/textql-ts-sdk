import {
	isConnectError,
	pagingFields,
	proxyError,
	readPaging,
	textqlClients,
	toIsoString
} from '$lib/server/textql';
import { json } from '@sveltejs/kit';
import {
	TextqlRpcPublicCommonSortDirection,
	TextqlRpcPublicPlaybookPlaybookSortField,
	TextqlRpcPublicPlaybookPlaybookStatus,
	type TextqlRpcPublicPlaybookPlaybook
} from '@textql/sdk/models';

import type { RequestHandler } from './$types';

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

export const GET: RequestHandler = async ({ url }) => {
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

export const POST: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const created = await client.playbooks.createPlaybook({ body: {} });
		if (isConnectError(created)) {
			return json(
				{ error: created.message ?? 'Unable to create playbook.' },
				{ status: 502 }
			);
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

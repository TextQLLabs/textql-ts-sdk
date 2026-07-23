import { isConnectError, proxyError, textqlClients, toIsoString } from '$lib/server/textql';
import { json } from '@sveltejs/kit';
import {
	TextqlRpcPublicCommonSortDirection,
	TextqlRpcPublicPlaybookPlaybookSortField,
	type TextqlRpcPublicPlaybookPlaybook
} from '@textql/sdk/models';

import type { RequestHandler } from './$types';

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

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

export const GET: RequestHandler = async () => {
	const { client } = textqlClients();

	const getPage = async (page: number) => {
		const result = await client.playbooks.get({
			body: {
				memberOnly: true,
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

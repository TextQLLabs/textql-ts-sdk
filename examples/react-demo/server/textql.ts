import { Textql } from '@textql/sdk';
import type { ConnectError, TextqlRpcPublicConnectorConnector } from '@textql/sdk/models';
import { createStreamingClient, type StreamingClient } from '@textql/sdk/streaming';

import { error, json } from './kit';

type Clients = { client: Textql; streaming: StreamingClient };

let cached: Clients | undefined;

/** Shared per-process SDK clients. Fails the request with a 503 when TEXTQL_API_KEY is unset. */
export function textqlClients(): Clients {
	const apiKey = process.env.TEXTQL_API_KEY;
	if (!apiKey) error(503, 'TEXTQL_API_KEY is not configured.');
	if (!cached) {
		const client = new Textql({ apiKey, serverURL: process.env.TEXTQL_SERVER_URL || undefined });
		cached = { client, streaming: createStreamingClient(client) };
	}
	return cached;
}

export function isConnectError(response: object): response is ConnectError {
	return 'code' in response || 'details' in response;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export function clampInt(raw: string | null, fallback: number, min: number, max: number) {
	const parsed = Number(raw);
	if (raw === null || !Number.isFinite(parsed)) return fallback;
	return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

/** `?page=` / `?pageSize=` for a list route, clamped to something sane. */
export function readPaging(url: URL) {
	const pageSize = clampInt(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
	const page = clampInt(url.searchParams.get('page'), 0, 0, Number.MAX_SAFE_INTEGER);
	return { page, pageSize, offset: page * pageSize };
}

/** The paging envelope every list route returns alongside its rows. */
export function pagingFields(
	{ page, pageSize }: { page: number; pageSize: number },
	totalCount: number | undefined,
	returned: number
) {
	return {
		page,
		pageSize,
		totalCount: totalCount ?? page * pageSize + returned,
		// With a total we can be exact; otherwise a short page means the end.
		hasMore: totalCount !== undefined ? (page + 1) * pageSize < totalCount : returned === pageSize
	};
}

export const SINCE_PREFIX = 'since:';

/** Date facet value — a preset id or `since:YYYY-MM-DD` — to a lower bound. */
export function createdAfterFor(value: string | null): Date | undefined {
	if (!value) return undefined;

	if (value.startsWith(SINCE_PREFIX)) {
		const parsed = new Date(`${value.slice(SINCE_PREFIX.length)}T00:00:00`);
		return Number.isNaN(parsed.getTime()) ? undefined : parsed;
	}

	const days: Record<string, number> = { today: 1, week: 7, month: 30, quarter: 90 };
	if (!(value in days)) return undefined;
	const since = new Date();
	since.setHours(0, 0, 0, 0);
	since.setDate(since.getDate() - (days[value] - 1));
	return since;
}

/** Normalize SDK timestamps that may arrive as Date or ISO string. */
export function toIsoString(value: unknown): string | null {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value.toISOString();
	}
	if (typeof value === 'string' && value.trim()) {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
	}
	return null;
}

/** Backend list RPCs default to 20 rows and reject anything above 100. */
export const LIST_PAGE_SIZE = 100;
const MAX_LIST_PAGES = 50;

type ListPage<T> = { items: T[]; totalCount?: number };

/**
 * Drains an offset-paginated list RPC so callers get the whole collection.
 * Pages after the first are fetched in parallel when the RPC reports a
 * totalCount, and sequentially otherwise; MAX_LIST_PAGES bounds both paths.
 */
export async function fetchAllPages<T>(
	getPage: (offset: number, limit: number) => Promise<ListPage<T>>
): Promise<{ items: T[]; totalCount: number }> {
	const first = await getPage(0, LIST_PAGE_SIZE);
	const items = [...first.items];
	let totalCount = first.totalCount;

	if (first.items.length === LIST_PAGE_SIZE) {
		if (totalCount !== undefined && totalCount > items.length) {
			const pageCount = Math.min(MAX_LIST_PAGES, Math.ceil(totalCount / LIST_PAGE_SIZE));
			const rest = await Promise.all(
				Array.from({ length: pageCount - 1 }, (_, i) =>
					getPage((i + 1) * LIST_PAGE_SIZE, LIST_PAGE_SIZE)
				)
			);
			for (const page of rest) items.push(...page.items);
		} else if (totalCount === undefined) {
			for (let page = 1; page < MAX_LIST_PAGES; page += 1) {
				const next = await getPage(page * LIST_PAGE_SIZE, LIST_PAGE_SIZE);
				items.push(...next.items);
				totalCount = next.totalCount ?? totalCount;
				if (next.items.length < LIST_PAGE_SIZE) break;
			}
		}
	}

	return { items, totalCount: totalCount ?? items.length };
}

export function proxyError(label: string, cause: unknown): Response {
	console.error(label, cause);
	return json({ error: `The ${label.toLowerCase()} failed.` }, { status: 502 });
}

export function normalizeConnector(connector: TextqlRpcPublicConnectorConnector) {
	if (
		typeof connector.id !== 'number' ||
		typeof connector.name !== 'string' ||
		!connector.name.trim()
	) {
		return null;
	}

	return {
		id: connector.id,
		name: connector.name.trim(),
		type: typeof connector.connectorType === 'string' ? connector.connectorType : 'UNKNOWN'
	};
}

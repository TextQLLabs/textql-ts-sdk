import { Textql } from '@textql/sdk';
import type {
	ConnectError,
	TextqlRpcIdentityMemberPreview,
	TextqlRpcPublicConnectorConnector
} from '@textql/sdk/models';
import { createStreamingClient, type StreamingClient } from '@textql/sdk/streaming';

import { DATE_PRESETS, SINCE_PREFIX } from '../src/lib/tableFilter';
import { trimmedOrNull } from '../src/lib/utils';
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
/** The backend clamps list `limit` to 100; asking for more silently skips rows. */
const MAX_PAGE_SIZE = 100;

function clampInt(raw: string | null, fallback: number, min: number, max: number) {
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

const PRESET_DAYS = new Map(DATE_PRESETS.map((preset) => [preset.value, preset.days]));

/** Date facet value — a preset id or `since:YYYY-MM-DD` — to a lower bound. */
export function createdAfterFor(value: string | null): Date | undefined {
	if (!value) return undefined;

	if (value.startsWith(SINCE_PREFIX)) {
		const parsed = new Date(`${value.slice(SINCE_PREFIX.length)}T00:00:00`);
		return Number.isNaN(parsed.getTime()) ? undefined : parsed;
	}

	const days = PRESET_DAYS.get(value);
	if (days === undefined) return undefined;
	const since = new Date();
	since.setHours(0, 0, 0, 0);
	since.setDate(since.getDate() - (days - 1));
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

/** Creator-facet options from a `getMembersWith*` response. */
export function memberOptions(members: unknown) {
	// The RPC returns a `Response | ConnectError` union, so the member list is
	// only `unknown` here — narrow at the boundary rather than casting.
	if (!Array.isArray(members)) return [];
	return members
		.filter(
			(member): member is TextqlRpcIdentityMemberPreview =>
				!!member && typeof member === 'object' && typeof member.memberId === 'string'
		)
		.map((member) => ({
			id: member.memberId,
			name: trimmedOrNull(member.memberName),
			email: trimmedOrNull(member.memberEmail),
			pictureUrl: trimmedOrNull(member.memberPictureUrl)
		}));
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

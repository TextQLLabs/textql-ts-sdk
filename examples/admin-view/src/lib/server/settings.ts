import { env } from '$env/dynamic/private';
import { Textql } from '@textql/sdk';

/**
 * Settings are read through the same pinned SDK used for mutations. Keeping
 * this helper separate gives us one place to redact fields before SvelteKit
 * serializes the organization into page data.
 */

export interface LiveSettings {
	configured: boolean;
	organization?: Record<string, unknown>;
	/** Host only — safe to send to the browser, unlike the key. */
	serverUrl: string;
	error?: string;
}

/**
 * GetOrganizationSettings is a public RPC, and `slack_key` carries no
 * visibility restriction (proto/api/auth.proto:60) — so the org's Slack bot
 * token comes back in the payload. This whole object is serialized into the
 * page for the browser, so strip it before it leaves the server.
 */
const SECRET_KEYS = ['slackKey'];

function redact(organization: Record<string, unknown>): Record<string, unknown> {
	const safe = { ...organization };
	for (const key of SECRET_KEYS) {
		if (safe[key] !== undefined) safe[key] = '<redacted>';
	}
	return safe;
}

export async function fetchOrganizationSettings(): Promise<LiveSettings> {
	const apiKey = env.TEXTQL_API_KEY?.trim();
	const base = (env.TEXTQL_SERVER_URL?.trim() || 'https://api.textql.com').replace(/\/+$/, '');

	if (!apiKey) {
		return { configured: false, serverUrl: base };
	}

	try {
		const serverURL = base.endsWith('/rpc/public') ? base : `${base}/rpc/public`;
		const client = new Textql({ apiKey, serverURL });
		const result = await client.settings.get({ body: {} });
		const organization =
			result && typeof result === 'object' && 'organization' in result && result.organization
				? (result.organization as unknown as Record<string, unknown>)
				: undefined;
		if (!organization) {
			return { configured: true, serverUrl: base, error: 'Organization settings were not returned.' };
		}
		return { configured: true, serverUrl: base, organization: redact(organization) };
	} catch (cause) {
		console.error('GetOrganizationSettings failed', cause);
		return {
			configured: true,
			serverUrl: base,
			error: 'Request failed. Check TEXTQL_SERVER_URL and the API key.'
		};
	}
}

/**
 * proto3 omits false booleans from JSON, so an absent key is a real `false`
 * rather than missing data. Callers need that distinction spelled out or they
 * misread a sparse response as an incomplete one.
 */
export function readBool(
	organization: Record<string, unknown> | undefined,
	key: string
): { value: boolean; present: boolean } | null {
	if (!organization) return null;
	const raw = organization[key];
	if (typeof raw === 'boolean') return { value: raw, present: true };
	if (raw === undefined) return { value: false, present: false };
	return null;
}

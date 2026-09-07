import type { Textql } from '@textql/sdk';

/**
 * Settings are read through the same pinned SDK used for mutations. Keeping
 * this helper separate gives us one place to redact fields before SvelteKit
 * serializes the organization into page data.
 */

export interface LiveSettings {
	organization?: Record<string, unknown>;
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

/** Takes the caller's client so the whole app reads one API key and one host. */
export async function fetchOrganizationSettings(client: Textql): Promise<LiveSettings> {
	try {
		const result = await client.settings.get({ body: {} });
		const organization =
			result && typeof result === 'object' && 'organization' in result && result.organization
				? (result.organization as unknown as Record<string, unknown>)
				: undefined;
		if (!organization) return { error: 'Organization settings were not returned.' };
		return { organization: redact(organization) };
	} catch (cause) {
		console.error('GetOrganizationSettings failed', cause);
		return { error: 'Request failed. Check TEXTQL_SERVER_URL and the API key.' };
	}
}

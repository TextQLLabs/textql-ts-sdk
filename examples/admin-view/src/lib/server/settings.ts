import { env } from '$env/dynamic/private';

/**
 * GetOrganizationSettings is a public RPC and is mapped in speakeasy_names.yaml
 * (SettingsService_GetOrganizationSettings -> `get`), but the current SDK
 * checkout predates that regeneration and exposes no `settings.get`. Until the
 * SDK is regenerated we call the Connect endpoint directly; afterwards this
 * whole module collapses to:
 *
 *   const result = await client.settings.get({});
 */
const RPC_PATH =
	'/rpc/public/textql.rpc.public.settings.SettingsService/GetOrganizationSettings';

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
		const response = await fetch(`${base}${RPC_PATH}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: '{}'
		});

		if (!response.ok) {
			const detail = await response.text().catch(() => '');
			return {
				configured: true,
				serverUrl: base,
				error: `${response.status} ${response.statusText}${detail ? ` — ${detail.slice(0, 200)}` : ''}`
			};
		}

		const payload = (await response.json()) as { organization?: Record<string, unknown> };
		return { configured: true, serverUrl: base, organization: redact(payload.organization ?? {}) };
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

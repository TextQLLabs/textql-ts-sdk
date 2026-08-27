/**
 * Ready-to-run requests for one setting.
 *
 * The reason this is not a one-liner: `paradigmParams` and `toolRestrictions`
 * are whole-message replaces with no field presence, so sending
 * `{"paradigmParams":{"bashEnabled":true}}` writes false to every other toggle.
 * Any request that touches them has to carry the complete object. When live org
 * data is available we can emit that object outright; without it, the only
 * honest answer is the read-modify-write shape.
 */

import { ORG_FIELDS } from '$lib/catalog';
import type { FeatureRow, Source } from '$lib/features';

const GET_PATH = '/rpc/public/textql.rpc.public.settings.SettingsService/GetOrganizationSettings';
const UPDATE_PATH =
	'/rpc/public/textql.rpc.public.settings.SettingsService/UpdateOrganizationSettings';

export interface RequestSnippet {
	title: string;
	language: 'bash' | 'json';
	code: string;
	/** Shown above the snippet when it needs a health warning. */
	warning?: string;
}

/** `-s` so the progress meter stays out of the piped output. */
function curl(serverUrl: string, path: string, body: string, filter = '.'): string {
	return `curl -s -X POST '${serverUrl}${path}' \\
  -H 'Authorization: Bearer '"$TEXTQL_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '${body}' \\
  | jq '${filter}'`;
}

export function readRequest(serverUrl: string): RequestSnippet {
	return {
		title: 'Read every setting',
		language: 'bash',
		code: curl(serverUrl, GET_PATH, '{}', '.organization')
	};
}

/** The top-level request key a source maps to, or null if it is not settable. */
function requestKey(source: Source): string | null {
	switch (source.kind) {
		case 'restriction':
			return 'toolRestrictions';
		case 'paradigm':
			return 'paradigmParams';
		case 'org':
			return source.field;
		case 'none':
			return null;
	}
}

function orgFieldMeta(key: string) {
	return ORG_FIELDS.find((f) => f.key === key);
}

/**
 * Build the write request for one column of one row.
 *
 * `desired` is the value the user wants for the *displayed* switch. Inverted
 * columns (hide_*, sharing_disabled) are negated here so the caller never has
 * to think about it.
 */
export function writeRequest(
	source: Source,
	desired: boolean,
	organization: Record<string, unknown> | undefined,
	serverUrl: string,
	orgId: string
): RequestSnippet | null {
	const key = requestKey(source);
	if (!key) return null;

	// Whole-message replace: emit the entire object with one field changed.
	if (source.kind === 'restriction' || source.kind === 'paradigm') {
		const parentKey = source.kind === 'restriction' ? 'toolRestrictions' : 'paradigmParams';
		const current = organization?.[parentKey] as Record<string, unknown> | undefined;

		if (!current) {
			return {
				title: `Set ${parentKey}.${source.field}`,
				language: 'bash',
				warning:
					'This field is part of a whole-message replace. Without live org data the complete object cannot be filled in, so read first and merge — sending only this field would turn every other toggle off.',
				code: `# 1. read the current object
curl -s -X POST '${serverUrl}${GET_PATH}' \\
  -H 'Authorization: Bearer '"$TEXTQL_API_KEY" \\
  -H 'Content-Type: application/json' -d '{}' \\
  | jq '.organization.${parentKey}' > current.json

# 2. flip one field
jq '.${source.field} = ${desired}' current.json > next.json

# 3. write the whole object back
curl -s -X POST '${serverUrl}${UPDATE_PATH}' \\
  -H 'Authorization: Bearer '"$TEXTQL_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d "$(jq -c --arg org '${orgId || '$ORG_ID'}' \\
        '{orgId: $org, ${parentKey}: .}' next.json)" \\
  | jq '.organization.${parentKey}.${source.field}'`
			};
		}

		const next = { ...current, [source.field]: desired };
		const body = JSON.stringify({ orgId: orgId || '<org-id>', [parentKey]: next }, null, 2);

		return {
			title: `Set ${parentKey}.${source.field}`,
			language: 'bash',
			warning:
				`${parentKey} is a whole-message replace — every field you omit is written as false. The body below is this org's current object with only ${source.field} changed, so it is safe to run as-is. Re-read before reusing it later.`,
			code: curl(serverUrl, UPDATE_PATH, body, `.organization.${parentKey}.${source.field}`)
		};
	}

	// Plain scalar: wrapper types give per-field presence, so a partial is safe.
	const meta = orgFieldMeta(key);
	const wire = source.kind === 'org' && source.invert ? !desired : desired;
	const body = JSON.stringify({ orgId: orgId || '<org-id>', [key]: wire }, null, 2);

	let warning: string | undefined;
	if (source.kind === 'org' && source.invert) {
		warning = `This column is stored inverted, so showing "${desired ? 'on' : 'off'}" means sending ${key}: ${wire}.`;
	} else if (meta?.surface === 'internal') {
		warning =
			'This field is marked INTERNAL, so it is stripped from the public OpenAPI spec and the SDKs. Whether the server also rejects it over the wire is untested — try it before depending on it.';
	} else if (meta?.enforcement === 'ignored') {
		warning = 'The handler has no reference to this field. It is accepted and then discarded.';
	}

	return {
		title: `Set ${key}`,
		language: 'bash',
		warning,
		// Echo back just the field that changed — the full org payload is 71 keys.
		code: curl(serverUrl, UPDATE_PATH, body, `.organization.${key}`)
	};
}

/** Everything a row can show: read, plus a write per column. */
export function requestsFor(
	row: FeatureRow,
	organization: Record<string, unknown> | undefined,
	serverUrl: string,
	orgId: string,
	desiredAvailable: boolean,
	desiredDefault: boolean
): RequestSnippet[] {
	const snippets: RequestSnippet[] = [];

	const available = writeRequest(row.available, desiredAvailable, organization, serverUrl, orgId);
	if (available) snippets.push({ ...available, title: `Available — ${available.title}` });

	const def = writeRequest(row.default, desiredDefault, organization, serverUrl, orgId);
	if (def) snippets.push({ ...def, title: `Default — ${def.title}` });

	return snippets;
}

import { fail } from '@sveltejs/kit';

import { FEATURE_GROUPS, type Source } from '$lib/features';
import { textqlClient } from '$lib/server/admin';
import { fetchOrganizationSettings } from '$lib/server/settings';

import type { Actions } from './$types';

const SDK_ORG_FIELDS = new Set([
	'hideExampleConnectors',
	'trainingMode',
	'dashboardsEnabled',
	'methodologyEnabled',
	'feedEnabled',
	'observabilityEnabled',
	'notificationsEnabled',
	'fastModeEnabled',
	'maxThinkingEnabled',
	'tracesEnabled',
	'sandboxObservabilityEnabled',
	'dataAppsEnabled',
	'subagentsEnabled'
]);

function findSource(kind: string, field: string): Source | null {
	for (const row of FEATURE_GROUPS.flatMap((group) => group.rows)) {
		for (const source of [row.available, row.default]) {
			if (source.kind === kind && source.kind !== 'none' && source.field === field) return source;
		}
	}
	return null;
}

export const actions: Actions = {
	setFeature: async ({ request }) => {
		const client = textqlClient();
		if (!client) return fail(400, { message: 'Configure TEXTQL_API_KEY before changing features.' });
		const data = await request.formData();
		const kind = String(data.get('kind') ?? '');
		const field = String(data.get('field') ?? '');
		const desired = String(data.get('desired')) === 'true';
		const source = findSource(kind, field);
		if (!source || source.kind === 'none') return fail(400, { message: 'Unknown feature setting.' });

		try {
			const settings = await fetchOrganizationSettings();
			const organization = settings.organization;
			const orgId = organization?.orgId;
			if (!organization || typeof orgId !== 'string') {
				return fail(400, { message: settings.error ?? 'Organization settings were not returned.' });
			}

			const body: Record<string, unknown> = { orgId };
			if (source.kind === 'restriction' || source.kind === 'paradigm') {
				const parentKey = source.kind === 'restriction' ? 'toolRestrictions' : 'paradigmParams';
				const current = organization[parentKey];
				if (!current || typeof current !== 'object') {
					return fail(400, { message: `${parentKey} must be read before it can be safely replaced.` });
				}
				body[parentKey] = { ...(current as Record<string, unknown>), [source.field]: desired };
			} else {
				if (!SDK_ORG_FIELDS.has(source.field)) {
					return fail(400, { message: `${source.field} is not exposed by @textql/sdk 1.4.21.` });
				}
				body[source.field] = source.invert ? !desired : desired;
			}

			await client.settings.update({ body });
			return { message: `${field} turned ${desired ? 'on' : 'off'}.` };
		} catch (cause) {
			return fail(400, { message: cause instanceof Error ? cause.message : 'Feature update failed.' });
		}
	}
};

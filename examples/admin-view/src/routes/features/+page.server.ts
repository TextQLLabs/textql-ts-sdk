import { fail } from '@sveltejs/kit';

import { findSource } from '$lib/features';
import { adminAction, field } from '$lib/server/form';
import { fetchOrganizationSettings } from '$lib/server/settings';

import type { Actions } from './$types';

export const actions: Actions = {
	setFeature: adminAction('changing features', async (client, data) => {
		const name = field(data, 'field');
		const desired = field(data, 'desired') === 'true';
		const source = findSource(field(data, 'kind'), name);
		if (!source || source.kind === 'none') return fail(400, { message: 'Unknown feature setting.' });

		const settings = await fetchOrganizationSettings(client);
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
			body[source.field] = source.invert ? !desired : desired;
		}

		await client.settings.update({ body });
		return `${name} turned ${desired ? 'on' : 'off'}.`;
	})
};

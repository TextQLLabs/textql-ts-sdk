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

		/** Both blobs are replaced wholesale, so they have to be read first. */
		function blob(parentKey: 'toolRestrictions' | 'paradigmParams'): Record<string, unknown> | null {
			const current = organization?.[parentKey];
			return current && typeof current === 'object' ? { ...(current as Record<string, unknown>) } : null;
		}

		const body: Record<string, unknown> = { orgId };
		if (source.kind === 'restriction' || source.kind === 'paradigm') {
			const parentKey = source.kind === 'restriction' ? 'toolRestrictions' : 'paradigmParams';
			const current = blob(parentKey);
			if (!current) {
				return fail(400, { message: `${parentKey} must be read before it can be safely replaced.` });
			}
			current[source.field] = desired;
			body[parentKey] = current;
		} else {
			body[source.field] = source.invert ? !desired : desired;
		}

		// Turning a tool unavailable clears its default in the same call. The
		// product does this too, but as a second debounced RPC — folding it into
		// this update means the pair cannot half-apply.
		const clearDefault = field(data, 'clearDefault');
		if (clearDefault && !desired && source.kind === 'restriction') {
			const paradigm = (body.paradigmParams as Record<string, unknown>) ?? blob('paradigmParams');
			if (!paradigm) {
				return fail(400, { message: 'paradigmParams must be read before it can be safely replaced.' });
			}
			paradigm[clearDefault] = false;
			body.paradigmParams = paradigm;
		}

		await client.settings.update({ body });
		return `${name} turned ${desired ? 'on' : 'off'}.`;
	})
};

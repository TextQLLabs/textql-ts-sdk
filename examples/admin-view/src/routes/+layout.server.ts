import { loadAdminSnapshot } from '$lib/server/admin';

import type { LayoutServerLoad } from './$types';

/** One server-only SDK load for the whole app; every page reads the same snapshot. */
export const load: LayoutServerLoad = async () => {
	const admin = await loadAdminSnapshot();
	return {
		admin,
		// Preserve the original developer-reference pages while they are moved
		// behind the secondary navigation.
		live: {
			configured: admin.configured,
			organization: admin.organization,
			serverUrl: admin.serverUrl,
			error: admin.error
		}
	};
};

import { loadAdminSnapshot } from '$lib/server/admin';

import type { LayoutServerLoad } from './$types';

/** One server-only SDK load for the whole app; every page reads the same snapshot. */
export const load: LayoutServerLoad = async () => {
	return { admin: await loadAdminSnapshot() };
};

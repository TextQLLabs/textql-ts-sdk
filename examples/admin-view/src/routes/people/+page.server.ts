import { fail } from '@sveltejs/kit';

import { adminAction, field } from '$lib/server/form';

import type { Actions } from './$types';

export const actions: Actions = {
	assignRole: adminAction('changing access', async (client, data) => {
		const memberId = field(data, 'memberId');
		const roleId = field(data, 'roleId');
		if (!memberId || !roleId) return fail(400, { message: 'Choose a person and role.' });

		await client.rbac.assignRoleToMember({ body: { memberId, roleId } });
		return 'Role assigned.';
	}),
	removeRole: adminAction('changing access', async (client, data) => {
		const memberId = field(data, 'memberId');
		const roleId = field(data, 'roleId');
		if (!memberId || !roleId) return fail(400, { message: 'Choose a person and role.' });

		await client.rbac.removeRoleFromMember({ body: { memberId, roleId } });
		return 'Role removed.';
	})
};

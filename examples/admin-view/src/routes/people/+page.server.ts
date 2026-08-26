import { fail } from '@sveltejs/kit';

import { textqlClient } from '$lib/server/admin';

import type { Actions } from './$types';

function field(data: FormData, key: string): string {
	return String(data.get(key) ?? '').trim();
}

export const actions: Actions = {
	assignRole: async ({ request }) => {
		const client = textqlClient();
		if (!client) return fail(400, { message: 'Configure TEXTQL_API_KEY before changing access.' });
		const data = await request.formData();
		const memberId = field(data, 'memberId');
		const roleId = field(data, 'roleId');
		if (!memberId || !roleId) return fail(400, { message: 'Choose a person and role.' });

		try {
			await client.rbac.assignRoleToMember({ body: { memberId, roleId } });
			return { message: 'Role assigned.' };
		} catch (cause) {
			return fail(400, { message: cause instanceof Error ? cause.message : 'Role assignment failed.' });
		}
	},
	removeRole: async ({ request }) => {
		const client = textqlClient();
		if (!client) return fail(400, { message: 'Configure TEXTQL_API_KEY before changing access.' });
		const data = await request.formData();
		const memberId = field(data, 'memberId');
		const roleId = field(data, 'roleId');
		if (!memberId || !roleId) return fail(400, { message: 'Choose a person and role.' });

		try {
			await client.rbac.removeRoleFromMember({ body: { memberId, roleId } });
			return { message: 'Role removed.' };
		} catch (cause) {
			return fail(400, { message: cause instanceof Error ? cause.message : 'Role removal failed.' });
		}
	}
};

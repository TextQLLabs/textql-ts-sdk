import { fail } from '@sveltejs/kit';

import { textqlClient } from '$lib/server/admin';

import type { Actions } from './$types';

function field(data: FormData, key: string): string {
	return String(data.get(key) ?? '').trim();
}

function csv(value: string): string[] {
	return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function responseArray(response: unknown, key: string): Record<string, unknown>[] {
	if (!response || typeof response !== 'object') return [];
	const value = (response as Record<string, unknown>)[key];
	return Array.isArray(value)
		? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
		: [];
}

export const actions: Actions = {
	createRole: async ({ request }) => {
		const client = textqlClient();
		if (!client) return fail(400, { message: 'Configure TEXTQL_API_KEY before creating roles.' });
		const data = await request.formData();
		const name = field(data, 'name');
		const description = field(data, 'description');
		if (!name) return fail(400, { message: 'Role name is required.' });

		try {
			await client.rbac.createRole({ body: { name, description } });
			return { message: `${name} created.` };
		} catch (cause) {
			return fail(400, { message: cause instanceof Error ? cause.message : 'Role creation failed.' });
		}
	},
	saveRole: async ({ request }) => {
		const client = textqlClient();
		if (!client) return fail(400, { message: 'Configure TEXTQL_API_KEY before changing roles.' });
		const data = await request.formData();
		const roleId = field(data, 'roleId');
		const name = field(data, 'name');
		const description = field(data, 'description');
		const permissionIds = csv(field(data, 'permissionIds'));
		const allowedModelIds = csv(field(data, 'allowedModelIds'))
			.map(Number)
			.filter((value) => Number.isInteger(value));
		if (!roleId || !name) return fail(400, { message: 'Role ID and name are required.' });

		try {
			const currentResponse = await client.rbac.getRolePermissions({ body: { roleId } });
			const currentIds = responseArray(currentResponse, 'permissions')
				.map((permission) => String(permission.id ?? ''))
				.filter(Boolean);
			const addPermissionIds = permissionIds.filter((id) => !currentIds.includes(id));
			const removePermissionIds = currentIds.filter((id) => !permissionIds.includes(id));

			await client.rbac.updateRole({
				body: {
					roleId,
					name,
					description,
					allowedModelIds,
					allowModelChoice: data.get('allowModelChoice') === 'on',
					clearAllowedModelIds: allowedModelIds.length === 0
				}
			});
			if (addPermissionIds.length || removePermissionIds.length) {
				await client.rbac.setRolePermissions({
					body: { roleId, addPermissionIds, removePermissionIds }
				});
			}
			return { message: `${name} updated.` };
		} catch (cause) {
			return fail(400, { message: cause instanceof Error ? cause.message : 'Role update failed.' });
		}
	},
	deleteRole: async ({ request }) => {
		const client = textqlClient();
		if (!client) return fail(400, { message: 'Configure TEXTQL_API_KEY before deleting roles.' });
		const data = await request.formData();
		const roleId = field(data, 'roleId');
		if (!roleId) return fail(400, { message: 'Role ID is required.' });

		try {
			await client.rbac.deleteRole({ body: { roleId } });
			return { message: 'Role deleted.' };
		} catch (cause) {
			return fail(400, { message: cause instanceof Error ? cause.message : 'Role deletion failed.' });
		}
	}
};

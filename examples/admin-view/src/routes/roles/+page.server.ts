import { fail } from '@sveltejs/kit';
import type { TextqlRpcPublicChatLlmModel } from '@textql/sdk/models';

import { validateModelPolicy } from '$lib/modelCatalog';
import { asArray } from '$lib/server/admin';
import { adminAction, csv, field } from '$lib/server/form';

import type { Actions } from './$types';

export const actions: Actions = {
	createRole: adminAction('creating roles', async (client, data) => {
		const name = field(data, 'name');
		const description = field(data, 'description');
		if (!name) return fail(400, { message: 'Role name is required.' });

		await client.rbac.createRole({ body: { name, description } });
		return `${name} created.`;
	}),
	saveRole: adminAction('changing roles', async (client, data) => {
		const roleId = field(data, 'roleId');
		const name = field(data, 'name');
		const description = field(data, 'description');
		const permissionIds = csv(field(data, 'permissionIds'));
		const modelScope = field(data, 'modelScope');
		const allowedModels = csv(field(data, 'allowedModels'));
		const defaultModel = field(data, 'defaultModel') || 'MODEL_UNKNOWN';
		if (!roleId || !name) return fail(400, { message: 'Role ID and name are required.' });

		const problem = validateModelPolicy({
			scope: modelScope,
			models: allowedModels,
			defaultModel
		});
		if (problem) return fail(400, { message: problem });

		const currentResponse = await client.rbac.getRolePermissions({ body: { roleId } });
		const currentIds = asArray(currentResponse, 'permissions')
			.map((permission) => String(permission.id ?? ''))
			.filter(Boolean);
		const addPermissionIds = permissionIds.filter((id) => !currentIds.includes(id));
		const removePermissionIds = currentIds.filter((id) => !permissionIds.includes(id));

		await client.rbac.updateRole({
			body: {
				roleId,
				name,
				description,
				...(modelScope === 'selected'
					? { allowedModels: allowedModels as TextqlRpcPublicChatLlmModel[] }
					: {}),
				defaultModel: defaultModel as TextqlRpcPublicChatLlmModel,
				allowModelChoice: data.get('allowModelChoice') === 'on',
				clearAllowedModelIds: modelScope === 'all'
			}
		});
		if (addPermissionIds.length || removePermissionIds.length) {
			await client.rbac.setRolePermissions({
				body: { roleId, addPermissionIds, removePermissionIds }
			});
		}
		return `${name} updated.`;
	}),
	deleteRole: adminAction('deleting roles', async (client, data) => {
		const roleId = field(data, 'roleId');
		if (!roleId) return fail(400, { message: 'Role ID is required.' });

		await client.rbac.deleteRole({ body: { roleId } });
		return 'Role deleted.';
	})
};

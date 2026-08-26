import { env } from '$env/dynamic/private';
import { Textql } from '@textql/sdk';

import {
	emptyAdminSnapshot,
	type AdminApiKey,
	type ApiKeyStatus,
	type AdminChange,
	type AdminConnector,
	type AdminPermission,
	type AdminPerson,
	type AdminRole,
	type AdminSnapshot
} from '$lib/admin';
import { getModelEnumName } from '$lib/modelCatalog';
import { fetchOrganizationSettings } from '$lib/server/settings';

function sdkBaseUrl(raw: string | undefined): string {
	const base = (raw?.trim() || 'https://app.textql.com').replace(/\/+$/, '');
	return base.endsWith('/rpc/public') ? base : `${base}/rpc/public`;
}

export function displayBaseUrl(raw: string | undefined): string {
	return (raw?.trim() || 'https://app.textql.com').replace(/\/rpc\/public\/?$/, '').replace(/\/+$/, '');
}

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function asArray(value: unknown, key: string): Record<string, unknown>[] {
	const field = asRecord(value)[key];
	return Array.isArray(field) ? field.map(asRecord) : [];
}

function text(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown): boolean {
	return value === true;
}

function number(value: unknown): number | undefined {
	return typeof value === 'number' ? value : undefined;
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function numberArray(value: unknown): number[] {
	return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
}

function iso(value: unknown): string | undefined {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === 'string') return value;
	return undefined;
}

function humanize(value: string): string {
	return value
		.replace(/^RBAC_/, '')
		.replace(/[._-]+/g, ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function apiKeyStatus(raw: string): ApiKeyStatus {
	const name = raw.replace(/^RBAC_/, '').toLowerCase();
	if (name.includes('revoked')) return 'revoked';
	if (name.includes('expired')) return 'expired';
	if (name.includes('active')) return 'active';
	return 'unknown';
}

export function errorMessage(cause: unknown): string {
	if (cause instanceof Error) return cause.message;
	return 'The TextQL API did not return admin data.';
}

export function textqlClient(): Textql | null {
	const apiKey = env.TEXTQL_API_KEY?.trim();
	if (!apiKey) return null;
	return new Textql({
		apiKey,
		serverURL: sdkBaseUrl(env.TEXTQL_SERVER_URL)
	});
}

/** Load the operator-facing administration model through the pinned SDK. */
export async function loadAdminSnapshot(): Promise<AdminSnapshot> {
	const client = textqlClient();
	const serverUrl = displayBaseUrl(env.TEXTQL_SERVER_URL);
	if (!client) return emptyAdminSnapshot(serverUrl, 'unconfigured');

	try {
		// Everything that needs no orgId goes out at once; only the member list
		// and the per-role permission fan-out have to wait on a prior response.
		const [
			settings,
			rolesResponse,
			permissionsResponse,
			serviceAccountsResponse,
			keysResponse,
			changesResponse,
			connectorsResponse
		] = await Promise.all([
			fetchOrganizationSettings(client),
			client.rbac.listRoles({ body: {} }),
			client.rbac.listPermissions({ body: {} }),
			client.rbac.listServiceAccounts({ body: {} }),
			client.rbac.listApiKeys({ body: {} }),
			client.auditLogs.list({ body: { pageSize: 40 } }),
			client.connectors.getConnectors({ body: {} })
		]);
		if (settings.error || !settings.organization) {
			throw new Error(settings.error ?? 'Organization settings were not returned.');
		}
		const roleRecords = asArray(rolesResponse, 'roles');
		const orgId = text(settings.organization.orgId) || text(roleRecords[0]?.orgId);
		if (!orgId) throw new Error('The TextQL API did not return an organization ID.');

		const roles: AdminRole[] = roleRecords.map((role) => ({
			id: text(role.id),
			name: text(role.name, 'Untitled role'),
			description: text(role.description, 'No description provided.'),
			isSystem: bool(role.isSystem),
			isScimManaged: bool(role.isScimManaged),
			defaultModel:
				text(role.defaultModel) ||
				(number(role.defaultModelId) === undefined
					? undefined
					: getModelEnumName(number(role.defaultModelId) as number)),
			allowedModels:
				stringArray(role.allowedModels).length > 0
					? stringArray(role.allowedModels)
					: numberArray(role.allowedModelIds)
						.map(getModelEnumName)
						.filter((model): model is string => Boolean(model)),
			allowModelChoice:
				typeof role.allowModelChoice === 'boolean' ? role.allowModelChoice : undefined
		}));

		const [membersResponse, ...rolePermissionResponses] = await Promise.all([
			client.settings.listMembers({ body: { orgId } }),
			...roles.map((role) => client.rbac.getRolePermissions({ body: { roleId: role.id } }))
		]);

		const permissions: AdminPermission[] = asArray(permissionsResponse, 'permissions').map(
			(permission) => ({
				id: text(permission.id),
				resource: text(permission.resource, 'unknown'),
				action: text(permission.action, 'use'),
				description: text(permission.description, 'No description provided.')
			})
		);

		const memberRecords = asArray(membersResponse, 'members');
		const serviceAccountRecords = asArray(serviceAccountsResponse, 'serviceAccounts');
		const memberIds = [
			...memberRecords.map((member) => text(member.memberId)).filter(Boolean),
			...serviceAccountRecords.map((account) => text(account.memberId)).filter(Boolean)
		];

		const memberRolesResponse = await client.rbac.getMemberRoles({ body: { memberIds } });

		const memberRoles = asRecord(asRecord(memberRolesResponse).memberRoles);
		const roleIdsFor = (memberId: string): string[] => {
			const entry = asRecord(memberRoles[memberId]);
			return asArray(entry, 'roles').map((role) => text(role.id)).filter(Boolean);
		};

		const peopleById = new Map<string, AdminPerson>();
		for (const member of memberRecords) {
			const id = text(member.memberId);
			if (!id) continue;
			const first = text(member.preferredFirstName) || text(member.firstName);
			const last = text(member.preferredLastName) || text(member.lastName);
			const fallbackName = text(member.name) || text(member.emailAddress, 'Unnamed person').split('@')[0];
			peopleById.set(id, {
				id,
				name: `${first} ${last}`.trim() || fallbackName,
				email: text(member.emailAddress),
				kind: bool(member.isServiceAccount) ? 'service-account' : 'person',
				roleIds: roleIdsFor(id),
				isAdmin: bool(member.isAdmin),
				isScimManaged: bool(member.isScimManaged),
				createdAt: iso(member.createdAt)
			});
		}

		for (const account of serviceAccountRecords) {
			const id = text(account.memberId);
			if (!id) continue;
			peopleById.set(id, {
				id,
				name: text(account.displayName, text(account.email, 'Service account')),
				email: text(account.email),
				kind: 'service-account',
				roleIds: roleIdsFor(id),
				isAdmin: false,
				isScimManaged: false,
				createdAt: iso(account.createdAt),
				description: text(account.description)
			});
		}

		const rolePermissions = Object.fromEntries(
			roles.map((role, index) => [
				role.id,
				asArray(rolePermissionResponses[index], 'permissions')
					.map((permission) => text(permission.id))
					.filter(Boolean)
			])
		);

		const apiKeys: AdminApiKey[] = asArray(keysResponse, 'apiKeys').map((key) => {
			const ownerId = text(key.memberId);
			const owner = peopleById.get(ownerId);
			return {
				id: text(key.id),
				name: text(key.name, 'Unnamed API key'),
				short: text(key.apiKeyShort, 'Hidden'),
				ownerId,
				ownerName: owner?.name ?? text(key.ownerDisplayName, text(key.ownerEmail, 'Unknown owner')),
				roleIds: stringArray(key.assumedRoles),
				status: apiKeyStatus(text(key.status, 'active')),
				statusLabel: humanize(text(key.status, 'active')).toLowerCase(),
				createdAt: iso(key.createdAt),
				expiresAt: iso(key.expiresAt)
			};
		});

		// getConnectors returns the ConnectorType enum by name; connectorBranding
		// is keyed the same way, so the string is carried through untranslated.
		const defaultConnectorIds = new Set(numberArray(settings.organization.defaultConnectorIds));
		const connectors: AdminConnector[] = asArray(connectorsResponse, 'connectors').map(
			(connector) => {
				const id = number(connector.id) ?? 0;
				return {
					id,
					name: text(connector.name, 'Unnamed connector'),
					type: text(connector.connectorType),
					authStrategy: text(connector.authStrategy) || undefined,
					createdAt: iso(connector.createdAt),
					isDefault: defaultConnectorIds.has(id)
				};
			}
		);

		const changes: AdminChange[] = asArray(changesResponse, 'entries').map((entry) => ({
			id: text(entry.id),
			actor: text(entry.actorEmail, text(entry.actorId, 'System')),
			action: humanize(text(entry.action, 'Changed configuration')),
			category: humanize(text(entry.category, 'Administration')),
			resourceType: humanize(text(entry.resourceType, 'configuration')),
			resourceId: text(entry.resourceId) || undefined,
			createdAt: iso(entry.createdAt) ?? new Date(0).toISOString(),
			authMethod: text(entry.authMethod) || undefined
		}));

		return {
			mode: 'live',
			configured: true,
			serverUrl,
			organization: settings.organization,
			roles,
			permissions,
			people: [...peopleById.values()],
			apiKeys,
			connectors,
			rolePermissions,
			changes
		};
	} catch (cause) {
		console.error('TextQL SDK admin load failed', cause);
		return emptyAdminSnapshot(serverUrl, 'error', errorMessage(cause));
	}
}

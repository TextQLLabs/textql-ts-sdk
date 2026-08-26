export type AdminMode = 'live' | 'unconfigured' | 'error';

export interface AdminRole {
	id: string;
	name: string;
	description: string;
	isSystem: boolean;
	isScimManaged: boolean;
	defaultModel?: string;
	allowedModels: string[];
	allowModelChoice?: boolean;
}

export interface AdminPermission {
	id: string;
	resource: string;
	action: string;
	description: string;
}

export interface AdminPerson {
	id: string;
	name: string;
	email: string;
	kind: 'person' | 'service-account';
	roleIds: string[];
	isAdmin: boolean;
	isScimManaged: boolean;
	createdAt?: string;
	description?: string;
}

export interface AdminApiKey {
	id: string;
	name: string;
	short: string;
	ownerId: string;
	ownerName: string;
	roleIds: string[];
	status: string;
	createdAt?: string;
	expiresAt?: string;
}

export interface AdminConnector {
	id: number;
	name: string;
	/** ConnectorType enum *name* — the API returns "SNOWFLAKE", not 2. */
	type: string;
	authStrategy?: string;
	createdAt?: string;
	/** Listed in organization.defaultConnectorIds — attached to every new thread. */
	isDefault: boolean;
}

export interface AdminChange {
	id: string;
	actor: string;
	action: string;
	category: string;
	resourceType: string;
	resourceId?: string;
	createdAt: string;
	authMethod?: string;
}

export interface AdminSnapshot {
	mode: AdminMode;
	configured: boolean;
	error?: string;
	serverUrl: string;
	organization?: Record<string, unknown>;
	roles: AdminRole[];
	permissions: AdminPermission[];
	people: AdminPerson[];
	apiKeys: AdminApiKey[];
	connectors: AdminConnector[];
	rolePermissions: Record<string, string[]>;
	changes: AdminChange[];
}

export function emptyAdminSnapshot(
	serverUrl: string,
	mode: Exclude<AdminMode, 'live'>,
	error?: string
): AdminSnapshot {
	return {
		mode,
		configured: mode !== 'unconfigured',
		error,
		serverUrl,
		roles: [],
		permissions: [],
		people: [],
		apiKeys: [],
		connectors: [],
		rolePermissions: {},
		changes: []
	};
}

export function initials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');
}

export function permissionLabel(permission: AdminPermission): string {
	return `${permission.resource}:${permission.action}`;
}

export function roleNames(person: AdminPerson, allRoles: AdminRole[]): string[] {
	return person.roleIds
		.map((id) => allRoles.find((role) => role.id === id)?.name)
		.filter((name): name is string => Boolean(name));
}

const ACTION_IMPLICATIONS: Record<string, string[]> = {
	write_private: ['write', 'read_private', 'read'],
	write: ['read'],
	read_private: ['read']
};

/** Expand explicit grants into the permissions they include for the same resource. */
export function expandPermissionIds(
	explicitIds: Iterable<string>,
	allPermissions: AdminPermission[]
): Set<string> {
	const expanded = new Set(explicitIds);
	const byResourceAndAction = new Map(
		allPermissions.map((permission) => [`${permission.resource}:${permission.action}`, permission.id])
	);

	for (const id of [...expanded]) {
		const permission = allPermissions.find((item) => item.id === id);
		if (!permission) continue;
		for (const action of ACTION_IMPLICATIONS[permission.action] ?? []) {
			const impliedId = byResourceAndAction.get(`${permission.resource}:${action}`);
			if (impliedId) expanded.add(impliedId);
		}
	}

	return expanded;
}

export function effectivePermissionIds(
	person: AdminPerson,
	permissionsByRole: Record<string, string[]>,
	allPermissions: AdminPermission[]
): Set<string> {
	return expandPermissionIds(
		person.roleIds.flatMap((roleId) => permissionsByRole[roleId] ?? []),
		allPermissions
	);
}

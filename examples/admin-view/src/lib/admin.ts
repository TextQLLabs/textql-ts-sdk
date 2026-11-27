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

export type ApiKeyStatus = 'active' | 'revoked' | 'expired' | 'unknown';

export interface AdminApiKey {
	id: string;
	name: string;
	short: string;
	ownerId: string;
	ownerName: string;
	roleIds: string[];
	/** Normalized at the boundary so call sites branch on a value, not on copy. */
	status: ApiKeyStatus;
	statusLabel: string;
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
	organizationName: string;
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
		organizationName: 'Organization',
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

/** Proto3 repeated int32 arrives as unknown JSON; every model list needs this. */
export function numberList(value: unknown): number[] {
	return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
}

type DateStyle = 'day' | 'time' | 'dayTime' | 'date';

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
	day: { month: 'short', day: 'numeric' },
	time: { hour: 'numeric', minute: '2-digit' },
	dayTime: { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
	date: { month: 'short', day: 'numeric', year: 'numeric' }
};

/** Intl formatters are costly to construct, so each style is built once. */
const FORMATTERS = new Map<DateStyle, Intl.DateTimeFormat>();

export function formatDate(value: string | undefined, style: DateStyle, fallback = 'Unknown'): string {
	if (!value) return fallback;
	let formatter = FORMATTERS.get(style);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(undefined, DATE_OPTIONS[style]);
		FORMATTERS.set(style, formatter);
	}
	return formatter.format(new Date(value));
}

/** The window Overview flags and People filters on. */
export const EXPIRING_SOON_DAYS = 30;

export function isExpiringSoon(key: AdminApiKey): boolean {
	if (!key.expiresAt || key.status === 'revoked') return false;
	const remaining = new Date(key.expiresAt).getTime() - Date.now();
	return remaining > 0 && remaining < EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
}

export function rolesById(roles: AdminRole[]): Map<string, AdminRole> {
	return new Map(roles.map((role) => [role.id, role]));
}

/**
 * The built-in admin role. It is identified by name because the API exposes no
 * flag for it, and both the roles editor and the directory need the same answer.
 */
export function isAdminRole(role: AdminRole | undefined): boolean {
	return Boolean(role?.isSystem && role.name.toLowerCase() === 'admin');
}

/** Assigned roles, admin first so a truncated list never drops it. */
export function personRoles(person: AdminPerson, byId: Map<string, AdminRole>): AdminRole[] {
	return person.roleIds
		.map((id) => byId.get(id))
		.filter((role): role is AdminRole => Boolean(role))
		.sort((a, b) => Number(isAdminRole(b)) - Number(isAdminRole(a)));
}

const ACTION_IMPLICATIONS: Record<string, string[]> = {
	write_private: ['write', 'read_private', 'read'],
	write: ['read'],
	read_private: ['read']
};

export interface PermissionIndex {
	byId: Map<string, AdminPermission>;
	byResourceAndAction: Map<string, string>;
}

/**
 * Built once per snapshot and passed in: expansion runs per role and per draft
 * edit, so rebuilding the index inside the expansion made it quadratic.
 */
export function permissionIndex(allPermissions: AdminPermission[]): PermissionIndex {
	return {
		byId: new Map(allPermissions.map((permission) => [permission.id, permission])),
		byResourceAndAction: new Map(
			allPermissions.map((permission) => [
				`${permission.resource}:${permission.action}`,
				permission.id
			])
		)
	};
}

/** Expand explicit grants into the permissions they include for the same resource. */
export function expandPermissionIds(
	explicitIds: Iterable<string>,
	index: PermissionIndex
): Set<string> {
	const expanded = new Set(explicitIds);

	for (const id of [...expanded]) {
		const permission = index.byId.get(id);
		if (!permission) continue;
		for (const action of ACTION_IMPLICATIONS[permission.action] ?? []) {
			const impliedId = index.byResourceAndAction.get(`${permission.resource}:${action}`);
			if (impliedId) expanded.add(impliedId);
		}
	}

	return expanded;
}

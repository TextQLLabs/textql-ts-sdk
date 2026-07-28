import { error, json } from '@sveltejs/kit';
import type { ConnectError, TextqlRpcPublicConnectorConnector } from '@textql/sdk/models';

/**
 * The SDK clients for the current request, built in `hooks.server.ts` from the
 * visitor's own sealed API key. Every visitor brings their own credential, so
 * these are per-request rather than per-process — see `$lib/server/session`.
 */
export function textqlClients(locals: App.Locals) {
	if (!locals.textql) error(401, 'Not signed in.');
	return locals.textql;
}

export function isConnectError(response: object): response is ConnectError {
	return 'code' in response || 'details' in response;
}

/** Normalize SDK timestamps that may arrive as Date or ISO string. */
export function toIsoString(value: unknown): string | null {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value.toISOString();
	}
	if (typeof value === 'string' && value.trim()) {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
	}
	return null;
}

export function proxyError(label: string, cause: unknown): Response {
	console.error(label, cause);
	return json({ error: `The ${label.toLowerCase()} failed.` }, { status: 502 });
}

export function normalizeConnector(connector: TextqlRpcPublicConnectorConnector) {
	if (
		typeof connector.id !== 'number' ||
		typeof connector.name !== 'string' ||
		!connector.name.trim()
	) {
		return null;
	}

	return {
		id: connector.id,
		name: connector.name.trim(),
		type: typeof connector.connectorType === 'string' ? connector.connectorType : 'UNKNOWN'
	};
}

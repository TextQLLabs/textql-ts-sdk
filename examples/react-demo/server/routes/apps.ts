import { isRecord, trimmedOrNull } from '../../src/lib/utils';
import { json } from '../kit';
import type { RequestHandler, RouteHandlers } from '../kit';
import { isConnectError, proxyError, textqlClients, toIsoString } from '../textql';
import type {
	TextqlRpcPublicAppApp,
	TextqlRpcPublicAppAppFile,
	TextqlRpcPublicAppCapability,
	TextqlRpcPublicAppComputeFunction,
	TextqlRpcPublicDashboardDataSource
} from '@textql/sdk/models';

// ─── /api/apps ──────────────────────────────────────────────────────────────

function toListItem(app: TextqlRpcPublicAppApp) {
	if (typeof app.id !== 'string') return null;
	return {
		id: app.id,
		name: trimmedOrNull(app.name) ?? 'Untitled app',
		description: trimmedOrNull(app.description),
		screenshotUrl: trimmedOrNull(app.screenshotUrl),
		isFavorited: app.isFavorited === true,
		hasUnpublishedChanges: app.hasUnpublishedChanges === true,
		scheduleEnabled: app.scheduleEnabled === true,
		dataSourceCount: Array.isArray(app.dataSources) ? app.dataSources.length : 0,
		updatedAt: toIsoString(app.updatedAt)
	};
}

const listApps: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.apps.list({ body: {} });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to list apps.' }, { status: 502 });
		}

		const apps = Array.isArray(result.apps) ? result.apps : [];
		return json({
			apps: apps.map(toListItem).filter((item) => item !== null),
			totalCount: typeof result.totalCount === 'number' ? result.totalCount : apps.length
		});
	} catch (error) {
		return proxyError('App list request', error);
	}
};

export const appsRoute: RouteHandlers = { GET: listApps };

// ─── /api/apps/[id] ─────────────────────────────────────────────────────────

/** Data sources are a discriminated union; every variant carries an optional type + name. */
function toDataSource(source: TextqlRpcPublicDashboardDataSource) {
	return {
		type: typeof source.type === 'string' ? source.type : null,
		name: trimmedOrNull(source.name)
	};
}

function toComputeFunction(fn: TextqlRpcPublicAppComputeFunction) {
	return {
		name: trimmedOrNull(fn.name),
		description: trimmedOrNull(fn.description),
		returns: trimmedOrNull(fn.returns),
		paramCount: Array.isArray(fn.params) ? fn.params.length : 0
	};
}

function toCapability(cap: TextqlRpcPublicAppCapability) {
	return {
		type: typeof cap.type === 'string' ? cap.type : null,
		name: trimmedOrNull(cap.name),
		connectorId: typeof cap.connectorId === 'number' ? cap.connectorId : null
	};
}

function toFile(file: TextqlRpcPublicAppAppFile) {
	const path = trimmedOrNull(file.path);
	if (!path) return null;
	const content = typeof file.content === 'string' ? file.content : '';
	return { path, size: content.length };
}

function serializeApp(app: TextqlRpcPublicAppApp) {
	return {
		id: app.id,
		name: trimmedOrNull(app.name) ?? 'Untitled app',
		description: trimmedOrNull(app.description),
		code: typeof app.code === 'string' ? app.code : '',
		htmlUrl: trimmedOrNull(app.htmlUrl),
		publishedHtmlUrl: trimmedOrNull(app.publishedHtmlUrl),
		screenshotUrl: trimmedOrNull(app.screenshotUrl),
		chatId: trimmedOrNull(app.chatId),
		folderId: trimmedOrNull(app.folderId),
		isFavorited: app.isFavorited === true,
		hasUnpublishedChanges: app.hasUnpublishedChanges === true,
		scheduleEnabled: app.scheduleEnabled === true,
		cronString: trimmedOrNull(app.cronString),
		consoleErrors: Array.isArray(app.consoleErrors)
			? app.consoleErrors.filter((e): e is string => typeof e === 'string')
			: [],
		dataSources: Array.isArray(app.dataSources) ? app.dataSources.map(toDataSource) : [],
		computeFunctions: Array.isArray(app.computeFunctions)
			? app.computeFunctions.map(toComputeFunction)
			: [],
		capabilities: Array.isArray(app.capabilities) ? app.capabilities.map(toCapability) : [],
		files: Array.isArray(app.files) ? app.files.map(toFile).filter((f) => f !== null) : [],
		createdAt: toIsoString(app.createdAt),
		updatedAt: toIsoString(app.updatedAt),
		refreshedAt: toIsoString(app.refreshedAt),
		publishedAt: toIsoString(app.publishedAt)
	};
}

const getApp: RequestHandler = async ({ params }) => {
	const { client } = textqlClients();

	try {
		const result = await client.apps.get({ body: { appId: params.id } });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'App not found.' }, { status: 404 });
		}
		if (!result.app || typeof result.app.id !== 'string') {
			return json({ error: 'App not found.' }, { status: 404 });
		}

		return json({
			app: serializeApp(result.app),
			hasWritePermission: result.hasWritePermission === true
		});
	} catch (error) {
		return proxyError('App request', error);
	}
};

export const appDetailRoute: RouteHandlers = { GET: getApp };

// ─── /api/apps/[id]/compute ─────────────────────────────────────────────────

/**
 * Relays a data app's ana.compute call to the backend. The browser bridge can't
 * hold the API key, so compute.run round-trips through here: the app posts a
 * function name + params, this invokes it via the SDK and returns the raw
 * resultJson for the bridge to hand back to the sandboxed app.
 */
const invokeCompute: RequestHandler = async ({ params, request }) => {
	const { client } = textqlClients();

	try {
		const body: unknown = await request.json();
		if (!isRecord(body) || typeof body.functionName !== 'string') {
			return json({ error: 'functionName is required.' }, { status: 400 });
		}
		const paramsJson = typeof body.paramsJson === 'string' ? body.paramsJson : '{}';

		const result = await client.apps.invokeComputeFunction({
			body: { appId: params.id, functionName: body.functionName, paramsJson }
		});

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Compute function failed.' }, { status: 502 });
		}

		return json({
			resultJson: typeof result.resultJson === 'string' ? result.resultJson : 'null'
		});
	} catch (error) {
		return proxyError('App compute request', error);
	}
};

export const appComputeRoute: RouteHandlers = { POST: invokeCompute };

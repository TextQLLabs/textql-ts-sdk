import { isConnectError, proxyError, textqlClients, toIsoString } from '$lib/server/textql';
import { json } from '@sveltejs/kit';
import type {
	TextqlRpcPublicAppApp,
	TextqlRpcPublicAppAppFile,
	TextqlRpcPublicAppCapability,
	TextqlRpcPublicAppComputeFunction,
	TextqlRpcPublicDashboardDataSource
} from '@textql/sdk/models';

import type { RequestHandler } from './$types';

/** Data sources are a discriminated union; every variant carries an optional type + name. */
function toDataSource(source: TextqlRpcPublicDashboardDataSource) {
	return {
		type: typeof source.type === 'string' ? source.type : null,
		name: typeof source.name === 'string' ? source.name.trim() || null : null
	};
}

function toComputeFunction(fn: TextqlRpcPublicAppComputeFunction) {
	return {
		name: typeof fn.name === 'string' ? fn.name.trim() || null : null,
		description: typeof fn.description === 'string' ? fn.description.trim() || null : null,
		returns: typeof fn.returns === 'string' ? fn.returns.trim() || null : null,
		paramCount: Array.isArray(fn.params) ? fn.params.length : 0
	};
}

function toCapability(cap: TextqlRpcPublicAppCapability) {
	return {
		type: typeof cap.type === 'string' ? cap.type : null,
		name: typeof cap.name === 'string' ? cap.name.trim() || null : null,
		connectorId: typeof cap.connectorId === 'number' ? cap.connectorId : null
	};
}

function toFile(file: TextqlRpcPublicAppAppFile) {
	if (typeof file.path !== 'string' || !file.path.trim()) return null;
	const content = typeof file.content === 'string' ? file.content : '';
	return { path: file.path.trim(), size: content.length };
}

function serializeApp(app: TextqlRpcPublicAppApp) {
	return {
		id: app.id,
		name: app.name?.trim() || 'Untitled app',
		description: typeof app.description === 'string' ? app.description.trim() || null : null,
		code: typeof app.code === 'string' ? app.code : '',
		htmlUrl: typeof app.htmlUrl === 'string' ? app.htmlUrl.trim() || null : null,
		publishedHtmlUrl:
			typeof app.publishedHtmlUrl === 'string' ? app.publishedHtmlUrl.trim() || null : null,
		screenshotUrl:
			typeof app.screenshotUrl === 'string' ? app.screenshotUrl.trim() || null : null,
		chatId: typeof app.chatId === 'string' ? app.chatId.trim() || null : null,
		folderId: typeof app.folderId === 'string' ? app.folderId.trim() || null : null,
		isFavorited: app.isFavorited === true,
		hasUnpublishedChanges: app.hasUnpublishedChanges === true,
		scheduleEnabled: app.scheduleEnabled === true,
		cronString: typeof app.cronString === 'string' ? app.cronString.trim() || null : null,
		consoleErrors: Array.isArray(app.consoleErrors)
			? app.consoleErrors.filter((e): e is string => typeof e === 'string')
			: [],
		dataSources: Array.isArray(app.dataSources) ? app.dataSources.map(toDataSource) : [],
		computeFunctions: Array.isArray(app.computeFunctions)
			? app.computeFunctions.map(toComputeFunction)
			: [],
		capabilities: Array.isArray(app.capabilities) ? app.capabilities.map(toCapability) : [],
		files: Array.isArray(app.files)
			? app.files.map(toFile).filter((f) => f !== null)
			: [],
		createdAt: toIsoString(app.createdAt),
		updatedAt: toIsoString(app.updatedAt),
		refreshedAt: toIsoString(app.refreshedAt),
		publishedAt: toIsoString(app.publishedAt)
	};
}

export const GET: RequestHandler = async ({ params }) => {
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

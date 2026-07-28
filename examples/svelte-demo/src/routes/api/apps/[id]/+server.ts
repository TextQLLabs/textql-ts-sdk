import { isConnectError, proxyError, textqlClients, toIsoString } from '$lib/server/textql';
import { trimmedOrNull } from '$lib/utils';
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

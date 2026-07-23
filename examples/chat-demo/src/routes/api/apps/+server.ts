import { isConnectError, proxyError, textqlClients, toIsoString } from '$lib/server/textql';
import { trimmedOrNull } from '$lib/utils';
import { json } from '@sveltejs/kit';
import type { TextqlRpcPublicAppApp } from '@textql/sdk/models';

import type { RequestHandler } from './$types';

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

export const GET: RequestHandler = async () => {
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

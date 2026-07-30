import {
	isConnectError,
	pagingFields,
	proxyError,
	readPaging,
	textqlClients,
	toIsoString
} from '$lib/server/textql';
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

export const GET: RequestHandler = async ({ url }) => {
	const { client } = textqlClients();

	const paging = readPaging(url);

	// ListApps has no creator/date/sort params, so the toolbar exposes only the
	// facets the RPC can actually honour; the rest would silently do nothing.
	const searchTerm = url.searchParams.get('q')?.trim() || undefined;
	const scope = url.searchParams.getAll('scope');

	try {
		const result = await client.apps.list({
			body: {
				limit: paging.pageSize,
				offset: paging.offset,
				searchTerm,
				sharedWithMe: scope.includes('shared') || undefined,
				uncategorizedOnly: scope.includes('uncategorized') || undefined
			}
		});

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to list apps.' }, { status: 502 });
		}

		const apps = Array.isArray(result.apps) ? result.apps : [];
		const totalCount = typeof result.totalCount === 'number' ? result.totalCount : undefined;

		return json({
			apps: apps.map(toListItem).filter((item) => item !== null),
			...pagingFields(paging, totalCount, apps.length)
		});
	} catch (error) {
		return proxyError('App list request', error);
	}
};

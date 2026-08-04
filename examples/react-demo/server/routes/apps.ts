import { isRecord, trimmedOrNull } from '../../src/lib/utils';
import { json } from '../kit';
import type { RequestHandler, RouteHandlers } from '../kit';
import { isConnectError, memberOptions, proxyError, textqlClients, toIsoString } from '../textql';
import type {
	TextqlRpcPublicAppApp,
	TextqlRpcPublicAppAppFile,
	TextqlRpcPublicAppCapability,
	TextqlRpcPublicAppComputeFunction,
	TextqlRpcPublicDashboardDashboard,
	TextqlRpcPublicDashboardDashboardFolder,
	TextqlRpcPublicDashboardDataSource
} from '@textql/sdk/models';

// ─── /api/apps ──────────────────────────────────────────────────────────────

/**
 * The library merges two RPCs whose filter surfaces barely overlap: ListApps
 * takes only searchTerm/folderId/uncategorizedOnly/sharedWithMe — no creator,
 * date or sort — while ListDashboards takes creator and sort but not the same
 * shape. Rather than expose the intersection (one facet, no sort), this route
 * loads the whole library once and the page filters and sorts it client-side,
 * which is what demo2's library page does.
 *
 * `sharedWithMe` is the one facet that stays server-side — nothing on an item
 * says whether it reached you by a grant, so only the backend can answer it.
 * Folders come back as a tree the page navigates rather than an RPC-side
 * `folderId` / `uncategorizedOnly`, so descending into one costs no round trip.
 */

/** Both list RPCs clamp `limit` to 100, so a full library takes several calls. */
const PAGE = 100;
/** Ceiling on the merged list — the page renders every row it is handed. */
const LIBRARY_MAX = 1000;

/** Page an offset-based list RPC until it is exhausted or the cap is reached. */
async function fetchAll<T>(
	fetchPage: (offset: number) => Promise<{ rows: T[]; totalCount?: number }>
): Promise<{ rows: T[]; totalCount: number; truncated: boolean }> {
	const rows: T[] = [];
	let totalCount = 0;

	for (let offset = 0; offset < LIBRARY_MAX; offset += PAGE) {
		const page = await fetchPage(offset);
		rows.push(...page.rows);
		if (page.totalCount !== undefined) totalCount = page.totalCount;
		if (page.rows.length < PAGE) break;
	}

	// Without a totalCount the backend still told us how many rows it handed over.
	if (totalCount < rows.length) totalCount = rows.length;
	return { rows, totalCount, truncated: totalCount > rows.length };
}

type LibraryScope = { sharedWithMe?: boolean };

function toAppItem(app: TextqlRpcPublicAppApp) {
	if (typeof app.id !== 'string') return null;
	return {
		id: app.id,
		kind: 'app' as const,
		name: trimmedOrNull(app.name) ?? 'Untitled app',
		description: trimmedOrNull(app.description),
		screenshotUrl: trimmedOrNull(app.screenshotUrl),
		isFavorited: app.isFavorited === true,
		hasUnpublishedChanges: app.hasUnpublishedChanges === true,
		scheduleEnabled: app.scheduleEnabled === true,
		dataSourceCount: Array.isArray(app.dataSources) ? app.dataSources.length : 0,
		creatorId: trimmedOrNull(app.creatorId),
		// Apps carry only a creator id; the toolbar resolves it to a name via
		// /api/apps/members. Dashboards embed the member, so they fill this in.
		creatorName: null as string | null,
		folderId: trimmedOrNull(app.folderId),
		href: `/apps/${app.id}`,
		createdAt: toIsoString(app.createdAt),
		updatedAt: toIsoString(app.updatedAt)
	};
}

function dashboardCreator(dashboard: TextqlRpcPublicDashboardDashboard): string | null {
	const creator = dashboard.creator;
	if (!creator) return null;
	return trimmedOrNull(creator.memberName) ?? trimmedOrNull(creator.memberEmail);
}

function toDashboardItem(dashboard: TextqlRpcPublicDashboardDashboard) {
	if (typeof dashboard.id !== 'string') return null;
	return {
		id: dashboard.id,
		kind: 'dashboard' as const,
		name: trimmedOrNull(dashboard.name) ?? 'Untitled dashboard',
		description: trimmedOrNull(dashboard.description),
		screenshotUrl: trimmedOrNull(dashboard.screenshotUrl),
		isFavorited: dashboard.isFavorited === true,
		hasUnpublishedChanges: dashboard.hasUnpublishedChanges === true,
		scheduleEnabled: dashboard.scheduleEnabled === true,
		dataSourceCount: Array.isArray(dashboard.dataSources) ? dashboard.dataSources.length : 0,
		creatorId: trimmedOrNull(dashboard.creatorId),
		creatorName: dashboardCreator(dashboard),
		folderId: trimmedOrNull(dashboard.folderId),
		// The demo has no dashboard detail route, so a card opens the backend's
		// rendered URL when there is one and is inert otherwise.
		href: trimmedOrNull(dashboard.htmlUrl) ?? trimmedOrNull(dashboard.streamlitUrl),
		createdAt: toIsoString(dashboard.createdAt),
		updatedAt: toIsoString(dashboard.updatedAt)
	};
}

function loadApps(client: ReturnType<typeof textqlClients>['client'], scope: LibraryScope) {
	return fetchAll(async (offset) => {
		const result = await client.apps.list({ body: { limit: PAGE, offset, ...scope } });
		if (isConnectError(result)) throw new Error(result.message ?? 'Unable to list apps.');
		return {
			rows: Array.isArray(result.apps) ? result.apps : [],
			totalCount: typeof result.totalCount === 'number' ? result.totalCount : undefined
		};
	});
}

function loadDashboards(client: ReturnType<typeof textqlClients>['client'], scope: LibraryScope) {
	return fetchAll(async (offset) => {
		const result = await client.dashboards.list({ body: { limit: PAGE, offset, ...scope } });
		if (isConnectError(result)) throw new Error(result.message ?? 'Unable to list dashboards.');
		return {
			rows: Array.isArray(result.dashboards) ? result.dashboards : [],
			totalCount: typeof result.totalCount === 'number' ? result.totalCount : undefined
		};
	});
}

type FolderNode = {
	id: string;
	name: string;
	parentId: string | null;
	appCount: number;
	dashboardCount: number;
	children: FolderNode[];
};

function count(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Folders are a dashboards-side RPC, but apps carry `folderId` from the same
 * namespace — `appCount` on the folder message is what makes that explicit.
 *
 * The response may arrive already nested or flat with `parentId`, so this
 * flattens whatever it gets and rebuilds the tree from ids. Doing it one way
 * keeps the page from having to handle both shapes.
 */
async function loadFolders(
	client: ReturnType<typeof textqlClients>['client']
): Promise<FolderNode[]> {
	const result = await client.dashboards.listFolders({ body: {} });
	if (isConnectError(result)) throw new Error(result.message ?? 'Unable to list folders.');

	const flat = new Map<string, FolderNode>();
	const walk = (folders: TextqlRpcPublicDashboardDashboardFolder[]) => {
		for (const folder of folders) {
			const name = trimmedOrNull(folder.name);
			if (typeof folder.id === 'string' && name && !flat.has(folder.id)) {
				flat.set(folder.id, {
					id: folder.id,
					name,
					parentId: trimmedOrNull(folder.parentId),
					appCount: count(folder.totalAppCount) || count(folder.appCount),
					dashboardCount: count(folder.totalDashboardCount) || count(folder.dashboardCount),
					children: []
				});
			}
			if (Array.isArray(folder.children)) walk(folder.children);
		}
	};
	walk(Array.isArray(result.folders) ? result.folders : []);

	const roots: FolderNode[] = [];
	for (const node of flat.values()) {
		// A parent outside the response would orphan the node, so it surfaces at
		// the root rather than disappearing.
		const parent = node.parentId ? flat.get(node.parentId) : undefined;
		if (parent) parent.children.push(node);
		else roots.push(node);
	}

	const byName = (a: FolderNode, b: FolderNode) => a.name.localeCompare(b.name);
	for (const node of flat.values()) node.children.sort(byName);
	return roots.sort(byName);
}

const listLibrary: RequestHandler = async ({ url }) => {
	const { client } = textqlClients();

	const scope: LibraryScope = {
		sharedWithMe: url.searchParams.getAll('scope').includes('shared') || undefined
	};

	try {
		// A dashboards or folders outage shouldn't blank the apps half of the
		// library, so the three settle independently.
		const [appsResult, dashboardsResult, foldersResult] = await Promise.allSettled([
			loadApps(client, scope),
			loadDashboards(client, scope),
			loadFolders(client)
		]);

		if (appsResult.status === 'rejected') {
			return proxyError('App list request', appsResult.reason);
		}
		if (dashboardsResult.status === 'rejected') {
			console.error('Dashboard list request', dashboardsResult.reason);
		}
		if (foldersResult.status === 'rejected') {
			console.error('Folder list request', foldersResult.reason);
		}

		const dashboards =
			dashboardsResult.status === 'fulfilled'
				? dashboardsResult.value
				: { rows: [], totalCount: 0, truncated: false };
		// Losing the folder tree flattens the page to a single level rather than
		// breaking it — every item is still reachable from the root.
		const folders = foldersResult.status === 'fulfilled' ? foldersResult.value : [];

		const items = [
			...appsResult.value.rows.map(toAppItem),
			...dashboards.rows.map(toDashboardItem)
		].filter((item) => item !== null);

		return json({
			apps: items,
			folders,
			totalCount: appsResult.value.totalCount + dashboards.totalCount,
			truncated: appsResult.value.truncated || dashboards.truncated,
			dashboardsAvailable: dashboardsResult.status === 'fulfilled'
		});
	} catch (error) {
		return proxyError('Library list request', error);
	}
};

export const appsRoute: RouteHandlers = { GET: listLibrary };

// ─── /api/apps/members ──────────────────────────────────────────────────────

/**
 * Creator facet options for the library toolbar — the union of members who own
 * an app and members who own a dashboard, mirroring the merged list.
 */
const listLibraryMembers: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const [apps, dashboards] = await Promise.all([
			client.apps.getMembersWithApps({ body: {} }),
			client.dashboards.getMembersWithDashboards({ body: {} })
		]);

		const merged = new Map<string, ReturnType<typeof memberOptions>[number]>();
		for (const member of [
			...memberOptions('members' in apps ? apps.members : undefined),
			...memberOptions('members' in dashboards ? dashboards.members : undefined)
		]) {
			if (!member.id) continue;
			// First writer wins unless the later record actually knows a name.
			const existing = merged.get(member.id);
			if (!existing || (!existing.name && member.name)) merged.set(member.id, member);
		}

		return json({ members: [...merged.values()] });
	} catch (error) {
		return proxyError('Library members request', error);
	}
};

export const appsMembersRoute: RouteHandlers = { GET: listLibraryMembers };

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

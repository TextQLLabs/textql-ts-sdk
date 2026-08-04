import { Bookmark, CalendarClock, ChevronRight, Database, Folder, Share2, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { FAppsIcon } from '../assets/icons/FAppsIcon';
import { FDashboardsIcon } from '../assets/icons/FDashboardsIcon';
import { cx } from '../lib/cx';
import {
	applyFilters,
	createdAfterFor,
	DATE_PRESETS,
	type ColumnFilter
} from '../lib/tableFilter';
import { applySort, type SortEntry } from '../lib/tableSort';
import { usePageDescription, usePageTitle } from '../lib/usePageTitle';
import { loadMemberOptions } from '../lib/usePagedList';
import { isRecord } from '../lib/utils';
import { Page } from '../primitives';
import { FilterToolbar } from './filterToolbar';
import type { FilterField, FilterOption } from './filterToolbar';
import {
	BOARD_END,
	LIST_SECTION_SCROLL,
	RETRY_BTN,
	STATE_BLOCK,
	STATE_TEXT,
	STATE_TITLE
} from './pageStyles';
import { UnicodeSpinner } from './UnicodeSpinner';

type LibraryItem = {
	id: string;
	kind: 'app' | 'dashboard';
	name: string;
	description: string | null;
	screenshotUrl: string | null;
	isFavorited: boolean;
	hasUnpublishedChanges: boolean;
	scheduleEnabled: boolean;
	dataSourceCount: number;
	creatorId: string | null;
	creatorName: string | null;
	folderId: string | null;
	/** In-app route for apps; the backend's rendered URL for dashboards, if any. */
	href: string | null;
	createdAt: string | null;
	updatedAt: string | null;
};

type FolderNode = {
	id: string;
	name: string;
	parentId: string | null;
	appCount: number;
	dashboardCount: number;
	children: FolderNode[];
};

const TAG =
	'inline-flex items-center gap-1 rounded-full bg-line/30 px-[7px] py-px text-[10.5px] font-medium text-muted';

/** Shared by the folder strip and the card grid so their columns align. */
const GRID = 'm-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 p-0';

const SCOPE = 'scope';
const DATE = 'date';
const SHARED = 'shared';
const BOOKMARKED = 'bookmarked';

function monogram(name: string): string {
	return name?.trim().charAt(0).toUpperCase() || 'A';
}

function formatUpdated(value: string | null) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	const today = new Date();
	return `Updated ${date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
	})}`;
}

function parseItem(item: unknown): LibraryItem | null {
	if (!isRecord(item) || typeof item.id !== 'string') return null;
	return {
		id: item.id,
		kind: item.kind === 'dashboard' ? 'dashboard' : 'app',
		name: typeof item.name === 'string' ? item.name : 'Untitled app',
		description: typeof item.description === 'string' ? item.description : null,
		screenshotUrl: typeof item.screenshotUrl === 'string' ? item.screenshotUrl : null,
		isFavorited: item.isFavorited === true,
		hasUnpublishedChanges: item.hasUnpublishedChanges === true,
		scheduleEnabled: item.scheduleEnabled === true,
		dataSourceCount: typeof item.dataSourceCount === 'number' ? item.dataSourceCount : 0,
		creatorId: typeof item.creatorId === 'string' ? item.creatorId : null,
		creatorName: typeof item.creatorName === 'string' ? item.creatorName : null,
		folderId: typeof item.folderId === 'string' ? item.folderId : null,
		href: typeof item.href === 'string' ? item.href : null,
		createdAt: typeof item.createdAt === 'string' ? item.createdAt : null,
		updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : null
	};
}

function parseFolder(node: unknown): FolderNode | null {
	if (!isRecord(node) || typeof node.id !== 'string' || typeof node.name !== 'string') return null;
	return {
		id: node.id,
		name: node.name,
		parentId: typeof node.parentId === 'string' ? node.parentId : null,
		appCount: typeof node.appCount === 'number' ? node.appCount : 0,
		dashboardCount: typeof node.dashboardCount === 'number' ? node.dashboardCount : 0,
		children: Array.isArray(node.children)
			? node.children.map(parseFolder).filter((child) => child !== null)
			: []
	};
}

/** Flatten the tree so a folder id resolves without walking it every time. */
function indexFolders(roots: FolderNode[]): Map<string, FolderNode> {
	const byId = new Map<string, FolderNode>();
	const walk = (nodes: FolderNode[]) => {
		for (const node of nodes) {
			byId.set(node.id, node);
			walk(node.children);
		}
	};
	walk(roots);
	return byId;
}

/** Root → … → the open folder, for the breadcrumb. */
function folderPath(byId: Map<string, FolderNode>, folderId: string | null): FolderNode[] {
	const path: FolderNode[] = [];
	let current = folderId ? byId.get(folderId) : undefined;
	// A cycle in the parent chain would hang the walk, so ids are visited once.
	const seen = new Set<string>();
	while (current && !seen.has(current.id)) {
		seen.add(current.id);
		path.unshift(current);
		current = current.parentId ? byId.get(current.parentId) : undefined;
	}
	return path;
}

/** Every id at or beneath a folder — descending shows nested contents too. */
function folderSubtreeIds(node: FolderNode | undefined): Set<string> {
	const ids = new Set<string>();
	const walk = (current: FolderNode) => {
		ids.add(current.id);
		for (const child of current.children) walk(child);
	};
	if (node) walk(node);
	return ids;
}

export function AppsPage() {
	// demo2 keeps the "Data Apps" heading even though the list merges dashboards,
	// and the sidebar entry matches — so this page follows suit.
	usePageTitle('Data apps');
	usePageDescription('Browse the data apps and dashboards in your workspace.');

	const [items, setItems] = useState<LibraryItem[]>([]);
	const [folders, setFolders] = useState<FolderNode[]>([]);
	const [creatorOptions, setCreatorOptions] = useState<FilterOption[]>([]);
	const [truncated, setTruncated] = useState(false);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(false);

	const [search, setSearch] = useState('');
	const [filters, setFilters] = useState<ColumnFilter[]>([]);
	const [sortEntries, setSortEntries] = useState<SortEntry[]>([
		{ columnId: BOOKMARKED, dir: 'desc' },
		{ columnId: 'updated', dir: 'desc' }
	]);

	/**
	 * The one facet the backend has to answer: nothing on an item says whether it
	 * reached you by a grant, so selecting it refetches instead of filtering.
	 */
	const sharedWithMe =
		filters.find((filter) => filter.columnId === SCOPE)?.values.includes(SHARED) === true;

	const load = useCallback(async (shared: boolean, isRefetch: boolean) => {
		// A scope refetch keeps the current cards under the toolbar spinner rather
		// than blanking the grid.
		if (isRefetch) setRefreshing(true);
		else setLoading(true);
		setError(false);

		try {
			const response = await fetch(`/api/apps${shared ? `?scope=${SHARED}` : ''}`);
			const payload: unknown = await response.json();

			if (!response.ok || !isRecord(payload) || !Array.isArray(payload.apps)) {
				throw new Error('Unable to load library.');
			}

			setItems(payload.apps.map(parseItem).filter((item) => item !== null));
			setFolders(
				Array.isArray(payload.folders)
					? payload.folders.map(parseFolder).filter((folder) => folder !== null)
					: []
			);
			setTruncated(payload.truncated === true);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		void load(sharedWithMe, items.length > 0);
		// Rerun on scope only — every other facet is answered client-side.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sharedWithMe, load]);

	useEffect(() => {
		void loadMemberOptions('/api/apps/members').then(setCreatorOptions);
	}, []);

	const hasDashboards = useMemo(() => items.some((item) => item.kind === 'dashboard'), [items]);

	// The open folder lives in the URL so a nested view can be linked and the
	// browser's back button walks back up the tree.
	const [searchParams, setSearchParams] = useSearchParams();
	const openFolderId = searchParams.get('folder');

	const foldersById = useMemo(() => indexFolders(folders), [folders]);
	const openFolder = openFolderId ? foldersById.get(openFolderId) : undefined;
	const breadcrumb = useMemo(
		() => folderPath(foldersById, openFolderId),
		[foldersById, openFolderId]
	);

	const openFolderById = useCallback(
		(folderId: string | null) => {
			setSearchParams(folderId ? { folder: folderId } : {});
		},
		[setSearchParams]
	);

	// A folder id that no longer resolves would strand the page on an empty view
	// with no breadcrumb to climb out of.
	useEffect(() => {
		if (openFolderId && folders.length > 0 && !foldersById.has(openFolderId)) {
			openFolderById(null);
		}
	}, [openFolderId, folders, foldersById, openFolderById]);

	// The whole library is loaded up front, so every facet but `shared` runs over
	// the rows here — which is what buys creator, folder, type, date and sort on
	// a pair of RPCs that between them expose almost none of those params.
	const fields = useMemo<FilterField<LibraryItem>[]>(
		() => [
			{
				id: BOOKMARKED,
				header: 'Bookmarked',
				sortable: true,
				sortType: 'number',
				sortLabels: { asc: 'Bookmarked last', desc: 'Bookmarked first' },
				sortValue: (item) => (item.isFavorited ? 1 : 0)
			},
			{
				id: 'updated',
				header: 'Last edited',
				sortable: true,
				sortType: 'date',
				sortValue: (item) => (item.updatedAt ? new Date(item.updatedAt) : null)
			},
			{
				id: 'created',
				header: 'Created',
				sortable: true,
				sortType: 'date',
				sortValue: (item) => (item.createdAt ? new Date(item.createdAt) : null)
			},
			{ id: 'name', header: 'Name', sortable: true, sortType: 'text' },
			{
				id: 'creator',
				header: 'Creator',
				filterable: true,
				filterKind: 'people',
				filterOptions: creatorOptions,
				filterValue: (item) => item.creatorId ?? ''
			},
			// Only worth offering once both kinds are actually present.
			...(hasDashboards
				? [
						{
							id: 'kind',
							header: 'Type',
							filterable: true,
							filterOptions: [
								{ value: 'app', label: 'Data Apps', icon: FAppsIcon },
								{ value: 'dashboard', label: 'Dashboards', icon: FDashboardsIcon }
							]
						} satisfies FilterField<LibraryItem>
					]
				: []),
			{ id: DATE, header: 'Created', filterable: true, filterKind: DATE },
			{
				id: SCOPE,
				header: 'Library',
				filterable: true,
				filterOptions: [
					{ value: BOOKMARKED, label: 'Bookmarked', icon: Bookmark },
					{ value: SHARED, label: 'Shared with me', icon: Share2 }
				],
				filterValue: (item) => (item.isFavorited ? BOOKMARKED : '')
			}
		],
		[creatorOptions, hasDashboards]
	);

	const fieldMap = useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);

	/**
	 * `shared` is already applied by the fetch and `date` needs the preset
	 * vocabulary rather than value matching, so neither reaches `applyFilters`.
	 */
	const clientFilters = useMemo(
		() =>
			filters.flatMap((filter) => {
				if (filter.columnId === DATE) return [];
				if (filter.columnId !== SCOPE) return [filter];
				const values = filter.values.filter((value) => value !== SHARED);
				return values.length ? [{ ...filter, values }] : [];
			}),
		[filters]
	);

	const createdAfter = useMemo(
		() => createdAfterFor(filters.find((filter) => filter.columnId === DATE)?.values[0]),
		[filters]
	);

	/**
	 * Inside a folder the grid shows that folder's contents, including anything
	 * in its subfolders — so descending never hides items behind a second level.
	 * Search escapes the folder and runs over the whole library, matching how the
	 * folder strip disappears while searching.
	 */
	const scopedItems = useMemo(() => {
		if (!openFolder || search.trim()) return items;
		const ids = folderSubtreeIds(openFolder);
		return items.filter((item) => item.folderId && ids.has(item.folderId));
	}, [items, openFolder, search]);

	const visibleItems = useMemo(() => {
		const q = search.trim().toLowerCase();
		let rows = q
			? scopedItems.filter((item) =>
					[item.name, item.description ?? '', item.creatorName ?? ''].some((text) =>
						text.toLowerCase().includes(q)
					)
				)
			: scopedItems;

		if (createdAfter) {
			rows = rows.filter((item) => {
				if (!item.createdAt) return false;
				const created = new Date(item.createdAt);
				return !Number.isNaN(created.getTime()) && created >= createdAfter;
			});
		}

		return applySort(applyFilters(rows, clientFilters, fieldMap), sortEntries, fieldMap);
	}, [scopedItems, search, createdAfter, clientFilters, fieldMap, sortEntries]);

	/** Child folders of the open one, or the roots. Hidden while searching. */
	const visibleFolders = search.trim() ? [] : (openFolder?.children ?? folders);

	const narrowed = filters.length > 0 || search.trim().length > 0;

	function clearFilters() {
		setFilters([]);
		setSearch('');
	}

	return (
		<Page title="Data apps" lead="Browse the data apps and dashboards in your workspace." wide>
			<FilterToolbar
				fields={fields}
				items={items}
				placeholder="Search library…"
				searching={refreshing}
				search={search}
				onSearchChange={setSearch}
				filters={filters}
				onFiltersChange={setFilters}
				sortEntries={sortEntries}
				onSortChange={setSortEntries}
				datePresets={DATE_PRESETS}
			/>

			{breadcrumb.length > 0 && (
				<nav className="mb-2 flex min-w-0 flex-wrap items-center gap-1" aria-label="Folder path">
					<button type="button" className={CRUMB_LINK} onClick={() => openFolderById(null)}>
						All items
					</button>
					{breadcrumb.map((folder, index) => {
						const isLast = index === breadcrumb.length - 1;
						return (
							<span key={folder.id} className="flex min-w-0 items-center gap-1">
								<ChevronRight className="shrink-0 text-muted" size={12} strokeWidth={2} />
								{isLast ? (
									<span className={CRUMB_CURRENT} aria-current="page">
										{folder.name}
									</span>
								) : (
									<button
										type="button"
										className={CRUMB_LINK}
										onClick={() => openFolderById(folder.id)}
									>
										{folder.name}
									</button>
								)}
							</span>
						);
					})}
				</nav>
			)}

			<section className={LIST_SECTION_SCROLL} aria-label="Library list">
				{!loading && !error && visibleFolders.length > 0 && (
					// Same track sizing as the card grid below, so a folder tile lines up
					// with a preview column instead of running on its own rhythm.
					<ul className={cx(GRID, 'mb-3')} aria-label="Folders">
						{visibleFolders.map((folder) => (
							<li key={folder.id}>
								<FolderTile folder={folder} onOpen={() => openFolderById(folder.id)} />
							</li>
						))}
					</ul>
				)}

				{loading ? (
					<div className={STATE_BLOCK} aria-busy="true">
						<UnicodeSpinner label="Loading library" />
						<p className={STATE_TEXT}>Loading library…</p>
					</div>
				) : error ? (
					<div className={STATE_BLOCK}>
						<p className={STATE_TEXT}>Unable to load the library.</p>
						<button
							type="button"
							className={RETRY_BTN}
							onClick={() => void load(sharedWithMe, false)}
						>
							Retry
						</button>
					</div>
				) : visibleItems.length === 0 ? (
					// Subfolder tiles are content in their own right, so an untouched
					// view doesn't need the empty state on top of them. A filter that
					// matched nothing always says so — otherwise it reads as a blank page.
					(narrowed || visibleFolders.length === 0) && (
						<div className={STATE_BLOCK}>
							<p className={STATE_TITLE}>
								{narrowed ? 'No matching items' : openFolder ? 'This folder is empty' : 'Nothing here yet'}
							</p>
							<p className={STATE_TEXT}>
								{narrowed
									? 'Try clearing a filter or searching for something else.'
									: openFolder
										? 'Move a data app or dashboard here to fill it.'
										: 'Data apps and dashboards you create will show up here.'}
							</p>
							{narrowed && (
								<button type="button" className={RETRY_BTN} onClick={clearFilters}>
									Clear filters
								</button>
							)}
						</div>
					)
				) : (
					<ul className={GRID}>
						{visibleItems.map((item) => (
							<li key={`${item.kind}:${item.id}`}>
								<LibraryCard item={item} />
							</li>
						))}
					</ul>
				)}

				{!loading && !error && visibleItems.length > 0 && (
					<p className={BOARD_END}>
						{visibleItems.length} of {scopedItems.length} items
						{truncated && ' (capped)'}
					</p>
				)}
			</section>
		</Page>
	);
}

const CRUMB_LINK =
	'cursor-pointer truncate rounded-[5px] border-0 bg-transparent px-1 py-0.5 font-sans text-[12px] text-muted transition-colors duration-[120ms] hover:bg-line/25 hover:text-ink';
const CRUMB_CURRENT = 'truncate px-1 py-0.5 font-sans text-[12px] font-medium text-ink';

/** Counts come from the RPC's totals, so they include nested contents. */
function FolderTile({ folder, onOpen }: { folder: FolderNode; onOpen: () => void }) {
	const parts = [
		folder.appCount > 0 && `${folder.appCount} app${folder.appCount === 1 ? '' : 's'}`,
		folder.dashboardCount > 0 &&
			`${folder.dashboardCount} dashboard${folder.dashboardCount === 1 ? '' : 's'}`
	].filter((part): part is string => typeof part === 'string');

	return (
		<button
			type="button"
			className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-line/60 bg-elevate/40 px-3 py-2.5 text-left transition-[background,border-color] duration-[120ms] hover:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))] hover:bg-elevate/70"
			onClick={onOpen}
		>
			<Folder className="shrink-0 text-accent" size={16} strokeWidth={1.75} />
			<span className="flex min-w-0 flex-col">
				<span
					className="overflow-hidden font-sans text-[13px] font-medium text-ellipsis whitespace-nowrap text-ink"
					title={folder.name}
				>
					{folder.name}
				</span>
				<span className="text-[11px] text-muted">
					{parts.length > 0 ? parts.join(' · ') : 'Empty'}
				</span>
			</span>
			<ChevronRight className="ml-auto shrink-0 text-muted" size={14} strokeWidth={2} />
		</button>
	);
}

const CARD =
	'flex h-full flex-col overflow-hidden rounded-md border border-line/60 bg-elevate/40 text-inherit no-underline transition-[background,border-color] duration-[120ms]';
const CARD_LINK =
	'hover:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))] hover:bg-elevate/70';

/**
 * Apps route in-app; dashboards have no detail page in this demo, so they open
 * the backend's rendered URL when there is one and sit inert when there isn't.
 */
function LibraryCard({ item }: { item: LibraryItem }) {
	const body = <LibraryCardBody item={item} />;

	if (item.kind === 'app' && item.href) {
		return (
			<Link className={cx(CARD, CARD_LINK)} to={item.href}>
				{body}
			</Link>
		);
	}
	if (item.href) {
		return (
			<a className={cx(CARD, CARD_LINK)} href={item.href} target="_blank" rel="noreferrer">
				{body}
			</a>
		);
	}
	return (
		<div className={CARD} title="This dashboard has no rendered URL to open.">
			{body}
		</div>
	);
}

function LibraryCardBody({ item }: { item: LibraryItem }) {
	const updated = formatUpdated(item.updatedAt);

	return (
		<>
			{/* Dot-grid tile behind card previews so any app palette sits well on the surface. */}
			<span
				className="relative flex h-32 shrink-0 items-center justify-center overflow-hidden bg-[var(--color-bg,#fff)] bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-accent)_12%,transparent)_1px,transparent_1.5px)] bg-[length:14px_14px]"
				aria-hidden="true"
			>
				{item.screenshotUrl ? (
					// Screenshot framed as a mini window rising from the card body.
					// Corners are 8px — `rounded-t-lg` would be 16px (--radius-lg).
					<span className="absolute inset-x-6 top-5 bottom-0 flex flex-col overflow-hidden rounded-t-[8px] border border-b-0 border-line/60 bg-[var(--color-bg,#fff)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]">
						<span className="flex h-[18px] shrink-0 items-center gap-[5px] border-b border-line/40 bg-[var(--color-bg,#fff)] px-2">
							<span className="size-[5px] rounded-full bg-line/70" />
							<span className="size-[5px] rounded-full bg-line/70" />
							<span className="size-[5px] rounded-full bg-line/70" />
						</span>
						<img
							className="min-h-0 w-full flex-1 object-cover object-top"
							src={item.screenshotUrl}
							alt=""
							loading="lazy"
						/>
						{/* Fade the preview into the card body so the cut-off isn't abrupt. */}
						<span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[var(--color-bg,#fff)]" />
					</span>
				) : (
					<span className="inline-flex size-[52px] items-center justify-center rounded-[12px] border border-line/60 bg-[var(--color-bg,#fff)] font-sans text-[22px] font-[650] text-accent shadow-[var(--shadow-sm,0_1px_2px_rgba(0,0,0,0.06))]">
						{monogram(item.name)}
					</span>
				)}
				{item.isFavorited && (
					<Star
						className="absolute top-2 right-2 text-accent"
						size={14}
						strokeWidth={2}
						fill="currentColor"
					/>
				)}
			</span>

			<span className="flex min-w-0 flex-col gap-[5px] p-3">
				<span
					className="overflow-hidden font-sans text-[13.5px] font-semibold text-ellipsis whitespace-nowrap text-ink"
					title={item.name}
				>
					{item.name}
				</span>
				{item.description && (
					<span className="line-clamp-2 overflow-hidden text-[12px] leading-[1.45] text-muted">
						{item.description}
					</span>
				)}

				<span className="mt-[3px] flex flex-wrap items-center gap-2">
					<span className={TAG} title={item.kind === 'app' ? 'Data app' : 'Dashboard'}>
						{item.kind === 'app' ? (
							<FAppsIcon className="size-3" />
						) : (
							<FDashboardsIcon className="size-3" />
						)}
						{item.kind === 'app' ? 'App' : 'Dashboard'}
					</span>
					{item.dataSourceCount > 0 && (
						<span className={TAG} title="Data sources">
							<Database size={12} strokeWidth={1.75} />
							{item.dataSourceCount}
						</span>
					)}
					{item.scheduleEnabled && (
						<span className={TAG} title="Scheduled">
							<CalendarClock size={12} strokeWidth={1.75} />
							Scheduled
						</span>
					)}
					{item.hasUnpublishedChanges && (
						<span
							className={cx(
								TAG,
								'bg-[color-mix(in_srgb,var(--color-warn,#b58900)_16%,transparent)] text-[var(--color-warn,#b58900)]'
							)}
							title="Unpublished changes"
						>
							Draft
						</span>
					)}
					{updated && (
						<span className="text-[10.5px] whitespace-nowrap text-muted">{updated}</span>
					)}
				</span>
			</span>
		</>
	);
}

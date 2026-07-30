import { Bookmark, Ellipsis, Plus, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { cx } from '../lib/cx';
import { DATE_PRESETS } from '../lib/tableFilter';
import { usePageTitle } from '../lib/usePageTitle';
import { loadMemberOptions, usePagedList } from '../lib/usePagedList';
import { FilterToolbar } from './filterToolbar';
import type { FilterField, FilterOption } from './filterToolbar';
import { Page, confirm, toast } from '../primitives';
import {
	BOARD,
	BOARD_END,
	BOARD_GROUP,
	BOARD_GROUP_COUNT,
	BOARD_GROUP_HEAD,
	BOARD_GROUP_TITLE,
	BOARD_GROUP_TITLE_ROW,
	BOARD_LIST,
	BOARD_MORE,
	LIST_SECTION_SCROLL,
	MENU_BTN_BASE,
	MENU_BTN_HIDDEN,
	MENU_BTN_SHOWN,
	MENU_ITEM,
	MENU_POPOVER,
	MENU_WRAP,
	NEW_BTN,
	RETRY_BTN,
	ROW_SPINNER,
	STATE_BLOCK,
	STATE_TEXT,
	STATE_TITLE
} from './pageStyles';
import { UnicodeSpinner } from './UnicodeSpinner';

type ThreadListItem = {
	id: string;
	title: string;
	createdBy: string | null;
	source: string | null;
	lastMessageAt: string | null;
	updatedAt: string | null;
};

const SOURCE_OPTIONS: FilterOption[] = [
	{ value: 'CHAT_SOURCE_THREAD', label: 'Thread' },
	{ value: 'CHAT_SOURCE_PLAYBOOK', label: 'Playbook' },
	{ value: 'CHAT_SOURCE_SLACK', label: 'Slack' },
	{ value: 'CHAT_SOURCE_TEAMS', label: 'Teams' },
	{ value: 'CHAT_SOURCE_SMS', label: 'Text' },
	{ value: 'CHAT_SOURCE_MCP', label: 'MCP' },
	{ value: 'CHAT_SOURCE_SYSTEM', label: 'System' }
];

type ThreadGroup = {
	key: string;
	label: string;
	threads: ThreadListItem[];
};

function dateKey(value: string | null) {
	if (!value) return 'unknown';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'unknown';
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shortDate(value: string | null) {
	if (!value) return 'Older';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Older';

	const today = new Date();
	const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const dayDiff = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86_400_000);

	if (dayDiff === 0) return 'Today';
	if (dayDiff === 1) return 'Yesterday';
	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
	});
}

function formatLastMessage(value: string | null) {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';

	const today = new Date();
	const isToday =
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate();

	if (isToday) {
		return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	}
	return shortDate(value);
}

export function ThreadsPage() {
	usePageTitle('Threads');
	const navigate = useNavigate();

	const [openingId, setOpeningId] = useState<string | undefined>();
	const [deletingId, setDeletingId] = useState<string | undefined>();
	const [menuThreadId, setMenuThreadId] = useState<string | undefined>();
	const [creatorOptions, setCreatorOptions] = useState<FilterOption[]>([]);

	const list = usePagedList<ThreadListItem>({
		endpoint: '/api/chats',
		rowsKey: 'chats',
		defaultSort: [{ columnId: 'updated', dir: 'desc' }],
		parse: (item) =>
			typeof item.id === 'string' && typeof item.title === 'string'
				? {
						id: item.id,
						title: item.title,
						createdBy: typeof item.createdBy === 'string' ? item.createdBy : null,
						source: typeof item.source === 'string' ? item.source : null,
						lastMessageAt: typeof item.lastMessageAt === 'string' ? item.lastMessageAt : null,
						updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : null
					}
				: null
	});

	const threads = list.items;

	const busy = openingId !== undefined || deletingId !== undefined;

	// Every facet here is applied server-side, so the toolbar gets no rows and
	// each facet declares its own options rather than deriving them from the one
	// page of rows currently loaded.
	const fields = useMemo<FilterField[]>(
		() => [
			{ id: 'updated', header: 'Last message', sortable: true, sortType: 'date' },
			{ id: 'created', header: 'Created', sortable: true, sortType: 'date' },
			{ id: 'name', header: 'Title', sortable: true, sortType: 'text' },
			{
				id: 'creator',
				header: 'Creator',
				filterable: true,
				filterKind: 'people',
				filterOptions: creatorOptions
			},
			{
				id: 'scope',
				header: 'Threads',
				filterable: true,
				filterOptions: [
					{ value: 'bookmarked', label: 'Bookmarked', icon: Bookmark },
					{ value: 'shared', label: 'Shared with me', icon: Share2 }
				]
			},
			{ id: 'source', header: 'Source', filterable: true, filterOptions: SOURCE_OPTIONS },
			{ id: 'date', header: 'Created', filterable: true, filterKind: 'date' }
		],
		[creatorOptions]
	);

	const groups: ThreadGroup[] = [];
	for (const thread of threads) {
		const key = dateKey(thread.lastMessageAt);
		const existing = groups.find((group) => group.key === key);
		if (existing) existing.threads.push(thread);
		else groups.push({ key, label: shortDate(thread.lastMessageAt), threads: [thread] });
	}

	useEffect(() => {
		void loadMemberOptions('/api/chats/members').then(setCreatorOptions);
	}, []);

	useEffect(() => {
		function onWindowKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape' && menuThreadId !== undefined) setMenuThreadId(undefined);
		}
		function onWindowPointerDown(event: PointerEvent) {
			if (menuThreadId === undefined) return;
			const target = event.target;
			if (!(target instanceof Element) || !target.closest('[data-thread-menu]')) {
				setMenuThreadId(undefined);
			}
		}
		window.addEventListener('keydown', onWindowKeydown);
		window.addEventListener('pointerdown', onWindowPointerDown);
		return () => {
			window.removeEventListener('keydown', onWindowKeydown);
			window.removeEventListener('pointerdown', onWindowPointerDown);
		};
	}, [menuThreadId]);

	function openThread(id: string) {
		if (busy) return;
		setOpeningId(id);
		navigate(`/chat/${id}`);
	}

	function newThread() {
		if (busy) return;
		navigate('/');
	}

	function toggleMenu(id: string, event: React.MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (busy) return;
		setMenuThreadId((current) => (current === id ? undefined : id));
	}

	async function deleteThread(id: string, event: React.MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		setMenuThreadId(undefined);
		if (busy) return;

		const confirmed = await confirm({
			tone: 'danger',
			title: 'Delete thread?',
			description:
				'This permanently deletes the thread and all of its messages. This cannot be undone.',
			confirmLabel: 'Delete'
		});
		if (!confirmed) return;

		setDeletingId(id);
		const rollback = list.remove(id);

		try {
			const response = await fetch(`/api/chats/${encodeURIComponent(id)}`, { method: 'DELETE' });
			if (!response.ok) throw new Error('Unable to delete thread.');
			toast.success('Thread deleted');
		} catch {
			rollback();
			toast.error("Couldn't delete thread", {
				description: 'Something went wrong. Please try again.'
			});
		} finally {
			setDeletingId(undefined);
		}
	}

	return (
		<Page
			title="Threads"
			lead="Browse and open all your conversations."
			wide
			actions={
				<button type="button" className={NEW_BTN} disabled={busy} onClick={newThread}>
					<Plus size={15} strokeWidth={2} />
					<span>New chat</span>
				</button>
			}
		>
			<FilterToolbar
				fields={fields}
				datePresets={DATE_PRESETS}
				placeholder="Search threads…"
				searching={list.searching}
				search={list.search}
				onSearchChange={list.setSearch}
				filters={list.filters}
				onFiltersChange={list.setFilters}
				sortEntries={list.sortEntries}
				onSortChange={list.setSortEntries}
			/>

			<section className={LIST_SECTION_SCROLL} aria-label="Thread list">
				{list.loading ? (
					<div className={STATE_BLOCK} aria-busy="true">
						<UnicodeSpinner label="Loading threads" />
						<p className={STATE_TEXT}>Loading threads…</p>
					</div>
				) : list.error ? (
					<div className={STATE_BLOCK}>
						<p className={STATE_TEXT}>Unable to load threads.</p>
						<button type="button" className={RETRY_BTN} onClick={() => void list.load()}>
							Retry
						</button>
					</div>
				) : threads.length === 0 ? (
					<div className={STATE_BLOCK}>
						<p className={STATE_TITLE}>
							{list.narrowed ? 'No matching threads' : 'No threads yet'}
						</p>
						<p className={STATE_TEXT}>
							{list.narrowed
								? 'Try clearing a filter or searching for something else.'
								: 'Start a chat to see it here.'}
						</p>
						{list.narrowed && (
							<button
								type="button"
								className={RETRY_BTN}
								onClick={list.clearFilters}
							>
								Clear filters
							</button>
						)}
					</div>
				) : (
					<div className={BOARD}>
						{groups.map((group) => (
							<section className={BOARD_GROUP} aria-label={group.label} key={group.key}>
								<header className={BOARD_GROUP_HEAD}>
									<div className={BOARD_GROUP_TITLE_ROW}>
										<h2 className={BOARD_GROUP_TITLE}>{group.label}</h2>
										<span className={BOARD_GROUP_COUNT}>{group.threads.length}</span>
									</div>
								</header>

								<ul className={BOARD_LIST}>
									{group.threads.map((thread) => {
										const menuOpen = menuThreadId === thread.id;
										const deleting = thread.id === deletingId;
										return (
											<li
												key={thread.id}
												className={cx(
													'group/row flex items-center gap-0.5 rounded-sm transition-[background] duration-[120ms] hover:bg-elevate/70',
													(thread.id === openingId || deleting) && 'opacity-65'
												)}
											>
												<button
													type="button"
													className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-sm border-0 bg-transparent pt-2.5 pr-1.5 pb-2.5 pl-2.5 text-left text-inherit disabled:cursor-wait disabled:opacity-70"
													title={thread.title}
													disabled={busy}
													onClick={() => openThread(thread.id)}
												>
													<span className="flex min-w-0 flex-1 flex-col gap-0.5">
														<span className="min-w-0 overflow-hidden font-sans text-[13px] font-medium text-ellipsis whitespace-nowrap text-ink">
															{thread.title}
														</span>
														<span className="flex min-w-0 items-center gap-2">
															<span className="min-w-0 overflow-hidden text-[11.5px] leading-[1.35] text-ellipsis whitespace-nowrap text-muted">
																{thread.createdBy ?? 'Unknown'}
															</span>
															{thread.source && (
																<span className="shrink-0 rounded-full bg-line/30 px-1.5 py-px text-[10px] font-medium tracking-[0.02em] text-muted uppercase">
																	{thread.source}
																</span>
															)}
														</span>
													</span>

													<span className="flex shrink-0 items-center gap-2">
														<span className="shrink-0 text-[11.5px] whitespace-nowrap text-muted">
															{formatLastMessage(thread.lastMessageAt)}
														</span>
														{thread.id === openingId && (
															<UnicodeSpinner className={ROW_SPINNER} label="Opening thread" />
														)}
													</span>
												</button>

												<div className={MENU_WRAP} data-thread-menu>
													<button
														type="button"
														className={cx(
															MENU_BTN_BASE,
															menuOpen || deleting ? MENU_BTN_SHOWN : MENU_BTN_HIDDEN
														)}
														aria-label="Thread options"
														aria-haspopup="menu"
														aria-expanded={menuOpen}
														title="Thread options"
														disabled={busy}
														onClick={(event) => toggleMenu(thread.id, event)}
													>
														{deleting ? (
															<UnicodeSpinner className={ROW_SPINNER} label="Deleting thread" />
														) : (
															<Ellipsis size={13} strokeWidth={2} />
														)}
													</button>
													{menuOpen && (
														<div className={MENU_POPOVER} role="menu">
															<button
																type="button"
																className={MENU_ITEM}
																role="menuitem"
																onClick={(event) => deleteThread(thread.id, event)}
															>
																Delete
															</button>
														</div>
													)}
												</div>
											</li>
										);
									})}
								</ul>
							</section>
						))}

						{list.hasMore || list.loadingMore ? (
							<div className={BOARD_MORE} ref={list.sentinelRef}>
								{list.moreError ? (
									<>
										<p className={STATE_TEXT}>Couldn't load more threads.</p>
										<button type="button" className={RETRY_BTN} onClick={list.loadMore}>
											Retry
										</button>
									</>
								) : list.loadingMore ? (
									<UnicodeSpinner label="Loading more threads" />
								) : (
									<button type="button" className={RETRY_BTN} onClick={list.loadMore}>
										Load more
									</button>
								)}
							</div>
						) : (
							<p className={BOARD_END}>
								{threads.length} of {list.totalCount} threads
							</p>
						)}
					</div>
				)}
			</section>
		</Page>
	);
}

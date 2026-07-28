import { Ellipsis, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { cx } from '../lib/cx';
import { usePageTitle } from '../lib/usePageTitle';
import { isRecord } from '../lib/utils';
import { Page, confirm, toast } from '../primitives';
import {
	BOARD,
	BOARD_GROUP,
	BOARD_GROUP_COUNT,
	BOARD_GROUP_HEAD,
	BOARD_GROUP_TITLE,
	BOARD_GROUP_TITLE_ROW,
	BOARD_LIST,
	LIST_SECTION,
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

	const [threads, setThreads] = useState<ThreadListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [openingId, setOpeningId] = useState<string | undefined>();
	const [deletingId, setDeletingId] = useState<string | undefined>();
	const [menuThreadId, setMenuThreadId] = useState<string | undefined>();

	const busy = openingId !== undefined || deletingId !== undefined;

	const groups: ThreadGroup[] = [];
	for (const thread of threads) {
		const key = dateKey(thread.lastMessageAt);
		const existing = groups.find((group) => group.key === key);
		if (existing) existing.threads.push(thread);
		else groups.push({ key, label: shortDate(thread.lastMessageAt), threads: [thread] });
	}

	async function loadThreads() {
		setLoading(true);
		setError(false);

		try {
			const response = await fetch('/api/chats');
			const payload: unknown = await response.json();

			if (!response.ok || !isRecord(payload) || !Array.isArray(payload.chats)) {
				throw new Error('Unable to load threads.');
			}

			setThreads(
				payload.chats
					.filter(
						(item): item is Record<string, unknown> =>
							isRecord(item) && typeof item.id === 'string' && typeof item.title === 'string'
					)
					.map((item) => ({
						id: item.id as string,
						title: item.title as string,
						createdBy: typeof item.createdBy === 'string' ? item.createdBy : null,
						source: typeof item.source === 'string' ? item.source : null,
						lastMessageAt: typeof item.lastMessageAt === 'string' ? item.lastMessageAt : null,
						updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : null
					}))
			);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void loadThreads();
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
		const previous = threads;
		setThreads(threads.filter((thread) => thread.id !== id));

		try {
			const response = await fetch(`/api/chats/${encodeURIComponent(id)}`, { method: 'DELETE' });
			if (!response.ok) throw new Error('Unable to delete thread.');
			toast.success('Thread deleted');
		} catch {
			setThreads(previous);
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
			<section className={LIST_SECTION} aria-label="Thread list">
				{loading ? (
					<div className={STATE_BLOCK} aria-busy="true">
						<UnicodeSpinner label="Loading threads" />
						<p className={STATE_TEXT}>Loading threads…</p>
					</div>
				) : error ? (
					<div className={STATE_BLOCK}>
						<p className={STATE_TEXT}>Unable to load threads.</p>
						<button type="button" className={RETRY_BTN} onClick={loadThreads}>
							Retry
						</button>
					</div>
				) : threads.length === 0 ? (
					<div className={STATE_BLOCK}>
						<p className={STATE_TITLE}>No threads yet</p>
						<p className={STATE_TEXT}>Start a chat to see it here.</p>
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
					</div>
				)}
			</section>
		</Page>
	);
}

import { Moon, PanelLeft, PanelLeftClose, PanelRight, Plus, Sun } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
	closeChat,
	createChat,
	getHistory,
	listChats,
	sendMessage,
	type ChatSummary,
	type StreamEvent
} from '../lib/api';
import { getCellCase, settleCells, type CellLike } from '../lib/cells';
import { loadLastChatConfig, saveLastChatConfig } from '../lib/chatConfigPrefs';
import { DEFAULT_CHAT_MODEL } from '../lib/chatModels';
import { connectorsCache, useConnectors } from '../lib/connectorsCache';
import { cx } from '../lib/cx';
import {
	collectPreviewItems,
	previewPanel,
	usePreviewPanel,
	type PreviewItem
} from '../lib/previewPanel';
import { themePref, useResolvedTheme } from '../lib/themePref';
import { usePageTitle } from '../lib/usePageTitle';
import { isRecord } from '../lib/utils';
import { Tooltip, toast } from '../primitives';
import { Composer } from './Composer';
import { PreviewPanel } from './PreviewPanel';
import { ToolSequence } from './ToolSequence';
import { UnicodeSpinner } from './UnicodeSpinner';

type Message = {
	id: number;
	role: 'you' | 'assistant';
	body: string;
	cells?: CellLike[];
	streaming?: boolean;
};

type ChatListItem = { id: string; title: string; updatedAt: string | null };

/* --------------------------------------------------------------------------
 * Class strings for the shell chrome, lifted from the TypeScript demo so the
 * two look identical.
 *
 * Keep any property a caller needs to override OUT of the shared base string:
 * two utilities that set the same property are resolved by Tailwind's own rule
 * order, not by the order they appear here.
 * ------------------------------------------------------------------------ */

/** Inset hairline ring shared by every "selected row" in the sidebar. */
const ACTIVE_RING = 'shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_70%,transparent)]';

const ICON_GHOST =
	'inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-0 text-[#71717a] hover:bg-fill [&_svg]:size-[15px]';
/** Frosted paper used by the floating overlay chrome so it reads over content. */
const OVERLAY_SURFACE = 'bg-paper/88 backdrop-blur-[10px]';

const NEW_CHAT_BTN =
	'inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm border-0 px-2.5 py-[7px] text-[13px] font-medium text-text-2 transition-[background] duration-[120ms] ease-[ease] hover:bg-elevate/82 [&_svg]:shrink-0';

const RETRY_BTN =
	'm-2 cursor-pointer rounded-sm border-0 bg-transparent px-2.5 py-1.5 text-[12px] text-accent hover:bg-elevate/60';

/** Floating chrome pinned over the chat panel; children opt back into hits. */
const PANEL_OVERLAYS =
	'pointer-events-none absolute top-2 z-[5] items-center gap-1.5 [&>*]:pointer-events-auto';

const RAIL_BTN =
	'inline-flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 no-underline transition-[background,color] duration-[120ms] ease-[ease]';
const RAIL_BTN_IDLE = 'bg-transparent text-text-3 hover:bg-elevate/55 hover:text-ink';

const CHAT_ROW =
	'group/row flex w-full items-center gap-0.5 rounded-sm transition-[background] duration-[120ms] ease-[ease] [&_.chat-opening-spinner]:shrink-0 [&_.chat-opening-spinner]:opacity-85';
const CHAT_ROW_ACTIVE = `bg-elevate/78 text-ink ${ACTIVE_RING}`;
const CHAT_ROW_IDLE = 'text-text-3 hover:bg-elevate/55';
const CHAT_ROW_MAIN =
	'flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent py-[7px] pr-1 pl-2.5 text-left text-inherit disabled:cursor-wait disabled:opacity-70';

const CHAT_STATUS = 'flex min-h-0 flex-col items-center justify-center gap-2.5 px-6 py-8';
const CHAT_STATUS_TEXT = 'm-0 text-center text-[13px] text-muted';

const MESSAGE_BODY =
	'm-0 text-[14px] leading-[1.65] whitespace-pre-wrap text-text-strong wrap-anywhere max-[560px]:text-[13px]';
const MESSAGE_BODY_YOU =
	'm-0 text-[13px] leading-[1.45] tracking-[-0.01em] whitespace-pre-wrap text-ink wrap-anywhere';

const MOBILE_SIDEBAR_MQ = '(max-width: 780px)';

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
	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isMobileSidebar() {
	return window.matchMedia(MOBILE_SIDEBAR_MQ).matches;
}

function chatTitle(chat: ChatSummary) {
	return chat.summary?.trim() || 'Untitled chat';
}

/** Prose from a user turn: the model's own answers set `generated`. */
function isUserProse(cell: CellLike): boolean {
	const cellCase = getCellCase(cell);
	return (cellCase === 'mdCell' || cellCase === 'ansCell') && cell.generated !== true;
}

/**
 * The server opens every chat by generating a title for it. That is bookkeeping,
 * not part of the conversation, so it doesn't belong in the transcript.
 */
function isHiddenCell(cell: CellLike): boolean {
	return getCellCase(cell) === 'summaryCell';
}

/**
 * A chat's paradigm — model, connectors, SQL/Python — is fixed when the chat is
 * created, and there is no RPC to change it afterwards. So a chat created with
 * no connector fails *every* run, and the server's phrasing doesn't say that.
 */
function runErrorMessage(raw: string): string {
	if (raw.includes('missing connector')) {
		return 'This chat was created without a connector. A chat\'s connectors are fixed when it is created, so start a new chat and pick one in the composer.';
	}
	return raw || 'The chat run failed.';
}

function proseText(cell: CellLike): string {
	const cellCase = getCellCase(cell);
	const payload = cellCase ? cell[cellCase] : undefined;
	if (!isRecord(payload)) return '';
	return typeof payload.content === 'string' ? payload.content : '';
}

/** Split replayed history into the alternating turns the conversation renders. */
function messagesFromHistory(cells: CellLike[]): Message[] {
	const messages: Message[] = [];
	let assistant: Message | undefined;
	let nextId = 1;

	for (const cell of cells) {
		if (isHiddenCell(cell)) continue;
		if (isUserProse(cell)) {
			assistant = undefined;
			messages.push({ id: nextId++, role: 'you', body: proseText(cell) });
			continue;
		}
		if (!assistant) {
			assistant = { id: nextId++, role: 'assistant', body: '', cells: [] };
			messages.push(assistant);
		}
		assistant.cells = [...(assistant.cells ?? []), cell];
	}
	return messages;
}

export function ChatPage() {
	const navigate = useNavigate();
	const routeId = useParams().id;
	const panel = usePreviewPanel();
	const resolvedTheme = useResolvedTheme();

	usePageTitle('TextQL — Python + React');

	const [messages, setMessages] = useState<Message[]>([]);
	const [draft, setDraft] = useState('');
	const [selectedConnectorIds, setSelectedConnectorIds] = useState<number[]>([]);
	const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_CHAT_MODEL);
	/** Desktop: collapsible panel. Mobile: drawer open state. */
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [chatId, setChatId] = useState<string | undefined>();
	const [chatLoadError, setChatLoadError] = useState<string | undefined>();
	const [sending, setSending] = useState(false);
	const [chats, setChats] = useState<ChatListItem[]>([]);
	const [chatsLoading, setChatsLoading] = useState(true);
	const [chatsError, setChatsError] = useState(false);
	const [openingChatId, setOpeningChatId] = useState<string | undefined>();
	const [chatAssets, setChatAssets] = useState<PreviewItem[]>([]);
	const [prefsReady, setPrefsReady] = useState(false);
	const connectors = useConnectors();

	// Model and connectors are fixed once the chat exists server-side.
	const configLocked = chatId !== undefined;

	const activeRequest = useRef<AbortController | undefined>(undefined);
	/**
	 * The chat the conversation on screen belongs to. The route is the source of
	 * truth for *which* chat is open, and this is what has actually been loaded —
	 * without it, pushing `/chat/:id` after creating one would send the effect
	 * below off to re-fetch a chat that is mid-run.
	 */
	const loadedChatId = useRef<string | undefined>(undefined);
	/**
	 * The previous turn's `finalCellId`. Sent with the next turn so the server
	 * replays from there instead of from the top of the chat.
	 */
	const latestCellId = useRef('');
	const conversationRef = useRef<HTMLElement | null>(null);
	/** Stick to bottom while the user hasn't scrolled up during a stream. */
	const stickToBottom = useRef(true);
	// The stream callbacks mutate this ref, then publish a fresh array to React —
	// re-rendering off a mutated array would miss snapshots.
	const messagesRef = useRef<Message[]>([]);

	const publishMessages = useCallback(() => {
		setMessages([...messagesRef.current]);
	}, []);

	// Refreshed after every run, so the spinner and the error state are reserved
	// for the first load — swapping a populated list out mid-chat reads as a
	// spurious refresh, and a background failure just leaves the list stale.
	const chatsLoadedRef = useRef(false);

	const loadChats = useCallback(async () => {
		if (!chatsLoadedRef.current) setChatsLoading(true);
		try {
			const list = await listChats();
			setChats(
				list.map((chat) => ({ id: chat.id, title: chatTitle(chat), updatedAt: chat.updated_at }))
			);
			chatsLoadedRef.current = true;
			setChatsError(false);
		} catch {
			if (chatsLoadedRef.current) toast.error('Could not refresh the chat list.');
			else setChatsError(true);
		} finally {
			setChatsLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadChats();
	}, [loadChats]);

	useEffect(() => {
		setSidebarOpen(!isMobileSidebar());
	}, []);

	// Pick up where the last chat left off, and fetch the connector list up front
	// so the composer's picker is populated the first time it opens.
	useEffect(() => {
		const prefs = loadLastChatConfig();
		if (prefs) {
			setSelectedModel(prefs.model);
			setSelectedConnectorIds(prefs.connectorIds);
		}
		void connectorsCache.load();
		setPrefsReady(true);
	}, []);

	// A chat created with no connector isn't rejected — it fails on the first run
	// with "configuring paradigm: missing connector". Default to the org's first
	// one so a fresh browser works, rather than dying a turn later.
	useEffect(() => {
		if (!prefsReady || configLocked || selectedConnectorIds.length > 0) return;
		const first = connectors.connectors[0];
		if (first) setSelectedConnectorIds([first.id]);
	}, [prefsReady, configLocked, connectors.connectors, selectedConnectorIds]);

	useEffect(() => {
		if (!prefsReady || configLocked) return;
		saveLastChatConfig({ model: selectedModel, connectorIds: [...selectedConnectorIds] });
	}, [prefsReady, configLocked, selectedModel, selectedConnectorIds]);

	// Collecting preview assets walks every cell in the chat, so debounce it
	// off the per-snapshot stream path.
	useEffect(() => {
		const allCells = messages.flatMap((message) => message.cells ?? []);
		const handle = setTimeout(() => {
			const items = collectPreviewItems(allCells);
			setChatAssets(items);
			if (previewPanel.tabs.length > 0) previewPanel.syncFromCells(items);
		}, 120);
		return () => clearTimeout(handle);
	}, [messages]);

	useEffect(() => {
		if (!stickToBottom.current) return;
		const el = conversationRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages]);

	const chatGroups = (() => {
		const groups: { key: string; label: string; chats: ChatListItem[] }[] = [];
		for (const chat of chats) {
			const key = dateKey(chat.updatedAt);
			const existing = groups.find((group) => group.key === key);
			if (existing) existing.chats.push(chat);
			else groups.push({ key, label: shortDate(chat.updatedAt), chats: [chat] });
		}
		return groups;
	})();

	function upsertAssistantCell(assistant: Message, cell: CellLike) {
		// Reassign the array so child props always see a new reference on every
		// stream snapshot (push/index mutate can miss UI).
		const prev = assistant.cells ?? [];
		const index = prev.findIndex((existing) => existing.id === cell.id);
		if (index === -1) {
			assistant.cells = [...prev, cell];
			return;
		}
		const next = prev.slice();
		next[index] = cell;
		assistant.cells = next;
	}

	/** Find the streaming assistant message, mounting it on first activity. */
	function mountAssistant(assistantId: number): Message {
		let assistant = messagesRef.current.find((message) => message.id === assistantId);
		if (!assistant) {
			assistant = { id: assistantId, role: 'assistant', body: '', streaming: true };
			messagesRef.current.push(assistant);
			stickToBottom.current = true;
		}
		return assistant;
	}

	/**
	 * One `WatchChatEvent`. Every cell event is a full snapshot keyed by id, not
	 * a delta — including prose, whose `content` grows a few tokens at a time
	 * with `complete` unset the whole way. That is the typing effect: replace
	 * the cell and let React repaint.
	 */
	function applyEvent(event: StreamEvent, assistantId: number) {
		switch (event.type) {
			case 'runStarted': {
				mountAssistant(assistantId);
				return;
			}
			case 'cell': {
				const cell = event.cell as CellLike | undefined;
				if (!isRecord(cell)) return;
				// The user's own turn is echoed back; it's already on screen.
				if (isUserProse(cell) || isHiddenCell(cell)) return;
				upsertAssistantCell(mountAssistant(assistantId), cell);
				return;
			}
			case 'runComplete': {
				const assistant = messagesRef.current.find((message) => message.id === assistantId);
				if (assistant) {
					assistant.streaming = false;
					settleCells(assistant.cells);
				}
				const complete = isRecord(event.runComplete) ? event.runComplete : {};
				if (typeof complete.finalCellId === 'string' && complete.finalCellId) {
					latestCellId.current = complete.finalCellId;
				} else {
					// The server can finish a run without naming a final cell; the last
					// cell it sent is the same resume point.
					const cells = assistant?.cells ?? [];
					const last = cells[cells.length - 1];
					if (typeof last?.id === 'string') latestCellId.current = last.id;
				}
				return;
			}
			case 'runError': {
				const assistant = mountAssistant(assistantId);
				const error = isRecord(event.runError) ? event.runError : {};
				assistant.body = runErrorMessage(typeof error.error === 'string' ? error.error : '');
				assistant.streaming = false;
				settleCells(assistant.cells);
				return;
			}
			case 'timeout': {
				const assistant = messagesRef.current.find((message) => message.id === assistantId);
				if (assistant) {
					assistant.streaming = false;
					settleCells(assistant.cells);
				}
				toast.error('The stream went quiet — reload the chat to catch up.');
				return;
			}
			default:
				// opened / heartbeat / handoffPending / streamEnded need no UI.
				return;
		}
	}

	function onConversationScroll() {
		const el = conversationRef.current;
		if (!el) return;
		const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
		stickToBottom.current = distance < 80;
	}

	async function send() {
		const message = draft.trim();
		if (!message || sending) return;

		// A chat with no connector is accepted, then fails on its first run with
		// "configuring paradigm: missing connector". Catch it while the message is
		// still in the box.
		if (!chatId && selectedConnectorIds.length === 0) {
			toast.error('Pick at least one connector before starting a chat.');
			return;
		}

		activeRequest.current?.abort();
		const request = new AbortController();
		activeRequest.current = request;

		setSending(true);
		setChatLoadError(undefined);
		setDraft('');
		stickToBottom.current = true;

		const userId = Date.now();
		const assistantId = userId + 1;
		messagesRef.current.push({ id: userId, role: 'you', body: message });
		publishMessages();

		try {
			let id = chatId;
			if (!id) {
				id = await createChat({ model: selectedModel, connectorIds: selectedConnectorIds });
				loadedChatId.current = id;
				setChatId(id);
				latestCellId.current = '';
				navigate(`/chat/${id}`, { replace: true });
				void loadChats();
			}

			await sendMessage(id, {
				message,
				latestCellId: latestCellId.current,
				signal: request.signal,
				onEvent: (event) => {
					if (activeRequest.current !== request) return;
					applyEvent(event, assistantId);
					publishMessages();
				}
			});
		} catch (error) {
			if (request.signal.aborted) return;
			const assistant = mountAssistant(assistantId);
			assistant.body = error instanceof Error ? error.message : 'The chat run failed.';
			assistant.streaming = false;
			toast.error(assistant.body);
		} finally {
			if (activeRequest.current === request) {
				const assistant = messagesRef.current.find((m) => m.id === assistantId);
				if (assistant) assistant.streaming = false;
				publishMessages();
				setSending(false);
				activeRequest.current = undefined;
				void loadChats();
			}
		}
	}

	function openChat(id: string) {
		if (id === chatId || openingChatId) return;
		navigate(`/chat/${id}`);
	}

	const loadChat = useCallback(async (id: string) => {
		activeRequest.current?.abort();
		activeRequest.current = undefined;
		loadedChatId.current = id;

		setOpeningChatId(id);
		setChatLoadError(undefined);
		previewPanel.reset();
		if (isMobileSidebar()) setSidebarOpen(false);

		try {
			const cells = await getHistory(id);
			messagesRef.current = messagesFromHistory(cells);
			publishMessages();
			setChatId(id);
			// History is everything the chat has said, so the next turn can resume
			// from its last cell instead of replaying the lot.
			latestCellId.current = String(cells[cells.length - 1]?.id ?? '');
			stickToBottom.current = true;
			setSending(false);
		} catch (error) {
			setChatId(id);
			messagesRef.current = [];
			publishMessages();
			setChatLoadError(error instanceof Error ? error.message : 'Unable to load this chat.');
		} finally {
			setOpeningChatId(undefined);
		}
	}, [publishMessages]);

	const resetToNewChat = useCallback(() => {
		activeRequest.current?.abort();
		activeRequest.current = undefined;
		loadedChatId.current = undefined;
		messagesRef.current = [];
		publishMessages();
		latestCellId.current = '';
		setChatId(undefined);
		setChatLoadError(undefined);
		setSending(false);
		previewPanel.reset();
	}, [publishMessages]);

	// The route drives the chat, so a reload, a deep link and the back button all
	// land in the same place.
	useEffect(() => {
		if (!routeId) {
			if (loadedChatId.current !== undefined) resetToNewChat();
			return;
		}
		if (routeId === loadedChatId.current) return;
		void loadChat(routeId);
	}, [routeId, loadChat, resetToNewChat]);

	function newThread() {
		if (chatId) void closeChat(chatId);
		if (isMobileSidebar()) setSidebarOpen(false);
		if (routeId) {
			navigate('/');
			return;
		}
		resetToNewChat();
	}

	function openAssetsPanel() {
		previewPanel.openPanel(chatAssets);
	}

	// Refreshing /chat/:id has no messages yet; switching chats keeps the
	// previous transcript until the new one loads.
	const chatPending = Boolean(routeId) && routeId !== chatId && messages.length === 0;
	const showNewChat = messages.length === 0 && !chatLoadError && !chatPending;
	const activeChatTitle = chats.find((chat) => chat.id === chatId)?.title ?? '';
	const hasAssets = chatAssets.length > 0;

	return (
		<div
			className={cx(
				// A two-column grid that animates its first track between the full
				// sidebar and the icon rail; under 780px it collapses to a plain block
				// and the sidebar becomes a fixed drawer.
				'max-[780px]:block min-[781px]:grid',
				'h-dvh bg-paper font-sans text-ink transition-[grid-template-columns] duration-[180ms] ease-[ease] motion-reduce:transition-none',
				sidebarOpen ? 'grid-cols-[260px_minmax(0,1fr)]' : 'grid-cols-[52px_minmax(0,1fr)]'
			)}
		>
			<button
				className={cx(
					'fixed inset-0 z-[29] border-0 bg-[rgba(15,15,20,0.22)] p-0 transition-[opacity,visibility] duration-[180ms] ease-[ease] motion-reduce:transition-none',
					'max-[780px]:block min-[781px]:hidden',
					sidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'
				)}
				aria-label="Close conversation menu"
				onClick={() => setSidebarOpen(false)}
			/>

			<aside
				className={cx(
					'col-start-1 row-start-1 min-h-0 min-w-0 flex-col overflow-hidden border-r border-line/80 bg-sidebar px-3 pt-3.5 pb-3',
					'ease-[ease]',
					'min-[781px]:transition-[opacity,border-color] min-[781px]:duration-[160ms] min-[781px]:motion-reduce:transition-none',
					// Mobile: a fixed drawer that slides in from the left edge.
					'max-[780px]:fixed max-[780px]:inset-y-0 max-[780px]:left-0 max-[780px]:z-30 max-[780px]:w-[min(300px,90vw)] max-[780px]:transition-[translate] max-[780px]:duration-[180ms] max-[780px]:motion-reduce:transition-none',
					sidebarOpen
						? 'flex max-[780px]:translate-x-0'
						: 'min-[781px]:hidden max-[780px]:pointer-events-none max-[780px]:flex max-[780px]:-translate-x-[102%]'
				)}
				aria-label="Conversation history"
				aria-hidden={!sidebarOpen}
			>
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-1">
						<button
							type="button"
							className={cx(NEW_CHAT_BTN, 'flex-1 bg-elevate/62')}
							onClick={newThread}
						>
							<Plus size={15} strokeWidth={2} />
							<span>New chat</span>
						</button>
						<Tooltip label="Close sidebar" side="bottom">
							<button
								type="button"
								className={cx(
									ICON_GHOST,
									'shrink-0 bg-transparent p-[7px] transition-[background] duration-[120ms] ease-[ease]'
								)}
								aria-label="Close sidebar"
								onClick={() => setSidebarOpen(false)}
							>
								<PanelLeftClose size={16} strokeWidth={1.75} />
							</button>
						</Tooltip>
					</div>
				</div>

				<div className="mt-3.5 flex min-h-0 flex-1 flex-col">
					<div
						className="min-h-0 overflow-y-auto pr-0.5"
						aria-live="polite"
						aria-busy={chatsLoading}
					>
						{chatsLoading ? (
							<div className="mx-2.5 my-3.5 flex min-h-[1em] items-center">
								<UnicodeSpinner label="Loading chats" />
							</div>
						) : chatsError ? (
							<button type="button" className={RETRY_BTN} onClick={() => void loadChats()}>
								Retry
							</button>
						) : chats.length === 0 ? (
							<p className="m-0 px-2.5 pt-2.5 text-[12px] leading-[1.4] text-muted">No chats yet</p>
						) : (
							chatGroups.map((group) => (
								<div className="mb-3.5 flex flex-col gap-0.5 last:mb-0" key={group.key}>
									<p className="m-0 px-2.5 pt-1 pb-1.5 text-[11px] font-medium tracking-[0.01em] text-muted">
										{group.label}
									</p>
									{group.chats.map((chat) => (
										<div
											key={chat.id}
											className={cx(
												CHAT_ROW,
												chat.id === chatId ? CHAT_ROW_ACTIVE : CHAT_ROW_IDLE,
												chat.id === openingChatId && 'opacity-65'
											)}
										>
											<button
												type="button"
												className={CHAT_ROW_MAIN}
												title={chat.title}
												disabled={sending || openingChatId !== undefined}
												onClick={() => openChat(chat.id)}
											>
												<span className="block min-w-0 flex-1 overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap">
													{chat.title}
												</span>
												{chat.id === openingChatId && (
													<UnicodeSpinner className="chat-opening-spinner" label="Opening chat" />
												)}
											</button>
										</div>
									))}
								</div>
							))
						)}
					</div>
				</div>

				<div className="mt-2 shrink-0 border-t border-line/70 pt-2">
					<button
						type="button"
						className="flex w-full cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-[9px] py-[7px] text-[13px] text-text-3 transition-[background,color] duration-[120ms] ease-[ease] hover:bg-ink/5 hover:text-ink"
						onClick={() => themePref.toggle()}
						aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
					>
						{resolvedTheme === 'dark' ? (
							<>
								<Sun size={15} strokeWidth={1.75} />
								<span>Light mode</span>
							</>
						) : (
							<>
								<Moon size={15} strokeWidth={1.75} />
								<span>Dark mode</span>
							</>
						)}
					</button>
				</div>
			</aside>

			{!sidebarOpen && (
				<aside
					className="col-start-1 row-start-1 min-h-0 min-w-0 flex-col items-center gap-1 overflow-hidden border-r border-line/80 bg-sidebar px-2 pt-3.5 pb-3 max-[780px]:hidden min-[781px]:flex"
					aria-label="Collapsed navigation"
				>
					<Tooltip label="Open sidebar" side="right">
						<button
							type="button"
							className={cx(RAIL_BTN, RAIL_BTN_IDLE)}
							aria-label="Open sidebar"
							onClick={() => setSidebarOpen(true)}
						>
							<PanelLeft size={16} strokeWidth={1.75} />
						</button>
					</Tooltip>
					<Tooltip label="New chat" side="right">
						<button
							type="button"
							className={cx(RAIL_BTN, RAIL_BTN_IDLE)}
							aria-label="New chat"
							onClick={newThread}
						>
							<Plus size={16} strokeWidth={2} />
						</button>
					</Tooltip>
				</aside>
			)}

			<div
				className={cx(
					// `workspace` stays a plain class: PreviewPanel's resize handler
					// finds this element with `closest('.workspace')`, and it sizes the
					// panel through the `--preview-panel-width` custom property below.
					'workspace col-start-2 row-start-1 flex h-full min-h-0 min-w-0 max-[780px]:h-dvh',
					'[&_.preview-panel]:h-full [&_.preview-panel]:min-h-0 [&_.preview-panel]:w-[var(--preview-panel-width,420px)] [&_.preview-panel]:min-w-0 [&_.preview-panel]:flex-none',
					// Narrow viewports stack the preview under the chat instead.
					panel.open &&
					'max-[960px]:flex-col max-[960px]:[&_.preview-panel]:h-[min(45vh,420px)] max-[960px]:[&_.preview-panel]:w-full max-[960px]:[&_.preview-panel]:border-t max-[960px]:[&_.preview-panel]:border-l-0',
					panel.resizing && 'cursor-col-resize'
				)}
				style={{ ['--preview-panel-width' as string]: `${panel.width}px` }}
			>
				<main
					className={cx(
						'relative min-h-0 min-w-0 flex-auto bg-paper max-[780px]:h-dvh',
						showNewChat || chatLoadError || chatPending
							? 'grid grid-rows-[auto_minmax(0,1fr)]'
							: 'grid grid-rows-[auto_minmax(0,1fr)_auto]',
						panel.resizing && 'pointer-events-none contain-layout contain-style'
					)}
				>
					{!sidebarOpen && (
						/* Desktop uses the collapsed icon rail, so the floating open/new
						   buttons are only needed on the mobile drawer layout. */
						<div className={cx(PANEL_OVERLAYS, 'left-3 max-[780px]:flex min-[781px]:hidden')}>
							<button
								type="button"
								className={cx(ICON_GHOST, OVERLAY_SURFACE)}
								aria-label="Open sidebar"
								onClick={() => setSidebarOpen(true)}
							>
								<PanelLeft size={16} strokeWidth={1.75} />
							</button>
							<button
								type="button"
								className={cx(NEW_CHAT_BTN, OVERLAY_SURFACE, 'max-w-[140px] flex-initial')}
								onClick={newThread}
							>
								<Plus size={15} strokeWidth={2} />
								<span>New chat</span>
							</button>
						</div>
					)}

					{/* Sits in the grid rather than the floating overlays, so a long title
					    truncates against the panel instead of running under them. */}
					<header className="flex h-9 min-w-0 items-center pt-1.5 pr-3 pl-4 max-[560px]:pl-3.5">
						<h1
							className={cx(
								'm-0 min-w-0 overflow-hidden text-[12.5px] font-medium text-ellipsis whitespace-nowrap text-text-3',
								// The mobile drawer's floating "New chat" pill owns this corner.
								!sidebarOpen && 'max-[780px]:hidden'
							)}
						>
							{activeChatTitle}
						</h1>
					</header>

					<div className={cx(PANEL_OVERLAYS, 'right-3 flex')}>
						{hasAssets && !panel.open && (
							<button
								type="button"
								className={cx(ICON_GHOST, OVERLAY_SURFACE, 'm-0')}
								aria-label="Open preview panel"
								title={`Preview (${chatAssets.length})`}
								onClick={openAssetsPanel}
							>
								<PanelRight size={16} strokeWidth={1.75} />
							</button>
						)}
					</div>

					{chatPending ? (
						<section className={CHAT_STATUS} aria-label="Loading chat" aria-busy="true">
							<UnicodeSpinner label="Loading chat" />
							<p className={CHAT_STATUS_TEXT}>Loading chat…</p>
						</section>
					) : chatLoadError ? (
						<section className={CHAT_STATUS} aria-label="Chat load error">
							<p className={CHAT_STATUS_TEXT}>{chatLoadError}</p>
							<div className="flex flex-wrap justify-center gap-1">
								<button
									type="button"
									className={RETRY_BTN}
									onClick={() => chatId && void loadChat(chatId)}
								>
									Retry
								</button>
								<button type="button" className={RETRY_BTN} onClick={newThread}>
									New chat
								</button>
							</div>
						</section>
					) : showNewChat ? (
						<section
							className="flex min-h-0 flex-col items-center justify-center px-6 pt-8 pb-10 max-[560px]:px-3.5"
							aria-label="New chat"
						>
							<Composer
								value={draft}
								onValueChange={setDraft}
								selectedConnectorIds={selectedConnectorIds}
								onConnectorIdsChange={setSelectedConnectorIds}
								selectedModel={selectedModel}
								onModelChange={setSelectedModel}
								sending={sending}
								configLocked={configLocked}
								onSend={() => void send()}
							/>
						</section>
					) : (
						<>
							<section
								ref={conversationRef}
								className="min-h-0 overflow-y-auto"
								aria-label="Chat messages"
								aria-live="polite"
								onScroll={onConversationScroll}
							>
								<div
									className={cx(
										// Generous tail so the last message can scroll up toward
										// center, well clear of the composer.
										'mx-auto w-[min(720px,calc(100%-48px))] pt-2 pb-[28vh] max-[560px]:w-[calc(100%-28px)]',
										!sidebarOpen && 'max-[780px]:pt-11'
									)}
								>
									<div className="flex flex-col items-stretch gap-4">
										{messages.map((message) => (
											<article
												key={message.id}
												className={cx(
													'flex max-w-full flex-col',
													message.role === 'you'
														? 'w-full gap-1.5 rounded-sm border border-[rgba(0,0,0,0.06)] bg-fill px-3.5 py-2.5 shadow-none'
														: 'w-full gap-2 border-0 bg-transparent px-0 py-0.5 [&_.streaming-indicator]:mt-1.5 [&_.streaming-indicator]:inline-block'
												)}
											>
												{message.role === 'assistant' ? (
													<>
														<span className="text-[12px] font-medium text-accent">Assistant</span>
														{message.cells && message.cells.length > 0 ? (
															<ToolSequence
																cells={message.cells}
																streaming={message.streaming ?? false}
															/>
														) : message.body ? (
															<p className={MESSAGE_BODY}>{message.body}</p>
														) : message.streaming ? (
															<UnicodeSpinner
																className="streaming-indicator"
																label="Waiting for response"
															/>
														) : null}
													</>
												) : message.body ? (
													<p className={MESSAGE_BODY_YOU}>{message.body}</p>
												) : null}
											</article>
										))}
									</div>
								</div>
							</section>

							<footer className="flex justify-center bg-[linear-gradient(180deg,transparent,var(--color-paper)_28%)] px-6 pt-2 pb-7 [&_.composer-shell]:mx-auto max-[560px]:px-3.5">
								<Composer
									value={draft}
									onValueChange={setDraft}
									selectedConnectorIds={selectedConnectorIds}
									onConnectorIdsChange={setSelectedConnectorIds}
									selectedModel={selectedModel}
									onModelChange={setSelectedModel}
									sending={sending}
									configLocked={configLocked}
									docked
									onSend={() => void send()}
								/>
							</footer>
						</>
					)}
				</main>

				{panel.open && <PreviewPanel />}
			</div>
		</div>
	);
}

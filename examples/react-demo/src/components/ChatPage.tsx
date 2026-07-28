import { Ellipsis, Moon, PanelLeft, PanelLeftClose, PanelRight, Plus, Sun } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { FAgentIcon } from '../assets/icons/FAgentIcon';
import { FAppsIcon } from '../assets/icons/FAppsIcon';
import { FOntologyIcon } from '../assets/icons/FOntologyIcon';
import { FPlaybooksIcon } from '../assets/icons/FPlaybooksIcon';
import { FThreadsIcon } from '../assets/icons/FThreadsIcon';
import { getCellCase, settleCells, type CellLike } from '../lib/cells';
import { loadLastChatConfig, saveLastChatConfig } from '../lib/chatConfigPrefs';
import { DEFAULT_CHAT_MODEL } from '../lib/chatModels';
import { connectorsCache } from '../lib/connectorsCache';
import { cx } from '../lib/cx';
import {
	collectPreviewItems,
	previewPanel,
	usePreviewPanel,
	type PreviewItem
} from '../lib/previewPanel';
import { parseStreamLine, toCellLike } from '../lib/streamEvents';
import { themePref, useResolvedTheme } from '../lib/themePref';
import { usePageDescription, usePageTitle } from '../lib/usePageTitle';
import { isRecord } from '../lib/utils';
import { Tooltip, confirm, toast } from '../primitives';
import { AgentDetailPage } from './AgentDetailPage';
import { AgentsPage } from './AgentsPage';
import { AppDetailPage } from './AppDetailPage';
import { AppsPage } from './AppsPage';
import { Composer } from './Composer';
import { OntologyPage } from './OntologyPage';
import { MENU_BTN_HIDDEN, MENU_BTN_SHOWN, MENU_ITEM, MENU_POPOVER, MENU_WRAP } from './pageStyles';
import { PlaybooksPage } from './PlaybooksPage';
import { PreviewPanel } from './PreviewPanel';
import { ThreadsPage } from './ThreadsPage';
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

const MOBILE_SIDEBAR_MQ = '(max-width: 780px)';

/* --------------------------------------------------------------------------
 * Class strings for the shell chrome.
 *
 * Keep any property a caller needs to override OUT of the shared base string:
 * two utilities that set the same property are resolved by Tailwind's own rule
 * order, not by the order they appear here. Background is the usual offender —
 * hence the split between `ICON_GHOST` and `OVERLAY_SURFACE`.
 * ------------------------------------------------------------------------ */

/** Inset hairline ring shared by every "selected row" in the sidebar. */
const ACTIVE_RING = 'shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_70%,transparent)]';

/**
 * Round ghost icon button. In the original stylesheet `.icon-ghost` was declared
 * after `.sidebar-close`, so at equal specificity its 32px box / pill radius /
 * `#71717a` ink won — the values below are that resolved result, not the
 * `.sidebar-close` block's. Ships without a background for the reason above.
 */
const ICON_GHOST =
	'inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-0 text-[#71717a] hover:bg-fill [&_svg]:size-[15px]';
/** Frosted paper used by the floating overlay chrome so it reads over content. */
const OVERLAY_SURFACE = 'bg-paper/88 backdrop-blur-[10px]';

/** "New chat" pill. Background is per call site (sidebar vs floating overlay). */
const NEW_CHAT_BTN =
	'inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm border-0 px-2.5 py-[7px] text-[13px] font-medium text-text-2 transition-[background] duration-[120ms] ease-[ease] hover:bg-elevate/82 [&_svg]:shrink-0';

const RETRY_BTN =
	'm-2 cursor-pointer rounded-sm border-0 bg-transparent px-2.5 py-1.5 text-[12px] text-accent hover:bg-elevate/60';

/** Floating chrome pinned over the chat panel; children opt back into hits. */
const PANEL_OVERLAYS =
	'pointer-events-none absolute top-2 z-[5] items-center gap-1.5 [&>*]:pointer-events-auto';

const RAIL_BTN =
	'inline-flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 no-underline transition-[background,color] duration-[120ms] ease-[ease] [&_.rail-icon]:text-[15px]';
const RAIL_BTN_ACTIVE = `bg-elevate/78 text-ink ${ACTIVE_RING} [&_.rail-icon]:text-ink`;
/** No hover pair on the active variant: `.rail-btn.active` outranked `:hover`. */
const RAIL_BTN_IDLE =
	'bg-transparent text-text-3 hover:bg-elevate/55 hover:text-ink [&_.rail-icon]:text-[#71717a]';

/** Nav icons keep their muted ink even when selected (as in the original). */
const NAV_ENTRY =
	'mb-0.5 flex w-full items-center gap-2 rounded-sm px-2.5 py-[7px] text-[12.5px] font-medium no-underline transition-[background] duration-[120ms] ease-[ease] [&_.sidebar-nav-icon]:shrink-0 [&_.sidebar-nav-icon]:text-[14px] [&_.sidebar-nav-icon]:text-[#71717a]';
const NAV_ENTRY_ACTIVE = `bg-elevate/78 text-ink ${ACTIVE_RING}`;
const NAV_ENTRY_IDLE = 'text-text-3 hover:bg-elevate/55';

const CHAT_ROW =
	'group/row flex w-full items-center gap-0.5 rounded-sm transition-[background] duration-[120ms] ease-[ease] [&_.chat-opening-spinner]:shrink-0 [&_.chat-opening-spinner]:opacity-85 [&_.chat-closing-spinner]:shrink-0 [&_.chat-closing-spinner]:opacity-85';
const CHAT_ROW_ACTIVE = `bg-elevate/78 text-ink ${ACTIVE_RING}`;
const CHAT_ROW_IDLE = 'text-text-3 hover:bg-elevate/55';
const CHAT_ROW_MAIN =
	'flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent py-[7px] pr-1 pl-2.5 text-left text-inherit disabled:cursor-wait disabled:opacity-70';
/** Same treatment as the list pages' row menus, but on a 24px button. */
const CHAT_MENU_BTN =
	'inline-flex size-6 cursor-pointer items-center justify-center rounded-xs border-0 bg-transparent text-muted transition-[opacity,background,color] duration-[120ms] ease-[ease] hover:not-disabled:bg-elevate/70 hover:not-disabled:text-ink disabled:cursor-wait';

const CHAT_STATUS = 'flex min-h-0 flex-col items-center justify-center gap-2.5 px-6 py-8';
const CHAT_STATUS_TEXT = 'm-0 text-center text-[13px] text-muted';

const MESSAGE_BODY =
	'm-0 text-[14px] leading-[1.65] whitespace-pre-wrap text-text-strong wrap-anywhere max-[560px]:text-[13px]';
/** The user bubble's own body rule outranks the ≤560px `.message-body`
 *  font-size, so it stays at 14px on narrow screens — same as the original. */
const MESSAGE_BODY_YOU =
	'm-0 text-[14px] leading-[1.45] tracking-[-0.01em] whitespace-pre-wrap text-ink wrap-anywhere';
const CHAT_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isChatUuid(value: string) {
	return CHAT_UUID_RE.test(value);
}

// API routes return { error }; the router's thrown error returns { message }.
function apiErrorDetail(payload: unknown, fallback: string): string {
	if (!isRecord(payload)) return fallback;
	if (typeof payload.error === 'string') return payload.error;
	if (typeof payload.message === 'string') return payload.message;
	return fallback;
}

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

export function ChatPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const routeParams = useParams();
	const panel = usePreviewPanel();
	const resolvedTheme = useResolvedTheme();

	usePageTitle('Chat');
	usePageDescription('A soft chat interface inspired by Cursor Agents.');

	const [messages, setMessages] = useState<Message[]>([]);
	const [draft, setDraft] = useState('');
	const [selectedConnectorIds, setSelectedConnectorIds] = useState<number[]>([]);
	const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_CHAT_MODEL);
	/** Desktop: collapsible panel. Mobile: drawer open state. */
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [chatId, setChatId] = useState<string | undefined>();
	/** Last chat id successfully hydrated from `/api/chats/[id]` (not stream meta). */
	const [resolvedChatId, setResolvedChatId] = useState<string | undefined>();
	const [chatLoadError, setChatLoadError] = useState<string | undefined>();
	const [sending, setSending] = useState(false);
	const [chats, setChats] = useState<ChatListItem[]>([]);
	const [chatsLoading, setChatsLoading] = useState(true);
	const [chatsError, setChatsError] = useState(false);
	const [openingChatId, setOpeningChatId] = useState<string | undefined>();
	const [closingChatId, setClosingChatId] = useState<string | undefined>();
	const [menuChatId, setMenuChatId] = useState<string | undefined>();
	const [prefsReady, setPrefsReady] = useState(false);
	const [chatAssets, setChatAssets] = useState<PreviewItem[]>([]);

	const activeRequest = useRef<AbortController | undefined>(undefined);
	const chatLoadRequest = useRef<AbortController | undefined>(undefined);
	/** User md cell id from stream meta — filter echoes by id, not `generated`. */
	const streamUserCellId = useRef<string | undefined>(undefined);
	const conversationRef = useRef<HTMLElement | null>(null);
	/** Stick to bottom while the user hasn't scrolled up during a stream. */
	const stickToBottom = useRef(true);
	// The stream callbacks mutate this ref, then publish a fresh array to React —
	// Svelte's fine-grained reactivity has no direct equivalent.
	const messagesRef = useRef<Message[]>([]);

	const publishMessages = useCallback(() => {
		setMessages([...messagesRef.current]);
	}, []);

	const path = location.pathname;
	const isPlaybooksRoute = path === '/playbooks' || path.startsWith('/playbooks/');
	const isOntologyRoute = path === '/ontology' || path.startsWith('/ontology/');
	const isThreadsRoute = path === '/threads' || path.startsWith('/threads/');
	const isAgentsRoute = path === '/agents' || path.startsWith('/agents/');
	const isAppsRoute = path === '/apps' || path.startsWith('/apps/');
	/** True on any full-panel section route (threads/playbooks/ontology/agents/apps) — i.e. not chat. */
	const inSection =
		isPlaybooksRoute || isOntologyRoute || isThreadsRoute || isAgentsRoute || isAppsRoute;
	const routeChatId = inSection ? undefined : routeParams.id;

	const isEmpty = messages.length === 0;
	const configLocked = chatId !== undefined || !isEmpty;

	/** Deep link / sidebar open: fetch before showing the new-chat composer. */
	const showChatLoading = (() => {
		if (inSection) return false;
		const id = routeChatId;
		if (!id) return false;
		if (sending && id === chatId && messages.length > 0) return false;
		if (chatLoadError && resolvedChatId !== id) return false;
		if (resolvedChatId === id) return false;
		return true;
	})();
	const showChatError = Boolean(
		!inSection && routeChatId && chatLoadError && resolvedChatId !== routeChatId && !showChatLoading
	);
	const showNewChat = !inSection && !routeChatId && isEmpty && !showChatLoading && !showChatError;
	const hasAssets = chatAssets.length > 0;

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

	function openAssetsPanel() {
		previewPanel.openPanel(chatAssets);
	}

	const resetChatConfig = useCallback(() => {
		const prefs = loadLastChatConfig();
		setSelectedModel(prefs?.model ?? DEFAULT_CHAT_MODEL);
		setSelectedConnectorIds(prefs?.connectorIds ?? []);
		if (prefs?.connectorIds?.length) void connectorsCache.load();
	}, []);

	/** Back to the blank new-chat state (aborts any in-flight stream). */
	const resetChatState = useCallback(() => {
		activeRequest.current?.abort();
		setSending(false);
		activeRequest.current = undefined;
		messagesRef.current = [];
		publishMessages();
		setDraft('');
		setChatId(undefined);
		setResolvedChatId(undefined);
		setChatLoadError(undefined);
		streamUserCellId.current = undefined;
		resetChatConfig();
		previewPanel.reset();
	}, [publishMessages, resetChatConfig]);

	const loadChats = useCallback(async () => {
		setChatsLoading(true);
		setChatsError(false);

		try {
			const response = await fetch('/api/chats');
			const payload: unknown = await response.json();

			if (!response.ok || !isRecord(payload) || !Array.isArray(payload.chats)) {
				throw new Error('Unable to load chats.');
			}

			setChats(
				payload.chats.filter(
					(item): item is ChatListItem =>
						isRecord(item) &&
						typeof item.id === 'string' &&
						typeof item.title === 'string' &&
						(typeof item.updatedAt === 'string' || item.updatedAt === null)
				)
			);
		} catch {
			setChatsError(true);
		} finally {
			setChatsLoading(false);
		}
	}, []);

	function closeSidebarIfMobile() {
		if (isMobileSidebar()) setSidebarOpen(false);
	}

	// The shell owns the viewport (a 100dvh grid with its own scroll regions), so
	// the document must not scroll behind it. Tailwind can't express "style <body>
	// while this component is mounted", and it has to stay scoped to the chat
	// shell on purpose — the standalone /style page still scrolls — so it is set
	// imperatively here and restored on unmount.
	useEffect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, []);

	useEffect(() => {
		if (isMobileSidebar()) setSidebarOpen(false);
		if (!routeParams.id) resetChatConfig();
		setPrefsReady(true);
		void loadChats();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
	}, []);

	// Persist last-used defaults while configuring a new chat (not locked).
	useEffect(() => {
		if (!prefsReady || configLocked || routeParams.id) return;
		saveLastChatConfig({ model: selectedModel, connectorIds: [...selectedConnectorIds] });
	}, [prefsReady, configLocked, routeParams.id, selectedModel, selectedConnectorIds]);

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

	// The user's own message cell may be echoed in the stream; it's already
	// rendered optimistically, so keep it out of the assistant's cell list.
	function isEchoedUserCell(cell: CellLike): boolean {
		if (streamUserCellId.current && cell.id === streamUserCellId.current) return true;
		const cellCase = getCellCase(cell);
		return (cellCase === 'mdCell' || cellCase === 'ansCell') && cell.generated !== true;
	}

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

	/** Find the streaming assistant message, mounting it on first activity
	 * (resume path: the run announces itself via runStarted or a cell). */
	function mountAssistant(assistantId: number): Message {
		let assistant = messagesRef.current.find((message) => message.id === assistantId);
		if (!assistant) {
			assistant = { id: assistantId, role: 'assistant', body: '', streaming: true };
			messagesRef.current.push(assistant);
			setSending(true);
			stickToBottom.current = true;
		}
		return assistant;
	}

	const setChatRoute = useCallback(
		(id: string | undefined, replace = false) => {
			if (id) {
				if (routeParams.id === id) return;
				navigate(`/chat/${id}`, { replace, preventScrollReset: true });
				return;
			}
			if (location.pathname === '/') return;
			navigate('/', { replace, preventScrollReset: true });
		},
		[location.pathname, navigate, routeParams.id]
	);

	function applyStreamLine(line: string, assistantId: number) {
		const parsed = parseStreamLine(line);
		if (!parsed) return;

		if (parsed.type === 'meta') {
			setChatId(parsed.chatId);
			if (parsed.userCellId) streamUserCellId.current = parsed.userCellId;
			setChatRoute(parsed.chatId, true);
			return;
		}
		if (parsed.type === 'idle') return;

		// Run state comes from the gRPC WatchChatEvent payload itself.
		const { payload } = parsed.event;
		switch (payload.case) {
			case 'runStarted': {
				mountAssistant(assistantId);
				return;
			}
			case 'cell': {
				const assistant = mountAssistant(assistantId);
				const cell = toCellLike(payload.value);
				if (isEchoedUserCell(cell)) return;
				upsertAssistantCell(assistant, cell);
				return;
			}
			case 'runComplete': {
				const assistant = messagesRef.current.find((message) => message.id === assistantId);
				if (assistant) {
					assistant.streaming = false;
					settleCells(assistant.cells);
				}
				return;
			}
			case 'runError': {
				const assistant = mountAssistant(assistantId);
				assistant.body = payload.value.error || 'The chat run failed.';
				assistant.streaming = false;
				settleCells(assistant.cells);
				return;
			}
			case 'opened':
			case 'heartbeat':
			case 'handoffPending':
			case undefined:
				return;
		}
	}

	function onConversationScroll() {
		const el = conversationRef.current;
		if (!el) return;
		const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
		stickToBottom.current = distance < 80;
	}

	function scrollConversationToBottom() {
		if (!stickToBottom.current) return;
		requestAnimationFrame(() => {
			const el = conversationRef.current;
			if (el) el.scrollTop = el.scrollHeight;
		});
	}

	async function pumpNdjson(
		body: ReadableStream<Uint8Array>,
		request: AbortController,
		assistantId: number
	) {
		const reader = body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (activeRequest.current !== request) return;
			if (value) buffer += decoder.decode(value, { stream: true });
			if (done) buffer += decoder.decode();

			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';
			for (const line of lines) applyStreamLine(line, assistantId);
			if (done && buffer) {
				applyStreamLine(buffer, assistantId);
				buffer = '';
			}
			publishMessages();
			scrollConversationToBottom();

			if (done) break;
		}
	}

	function lastCellId(): string | undefined {
		for (let i = messagesRef.current.length - 1; i >= 0; i--) {
			const cells = messagesRef.current[i]!.cells;
			if (!cells?.length) continue;
			const id = cells[cells.length - 1]?.id;
			if (typeof id === 'string' && id) return id;
		}
		return undefined;
	}

	async function resumeLiveRun(id: string) {
		const cursor = lastCellId();
		const request = new AbortController();
		activeRequest.current = request;
		const assistantId = Date.now();

		try {
			const query = cursor ? `?latestCompleteCellId=${encodeURIComponent(cursor)}` : '';
			const response = await fetch(`/api/chats/${encodeURIComponent(id)}/watch${query}`, {
				signal: request.signal
			});
			if (!response.ok || !response.body) return;
			await pumpNdjson(response.body, request, assistantId);
		} catch {
			// Resume is best-effort; the chat renders fine without it.
		} finally {
			const assistant = messagesRef.current.find((message) => message.id === assistantId);
			if (assistant?.streaming) {
				assistant.streaming = false;
				settleCells(assistant.cells);
				publishMessages();
			}
			if (activeRequest.current === request) {
				activeRequest.current = undefined;
				setSending(false);
			}
		}
	}

	function handleQuestionsAnswered() {
		const id = chatId ?? routeParams.id;
		if (id) void resumeLiveRun(id);
	}

	async function sendMessage() {
		const body = draft.trim();
		if (!body || sending) return;

		// Snapshot config before optimistic UI (messages → configLocked).
		const model = selectedModel;
		const connectorIds = [...selectedConnectorIds];
		const existingChatId = chatId;

		const userId = Date.now();
		const assistantId = userId + 1;
		messagesRef.current.push(
			{ id: userId, role: 'you', body },
			{ id: assistantId, role: 'assistant', body: '', streaming: true }
		);
		publishMessages();
		setDraft('');
		setSending(true);
		stickToBottom.current = true;
		streamUserCellId.current = undefined;
		const request = new AbortController();
		activeRequest.current = request;
		scrollConversationToBottom();

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: body, chatId: existingChatId, model, connectorIds }),
				signal: request.signal
			});

			if (!response.ok || !response.body) {
				const payload: unknown = await response.json().catch(() => null);
				throw new Error(apiErrorDetail(payload, 'Request failed.'));
			}

			await pumpNdjson(response.body, request, assistantId);

			// New chat: remember the config that was actually used.
			if (!existingChatId) saveLastChatConfig({ model, connectorIds });
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			const assistant = messagesRef.current.find((message) => message.id === assistantId);
			const detail = error instanceof Error ? error.message : 'Request failed.';
			if (assistant) assistant.body = detail;
			toast.error('Message failed to send', { description: detail });
		} finally {
			const assistant = messagesRef.current.find((message) => message.id === assistantId);
			if (assistant) assistant.streaming = false;
			publishMessages();
			setSending(false);
			streamUserCellId.current = undefined;
			if (activeRequest.current === request) activeRequest.current = undefined;
			void loadChats();
		}
	}

	const loadChatById = useCallback(
		async (id: string) => {
			if (openingChatId === id) return;

			if (!isChatUuid(id)) {
				setChatLoadError('Invalid chat id.');
				setResolvedChatId(undefined);
				return;
			}

			// Never clobber an in-flight stream with a history fetch (e.g. after
			// meta navigates `/` → `/chat/[id]` mid-response).
			if (sending && id === chatId) {
				setResolvedChatId(id);
				setChatLoadError(undefined);
				closeSidebarIfMobile();
				return;
			}
			if (id === resolvedChatId && id === chatId) {
				closeSidebarIfMobile();
				return;
			}

			// An explicit navigation abandons work for the prior route.
			if (sending) {
				activeRequest.current?.abort();
				setSending(false);
				activeRequest.current = undefined;
			}
			chatLoadRequest.current?.abort();
			const request = new AbortController();
			chatLoadRequest.current = request;

			setOpeningChatId(id);
			setChatLoadError(undefined);

			try {
				const response = await fetch(`/api/chats/${encodeURIComponent(id)}`, {
					signal: request.signal
				});
				const payload: unknown = await response.json();
				if (request !== chatLoadRequest.current) return;

				if (!response.ok || !isRecord(payload) || !Array.isArray(payload.messages)) {
					throw new Error(apiErrorDetail(payload, 'Unable to load chat.'));
				}

				setChatId(id);
				setResolvedChatId(id);
				setChatLoadError(undefined);
				previewPanel.reset();
				messagesRef.current = payload.messages.flatMap((item, index): Message[] => {
					if (!isRecord(item) || (item.role !== 'you' && item.role !== 'assistant')) return [];
					const body = typeof item.body === 'string' ? item.body : '';
					const cells = Array.isArray(item.cells)
						? (item.cells.filter(isRecord) as CellLike[])
						: undefined;
					if (!body && (!cells || cells.length === 0)) return [];
					// History is never a live run; stale executing lifecycles from an
					// interrupted run must not tick a "Running" timer forever.
					settleCells(cells);
					return [{ id: index, role: item.role, body, cells }];
				});
				publishMessages();

				setSelectedModel(
					typeof payload.model === 'string' && payload.model ? payload.model : DEFAULT_CHAT_MODEL
				);

				const nextConnectorIds = Array.isArray(payload.connectorIds)
					? payload.connectorIds.filter(
							(value): value is number => typeof value === 'number' && Number.isInteger(value)
						)
					: [];
				setSelectedConnectorIds(nextConnectorIds);
				if (nextConnectorIds.length > 0) void connectorsCache.load();

				closeSidebarIfMobile();

				// A run may still be executing on this chat (e.g. the page was
				// refreshed mid-stream) — re-attach so progress keeps rendering.
				void resumeLiveRun(id);
			} catch (error) {
				if (request.signal.aborted || request !== chatLoadRequest.current) return;
				setChatLoadError(error instanceof Error ? error.message : 'Unable to load chat.');
				setResolvedChatId(undefined);
			} finally {
				if (request === chatLoadRequest.current) {
					chatLoadRequest.current = undefined;
					setOpeningChatId(undefined);
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps -- reads live refs on purpose
		[chatId, openingChatId, resolvedChatId, sending, publishMessages]
	);

	// Initial load + client navigations (SvelteKit's afterNavigate).
	useEffect(() => {
		if (inSection) return;

		const id = routeParams.id;
		if (id) {
			void loadChatById(id);
			return;
		}
		chatLoadRequest.current?.abort();
		chatLoadRequest.current = undefined;
		setOpeningChatId(undefined);

		if (!sending && (chatId !== undefined || messagesRef.current.length > 0)) {
			resetChatState();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- route-driven
	}, [path, routeParams.id]);

	const newThread = useCallback(() => {
		chatLoadRequest.current?.abort();
		chatLoadRequest.current = undefined;
		setOpeningChatId(undefined);
		resetChatState();
		closeSidebarIfMobile();
		setChatRoute(undefined);
	}, [resetChatState, setChatRoute]);

	function openChat(id: string) {
		if (sending || openingChatId || closingChatId) return;
		closeSidebarIfMobile();
		setChatRoute(id);
	}

	function retryLoadChat() {
		const id = routeChatId;
		if (!id) return;
		setChatLoadError(undefined);
		setResolvedChatId(undefined);
		void loadChatById(id);
	}

	function toggleChatMenu(id: string, event: React.MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (closingChatId || openingChatId || sending) return;
		setMenuChatId((current) => (current === id ? undefined : id));
	}

	useEffect(() => {
		function onWindowKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape' && menuChatId !== undefined) setMenuChatId(undefined);
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
				event.preventDefault();
				setSidebarOpen((current) => !current);
			}
		}
		function onWindowPointerDown(event: PointerEvent) {
			if (menuChatId === undefined) return;
			const target = event.target;
			if (!(target instanceof Element) || !target.closest('.chat-menu')) {
				setMenuChatId(undefined);
			}
		}
		window.addEventListener('keydown', onWindowKeydown);
		window.addEventListener('pointerdown', onWindowPointerDown);
		return () => {
			window.removeEventListener('keydown', onWindowKeydown);
			window.removeEventListener('pointerdown', onWindowPointerDown);
		};
	}, [menuChatId]);

	async function deleteChat(id: string, event: React.MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		setMenuChatId(undefined);
		if (closingChatId || openingChatId || sending) return;

		const confirmed = await confirm({
			tone: 'danger',
			title: 'Delete chat?',
			description:
				'This permanently deletes the chat and all of its messages. This cannot be undone.',
			confirmLabel: 'Delete'
		});
		if (!confirmed) return;

		setClosingChatId(id);
		const previous = chats;
		setChats(chats.filter((chat) => chat.id !== id));

		try {
			const response = await fetch(`/api/chats/${encodeURIComponent(id)}`, { method: 'DELETE' });
			if (!response.ok) throw new Error('Unable to delete chat.');

			if (chatId === id) newThread();
			toast.success('Chat deleted');
		} catch {
			setChats(previous);
			toast.error("Couldn't delete chat", {
				description: 'Something went wrong. Please try again.'
			});
		} finally {
			setClosingChatId(undefined);
		}
	}

	const navEntries = [
		{ to: '/threads', label: 'Threads', Icon: FThreadsIcon, active: isThreadsRoute },
		{ to: '/playbooks', label: 'Playbooks', Icon: FPlaybooksIcon, active: isPlaybooksRoute },
		{ to: '/agents', label: 'Agents', Icon: FAgentIcon, active: isAgentsRoute },
		{ to: '/apps', label: 'Data apps', Icon: FAppsIcon, active: isAppsRoute },
		{ to: '/ontology', label: 'Ontology', Icon: FOntologyIcon, active: isOntologyRoute }
	];

	function renderSection() {
		if (isThreadsRoute) return <ThreadsPage />;
		if (isPlaybooksRoute) return <PlaybooksPage />;
		if (isOntologyRoute) return <OntologyPage />;
		if (isAgentsRoute) return routeParams.id ? <AgentDetailPage /> : <AgentsPage />;
		if (isAppsRoute) return routeParams.id ? <AppDetailPage /> : <AppsPage />;
		return null;
	}

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
					// Reduced motion has to be re-stated inside each breakpoint: the
					// transition itself is media-scoped, and a bare `motion-reduce:`
					// rule sorts ahead of it.
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
				inert={!sidebarOpen ? true : undefined}
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
						<Tooltip label="Close sidebar" shortcut="⌘S" side="bottom">
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
						{navEntries.map(({ to, label, Icon, active }) => (
							<Link
								key={to}
								className={cx(NAV_ENTRY, active ? NAV_ENTRY_ACTIVE : NAV_ENTRY_IDLE)}
								to={to}
								aria-current={active ? 'page' : undefined}
							>
								<Icon className="sidebar-nav-icon" />
								<span>{label}</span>
							</Link>
						))}

						{chatsLoading ? (
							<div className="mx-2.5 my-3.5 flex min-h-[1em] items-center">
								<UnicodeSpinner label="Loading chats" />
							</div>
						) : chatsError ? (
							<button type="button" className={RETRY_BTN} onClick={loadChats}>
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
									{group.chats.map((chat) => {
										const isActive = !inSection && chat.id === chatId;
										const isClosing = chat.id === closingChatId;
										const menuOpen = menuChatId === chat.id;
										return (
											<div
												key={chat.id}
												className={cx(
													CHAT_ROW,
													isActive ? CHAT_ROW_ACTIVE : CHAT_ROW_IDLE,
													(chat.id === openingChatId || isClosing) && 'opacity-65'
												)}
											>
												<button
													type="button"
													className={CHAT_ROW_MAIN}
													title={chat.title}
													disabled={
														sending || openingChatId !== undefined || closingChatId !== undefined
													}
													onClick={() => openChat(chat.id)}
												>
													<span className="block min-w-0 flex-1 overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap">
														{chat.title}
													</span>
													{chat.id === openingChatId && (
														<UnicodeSpinner className="chat-opening-spinner" label="Opening chat" />
													)}
												</button>
												{/* `chat-menu` stays a plain class: the outside-click handler
												    resolves this wrapper with `closest('.chat-menu')`. */}
												<div className={cx('chat-menu', MENU_WRAP)}>
													<button
														type="button"
														className={cx(
															CHAT_MENU_BTN,
															isActive || isClosing || menuOpen ? MENU_BTN_SHOWN : MENU_BTN_HIDDEN
														)}
														aria-label="Chat options"
														aria-haspopup="menu"
														aria-expanded={menuOpen}
														title="Chat options"
														disabled={closingChatId !== undefined || sending}
														onClick={(event) => toggleChatMenu(chat.id, event)}
													>
														{isClosing ? (
															<UnicodeSpinner
																className="chat-closing-spinner"
																label="Deleting chat"
															/>
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
																onClick={(event) => deleteChat(chat.id, event)}
															>
																Delete
															</button>
														</div>
													)}
												</div>
											</div>
										);
									})}
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
					<Tooltip label="Open sidebar" shortcut="⌘S" side="right">
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

					<div className="my-1 h-px w-[22px] bg-line/70" role="presentation" />

					{navEntries.map(({ to, label, Icon, active }) => (
						<Tooltip key={to} label={label} side="right">
							<Link
								className={cx(RAIL_BTN, active ? RAIL_BTN_ACTIVE : RAIL_BTN_IDLE)}
								to={to}
								aria-label={label}
								aria-current={active ? 'page' : undefined}
							>
								<Icon className="rail-icon" />
							</Link>
						</Tooltip>
					))}
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
						inSection
							? // Section routes hand the whole panel to a `Page` primitive.
								'flex flex-col overflow-hidden [&_.page]:h-full [&_.page]:min-h-0 [&_.page]:flex-1'
							: showNewChat || showChatLoading || showChatError
								? 'grid grid-rows-[minmax(0,1fr)]'
								: 'grid grid-rows-[minmax(0,1fr)_auto]',
						panel.resizing && 'pointer-events-none contain-layout contain-style'
					)}
				>
					{!sidebarOpen && (
						/* Desktop uses the collapsed icon rail, so the floating open/new
						   buttons are only needed on the mobile drawer layout. */
						<div className={cx(PANEL_OVERLAYS, 'left-3 max-[780px]:flex min-[781px]:hidden')}>
							<Tooltip label="Open sidebar" shortcut="⌘S" side="right">
								<button
									type="button"
									className={cx(ICON_GHOST, OVERLAY_SURFACE)}
									aria-label="Open sidebar"
									onClick={() => setSidebarOpen(true)}
								>
									<PanelLeft size={16} strokeWidth={1.75} />
								</button>
							</Tooltip>
							{!inSection && (
								<button
									type="button"
									className={cx(NEW_CHAT_BTN, OVERLAY_SURFACE, 'max-w-[140px] flex-initial')}
									onClick={newThread}
								>
									<Plus size={15} strokeWidth={2} />
									<span>New chat</span>
								</button>
							)}
						</div>
					)}

					<div className={cx(PANEL_OVERLAYS, 'right-3 flex')}>
						{!inSection && hasAssets && !panel.open && (
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

					{inSection ? (
						renderSection()
					) : showChatLoading ? (
						<section className={CHAT_STATUS} aria-label="Loading chat" aria-busy="true">
							<UnicodeSpinner label="Loading chat" />
							<p className={CHAT_STATUS_TEXT}>Loading chat…</p>
						</section>
					) : showChatError ? (
						<section className={CHAT_STATUS} aria-label="Chat load error">
							<p className={CHAT_STATUS_TEXT}>{chatLoadError}</p>
							<div className="flex flex-wrap justify-center gap-1">
								<button type="button" className={RETRY_BTN} onClick={retryLoadChat}>
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
							aria-label="New agent"
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
								onSend={sendMessage}
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
										// Only the mobile floating overlay overlaps the conversation;
										// the desktop rail sits in its own column, so no extra top
										// padding is needed there.
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
														? 'w-full gap-1.5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-fill px-3.5 py-2.5 shadow-none'
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
																onAnswered={handleQuestionsAnswered}
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
									onSend={sendMessage}
								/>
							</footer>
						</>
					)}
				</main>

				{!inSection && panel.open && <PreviewPanel />}
			</div>
		</div>
	);
}

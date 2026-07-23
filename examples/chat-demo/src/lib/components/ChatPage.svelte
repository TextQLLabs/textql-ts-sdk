<script lang="ts">
	import Ellipsis from "@lucide/svelte/icons/ellipsis";
	import Moon from "@lucide/svelte/icons/moon";
	import PanelLeft from "@lucide/svelte/icons/panel-left";
	import PanelLeftClose from "@lucide/svelte/icons/panel-left-close";
	import PanelRight from "@lucide/svelte/icons/panel-right";
	import Plus from "@lucide/svelte/icons/plus";
	import Sun from "@lucide/svelte/icons/sun";
	import { onMount, tick } from "svelte";
	import { afterNavigate, goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import {
		loadLastChatConfig,
		saveLastChatConfig,
	} from "$lib/chatConfigPrefs";
	import FAgentIcon from "$lib/assets/icons/FAgentIcon.svelte";
	import FAppsIcon from "$lib/assets/icons/FAppsIcon.svelte";
	import FOntologyIcon from "$lib/assets/icons/FOntologyIcon.svelte";
	import FPlaybooksIcon from "$lib/assets/icons/FPlaybooksIcon.svelte";
	import FThreadsIcon from "$lib/assets/icons/FThreadsIcon.svelte";
	import { DEFAULT_CHAT_MODEL } from "$lib/chatModels";
	import { getCellCase, settleCells, type CellLike } from "$lib/cells";
	import AgentDetailPage from "$lib/components/AgentDetailPage.svelte";
	import AgentsPage from "$lib/components/AgentsPage.svelte";
	import AppDetailPage from "$lib/components/AppDetailPage.svelte";
	import AppsPage from "$lib/components/AppsPage.svelte";
	import Composer from "$lib/components/Composer.svelte";
	import OntologyPage from "$lib/components/OntologyPage.svelte";
	import PlaybooksPage from "$lib/components/PlaybooksPage.svelte";
	import PreviewPanel from "$lib/components/PreviewPanel.svelte";
	import ThreadsPage from "$lib/components/ThreadsPage.svelte";
	import ToolSequence from "$lib/components/ToolSequence.svelte";
	import UnicodeSpinner from "$lib/components/UnicodeSpinner.svelte";
	import { connectorsCache } from "$lib/connectorsCache.svelte";
	import {
		collectPreviewItems,
		previewPanel,
		type PreviewItem,
	} from "$lib/previewPanel.svelte";
	import { Tooltip, confirm, toast } from "$lib/primitives";
	import { themePref } from "$lib/themePref.svelte";
	import { parseStreamLine, toCellLike } from "$lib/streamEvents";
	import { isRecord } from "$lib/utils";

	type Message = {
		id: number;
		role: "you" | "assistant";
		body: string;
		cells?: CellLike[];
		streaming?: boolean;
	};

	type ChatListItem = {
		id: string;
		title: string;
		updatedAt: string | null;
	};

	const MOBILE_SIDEBAR_MQ = "(max-width: 780px)";
	const CHAT_UUID_RE =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	let messages = $state<Message[]>([]);
	let draft = $state("");
	let selectedConnectorIds = $state<number[]>([]);
	let selectedModel = $state<string>(DEFAULT_CHAT_MODEL);
	/** Desktop: collapsible panel. Mobile: drawer open state. */
	let sidebarOpen = $state(true);
	let chatId = $state<string | undefined>();
	/** Last chat id successfully hydrated from `/api/chats/[id]` (not stream meta). */
	let resolvedChatId = $state<string | undefined>();
	let chatLoadError = $state<string | undefined>();
	let sending = $state(false);
	let activeRequest: AbortController | undefined;
	let chats = $state<ChatListItem[]>([]);
	let chatsLoading = $state(true);
	let chatsError = $state(false);
	let openingChatId = $state<string | undefined>();
	let chatLoadRequest: AbortController | undefined;
	let closingChatId = $state<string | undefined>();
	let menuChatId = $state<string | undefined>();
	let prefsReady = $state(false);
	/** User md cell id from stream meta — filter echoes by id, not `generated`. */
	let streamUserCellId = $state<string | undefined>();
	let conversationEl = $state<HTMLElement | undefined>();
	/** Stick to bottom while the user hasn't scrolled up during a stream. */
	let stickToBottom = $state(true);

	function isChatUuid(value: string) {
		return CHAT_UUID_RE.test(value);
	}

	const isPlaybooksRoute = $derived(
		page.url.pathname === "/playbooks" ||
			page.url.pathname.startsWith("/playbooks/"),
	);
	const isOntologyRoute = $derived(
		page.url.pathname === "/ontology" ||
			page.url.pathname.startsWith("/ontology/"),
	);
	const isThreadsRoute = $derived(
		page.url.pathname === "/threads" ||
			page.url.pathname.startsWith("/threads/"),
	);
	const isAgentsRoute = $derived(
		page.url.pathname === "/agents" ||
			page.url.pathname.startsWith("/agents/"),
	);
	const isAppsRoute = $derived(
		page.url.pathname === "/apps" || page.url.pathname.startsWith("/apps/"),
	);
	/** True on any full-panel section route (threads/playbooks/ontology/agents/apps) — i.e. not chat. */
	const inSection = $derived(
		isPlaybooksRoute ||
			isOntologyRoute ||
			isThreadsRoute ||
			isAgentsRoute ||
			isAppsRoute,
	);
	const routeChatId = $derived(
		inSection
			? undefined
			: typeof page.params.id === "string"
				? page.params.id
				: undefined,
	);
	const isEmpty = $derived(messages.length === 0);
	const configLocked = $derived(chatId !== undefined || !isEmpty);
	/** Deep link / sidebar open: fetch before showing the new-chat composer. */
	const showChatLoading = $derived.by(() => {
		if (inSection) return false;
		const id = routeChatId;
		if (!id) return false;
		if (sending && id === chatId && messages.length > 0) return false;
		if (chatLoadError && resolvedChatId !== id) return false;
		if (resolvedChatId === id) return false;
		return true;
	});
	const showChatError = $derived(
		Boolean(
			!inSection &&
				routeChatId &&
				chatLoadError &&
				resolvedChatId !== routeChatId &&
				!showChatLoading,
		),
	);
	const showNewChat = $derived(
		!inSection &&
			!routeChatId &&
			isEmpty &&
			!showChatLoading &&
			!showChatError,
	);
	// Collecting preview assets walks every cell in the chat, so debounce it
	// off the per-snapshot stream path; cells arrays are reassigned on every
	// upsert, so reading them here is enough to re-arm the timer.
	let chatAssets = $state<PreviewItem[]>([]);
	const hasAssets = $derived(chatAssets.length > 0);
	$effect(() => {
		const allCells = messages.flatMap((message) => message.cells ?? []);
		const handle = setTimeout(() => {
			chatAssets = collectPreviewItems(allCells);
			if (previewPanel.tabs.length > 0) {
				previewPanel.syncFromCells(chatAssets);
			}
		}, 120);
		return () => clearTimeout(handle);
	});

	function openAssetsPanel() {
		previewPanel.openPanel(chatAssets);
	}

	function resetChatConfig() {
		const prefs = loadLastChatConfig();
		selectedModel = prefs?.model ?? DEFAULT_CHAT_MODEL;
		selectedConnectorIds = prefs?.connectorIds ?? [];
		if (selectedConnectorIds.length > 0) {
			void connectorsCache.load();
		}
	}

	/** Back to the blank new-chat state (aborts any in-flight stream). */
	function resetChatState() {
		activeRequest?.abort();
		sending = false;
		activeRequest = undefined;
		messages = [];
		draft = "";
		chatId = undefined;
		resolvedChatId = undefined;
		chatLoadError = undefined;
		streamUserCellId = undefined;
		resetChatConfig();
		previewPanel.reset();
	}

	function persistChatConfig(model: string, connectorIds: number[]) {
		saveLastChatConfig({ model, connectorIds });
	}

	async function loadChats() {
		chatsLoading = true;
		chatsError = false;

		try {
			const response = await fetch("/api/chats");
			const payload: unknown = await response.json();

			if (
				!response.ok ||
				!isRecord(payload) ||
				!Array.isArray(payload.chats)
			) {
				throw new Error("Unable to load chats.");
			}

			chats = payload.chats.filter(
				(item): item is ChatListItem =>
					isRecord(item) &&
					typeof item.id === "string" &&
					typeof item.title === "string" &&
					(typeof item.updatedAt === "string" ||
						item.updatedAt === null),
			);
		} catch {
			chatsError = true;
		} finally {
			chatsLoading = false;
		}
	}

	async function syncFromRoute() {
		if (
			page.url.pathname === "/playbooks" ||
			page.url.pathname.startsWith("/playbooks/") ||
			page.url.pathname === "/ontology" ||
			page.url.pathname.startsWith("/ontology/") ||
			page.url.pathname === "/threads" ||
			page.url.pathname.startsWith("/threads/") ||
			page.url.pathname === "/agents" ||
			page.url.pathname.startsWith("/agents/") ||
			page.url.pathname === "/apps" ||
			page.url.pathname.startsWith("/apps/")
		) {
			return;
		}

		const id = page.params.id;
		if (id) {
			await loadChatById(id);
			return;
		}
		chatLoadRequest?.abort();
		chatLoadRequest = undefined;
		openingChatId = undefined;

		if (!sending && (chatId !== undefined || messages.length > 0)) {
			resetChatState();
		}
	}

	function isMobileSidebar() {
		return window.matchMedia(MOBILE_SIDEBAR_MQ).matches;
	}

	function closeSidebarIfMobile() {
		if (isMobileSidebar()) sidebarOpen = false;
	}

	onMount(() => {
		if (isMobileSidebar()) sidebarOpen = false;
		if (!page.params.id) {
			resetChatConfig();
		}
		prefsReady = true;
		void loadChats();
	});

	// Initial load + client navigations. `showChatLoading` covers the route id
	// immediately so deep links never flash the empty composer.
	afterNavigate(() => {
		void syncFromRoute();
	});

	// Persist last-used defaults while configuring a new chat (not locked).
	$effect(() => {
		if (!prefsReady || configLocked || page.params.id) return;
		persistChatConfig(selectedModel, [...selectedConnectorIds]);
	});

	// API routes return { error }; SvelteKit's thrown error() returns { message }.
	function apiErrorDetail(payload: unknown, fallback: string): string {
		if (!isRecord(payload)) return fallback;
		if (typeof payload.error === "string") return payload.error;
		if (typeof payload.message === "string") return payload.message;
		return fallback;
	}

	function dateKey(value: string | null) {
		if (!value) return "unknown";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "unknown";
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	}

	function shortDate(value: string | null) {
		if (!value) return "Older";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "Older";

		const today = new Date();
		const startOfToday = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
		);
		const startOfDay = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
		);
		const dayDiff = Math.round(
			(startOfToday.getTime() - startOfDay.getTime()) / 86_400_000,
		);

		if (dayDiff === 0) return "Today";
		if (dayDiff === 1) return "Yesterday";
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	}

	const chatGroups = $derived.by(() => {
		const groups: { key: string; label: string; chats: ChatListItem[] }[] =
			[];

		for (const chat of chats) {
			const key = dateKey(chat.updatedAt);
			const existing = groups.find((group) => group.key === key);
			if (existing) {
				existing.chats.push(chat);
			} else {
				groups.push({
					key,
					label: shortDate(chat.updatedAt),
					chats: [chat],
				});
			}
		}

		return groups;
	});

	async function setChatRoute(id: string | undefined, replace = false) {
		if (id) {
			if (page.params.id === id) return;
			await goto(resolve("/(chat)/chat/[id]", { id }), {
				replaceState: replace,
				noScroll: true,
				keepFocus: true,
			});
			return;
		}

		if (page.url.pathname === "/") return;
		await goto(resolve("/(chat)"), {
			replaceState: replace,
			noScroll: true,
			keepFocus: true,
		});
	}

	// The user's own message cell may be echoed in the stream; it's already
	// rendered optimistically, so keep it out of the assistant's cell list.
	function isEchoedUserCell(cell: CellLike): boolean {
		if (streamUserCellId && cell.id === streamUserCellId) return true;
		const cellCase = getCellCase(cell);
		return (
			(cellCase === "mdCell" || cellCase === "ansCell") &&
			cell.generated !== true
		);
	}

	function upsertAssistantCell(assistant: Message, cell: CellLike) {
		// Reassign the array so child `$derived`s / props always see a new
		// reference on every stream snapshot (push/index mutate can miss UI).
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
		let assistant = messages.find((message) => message.id === assistantId);
		if (!assistant) {
			assistant = {
				id: assistantId,
				role: "assistant",
				body: "",
				streaming: true,
			};
			messages.push(assistant);
			sending = true;
			stickToBottom = true;
		}
		return assistant;
	}

	function applyStreamLine(line: string, assistantId: number) {
		const parsed = parseStreamLine(line);
		if (!parsed) return;

		if (parsed.type === "meta") {
			chatId = parsed.chatId;
			if (parsed.userCellId) streamUserCellId = parsed.userCellId;
			void setChatRoute(parsed.chatId, true);
			return;
		}
		if (parsed.type === "idle") return;

		// Run state comes from the gRPC WatchChatEvent payload itself.
		const { payload } = parsed.event;
		switch (payload.case) {
			case "runStarted": {
				mountAssistant(assistantId);
				return;
			}
			case "cell": {
				const assistant = mountAssistant(assistantId);
				const cell = toCellLike(payload.value);
				if (isEchoedUserCell(cell)) return;
				upsertAssistantCell(assistant, cell);
				return;
			}
			case "runComplete": {
				const assistant = messages.find(
					(message) => message.id === assistantId,
				);
				if (assistant) {
					assistant.streaming = false;
					settleCells(assistant.cells);
				}
				return;
			}
			case "runError": {
				const assistant = mountAssistant(assistantId);
				assistant.body = payload.value.error || "The chat run failed.";
				assistant.streaming = false;
				settleCells(assistant.cells);
				return;
			}
			case "opened":
			case "heartbeat":
			case "handoffPending":
			case undefined:
				return;
		}
	}

	function onConversationScroll() {
		const el = conversationEl;
		if (!el) return;
		const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
		stickToBottom = distance < 80;
	}

	async function scrollConversationToBottom() {
		if (!stickToBottom || !conversationEl) return;
		await tick();
		conversationEl.scrollTop = conversationEl.scrollHeight;
	}

	async function pumpNdjson(
		body: ReadableStream<Uint8Array>,
		request: AbortController,
		assistantId: number,
	) {
		const reader = body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		while (true) {
			const { done, value } = await reader.read();
			if (activeRequest !== request) return;
			if (value) buffer += decoder.decode(value, { stream: true });
			if (done) buffer += decoder.decode();

			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";
			for (const line of lines) applyStreamLine(line, assistantId);
			if (done && buffer) {
				applyStreamLine(buffer, assistantId);
				buffer = "";
			}
			await scrollConversationToBottom();

			if (done) break;
		}
	}

	function lastCellId(): string | undefined {
		for (let i = messages.length - 1; i >= 0; i--) {
			const cells = messages[i].cells;
			if (!cells?.length) continue;
			const id = cells[cells.length - 1]?.id;
			if (typeof id === "string" && id) return id;
		}
		return undefined;
	}

	async function resumeLiveRun(id: string) {
		const cursor = lastCellId();
		const request = new AbortController();
		activeRequest = request;
		const assistantId = Date.now();

		try {
			const query = cursor
				? `?latestCompleteCellId=${encodeURIComponent(cursor)}`
				: "";
			const response = await fetch(
				`/api/chats/${encodeURIComponent(id)}/watch${query}`,
				{ signal: request.signal },
			);
			if (!response.ok || !response.body) return;
			await pumpNdjson(response.body, request, assistantId);
		} catch {
			// Resume is best-effort; the chat renders fine without it.
		} finally {
			const assistant = messages.find(
				(message) => message.id === assistantId,
			);
			if (assistant?.streaming) {
				assistant.streaming = false;
				settleCells(assistant.cells);
			}
			if (activeRequest === request) {
				activeRequest = undefined;
				sending = false;
			}
		}
	}

	function handleQuestionsAnswered() {
		const id =
			chatId ??
			(typeof page.params.id === "string" ? page.params.id : undefined);
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
		messages.push(
			{ id: userId, role: "you", body },
			{ id: assistantId, role: "assistant", body: "", streaming: true },
		);
		draft = "";
		sending = true;
		stickToBottom = true;
		streamUserCellId = undefined;
		const request = new AbortController();
		activeRequest = request;
		void scrollConversationToBottom();

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: body,
					chatId: existingChatId,
					model,
					connectorIds,
				}),
				signal: request.signal,
			});

			if (!response.ok || !response.body) {
				const payload: unknown = await response
					.json()
					.catch(() => null);
				throw new Error(apiErrorDetail(payload, "Request failed."));
			}

			await pumpNdjson(response.body, request, assistantId);

			// New chat: remember the config that was actually used.
			if (!existingChatId) {
				persistChatConfig(model, connectorIds);
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError")
				return;
			const assistant = messages.find(
				(message) => message.id === assistantId,
			);
			const detail =
				error instanceof Error ? error.message : "Request failed.";
			if (assistant) assistant.body = detail;
			toast.error("Message failed to send", { description: detail });
		} finally {
			const assistant = messages.find(
				(message) => message.id === assistantId,
			);
			if (assistant) assistant.streaming = false;
			sending = false;
			streamUserCellId = undefined;
			if (activeRequest === request) activeRequest = undefined;
			void loadChats();
		}
	}

	async function loadChatById(id: string) {
		if (openingChatId === id) return;

		if (!isChatUuid(id)) {
			chatLoadError = "Invalid chat id.";
			resolvedChatId = undefined;
			return;
		}

		// Never clobber an in-flight stream with a history fetch (e.g. after
		// meta navigates `/` → `/chat/[id]` mid-response).
		if (sending && id === chatId) {
			resolvedChatId = id;
			chatLoadError = undefined;
			closeSidebarIfMobile();
			return;
		}
		if (id === resolvedChatId && id === chatId) {
			closeSidebarIfMobile();
			return;
		}

		// An explicit navigation abandons work for the prior route.
		if (sending) {
			activeRequest?.abort();
			sending = false;
			activeRequest = undefined;
		}
		chatLoadRequest?.abort();
		const request = new AbortController();
		chatLoadRequest = request;

		openingChatId = id;
		chatLoadError = undefined;

		try {
			const response = await fetch(
				`/api/chats/${encodeURIComponent(id)}`,
				{ signal: request.signal },
			);
			const payload: unknown = await response.json();
			if (request !== chatLoadRequest || page.params.id !== id) return;

			if (
				!response.ok ||
				!isRecord(payload) ||
				!Array.isArray(payload.messages)
			) {
				throw new Error(
					apiErrorDetail(payload, "Unable to load chat."),
				);
			}

			chatId = id;
			resolvedChatId = id;
			chatLoadError = undefined;
			previewPanel.reset();
			messages = payload.messages.flatMap((item, index): Message[] => {
				if (
					!isRecord(item) ||
					(item.role !== "you" && item.role !== "assistant")
				) {
					return [];
				}
				const body = typeof item.body === "string" ? item.body : "";
				const cells = Array.isArray(item.cells)
					? (item.cells.filter(isRecord) as CellLike[])
					: undefined;
				if (!body && (!cells || cells.length === 0)) return [];
				// History is never a live run; stale executing lifecycles from an
				// interrupted run must not tick a "Running" timer forever.
				settleCells(cells);
				return [{ id: index, role: item.role, body, cells }];
			});

			if (typeof payload.model === "string" && payload.model) {
				selectedModel = payload.model;
			} else {
				selectedModel = DEFAULT_CHAT_MODEL;
			}

			selectedConnectorIds = Array.isArray(payload.connectorIds)
				? payload.connectorIds.filter(
						(value): value is number =>
							typeof value === "number" &&
							Number.isInteger(value),
					)
				: [];

			if (selectedConnectorIds.length > 0) {
				void connectorsCache.load();
			}

			closeSidebarIfMobile();

			// A run may still be executing on this chat (e.g. the page was
			// refreshed mid-stream) — re-attach so progress keeps rendering.
			void resumeLiveRun(id);
		} catch (error) {
			if (request.signal.aborted || request !== chatLoadRequest) return;
			chatLoadError =
				error instanceof Error ? error.message : "Unable to load chat.";
			resolvedChatId = undefined;
		} finally {
			if (request === chatLoadRequest) {
				chatLoadRequest = undefined;
				openingChatId = undefined;
			}
		}
	}

	function openChat(id: string) {
		if (sending || openingChatId || closingChatId) return;
		closeSidebarIfMobile();
		void setChatRoute(id);
	}

	function newThread() {
		chatLoadRequest?.abort();
		chatLoadRequest = undefined;
		openingChatId = undefined;
		resetChatState();
		closeSidebarIfMobile();
		void setChatRoute(undefined);
	}

	function retryLoadChat() {
		const id = routeChatId;
		if (!id) return;
		chatLoadError = undefined;
		resolvedChatId = undefined;
		void loadChatById(id);
	}

	function toggleChatMenu(id: string, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (closingChatId || openingChatId || sending) return;
		menuChatId = menuChatId === id ? undefined : id;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && menuChatId !== undefined) {
			menuChatId = undefined;
		}
		if (
			(event.metaKey || event.ctrlKey) &&
			event.key.toLowerCase() === "s"
		) {
			event.preventDefault();
			sidebarOpen = !sidebarOpen;
		}
	}

	function onWindowPointerDown(event: PointerEvent) {
		if (menuChatId === undefined) return;
		const target = event.target;
		if (!(target instanceof Element) || !target.closest(".chat-menu")) {
			menuChatId = undefined;
		}
	}

	async function deleteChat(id: string, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		menuChatId = undefined;
		if (closingChatId || openingChatId || sending) return;

		const confirmed = await confirm({
			tone: "danger",
			title: "Delete chat?",
			description:
				"This permanently deletes the chat and all of its messages. This cannot be undone.",
			confirmLabel: "Delete",
		});
		if (!confirmed) return;

		closingChatId = id;
		const previous = chats;
		chats = chats.filter((chat) => chat.id !== id);

		try {
			const response = await fetch(
				`/api/chats/${encodeURIComponent(id)}`,
				{ method: "DELETE" },
			);
			if (!response.ok) {
				throw new Error("Unable to delete chat.");
			}

			if (chatId === id) {
				newThread();
			}
			toast.success("Chat deleted");
		} catch {
			chats = previous;
			toast.error("Couldn't delete chat", {
				description: "Something went wrong. Please try again.",
			});
		} finally {
			closingChatId = undefined;
		}
	}
</script>

<svelte:window
	onkeydown={onWindowKeydown}
	onpointerdown={onWindowPointerDown}
/>

<svelte:head>
	<title>Chat</title>
	<meta
		name="description"
		content="A soft chat interface inspired by Cursor Agents."
	/>
</svelte:head>

<div
	class:preview-open={previewPanel.open}
	class:sidebar-collapsed={!sidebarOpen}
	class="app-shell"
>
	<button
		class:visible={sidebarOpen}
		class="scrim"
		aria-label="Close conversation menu"
		onclick={() => (sidebarOpen = false)}
	></button>

	<aside
		class:open={sidebarOpen}
		class="sidebar"
		aria-label="Conversation history"
		aria-hidden={!sidebarOpen}
		inert={!sidebarOpen ? true : undefined}
	>
		<div class="sidebar-top">
			<div class="sidebar-header">
				<button type="button" class="new-chat-btn" onclick={newThread}>
					<Plus size={15} strokeWidth={2} />
					<span>New chat</span>
				</button>
				<Tooltip label="Close sidebar" shortcut="⌘S" side="bottom">
					<button
						type="button"
						class="icon-ghost sidebar-close"
						aria-label="Close sidebar"
						onclick={() => (sidebarOpen = false)}
					>
						<PanelLeftClose size={16} strokeWidth={1.75} />
					</button>
				</Tooltip>
			</div>
		</div>

		<div class="chats-section">
			<div class="chat-list" aria-live="polite" aria-busy={chatsLoading}>
				<a
					class="sidebar-nav-entry"
					class:active={isThreadsRoute}
					href={resolve("/(chat)/threads")}
					aria-current={isThreadsRoute ? "page" : undefined}
				>
					<FThreadsIcon class="sidebar-nav-icon" />
					<span>Threads</span>
				</a>
				<a
					class="sidebar-nav-entry"
					class:active={isPlaybooksRoute}
					href={resolve("/(chat)/playbooks")}
					aria-current={isPlaybooksRoute ? "page" : undefined}
				>
					<FPlaybooksIcon class="sidebar-nav-icon" />
					<span>Playbooks</span>
				</a>
				<a
					class="sidebar-nav-entry"
					class:active={isAgentsRoute}
					href={resolve("/(chat)/agents")}
					aria-current={isAgentsRoute ? "page" : undefined}
				>
					<FAgentIcon class="sidebar-nav-icon" />
					<span>Agents</span>
				</a>
				<a
					class="sidebar-nav-entry"
					class:active={isAppsRoute}
					href={resolve("/(chat)/apps")}
					aria-current={isAppsRoute ? "page" : undefined}
				>
					<FAppsIcon class="sidebar-nav-icon" />
					<span>Data apps</span>
				</a>
				<a
					class="sidebar-nav-entry"
					class:active={isOntologyRoute}
					href={resolve("/(chat)/ontology")}
					aria-current={isOntologyRoute ? "page" : undefined}
				>
					<FOntologyIcon class="sidebar-nav-icon" />
					<span>Ontology</span>
				</a>
				{#if chatsLoading}
					<div class="list-loading">
						<UnicodeSpinner label="Loading chats" />
					</div>
				{:else if chatsError}
					<button type="button" class="retry-btn" onclick={loadChats}
						>Retry</button
					>
				{:else if chats.length === 0}
					<p class="list-empty">No chats yet</p>
				{:else}
					{#each chatGroups as group (group.key)}
						<div class="chat-group">
							<p class="chat-group-label">{group.label}</p>
							{#each group.chats as chat (chat.id)}
								<div
									class="chat-row"
									class:active={!inSection &&
										chat.id === chatId}
									class:opening={chat.id === openingChatId}
									class:closing={chat.id === closingChatId}
								>
									<button
										type="button"
										class="chat-row-main"
										title={chat.title}
										disabled={sending ||
											openingChatId !== undefined ||
											closingChatId !== undefined}
										onclick={() => openChat(chat.id)}
									>
										<span class="chat-title"
											>{chat.title}</span
										>
										{#if chat.id === openingChatId}
											<UnicodeSpinner
												class="chat-opening-spinner"
												label="Opening chat"
											/>
										{/if}
									</button>
									<div
										class="chat-menu"
										class:open={menuChatId === chat.id}
									>
										<button
											type="button"
											class="chat-menu-btn"
											aria-label="Chat options"
											aria-haspopup="menu"
											aria-expanded={menuChatId ===
												chat.id}
											title="Chat options"
											disabled={closingChatId !==
												undefined || sending}
											onclick={(event) =>
												toggleChatMenu(chat.id, event)}
										>
											{#if chat.id === closingChatId}
												<UnicodeSpinner
													class="chat-closing-spinner"
													label="Deleting chat"
												/>
											{:else}
												<Ellipsis
													size={13}
													strokeWidth={2}
												/>
											{/if}
										</button>
										{#if menuChatId === chat.id}
											<div
												class="chat-menu-popover"
												role="menu"
											>
												<button
													type="button"
													class="chat-menu-item"
													role="menuitem"
													onclick={(event) =>
														deleteChat(
															chat.id,
															event,
														)}
												>
													Delete
												</button>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/each}
				{/if}
			</div>
		</div>
		<div class="sidebar-foot">
			<button
				type="button"
				class="theme-toggle"
				onclick={() => themePref.toggle()}
				aria-label={themePref.resolved === "dark"
					? "Switch to light mode"
					: "Switch to dark mode"}
			>
				{#if themePref.resolved === "dark"}
					<Sun size={15} strokeWidth={1.75} />
					<span>Light mode</span>
				{:else}
					<Moon size={15} strokeWidth={1.75} />
					<span>Dark mode</span>
				{/if}
			</button>
		</div>
	</aside>

	{#if !sidebarOpen}
		<aside class="sidebar-rail" aria-label="Collapsed navigation">
			<Tooltip label="Open sidebar" shortcut="⌘S" side="right">
				<button
					type="button"
					class="rail-btn"
					aria-label="Open sidebar"
					onclick={() => (sidebarOpen = true)}
				>
					<PanelLeft size={16} strokeWidth={1.75} />
				</button>
			</Tooltip>
			<Tooltip label="New chat" side="right">
				<button
					type="button"
					class="rail-btn"
					aria-label="New chat"
					onclick={newThread}
				>
					<Plus size={16} strokeWidth={2} />
				</button>
			</Tooltip>

			<div class="rail-divider" role="presentation"></div>

			<Tooltip label="Threads" side="right">
				<a
					class="rail-btn"
					class:active={isThreadsRoute}
					href={resolve("/(chat)/threads")}
					aria-label="Threads"
					aria-current={isThreadsRoute ? "page" : undefined}
				>
					<FThreadsIcon class="rail-icon" />
				</a>
			</Tooltip>
			<Tooltip label="Playbooks" side="right">
				<a
					class="rail-btn"
					class:active={isPlaybooksRoute}
					href={resolve("/(chat)/playbooks")}
					aria-label="Playbooks"
					aria-current={isPlaybooksRoute ? "page" : undefined}
				>
					<FPlaybooksIcon class="rail-icon" />
				</a>
			</Tooltip>
			<Tooltip label="Agents" side="right">
				<a
					class="rail-btn"
					class:active={isAgentsRoute}
					href={resolve("/(chat)/agents")}
					aria-label="Agents"
					aria-current={isAgentsRoute ? "page" : undefined}
				>
					<FAgentIcon class="rail-icon" />
				</a>
			</Tooltip>
			<Tooltip label="Data apps" side="right">
				<a
					class="rail-btn"
					class:active={isAppsRoute}
					href={resolve("/(chat)/apps")}
					aria-label="Data apps"
					aria-current={isAppsRoute ? "page" : undefined}
				>
					<FAppsIcon class="rail-icon" />
				</a>
			</Tooltip>
			<Tooltip label="Ontology" side="right">
				<a
					class="rail-btn"
					class:active={isOntologyRoute}
					href={resolve("/(chat)/ontology")}
					aria-label="Ontology"
					aria-current={isOntologyRoute ? "page" : undefined}
				>
					<FOntologyIcon class="rail-icon" />
				</a>
			</Tooltip>
		</aside>
	{/if}

	<div
		class="workspace"
		class:with-preview={previewPanel.open}
		class:is-resizing={previewPanel.resizing}
		style:--preview-panel-width="{previewPanel.width}px"
	>
		<main
			class="chat-panel"
			class:empty={!inSection &&
				(showNewChat || showChatLoading || showChatError)}
			class:has-overlays={!sidebarOpen}
			class:playbooks={inSection}
		>
			{#if !sidebarOpen}
				<div class="panel-overlays panel-overlays-start">
					<Tooltip label="Open sidebar" shortcut="⌘S" side="right">
						<button
							type="button"
							class="icon-ghost"
							aria-label="Open sidebar"
							onclick={() => (sidebarOpen = true)}
						>
							<PanelLeft size={16} strokeWidth={1.75} />
						</button>
					</Tooltip>
					{#if !inSection}
						<button
							type="button"
							class="new-chat-btn panel-new"
							onclick={newThread}
						>
							<Plus size={15} strokeWidth={2} />
							<span>New chat</span>
						</button>
					{/if}
				</div>
			{/if}

			<div class="panel-overlays panel-overlays-end">
				{#if !inSection && hasAssets && !previewPanel.open}
					<button
						type="button"
						class="icon-ghost assets-toggle"
						aria-label="Open preview panel"
						title={`Preview (${chatAssets.length})`}
						onclick={openAssetsPanel}
					>
						<PanelRight size={16} strokeWidth={1.75} />
					</button>
				{/if}
			</div>

			{#if isThreadsRoute}
				<ThreadsPage />
			{:else if isPlaybooksRoute}
				<PlaybooksPage />
			{:else if isOntologyRoute}
				<OntologyPage />
			{:else if isAgentsRoute}
				{#if page.params.id}
					<AgentDetailPage />
				{:else}
					<AgentsPage />
				{/if}
			{:else if isAppsRoute}
				{#if page.params.id}
					<AppDetailPage />
				{:else}
					<AppsPage />
				{/if}
			{:else if showChatLoading}
				<section
					class="chat-status"
					aria-label="Loading chat"
					aria-busy="true"
				>
					<UnicodeSpinner label="Loading chat" />
					<p class="chat-status-text">Loading chat…</p>
				</section>
			{:else if showChatError}
				<section class="chat-status" aria-label="Chat load error">
					<p class="chat-status-text">{chatLoadError}</p>
					<div class="chat-status-actions">
						<button
							type="button"
							class="retry-btn"
							onclick={retryLoadChat}>Retry</button
						>
						<button
							type="button"
							class="retry-btn"
							onclick={newThread}>New chat</button
						>
					</div>
				</section>
			{:else if showNewChat}
				<section class="empty-state" aria-label="New agent">
					<Composer
						bind:value={draft}
						bind:selectedConnectorIds
						bind:selectedModel
						{sending}
						{configLocked}
						onsend={sendMessage}
					/>
				</section>
			{:else}
				<section
					bind:this={conversationEl}
					class="conversation"
					aria-label="Chat messages"
					aria-live="polite"
					onscroll={onConversationScroll}
				>
					<div class="conversation-inner">
						<div class="messages">
							{#each messages as message (message.id)}
								<article
									class="message"
									class:you={message.role === "you"}
									class:assistant={message.role ===
										"assistant"}
								>
									{#if message.role === "assistant"}
										<span class="message-role"
											>Assistant</span
										>
										{#if message.cells && message.cells.length > 0}
											<ToolSequence
												cells={message.cells}
												streaming={message.streaming ??
													false}
												onAnswered={handleQuestionsAnswered}
											/>
										{:else if message.body}
											<p class="message-body">
												{message.body}
											</p>
										{:else if message.streaming}
											<UnicodeSpinner
												class="streaming-indicator"
												label="Waiting for response"
											/>
										{/if}
									{:else if message.body}
										<p class="message-body">
											{message.body}
										</p>
									{/if}
								</article>
							{/each}
						</div>
					</div>
				</section>

				<footer class="composer-dock">
					<Composer
						bind:value={draft}
						bind:selectedConnectorIds
						bind:selectedModel
						{sending}
						{configLocked}
						docked
						onsend={sendMessage}
					/>
				</footer>
			{/if}
		</main>

		{#if !inSection && previewPanel.open}
			<PreviewPanel />
		{/if}
	</div>
</div>

<style>
	:global(body) {
		overflow: hidden;
	}

	:global(button:focus-visible),
	:global(input:focus-visible),
	:global(textarea:focus-visible) {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.app-shell {
		display: grid;
		grid-template-columns: 260px minmax(0, 1fr);
		height: 100vh;
		height: 100dvh;
		color: var(--color-ink);
		background: var(--color-paper);
		font-family: var(--font-sans);
		transition: grid-template-columns 180ms ease;
	}

	.app-shell.sidebar-collapsed {
		grid-template-columns: 52px minmax(0, 1fr);
	}

	.workspace {
		display: flex;
		grid-column: 2;
		grid-row: 1;
		min-width: 0;
		min-height: 0;
		height: 100%;
	}

	.workspace .chat-panel {
		flex: 1 1 auto;
		min-width: 0;
	}

	.workspace.is-resizing {
		cursor: col-resize;
	}

	.workspace.is-resizing .chat-panel {
		pointer-events: none;
		contain: layout style;
	}

	.workspace :global(.preview-panel) {
		flex: 0 0 auto;
		width: var(--preview-panel-width, 420px);
		min-width: 0;
		min-height: 0;
		height: 100%;
	}

	.sidebar {
		display: flex;
		grid-column: 1;
		grid-row: 1;
		min-width: 0;
		min-height: 0;
		flex-direction: column;
		overflow: hidden;
		padding: 14px 12px 12px;
		border-right: 1px solid
			color-mix(in srgb, var(--color-line) 80%, transparent);
		background: var(--color-sidebar);
		transition:
			opacity 160ms ease,
			border-color 160ms ease;
	}

	.app-shell.sidebar-collapsed .sidebar {
		display: none;
	}

	/* Collapsed icon rail — only mounted when the full sidebar is closed. */
	.sidebar-rail {
		display: flex;
		grid-column: 1;
		grid-row: 1;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		min-width: 0;
		min-height: 0;
		padding: 14px 8px 12px;
		overflow: hidden;
		border-right: 1px solid
			color-mix(in srgb, var(--color-line) 80%, transparent);
		background: var(--color-sidebar);
	}

	.rail-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 34px;
		height: 34px;
		border: 0;
		border-radius: var(--radius-sm);
		color: var(--color-text-3);
		background: transparent;
		font: inherit;
		text-decoration: none;
		cursor: pointer;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	.rail-btn:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 55%, transparent);
	}

	.rail-btn.active {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 78%, transparent);
		box-shadow: inset 0 0 0 1px
			color-mix(in srgb, var(--color-line) 70%, transparent);
	}

	.rail-btn :global(.rail-icon) {
		font-size: 15px;
		color: #71717a;
	}

	.rail-btn.active :global(.rail-icon) {
		color: var(--color-ink);
	}

	.rail-divider {
		width: 22px;
		height: 1px;
		margin: 4px 0;
		background: color-mix(in srgb, var(--color-line) 70%, transparent);
	}

	.sidebar-top {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.sidebar-close {
		display: inline-flex;
		width: 30px;
		height: 30px;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		padding: 7px;
		border-radius: var(--radius-sm);
		color: var(--color-text-3);
		transition: background 120ms ease;
	}

	.sidebar-close:hover {
		background: color-mix(in srgb, var(--color-elevate) 82%, transparent);
	}

	.new-chat-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-width: 0;
		flex: 1;
		padding: 7px 10px;
		border: 0;
		border-radius: var(--radius-sm);
		color: var(--color-text-2);
		background: color-mix(in srgb, var(--color-elevate) 62%, transparent);
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 120ms ease;
	}

	.new-chat-btn:hover {
		background: color-mix(in srgb, var(--color-elevate) 82%, transparent);
	}

	.new-chat-btn :global(svg) {
		flex-shrink: 0;
	}

	.chat-row-main,
	.chat-menu-btn,
	.chat-menu-item,
	.retry-btn,
	.icon-ghost {
		border: 0;
		background: transparent;
		font: inherit;
		cursor: pointer;
	}

	.icon-ghost :global(svg) {
		width: 100%;
		height: 100%;
	}

	.chats-section {
		display: flex;
		min-height: 0;
		flex: 1;
		flex-direction: column;
		margin-top: 14px;
	}

	.sidebar-foot {
		flex-shrink: 0;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
	}

	.theme-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 7px 9px;
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-3);
		font: inherit;
		font-size: 13px;
		cursor: pointer;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	.theme-toggle:hover {
		background: color-mix(in srgb, var(--color-ink) 5%, transparent);
		color: var(--color-ink);
	}

	.chat-list {
		min-height: 0;
		overflow-y: auto;
		padding-right: 2px;
	}

	.sidebar-nav-entry {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		margin-bottom: 2px;
		padding: 7px 10px;
		border-radius: var(--radius-sm);
		color: var(--color-text-3);
		font-size: 12.5px;
		font-weight: 500;
		text-decoration: none;
		transition: background 120ms ease;
	}

	.sidebar-nav-entry:hover {
		background: color-mix(in srgb, var(--color-elevate) 55%, transparent);
	}

	.sidebar-nav-entry.active {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 78%, transparent);
		box-shadow: inset 0 0 0 1px
			color-mix(in srgb, var(--color-line) 70%, transparent);
	}

	.chat-panel.playbooks {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.chat-panel.playbooks :global(.page) {
		flex: 1;
		min-height: 0;
		height: 100%;
	}

	.sidebar-nav-entry :global(.sidebar-nav-icon) {
		flex-shrink: 0;
		font-size: 14px;
		color: #71717a;
	}

	.chat-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-bottom: 14px;
	}

	.chat-group:last-child {
		margin-bottom: 0;
	}

	.chat-group-label {
		margin: 0;
		padding: 4px 10px 6px;
		color: var(--color-muted);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	.chat-row {
		display: flex;
		align-items: center;
		gap: 2px;
		width: 100%;
		border-radius: var(--radius-sm);
		color: var(--color-text-3);
		transition: background 120ms ease;
	}

	.chat-row:hover {
		background: color-mix(in srgb, var(--color-elevate) 55%, transparent);
	}

	.chat-row.active {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 78%, transparent);
		box-shadow: inset 0 0 0 1px
			color-mix(in srgb, var(--color-line) 70%, transparent);
	}

	.chat-row.opening,
	.chat-row.closing {
		opacity: 0.65;
	}

	.chat-row-main {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		flex: 1;
		padding: 7px 4px 7px 10px;
		color: inherit;
		text-align: left;
		border-radius: var(--radius-sm);
	}

	.chat-row-main:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.chat-title {
		display: block;
		min-width: 0;
		flex: 1;
		overflow: hidden;
		font-size: 12.5px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chat-menu {
		position: relative;
		flex-shrink: 0;
		margin-right: 4px;
	}

	.chat-menu-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 6px;
		color: var(--color-muted);
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 120ms ease,
			background 120ms ease,
			color 120ms ease;
	}

	.chat-row:hover .chat-menu-btn,
	.chat-row.active .chat-menu-btn,
	.chat-menu-btn:focus-visible,
	.chat-row.closing .chat-menu-btn,
	.chat-menu.open .chat-menu-btn,
	.chat-menu:focus-within .chat-menu-btn {
		opacity: 1;
		pointer-events: auto;
	}

	.chat-menu-btn:hover:not(:disabled) {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
	}

	.chat-menu-btn:disabled {
		cursor: wait;
	}

	.chat-menu-popover {
		position: absolute;
		top: calc(100% + 2px);
		right: 0;
		z-index: 5;
		min-width: 96px;
		padding: 3px;
		border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-paper) 96%, var(--color-elevate));
		box-shadow: 0 4px 14px rgba(15, 15, 20, 0.06);
	}

	.chat-menu-item {
		display: block;
		width: 100%;
		padding: 6px 8px;
		border-radius: 5px;
		color: var(--color-text-3);
		font-size: 12px;
		text-align: left;
	}

	.chat-menu-item:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
	}

	.chat-row :global(.chat-opening-spinner),
	.chat-row :global(.chat-closing-spinner) {
		flex-shrink: 0;
		opacity: 0.85;
	}

	.list-loading {
		display: flex;
		align-items: center;
		margin: 14px 10px;
		min-height: 1em;
	}

	.list-empty {
		margin: 0;
		padding: 10px 10px 0;
		color: var(--color-muted);
		font-size: 12px;
		line-height: 1.4;
	}

	.retry-btn {
		margin: 8px;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		color: var(--color-accent);
		font-size: 12px;
	}

	.retry-btn:hover {
		background: color-mix(in srgb, var(--color-elevate) 60%, transparent);
	}

	.chat-panel {
		position: relative;
		display: grid;
		min-width: 0;
		min-height: 0;
		grid-template-rows: minmax(0, 1fr) auto;
		background: var(--color-paper);
	}

	.chat-panel.empty {
		grid-template-rows: minmax(0, 1fr);
	}

	.panel-overlays {
		position: absolute;
		top: 8px;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: 6px;
		pointer-events: none;
	}

	.panel-overlays > * {
		pointer-events: auto;
	}

	.panel-overlays-start {
		left: 12px;
	}

	.panel-overlays-end {
		right: 12px;
	}

	/* Desktop uses the collapsed icon rail, so the floating open/new buttons
	   are only needed on the mobile drawer layout. */
	@media (min-width: 781px) {
		.panel-overlays-start {
			display: none;
		}
	}

	.panel-overlays .icon-ghost {
		background: color-mix(in srgb, var(--color-paper) 88%, transparent);
		backdrop-filter: blur(10px);
	}

	.panel-new {
		flex: 0 1 auto;
		max-width: 140px;
		background: color-mix(in srgb, var(--color-paper) 88%, transparent);
		backdrop-filter: blur(10px);
	}

	.assets-toggle {
		margin: 0;
		background: color-mix(in srgb, var(--color-paper) 88%, transparent);
		backdrop-filter: blur(10px);
	}

	.chat-status {
		display: flex;
		min-height: 0;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 32px 24px;
	}

	.chat-status-text {
		margin: 0;
		color: var(--color-muted);
		font-size: 13px;
		text-align: center;
	}

	.chat-status-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		justify-content: center;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 0;
		padding: 32px 24px 40px;
	}

	.icon-ghost {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		color: #71717a;
	}

	.icon-ghost :global(svg) {
		width: 15px;
		height: 15px;
	}

	.icon-ghost:hover {
		background: var(--color-fill);
	}

	.conversation {
		min-height: 0;
		overflow-y: auto;
	}

	.conversation-inner {
		width: min(720px, calc(100% - 48px));
		margin: 0 auto;
		padding: 8px 0 20vh;
	}

	/* Only the mobile floating overlay overlaps the conversation; the desktop
	   rail sits in its own column, so no extra top padding is needed there. */
	@media (max-width: 780px) {
		.chat-panel.has-overlays .conversation-inner {
			padding-top: 44px;
		}
	}

	.messages {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 16px;
	}

	.message {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 100%;
		padding: 0;
		border: 0;
		background: transparent;
	}

	.message.you {
		width: 100%;
		max-width: 100%;
		padding: 10px 14px;
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: 20px;
		background: var(--color-fill);
		box-shadow: none;
	}

	.message.you .message-body {
		color: var(--color-ink);
		font-size: 14px;
		line-height: 1.45;
		letter-spacing: -0.01em;
	}

	.message.assistant {
		width: 100%;
		gap: 8px;
		padding: 2px 0;
	}

	.message-role {
		color: var(--color-accent);
		font-size: 12px;
		font-weight: 500;
	}

	.message-body {
		margin: 0;
		color: var(--color-text-strong);
		font-size: 14px;
		line-height: 1.65;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.message :global(.streaming-indicator) {
		display: inline-block;
		margin-top: 6px;
	}

	.composer-dock {
		display: flex;
		justify-content: center;
		padding: 8px 24px 28px;
		background: linear-gradient(
			180deg,
			transparent,
			var(--color-paper) 28%
		);
	}

	.composer-dock :global(.composer-shell) {
		margin-inline: auto;
	}

	.scrim {
		display: none;
	}

	@media (max-width: 960px) {
		.workspace.with-preview {
			flex-direction: column;
		}

		.workspace.with-preview :global(.preview-panel) {
			width: 100%;
			height: min(45vh, 420px);
			border-left: 0;
			border-top: 1px solid
				color-mix(in srgb, var(--color-line) 85%, transparent);
		}
	}

	@media (max-width: 780px) {
		.app-shell,
		.app-shell.sidebar-collapsed {
			display: block;
			grid-template-columns: unset;
		}

		/* Mobile keeps the slide-in drawer + floating open button, not the rail. */
		.sidebar-rail {
			display: none;
		}

		.workspace {
			height: 100vh;
			height: 100dvh;
		}

		.sidebar {
			position: fixed;
			inset: 0 auto 0 0;
			z-index: 30;
			display: flex;
			width: min(300px, 90vw);
			opacity: 1;
			pointer-events: auto;
			transform: translateX(-102%);
			transition: transform 180ms ease;
		}

		.app-shell.sidebar-collapsed .sidebar {
			display: flex;
			pointer-events: none;
		}

		.sidebar.open {
			pointer-events: auto;
			transform: translateX(0);
		}

		.scrim {
			position: fixed;
			inset: 0;
			z-index: 29;
			display: block;
			visibility: hidden;
			padding: 0;
			border: 0;
			background: rgba(15, 15, 20, 0.22);
			opacity: 0;
			transition:
				opacity 180ms ease,
				visibility 180ms ease;
		}

		.scrim.visible {
			visibility: visible;
			opacity: 1;
		}

		.chat-panel {
			height: 100vh;
			height: 100dvh;
		}
	}

	@media (max-width: 560px) {
		.conversation-inner {
			width: calc(100% - 28px);
		}

		.composer-dock {
			padding-inline: 14px;
		}

		.empty-state {
			padding-inline: 14px;
		}

		.message-body {
			font-size: 13px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.app-shell,
		.sidebar,
		.scrim {
			transition: none;
		}
	}
</style>

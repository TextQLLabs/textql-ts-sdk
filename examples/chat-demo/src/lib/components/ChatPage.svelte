<script lang="ts">
	import Ellipsis from "@lucide/svelte/icons/ellipsis";
	import PanelLeft from "@lucide/svelte/icons/panel-left";
	import PanelLeftClose from "@lucide/svelte/icons/panel-left-close";
	import PanelRight from "@lucide/svelte/icons/panel-right";
	import Plus from "@lucide/svelte/icons/plus";
	import { onMount } from "svelte";
	import { afterNavigate, goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import {
		loadLastChatConfig,
		saveLastChatConfig,
	} from "$lib/chatConfigPrefs";
	import {
		extractEnabledTools,
		type ChatTools,
	} from "$lib/chatTools";
	import { getCellCase, type CellLike } from "$lib/cells";
	import Composer from "$lib/components/Composer.svelte";
	import PreviewPanel from "$lib/components/PreviewPanel.svelte";
	import ToolSequence from "$lib/components/ToolSequence.svelte";
	import UnicodeSpinner from "$lib/components/UnicodeSpinner.svelte";
	import { connectorsCache } from "$lib/connectorsCache.svelte";
	import {
		collectPreviewItems,
		previewPanel,
	} from "$lib/previewPanel.svelte";

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

	const DEFAULT_MODEL = "MODEL_SONNET_5";
	const MOBILE_SIDEBAR_MQ = "(max-width: 780px)";

	let messages = $state<Message[]>([]);
	let draft = $state("");
	let selectedConnectorIds = $state<number[]>([]);
	let selectedModel = $state(DEFAULT_MODEL);
	/** Enabled tools from GetChat; null on blank chats (Composer infers from selection). */
	let chatTools = $state<ChatTools | null>(null);
	/** Desktop: collapsible panel. Mobile: drawer open state. */
	let sidebarOpen = $state(true);
	let chatId = $state<string | undefined>();
	let sending = $state(false);
	let activeRequest: AbortController | undefined;
	let chats = $state<ChatListItem[]>([]);
	let chatsLoading = $state(true);
	let chatsError = $state(false);
	let openingChatId = $state<string | undefined>();
	let closingChatId = $state<string | undefined>();
	let menuChatId = $state<string | undefined>();
	let prefsReady = $state(false);

	const isEmpty = $derived(messages.length === 0);
	const configLocked = $derived(chatId !== undefined || !isEmpty);
	const chatAssets = $derived.by(() => {
		const allCells = messages.flatMap((message) => message.cells ?? []);
		return collectPreviewItems(allCells);
	});
	const hasAssets = $derived(chatAssets.length > 0);
	const showTopbar = $derived(!sidebarOpen || hasAssets);

	$effect(() => {
		previewPanel.syncFromCells(chatAssets);
	});

	function openAssetsPanel() {
		previewPanel.openPanel(chatAssets);
	}

	function resetChatConfig() {
		const prefs = loadLastChatConfig();
		selectedModel = prefs?.model ?? DEFAULT_MODEL;
		selectedConnectorIds = prefs?.connectorIds ?? [];
		chatTools = null;
		if (selectedConnectorIds.length > 0) {
			void connectorsCache.load();
		}
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
		const id = page.params.id;
		if (id) {
			await loadChatById(id);
			return;
		}

		if (!sending && (chatId !== undefined || messages.length > 0)) {
			activeRequest?.abort();
			sending = false;
			activeRequest = undefined;
			messages = [];
			draft = "";
			chatId = undefined;
			resetChatConfig();
			previewPanel.reset();
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

	afterNavigate(() => {
		void syncFromRoute();
	});

	// Persist last-used defaults while configuring a new chat (not locked).
	$effect(() => {
		if (!prefsReady || configLocked || page.params.id) return;
		persistChatConfig(selectedModel, [...selectedConnectorIds]);
	});

	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === "object" && value !== null;
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

	// The user's own message cell is echoed in the stream; it's already
	// rendered optimistically, so keep it out of the assistant's cell list.
	function isEchoedUserCell(cell: CellLike): boolean {
		const cellCase = getCellCase(cell);
		return (
			(cellCase === "mdCell" || cellCase === "ansCell") &&
			cell.generated !== true
		);
	}

	function applyStreamLine(line: string, assistantId: number) {
		if (!line.trim()) return;

		const event: unknown = JSON.parse(line);
		if (!isRecord(event)) return;

		if (event.type === "meta" && typeof event.chatId === "string") {
			chatId = event.chatId;
			void setChatRoute(event.chatId, true);
			return;
		}

		const assistant = messages.find(
			(message) => message.id === assistantId,
		);
		if (!assistant) return;

		// grpc-gateway wraps stream messages as {result} and failures as {error}.
		if (isRecord(event.error)) {
			assistant.body =
				typeof event.error.message === "string"
					? event.error.message
					: "The chat stream failed.";
			return;
		}

		const cell = event.result;
		if (!isRecord(cell) || typeof cell.id !== "string") return;
		if (isEchoedUserCell(cell)) return;

		// Each stream event is a full cell snapshot — upsert by id.
		const cells = assistant.cells ?? (assistant.cells = []);
		const index = cells.findIndex((existing) => existing.id === cell.id);
		if (index === -1) {
			cells.push(cell);
		} else {
			cells[index] = cell;
		}
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
		activeRequest = new AbortController();

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
				signal: activeRequest.signal,
			});

			if (!response.ok || !response.body) {
				const payload: unknown = await response
					.json()
					.catch(() => null);
				const detail =
					isRecord(payload) && typeof payload.error === "string"
						? payload.error
						: "Request failed.";
				throw new Error(detail);
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				buffer += decoder.decode(value, { stream: !done });

				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";
				for (const line of lines) applyStreamLine(line, assistantId);

				if (done) break;
			}

			if (buffer) applyStreamLine(buffer, assistantId);

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
			if (assistant)
				assistant.body =
					error instanceof Error ? error.message : "Request failed.";
		} finally {
			const assistant = messages.find(
				(message) => message.id === assistantId,
			);
			if (assistant) assistant.streaming = false;
			sending = false;
			activeRequest = undefined;
			void loadChats();
		}
	}

	async function loadChatById(id: string) {
		if (openingChatId === id) return;
		if (id === chatId && messages.length > 0) {
			closeSidebarIfMobile();
			return;
		}

		openingChatId = id;

		try {
			const response = await fetch(
				`/api/chats/${encodeURIComponent(id)}`,
			);
			const payload: unknown = await response.json();

			if (
				!response.ok ||
				!isRecord(payload) ||
				!Array.isArray(payload.messages)
			) {
				throw new Error("Unable to load chat.");
			}

			activeRequest?.abort();
			sending = false;
			activeRequest = undefined;
			chatId = id;
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
				return [{ id: index, role: item.role, body, cells }];
			});

			if (typeof payload.model === "string" && payload.model) {
				selectedModel = payload.model;
			} else {
				selectedModel = DEFAULT_MODEL;
			}

			selectedConnectorIds = Array.isArray(payload.connectorIds)
				? payload.connectorIds.filter(
						(value): value is number =>
							typeof value === "number" &&
							Number.isInteger(value),
					)
				: [];

			chatTools = extractEnabledTools(payload.tools);

			if (selectedConnectorIds.length > 0) {
				void connectorsCache.load();
			}

			closeSidebarIfMobile();
		} catch {
			chatsError = true;
		} finally {
			openingChatId = undefined;
		}
	}

	function openChat(id: string) {
		if (sending || openingChatId || closingChatId) return;
		closeSidebarIfMobile();
		void setChatRoute(id);
	}

	function newThread() {
		activeRequest?.abort();
		sending = false;
		activeRequest = undefined;
		messages = [];
		draft = "";
		chatId = undefined;
		resetChatConfig();
		previewPanel.reset();
		closeSidebarIfMobile();
		void setChatRoute(undefined);
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
		} catch {
			chats = previous;
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
				<button
					type="button"
					class="new-chat-btn"
					onclick={newThread}
				>
					<Plus size={15} strokeWidth={2} />
					<span>New chat</span>
				</button>
				<button
					type="button"
					class="icon-ghost sidebar-toggle"
					aria-label="Close sidebar"
					title="Close sidebar"
					onclick={() => (sidebarOpen = false)}
				>
					<PanelLeftClose size={16} strokeWidth={1.75} />
				</button>
			</div>
		</div>

		<div class="chats-section">
			<div class="chat-list" aria-live="polite" aria-busy={chatsLoading}>
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
									class:active={chat.id === chatId}
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
	</aside>

	<div
		class="workspace"
		class:with-preview={previewPanel.open}
		class:is-resizing={previewPanel.resizing}
		style:--preview-panel-width="{previewPanel.width}px"
	>
		<main
			class="chat-panel"
			class:empty={isEmpty}
			class:show-topbar={showTopbar}
		>
			<header class="topbar">
				{#if !sidebarOpen}
					<button
						type="button"
						class="icon-ghost sidebar-toggle"
						aria-label="Open sidebar"
						title="Open sidebar"
						onclick={() => (sidebarOpen = true)}
					>
						<PanelLeft size={16} strokeWidth={1.75} />
					</button>
					<button
						type="button"
						class="new-chat-btn topbar-new"
						onclick={newThread}
					>
						<Plus size={15} strokeWidth={2} />
						<span>New chat</span>
					</button>
				{/if}
				{#if hasAssets}
					<button
						type="button"
						class="icon-ghost assets-toggle"
						class:active={previewPanel.open}
						aria-label="Open preview panel"
						aria-pressed={previewPanel.open}
						title={previewPanel.open
							? "Preview open"
							: `Preview (${chatAssets.length})`}
						onclick={openAssetsPanel}
					>
						<PanelRight size={16} strokeWidth={1.75} />
					</button>
				{/if}
			</header>

			{#if isEmpty}
				<section class="empty-state" aria-label="New agent">
					<Composer
						bind:value={draft}
						bind:selectedConnectorIds
						bind:selectedModel
						{sending}
						{configLocked}
						tools={chatTools}
						onsend={sendMessage}
					/>
				</section>
			{:else}
				<section
					class="conversation"
					aria-label="Chat messages"
					aria-live="polite"
				>
					<div class="conversation-inner">
						<div class="messages">
							{#each messages as message (message.id)}
								<article
									class="message"
									class:you={message.role === "you"}
									class:assistant={message.role === "assistant"}
								>
									{#if message.role === "assistant"}
										<span class="message-role">Assistant</span>
										{#if message.cells && message.cells.length > 0}
											<ToolSequence
												cells={message.cells}
												streaming={message.streaming ?? false}
											/>
										{:else if message.body}
											<p class="message-body">{message.body}</p>
										{:else if message.streaming}
											<UnicodeSpinner
												class="streaming-indicator"
												label="Waiting for response"
											/>
										{/if}
									{:else if message.body}
										<p class="message-body">{message.body}</p>
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
						tools={chatTools}
						docked
						onsend={sendMessage}
					/>
				</footer>
			{/if}
		</main>

		{#if previewPanel.open}
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
		grid-template-columns: 0 minmax(0, 1fr);
	}

	.workspace {
		display: flex;
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
		opacity: 0;
		pointer-events: none;
		border-right-color: transparent;
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
		color: #3f3f46;
		background: color-mix(in srgb, #fff 62%, transparent);
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 120ms ease;
	}

	.new-chat-btn:hover {
		background: color-mix(in srgb, #fff 82%, transparent);
	}

	.new-chat-btn :global(svg) {
		flex-shrink: 0;
	}

	.sidebar-header .sidebar-toggle {
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

	.chat-list {
		min-height: 0;
		overflow-y: auto;
		padding-right: 2px;
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
		color: #52525b;
		transition: background 120ms ease;
	}

	.chat-row:hover {
		background: color-mix(in srgb, #fff 55%, transparent);
	}

	.chat-row.active {
		color: var(--color-ink);
		background: color-mix(in srgb, #fff 78%, transparent);
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
		background: color-mix(in srgb, #fff 70%, transparent);
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
		border: 1px solid
			color-mix(in srgb, var(--color-line) 85%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-paper) 96%, #fff);
		box-shadow: 0 4px 14px rgba(15, 15, 20, 0.06);
	}

	.chat-menu-item {
		display: block;
		width: 100%;
		padding: 6px 8px;
		border-radius: 5px;
		color: #52525b;
		font-size: 12px;
		text-align: left;
	}

	.chat-menu-item:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, #fff 70%, transparent);
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
		background: color-mix(in srgb, #fff 60%, transparent);
	}

	.chat-panel {
		display: grid;
		min-width: 0;
		min-height: 0;
		grid-template-rows: minmax(0, 1fr) auto;
		background: var(--color-paper);
	}

	.chat-panel.empty {
		grid-template-rows: minmax(0, 1fr);
	}

	.chat-panel.show-topbar {
		grid-template-rows: 48px minmax(0, 1fr) auto;
	}

	.chat-panel.show-topbar.empty {
		grid-template-rows: 48px minmax(0, 1fr);
	}

	.topbar {
		display: none;
		align-items: center;
		gap: 8px;
		padding: 0 12px;
		border-bottom: 1px solid var(--color-line);
		background: color-mix(in srgb, var(--color-paper) 92%, transparent);
		backdrop-filter: blur(12px);
	}

	.chat-panel.show-topbar .topbar {
		display: flex;
	}

	.topbar-new {
		flex: 0 1 auto;
		max-width: 140px;
	}

	.assets-toggle {
		margin-left: auto;
	}

	.assets-toggle.active {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-ink) 6%, transparent);
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
		background: #f4f4f5;
	}

	.conversation {
		min-height: 0;
		overflow-y: auto;
	}

	.conversation-inner {
		width: min(720px, calc(100% - 48px));
		margin: 0 auto;
		padding: 28px 0 24px;
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
		background: #fcfcfc;
		box-shadow: none;
	}

	.message.you .message-body {
		color: #1a1a1c;
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
		color: #27272a;
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
		padding: 0 24px 18px;
		background: linear-gradient(
			180deg,
			transparent,
			var(--color-paper) 28%
		);
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
			border-top: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		}
	}

	@media (max-width: 780px) {
		.app-shell,
		.app-shell.sidebar-collapsed {
			display: block;
			grid-template-columns: unset;
		}

		.workspace {
			height: 100vh;
			height: 100dvh;
		}

		.sidebar {
			position: fixed;
			inset: 0 auto 0 0;
			z-index: 30;
			width: min(300px, 90vw);
			opacity: 1;
			pointer-events: auto;
			transform: translateX(-102%);
			transition: transform 180ms ease;
		}

		.app-shell.sidebar-collapsed .sidebar {
			opacity: 1;
			pointer-events: none;
			border-right-color: color-mix(
				in srgb,
				var(--color-line) 80%,
				transparent
			);
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

		.chat-panel,
		.chat-panel.show-topbar {
			height: 100vh;
			height: 100dvh;
			grid-template-rows: 52px minmax(0, 1fr) auto;
		}

		.chat-panel.empty,
		.chat-panel.show-topbar.empty {
			grid-template-rows: 52px minmax(0, 1fr);
		}

		.topbar {
			display: flex;
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

<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Modal, Switch } from '$lib/primitives';

	type Message = {
		id: number;
		role: 'you' | 'assistant';
		body: string;
		streaming?: boolean;
	};

	type ChatListItem = {
		id: string;
		title: string;
		updatedAt: string | null;
	};

	let messages = $state<Message[]>([]);
	let draft = $state('');
	let sidebarOpen = $state(false);
	let settingsOpen = $state(false);
	let compactMode = $state(false);
	let chatId = $state<string | undefined>();
	let sending = $state(false);
	let activeRequest: AbortController | undefined;
	let chats = $state<ChatListItem[]>([]);
	let chatsLoading = $state(true);
	let chatsError = $state(false);
	let openingChatId = $state<string | undefined>();

	const isEmpty = $derived(messages.length === 0);

	async function loadChats() {
		chatsLoading = true;
		chatsError = false;

		try {
			const response = await fetch('/api/chats');
			const payload: unknown = await response.json();

			if (!response.ok || !isRecord(payload) || !Array.isArray(payload.chats)) {
				throw new Error('Unable to load chats.');
			}

			chats = payload.chats.filter(
				(item): item is ChatListItem =>
					isRecord(item) &&
					typeof item.id === 'string' &&
					typeof item.title === 'string' &&
					(typeof item.updatedAt === 'string' || item.updatedAt === null)
			);
		} catch {
			chatsError = true;
		} finally {
			chatsLoading = false;
		}
	}

	onMount(() => {
		void loadChats();
	});

	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	function shortDate(value: string | null) {
		if (!value) return '';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '';
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	function cellText(cell: unknown) {
		if (!isRecord(cell)) return '';

		const candidates = [cell.ansCell, cell.ans_cell, cell.mdCell, cell.md_cell];
		for (const candidate of candidates) {
			if (isRecord(candidate) && typeof candidate.content === 'string') return candidate.content;
		}

		return '';
	}

	function applyStreamLine(line: string, assistantId: number) {
		if (!line.trim()) return;

		const event: unknown = JSON.parse(line);
		if (!isRecord(event)) return;

		if (event.type === 'meta' && typeof event.chatId === 'string') {
			chatId = event.chatId;
			return;
		}

		const text = cellText(event.result);
		if (!text) return;

		const assistant = messages.find((message) => message.id === assistantId);
		if (assistant) assistant.body = text;
	}

	async function sendMessage() {
		const body = draft.trim();
		if (!body || sending) return;

		const userId = Date.now();
		const assistantId = userId + 1;
		messages.push(
			{ id: userId, role: 'you', body },
			{ id: assistantId, role: 'assistant', body: '', streaming: true }
		);
		draft = '';
		sending = true;
		activeRequest = new AbortController();

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: body, chatId }),
				signal: activeRequest.signal
			});

			if (!response.ok || !response.body) {
				const payload: unknown = await response.json().catch(() => null);
				const detail =
					isRecord(payload) && typeof payload.error === 'string'
						? payload.error
						: 'Request failed.';
				throw new Error(detail);
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				buffer += decoder.decode(value, { stream: !done });

				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';
				for (const line of lines) applyStreamLine(line, assistantId);

				if (done) break;
			}

			if (buffer) applyStreamLine(buffer, assistantId);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			const assistant = messages.find((message) => message.id === assistantId);
			if (assistant) assistant.body = error instanceof Error ? error.message : 'Request failed.';
		} finally {
			const assistant = messages.find((message) => message.id === assistantId);
			if (assistant) assistant.streaming = false;
			sending = false;
			activeRequest = undefined;
			void loadChats();
		}
	}

	function handleComposerKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			void sendMessage();
		}
	}

	async function openChat(id: string) {
		if (sending || openingChatId || id === chatId) {
			sidebarOpen = false;
			return;
		}

		openingChatId = id;

		try {
			const response = await fetch(`/api/chats/${encodeURIComponent(id)}`);
			const payload: unknown = await response.json();

			if (!response.ok || !isRecord(payload) || !Array.isArray(payload.messages)) {
				throw new Error('Unable to load chat.');
			}

			activeRequest?.abort();
			chatId = id;
			messages = payload.messages
				.filter(
					(item): item is { role: 'you' | 'assistant'; body: string } =>
						isRecord(item) &&
						(item.role === 'you' || item.role === 'assistant') &&
						typeof item.body === 'string'
				)
				.map((item, index) => ({ id: index, role: item.role, body: item.body }));
			sidebarOpen = false;
		} catch {
			chatsError = true;
		} finally {
			openingChatId = undefined;
		}
	}

	function newThread() {
		activeRequest?.abort();
		messages = [];
		draft = '';
		chatId = undefined;
		sidebarOpen = false;
	}

	function focusComposer() {
		const el = document.querySelector<HTMLTextAreaElement>('.composer textarea');
		el?.focus();
		sidebarOpen = false;
	}
</script>

<svelte:head>
	<title>Chat</title>
	<meta name="description" content="A soft chat interface inspired by Cursor Agents." />
</svelte:head>

{#snippet iconPlus()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
		<path d="M12 5v14M5 12h14" stroke-linecap="round" />
	</svg>
{/snippet}

{#snippet iconSearch()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
		<circle cx="11" cy="11" r="6.5" />
		<path d="M16.5 16.5 20 20" stroke-linecap="round" />
	</svg>
{/snippet}

{#snippet iconChat()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
		<path
			d="M8 10.5h8M8 14h5"
			stroke-linecap="round"
		/>
		<path
			d="M6.5 5.5h11A2.5 2.5 0 0 1 20 8v6.5a2.5 2.5 0 0 1-2.5 2.5H11l-3.5 2.5V17H6.5A2.5 2.5 0 0 1 4 14.5V8a2.5 2.5 0 0 1 2.5-2.5Z"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

{#snippet iconGift()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
		<path d="M4 10h16v10H4V10Z" stroke-linejoin="round" />
		<path d="M3 7h18v3H3V7Z" stroke-linejoin="round" />
		<path d="M12 7v13M12 7c0-2-1.2-3.5-3-3.5S6 5 6 7c0 0 2.2.8 6 0Zm0 0c0-2 1.2-3.5 3-3.5S18 5 18 7c0 0-2.2.8-6 0Z" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{/snippet}

{#snippet iconMic()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
		<rect x="9" y="3.5" width="6" height="11" rx="3" />
		<path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5" stroke-linecap="round" />
	</svg>
{/snippet}

{#snippet iconArrowUp()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
		<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{/snippet}

{#snippet iconChevron()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
		<path d="m9 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{/snippet}

{#snippet iconGear()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
		<path
			d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path
			d="M19.1 14.2a1.5 1.5 0 0 0 .3 1.65l.05.05a1.8 1.8 0 0 1-2.55 2.55l-.05-.05a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.93 1.38V19.8a1.8 1.8 0 0 1-3.6 0v-.07a1.5 1.5 0 0 0-.93-1.38 1.5 1.5 0 0 0-1.65.3l-.05.05a1.8 1.8 0 1 1-2.55-2.55l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.38-.93H4.2a1.8 1.8 0 0 1 0-3.6h.07a1.5 1.5 0 0 0 1.38-.93 1.5 1.5 0 0 0-.3-1.65l-.05-.05a1.8 1.8 0 1 1 2.55-2.55l.05.05a1.5 1.5 0 0 0 1.65.3h.02A1.5 1.5 0 0 0 10.5 4.27V4.2a1.8 1.8 0 0 1 3.6 0v.07a1.5 1.5 0 0 0 .93 1.38h.02a1.5 1.5 0 0 0 1.65-.3l.05-.05a1.8 1.8 0 1 1 2.55 2.55l-.05.05a1.5 1.5 0 0 0-.3 1.65v.02a1.5 1.5 0 0 0 1.38.93H19.8a1.8 1.8 0 0 1 0 3.6h-.07a1.5 1.5 0 0 0-1.38.93Z"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

{#snippet composer()}
	<div class="composer">
		<textarea
			bind:value={draft}
			onkeydown={handleComposerKeydown}
			rows="3"
			placeholder="Plan, @ for context, / for commands"
			aria-label="Message"
		></textarea>
		<div class="composer-toolbar">
			<div class="composer-left">
				<button type="button" class="icon-circle" aria-label="Add context" tabindex="-1">
					{@render iconPlus()}
				</button>
				<button type="button" class="model-pill" tabindex="-1">
					<span>Agent</span>
					<svg class="chevron-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path d="m7 10 5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
			<div class="composer-right">
				<button type="button" class="icon-ghost" aria-label="Voice input" tabindex="-1">
					{@render iconMic()}
				</button>
				<button
					type="button"
					class="send-btn"
					disabled={!draft.trim() || sending}
					aria-label="Send message"
					onclick={sendMessage}
				>
					{@render iconArrowUp()}
				</button>
			</div>
		</div>
	</div>
{/snippet}

<div class:compact={compactMode} class="app-shell">
	<button
		class:visible={sidebarOpen}
		class="scrim"
		aria-label="Close conversation menu"
		onclick={() => (sidebarOpen = false)}
	></button>

	<aside class:open={sidebarOpen} class="sidebar" aria-label="Conversation history">
		<div class="sidebar-top">
			<button type="button" class="mobile-close" aria-label="Close sidebar" onclick={() => (sidebarOpen = false)}>
				Close
			</button>

			<nav class="nav-list" aria-label="Primary">
				<button type="button" class="nav-row" onclick={newThread}>
					<span class="nav-icon">{@render iconPlus()}</span>
					<span>New Agent</span>
				</button>
				<button type="button" class="nav-row" onclick={focusComposer}>
					<span class="nav-icon">{@render iconSearch()}</span>
					<span>Search</span>
				</button>
			</nav>
		</div>

		<div class="chats-section">
			<div class="chat-list" aria-live="polite" aria-busy={chatsLoading}>
				{#if chatsLoading}
					<span class="list-loading" aria-label="Loading chats"></span>
				{:else if chatsError}
					<button type="button" class="retry-btn" onclick={loadChats}>Retry</button>
				{:else if chats.length === 0}
					<p class="list-empty">No chats yet</p>
				{:else}
					{#each chats as chat (chat.id)}
						<button
							type="button"
							class="chat-row"
							class:active={chat.id === chatId}
							class:opening={chat.id === openingChatId}
							title={chat.title}
							disabled={sending || openingChatId !== undefined}
							onclick={() => openChat(chat.id)}
						>
							<span class="chat-icon">{@render iconChat()}</span>
							<span class="chat-title">{chat.title}</span>
							<span class="chat-time">{shortDate(chat.updatedAt)}</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>

		<div class="sidebar-footer">
			<button type="button" class="refer-pill" tabindex="-1">
				<span class="refer-icon">{@render iconGift()}</span>
				<span>Refer friends, earn up to $250</span>
			</button>

			<div class="user-row">
				<span class="avatar" aria-hidden="true">Y</span>
				<div class="user-meta">
					<span class="user-name">You</span>
					<span class="user-plan">Pro Plan</span>
				</div>
				<button
					type="button"
					class="icon-ghost gear"
					aria-label="Open settings"
					onclick={() => (settingsOpen = true)}
				>
					{@render iconGear()}
				</button>
			</div>
		</div>
	</aside>

	<main class="chat-panel" class:empty={isEmpty}>
		<header class="topbar">
			<button type="button" class="menu-button" onclick={() => (sidebarOpen = true)}>
				Menu
			</button>
		</header>

		{#if isEmpty}
			<section class="empty-state" aria-label="New agent">
				<nav class="breadcrumbs" aria-label="Context">
					<span>textql-ts-sdk</span>
					<span class="crumb-sep">{@render iconChevron()}</span>
					<span>chat</span>
					<span class="crumb-sep">{@render iconChevron()}</span>
					<span>This Mac</span>
				</nav>

				{@render composer()}

				<div class="suggestion-chips">
					<button type="button" class="chip" tabindex="-1">Plan New Idea</button>
					<button type="button" class="chip" tabindex="-1">Multitask</button>
				</div>

				<p class="footer-hint">
					Select Composer in your model picker for a great balance of intelligence and cost
				</p>
			</section>
		{:else}
			<section class="conversation" aria-label="Chat messages" aria-live="polite">
				<div class="conversation-inner">
					<div class="messages">
						{#each messages as message (message.id)}
							<article class="message" class:assistant={message.role === 'assistant'}>
								<span class="message-role">
									{message.role === 'assistant' ? 'Assistant' : 'You'}
								</span>
								{#if message.body}
									<p class="message-body">{message.body}</p>
								{:else if message.streaming}
									<span class="streaming-indicator" aria-label="Waiting for response"></span>
								{/if}
							</article>
						{/each}
					</div>
				</div>
			</section>

			<footer class="composer-dock">
				{@render composer()}
			</footer>
		{/if}
	</main>
</div>

<Modal bind:open={settingsOpen} title="Settings">
	<div class="settings-list">
		<label>
			<span class="settings-label">Compact messages</span>
			<Switch bind:checked={compactMode} aria-label="Use compact messages" />
		</label>
	</div>

	{#snippet actions()}
		<Button class="rounded-xl" variant="solid" size="sm" onclick={() => (settingsOpen = false)}>
			Done
		</Button>
	{/snippet}
</Modal>

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
	}

	.sidebar {
		display: flex;
		min-height: 0;
		flex-direction: column;
		padding: 14px 12px 12px;
		border-right: 1px solid color-mix(in srgb, var(--color-line) 80%, transparent);
		background: var(--color-sidebar);
	}

	.sidebar-top {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.mobile-close,
	.menu-button {
		display: none;
		align-items: center;
		justify-content: center;
		padding: 6px 10px;
		border: 0;
		border-radius: var(--radius-sm);
		color: var(--color-muted);
		background: transparent;
		font-size: 13px;
		cursor: pointer;
	}

	.mobile-close:hover,
	.menu-button:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, #fff 55%, transparent);
	}

	.nav-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.nav-row,
	.chat-row,
	.retry-btn,
	.refer-pill,
	.icon-circle,
	.icon-ghost,
	.model-pill,
	.send-btn,
	.chip {
		border: 0;
		background: transparent;
		font: inherit;
		cursor: pointer;
	}

	.nav-row {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 8px 10px;
		border-radius: var(--radius-sm);
		color: #3f3f46;
		font-size: 13.5px;
		font-weight: 500;
		text-align: left;
		transition: background 120ms ease;
	}

	.nav-row:hover {
		background: color-mix(in srgb, #fff 58%, transparent);
	}

	.nav-icon {
		display: inline-flex;
		width: 16px;
		height: 16px;
		color: #6b6b75;
	}

	.nav-icon :global(svg),
	.chat-icon :global(svg),
	.refer-icon :global(svg),
	.icon-circle :global(svg),
	.icon-ghost :global(svg),
	.send-btn :global(svg),
	.chevron-down,
	.crumb-sep :global(svg) {
		width: 100%;
		height: 100%;
	}

	.chats-section {
		display: flex;
		min-height: 0;
		flex: 1;
		flex-direction: column;
		margin-top: 18px;
	}

	.chat-list {
		min-height: 0;
		overflow-y: auto;
		padding-right: 2px;
	}

	.chat-row {
		display: grid;
		grid-template-columns: 16px minmax(0, 1fr) auto;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 7px 8px;
		border-radius: var(--radius-sm);
		color: #52525b;
		text-align: left;
		transition: background 120ms ease;
	}

	.chat-row:hover:not(:disabled) {
		background: color-mix(in srgb, #fff 55%, transparent);
	}

	.chat-row.active {
		color: var(--color-ink);
		background: color-mix(in srgb, #fff 78%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-line) 70%, transparent);
	}

	.chat-row.opening {
		opacity: 0.65;
	}

	.chat-row:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.chat-icon {
		display: inline-flex;
		width: 14px;
		height: 14px;
		color: #8b8b93;
	}

	.chat-row.active .chat-icon {
		color: var(--color-accent);
	}

	.chat-title {
		overflow: hidden;
		font-size: 12.5px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chat-time {
		flex-shrink: 0;
		color: var(--color-muted);
		font-size: 11px;
		font-variant-numeric: tabular-nums;
	}

	.list-loading {
		display: block;
		width: 40px;
		height: 3px;
		margin: 14px 10px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-accent) 55%, #c7c7d1);
		transform-origin: left;
		animation: wait 900ms ease-in-out infinite alternate;
	}

	.list-empty,
	.footer-hint {
		margin: 0;
		color: var(--color-muted);
		font-size: 12px;
		line-height: 1.4;
	}

	.list-empty {
		padding: 10px 10px 0;
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

	.sidebar-footer {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: auto;
		padding-top: 12px;
	}

	.refer-pill {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 9px 12px;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, #fff);
		border-radius: 999px;
		color: #52525b;
		background: color-mix(in srgb, #fff 72%, transparent);
		font-size: 12px;
		box-shadow: 0 1px 2px rgba(15, 15, 20, 0.04);
		text-align: left;
	}

	.refer-icon {
		display: inline-flex;
		width: 15px;
		height: 15px;
		flex-shrink: 0;
		color: #6b6b75;
	}

	.user-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 4px 4px 2px;
	}

	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 999px;
		color: #fff;
		background: linear-gradient(145deg, #7c8cff, #4f6ef7);
		font-size: 12px;
		font-weight: 600;
	}

	.user-meta {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 1px;
	}

	.user-name {
		font-size: 13px;
		font-weight: 500;
	}

	.user-plan {
		color: var(--color-muted);
		font-size: 11px;
	}

	.gear {
		width: 30px;
		height: 30px;
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

	.topbar {
		display: none;
		align-items: center;
		padding: 0 14px;
		border-bottom: 1px solid var(--color-line);
		background: color-mix(in srgb, var(--color-paper) 92%, transparent);
		backdrop-filter: blur(12px);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 18px;
		min-height: 0;
		padding: 32px 24px 40px;
	}

	.breadcrumbs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 4px;
		color: var(--color-muted);
		font-size: 13px;
	}

	.crumb-sep {
		display: inline-flex;
		width: 12px;
		height: 12px;
		opacity: 0.55;
	}

	.composer {
		display: flex;
		width: min(640px, 100%);
		flex-direction: column;
		gap: 10px;
		padding: 14px 14px 12px;
		border: 1px solid color-mix(in srgb, var(--color-line) 95%, #cfcfd4);
		border-radius: var(--radius-lg);
		background: #fff;
		box-shadow:
			0 1px 2px rgba(15, 15, 20, 0.03),
			0 10px 28px rgba(15, 15, 20, 0.06);
	}

	.composer:focus-within {
		border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-line));
		box-shadow:
			0 1px 2px rgba(15, 15, 20, 0.03),
			0 12px 32px rgba(15, 15, 20, 0.07),
			0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent);
	}

	.composer textarea {
		width: 100%;
		max-height: 180px;
		min-height: 72px;
		padding: 2px 4px;
		resize: none;
		border: 0;
		outline: 0;
		color: var(--color-ink);
		background: transparent;
		font-size: 14px;
		line-height: 1.55;
	}

	.composer textarea::placeholder {
		color: #a1a1aa;
	}

	.composer-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.composer-left,
	.composer-right {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.icon-circle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		color: #71717a;
		background: #fff;
	}

	.icon-circle :global(svg),
	.icon-ghost :global(svg) {
		width: 15px;
		height: 15px;
	}

	.icon-circle:hover,
	.model-pill:hover,
	.chip:hover {
		background: #f4f4f5;
	}

	.model-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 5px 10px;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		color: #3f3f46;
		background: #fafafa;
		font-size: 12.5px;
		font-weight: 500;
	}

	.chevron-down {
		width: 14px;
		height: 14px;
		color: #8b8b93;
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

	.icon-ghost:hover {
		background: #f4f4f5;
	}

	.send-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		color: #fff;
		background: #171717;
		transition: opacity 120ms ease, transform 120ms ease;
	}

	.send-btn :global(svg) {
		width: 15px;
		height: 15px;
	}

	.send-btn:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.send-btn:disabled {
		cursor: not-allowed;
		opacity: 0.35;
	}

	.suggestion-chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
	}

	.chip {
		padding: 7px 14px;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		color: #52525b;
		background: color-mix(in srgb, #fff 70%, var(--color-paper));
		font-size: 12.5px;
		box-shadow: 0 1px 2px rgba(15, 15, 20, 0.03);
	}

	.footer-hint {
		max-width: 420px;
		text-align: center;
	}

	.conversation {
		min-height: 0;
		overflow-y: auto;
		scrollbar-color: #d4d4d8 transparent;
	}

	.conversation-inner {
		width: min(720px, calc(100% - 48px));
		margin: 0 auto;
		padding: 28px 0 24px;
	}

	.messages {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.message {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px 16px;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		background: transparent;
	}

	.message.assistant {
		border-color: var(--color-line);
		background: #fff;
		box-shadow: 0 1px 2px rgba(15, 15, 20, 0.03);
	}

	.compact .message {
		padding: 10px 12px;
		gap: 4px;
	}

	.message-role {
		color: var(--color-muted);
		font-size: 12px;
		font-weight: 500;
	}

	.message.assistant .message-role {
		color: var(--color-accent);
	}

	.message-body {
		margin: 0;
		color: #27272a;
		font-size: 14px;
		line-height: 1.65;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.streaming-indicator {
		display: block;
		width: 42px;
		height: 3px;
		margin-top: 6px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-accent) 55%, #c7c7d1);
		transform-origin: left;
		animation: wait 900ms ease-in-out infinite alternate;
	}

	@keyframes wait {
		from {
			transform: scaleX(0.25);
			opacity: 0.35;
		}
		to {
			transform: scaleX(1);
			opacity: 1;
		}
	}

	.composer-dock {
		display: flex;
		justify-content: center;
		padding: 0 24px 18px;
		background: linear-gradient(180deg, transparent, var(--color-paper) 28%);
	}

	.composer-dock .composer {
		width: min(720px, 100%);
	}

	.settings-list {
		display: flex;
		flex-direction: column;
		margin-top: 18px;
		border-top: 1px solid var(--color-line);
	}

	.settings-list label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		padding: 15px 0;
		border-bottom: 1px solid var(--color-line);
	}

	.settings-label {
		color: var(--color-ink);
		font-size: 13px;
		font-weight: 500;
	}

	.scrim {
		display: none;
	}

	@media (max-width: 780px) {
		.app-shell {
			display: block;
		}

		.sidebar {
			position: fixed;
			inset: 0 auto 0 0;
			z-index: 30;
			width: min(300px, 90vw);
			transform: translateX(-102%);
			transition: transform 180ms ease;
		}

		.sidebar.open {
			transform: translateX(0);
		}

		.mobile-close,
		.menu-button {
			display: inline-flex;
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
			grid-template-rows: 56px minmax(0, 1fr) auto;
		}

		.chat-panel.empty {
			grid-template-rows: 56px minmax(0, 1fr);
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

		.composer textarea {
			min-height: 56px;
		}

		.message-body {
			font-size: 13px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar,
		.scrim,
		.send-btn {
			transition: none;
		}

		.streaming-indicator,
		.list-loading {
			animation: none;
		}
	}
</style>

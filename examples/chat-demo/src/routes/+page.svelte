<script lang="ts">
	import { Button, Marquee, Modal, Switch, Text, Toaster, toast } from '$lib/primitives';

	type Message = {
		id: number;
		role: 'you' | 'assistant';
		body: string;
		time: string;
	};

	type Thread = {
		title: string;
		meta: string;
		active?: boolean;
	};

	const threads: Thread[] = [
		{ title: 'Weekly activation movement', meta: 'NOW', active: true },
		{ title: 'Explain the churn spike', meta: 'YESTERDAY' },
		{ title: 'Q3 pipeline coverage', meta: 'MON' },
		{ title: 'Segment enterprise users', meta: '09 JUL' },
		{ title: 'Untitled analysis', meta: '02 JUL' }
	];

	const starterMessages: Message[] = [
		{
			id: 1,
			role: 'you',
			body: 'Compare weekly activation before and after the onboarding launch. Call out anything unusual.',
			time: '11:42'
		},
		{
			id: 2,
			role: 'assistant',
			body: 'Activation increased 18.4% in the four weeks after launch. The lift is broad, but smaller teams improved nearly twice as much as enterprise accounts. Week three is the exception: mobile activation fell 6% while every other platform grew.',
			time: '11:43'
		},
		{
			id: 3,
			role: 'you',
			body: 'What changed for mobile in week three?',
			time: '11:44'
		},
		{
			id: 4,
			role: 'assistant',
			body: 'The decline lines up with version 4.12. New users reached the permissions step, but completion dropped sharply on Android. That release is the strongest candidate for the temporary dip.',
			time: '11:44'
		}
	];

	let messages = $state<Message[]>([...starterMessages]);
	let draft = $state('');
	let search = $state('');
	let sidebarOpen = $state(false);
	let settingsOpen = $state(false);
	let showSources = $state(true);
	let compactMode = $state(false);

	let filteredThreads = $derived(
		threads.filter((thread) => thread.title.toLowerCase().includes(search.toLowerCase()))
	);

	function currentTime() {
		return new Intl.DateTimeFormat('en', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(new Date());
	}

	function sendMessage() {
		const body = draft.trim();
		if (!body) return;

		messages.push({ id: Date.now(), role: 'you', body, time: currentTime() });
		draft = '';
		toast('Message staged locally', {
			description: 'Connect the TextQL API to receive a response.'
		});
	}

	function handleComposerKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function newThread() {
		messages = [];
		draft = '';
		sidebarOpen = false;
		toast('New conversation ready');
	}

	function attachFile() {
		toast('File uploads are not connected yet');
	}
</script>

<svelte:head>
	<title>TextQL — Chat demo</title>
	<meta name="description" content="A light editorial chat interface built with Svelte and TextQL." />
</svelte:head>

<Toaster />

<div class:compact={compactMode} class="app-shell">
	<button
		class:visible={sidebarOpen}
		class="scrim"
		aria-label="Close conversation menu"
		onclick={() => (sidebarOpen = false)}
	></button>

	<aside class:open={sidebarOpen} class="sidebar" aria-label="Conversation history">
		<div class="sidebar-head">
			<div class="brand-block">
				<Text type="heading" size="lg" color="black">TEXTQL</Text>
				<Text type="label" size="xs" color="muted">CHAT / DEMO</Text>
			</div>
			<Button class="mobile-close" variant="ghost" size="xs" onclick={() => (sidebarOpen = false)}>
				CLOSE
			</Button>
		</div>

		<Button class="new-thread" variant="solid" size="md" onclick={newThread}>
			NEW CONVERSATION
		</Button>

		<label class="search-box">
			<span>SEARCH</span>
			<input bind:value={search} type="search" placeholder="Filter conversations" />
		</label>

		<nav class="thread-list" aria-label="Previous conversations">
			<Text type="label" size="xs" color="muted" class="thread-section-label">RECENT</Text>
			{#each filteredThreads as thread}
				<button class:active={thread.active} class="thread" onclick={() => (sidebarOpen = false)}>
					<span class="thread-title">
						<Marquee text={thread.title} speed={30} gap={24} />
					</span>
					<span class="thread-meta">{thread.meta}</span>
				</button>
			{:else}
				<Text type="paragraph" size="xs" color="muted" class="empty-search">
					No conversations match.
				</Text>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<div>
				<Text type="paragraph" size="xs" color="black">Rodney</Text>
				<Text type="label" size="xs" color="muted">PERSONAL WORKSPACE</Text>
			</div>
			<Button variant="ghost" size="xs" onclick={() => (settingsOpen = true)}>SETTINGS</Button>
		</div>
	</aside>

	<main class="chat-panel">
		<header class="topbar">
			<Button class="menu-button" variant="ghost" size="xs" onclick={() => (sidebarOpen = true)}>
				MENU
			</Button>
			<div class="conversation-title">
				<h1>Weekly activation movement</h1>
				<p>CHAT_01 / {messages.length} MESSAGES</p>
			</div>
			<div class="topbar-actions">
				<Button variant="ghost" size="xs" onclick={() => toast('Export is not connected yet')}>EXPORT</Button>
				<Button variant="ghost" size="xs" onclick={() => (settingsOpen = true)}>OPTIONS</Button>
			</div>
		</header>

		<section class="conversation" aria-label="Chat messages" aria-live="polite">
			<div class="conversation-inner">
				<div class="date-rule">
					<Text type="label" size="xs" color="muted">TODAY / JULY 21</Text>
				</div>

				{#if messages.length === 0}
					<div class="empty-state">
						<Text type="heading" size="2xl" color="black">Start with a question.</Text>
						<Text type="paragraph" size="sm" color="muted">
							Ask about your data, a metric, or a change you want to understand.
						</Text>
					</div>
				{:else}
					<div class="messages">
						{#each messages as message}
							<article class:assistant={message.role === 'assistant'} class="message">
								<div class="message-meta">
									<Text type="label" size="xs" color={message.role === 'assistant' ? 'accent' : 'muted'}>
										{message.role === 'assistant' ? 'TEXTQL' : 'YOU'}
									</Text>
									<time>{message.time}</time>
								</div>
								<p class="message-body">{message.body}</p>
								{#if message.role === 'assistant'}
									<div class="message-actions">
										<Button variant="ghost" size="xs" onclick={() => toast('Response copied')}>COPY</Button>
										<Button variant="ghost" size="xs" onclick={() => toast('Feedback saved')}>USEFUL</Button>
									</div>
								{/if}
							</article>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<footer class="composer-wrap">
			<div class="composer">
				<textarea
					bind:value={draft}
					onkeydown={handleComposerKeydown}
					rows="2"
					placeholder="Ask a follow-up question"
					aria-label="Message TextQL"
				></textarea>
				<div class="composer-actions">
					<Button variant="ghost" size="sm" onclick={attachFile}>ATTACH</Button>
					<Button variant="solid" size="sm" disabled={!draft.trim()} onclick={sendMessage}>SEND</Button>
				</div>
			</div>
			<div class="composer-note">
				<span>ENTER TO SEND / SHIFT + ENTER FOR NEW LINE</span>
				<span>TEXTQL API / NOT CONNECTED</span>
			</div>
		</footer>
	</main>
</div>

<Modal bind:open={settingsOpen} title="Conversation options">
	<div class="settings-list">
		<label>
			<span>
				<strong>Show sources</strong>
				<small>Include references beneath generated responses.</small>
			</span>
			<Switch bind:checked={showSources} aria-label="Show sources" />
		</label>
		<label>
			<span>
				<strong>Compact messages</strong>
				<small>Reduce spacing between conversation turns.</small>
			</span>
			<Switch bind:checked={compactMode} aria-label="Use compact messages" />
		</label>
	</div>

	{#snippet actions()}
		<Button variant="solid" size="sm" onclick={() => (settingsOpen = false)}>DONE</Button>
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
		grid-template-columns: 280px minmax(0, 1fr);
		height: 100vh;
		height: 100dvh;
		color: var(--color-ink);
		background: var(--color-paper);
	}

	.sidebar {
		display: flex;
		min-height: 0;
		flex-direction: column;
		padding: 28px 20px 20px;
		border-right: 1px solid var(--color-line);
		background: #f1f0ed;
	}

	.sidebar-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.brand-block {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	:global(.brand-block > p:first-child) {
		letter-spacing: -0.03em;
	}

	:global(.mobile-close),
	:global(.menu-button) {
		display: none !important;
	}

	:global(.new-thread) {
		width: 100%;
		margin-top: 30px;
	}

	.search-box {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 10px;
		margin-top: 14px;
		border-bottom: 1px solid #d4d2cb;
	}

	.search-box span,
	.thread-meta,
	.conversation-title p,
	.message-meta time,
	.composer-note {
		color: var(--color-muted);
		font-size: 10px;
		letter-spacing: 0.08em;
	}

	.search-box input {
		min-width: 0;
		padding: 12px 0;
		border: 0;
		outline: 0;
		color: var(--color-ink);
		background: transparent;
		font-size: 12px;
	}

	.search-box input::placeholder {
		color: #93918b;
	}

	.thread-list {
		min-height: 0;
		margin-top: 30px;
		overflow-y: auto;
	}

	:global(.thread-section-label) {
		margin: 0 10px 9px;
	}

	.thread {
		display: grid;
		width: 100%;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 12px;
		padding: 13px 10px;
		border: 0;
		border-top: 1px solid transparent;
		border-bottom: 1px solid #dedcd6;
		color: #55534f;
		background: transparent;
		font: inherit;
		font-size: 12px;
		text-align: left;
		cursor: pointer;
	}

	.thread:hover {
		color: var(--color-accent);
		background: #ecebff;
	}

	.thread.active {
		border-top-color: var(--color-accent);
		border-bottom-color: var(--color-accent);
		color: var(--color-accent);
		background: #ecebff;
	}

	.thread-title {
		min-width: 0;
		overflow: hidden;
	}

	.thread-meta {
		font-size: 9px;
	}

	:global(.empty-search) {
		margin: 16px 10px;
	}

	.sidebar-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: auto;
		padding-top: 17px;
		border-top: 1px solid #d4d2cb;
	}

	.sidebar-footer > div {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 2px;
	}

	.chat-panel {
		display: grid;
		min-width: 0;
		min-height: 0;
		grid-template-rows: 70px minmax(0, 1fr) auto;
	}

	.topbar {
		display: flex;
		align-items: center;
		padding: 0 28px;
		border-bottom: 1px solid var(--color-line);
		background: rgba(247, 246, 245, 0.94);
		backdrop-filter: blur(12px);
	}

	.conversation-title h1 {
		margin: 0;
		font-size: 13px;
		font-weight: 500;
	}

	.conversation-title p {
		margin: 4px 0 0;
		font-size: 9px;
	}

	.topbar-actions {
		display: flex;
		gap: 4px;
		margin-left: auto;
	}

	.conversation {
		min-height: 0;
		overflow-y: auto;
		scrollbar-color: #cbc8c0 transparent;
	}

	.conversation-inner {
		width: min(760px, calc(100% - 48px));
		margin: 0 auto;
		padding-bottom: 90px;
	}

	.date-rule {
		padding: 35px 0 13px;
		border-bottom: 1px solid var(--color-line);
	}

	.messages {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.message {
		display: grid;
		grid-template-columns: 104px minmax(0, 1fr);
		column-gap: 24px;
		padding: 38px 0;
		border-bottom: 1px solid var(--color-line);
	}

	.compact .message {
		padding-top: 24px;
		padding-bottom: 24px;
	}

	.message.assistant {
		position: relative;
	}

	.message.assistant::before {
		position: absolute;
		top: 38px;
		bottom: 38px;
		left: -17px;
		width: 2px;
		background: var(--color-accent);
		content: '';
	}

	.compact .message.assistant::before {
		top: 24px;
		bottom: 24px;
	}

	.message-meta {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.message-meta time {
		font-size: 9px;
	}

	.message-body {
		grid-column: 2;
		margin: 0;
		color: #292825;
		font-size: 14px;
		line-height: 1.75;
	}

	.assistant .message-body {
		font-size: 15px;
		line-height: 1.8;
	}

	.message-actions {
		display: flex;
		grid-column: 2;
		gap: 2px;
		margin-top: 12px;
		margin-left: -8px;
		opacity: 0;
		transition: opacity 140ms ease;
	}

	.message:hover .message-actions,
	.message:focus-within .message-actions {
		opacity: 1;
	}

	.empty-state {
		display: flex;
		min-height: 55vh;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		text-align: center;
	}

	.composer-wrap {
		width: min(800px, calc(100% - 48px));
		margin: 0 auto;
		padding-bottom: 20px;
		background: var(--color-paper);
	}

	.composer {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: end;
		gap: 16px;
		padding: 14px;
		border: 1px solid #cbc8c0;
		background: #fff;
		box-shadow: 0 14px 50px rgba(10, 10, 10, 0.07);
	}

	.composer:focus-within {
		border-color: var(--color-accent);
	}

	.composer textarea {
		width: 100%;
		max-height: 140px;
		min-height: 48px;
		padding: 5px 3px;
		resize: none;
		border: 0;
		outline: 0;
		color: var(--color-ink);
		background: transparent;
		font-size: 13px;
		line-height: 1.55;
	}

	.composer textarea::placeholder {
		color: #8a8882;
	}

	.composer-actions {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.composer-note {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		padding: 8px 2px 0;
		font-size: 9px;
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

	.settings-list label > span {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.settings-list strong {
		color: var(--color-ink);
		font-size: 12px;
		font-weight: 500;
	}

	.settings-list small {
		color: var(--color-muted);
		font-size: 10px;
		line-height: 1.4;
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
			width: min(310px, 90vw);
			transform: translateX(-102%);
			transition: transform 180ms ease;
		}

		.sidebar.open {
			transform: translateX(0);
		}

		:global(.mobile-close),
		:global(.menu-button) {
			display: inline-flex !important;
		}

		.scrim {
			position: fixed;
			inset: 0;
			z-index: 29;
			display: block;
			visibility: hidden;
			padding: 0;
			border: 0;
			background: rgba(10, 10, 10, 0.24);
			opacity: 0;
			transition: opacity 180ms ease, visibility 180ms ease;
		}

		.scrim.visible {
			visibility: visible;
			opacity: 1;
		}

		.chat-panel {
			height: 100vh;
			height: 100dvh;
			grid-template-rows: 64px minmax(0, 1fr) auto;
		}

		.topbar {
			padding: 0 14px;
		}

		:global(.menu-button) {
			margin-right: 8px;
		}
	}

	@media (max-width: 560px) {
		.topbar-actions :global(button:first-child) {
			display: none;
		}

		.conversation-inner,
		.composer-wrap {
			width: calc(100% - 28px);
		}

		.message {
			display: block;
			padding: 28px 0;
		}

		.message.assistant::before {
			top: 28px;
			bottom: 28px;
			left: -8px;
		}

		.message-meta {
			flex-direction: row;
			align-items: baseline;
			justify-content: space-between;
			margin-bottom: 11px;
		}

		.message-body,
		.message-actions {
			grid-column: auto;
		}

		.message-body,
		.assistant .message-body {
			font-size: 13px;
		}

		.message-actions {
			opacity: 1;
		}

		.composer {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.composer-actions {
			justify-content: flex-end;
		}

		.composer-note span:first-child {
			display: none;
		}

		.composer-note span:last-child {
			margin-left: auto;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar,
		.scrim,
		.message-actions {
			transition: none;
		}
	}
</style>

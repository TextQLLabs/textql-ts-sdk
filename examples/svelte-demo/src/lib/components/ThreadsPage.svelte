<script lang="ts">
	import Ellipsis from "@lucide/svelte/icons/ellipsis";
	import Plus from "@lucide/svelte/icons/plus";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import UnicodeSpinner from "$lib/components/UnicodeSpinner.svelte";
	import { Page, confirm, toast } from "$lib/primitives";
	import { isRecord } from "$lib/utils";

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

	let threads = $state<ThreadListItem[]>([]);
	let loading = $state(true);
	let error = $state(false);
	let openingId = $state<string | undefined>();
	let deletingId = $state<string | undefined>();
	let menuThreadId = $state<string | undefined>();

	const busy = $derived(openingId !== undefined || deletingId !== undefined);

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
			year:
				date.getFullYear() !== today.getFullYear()
					? "numeric"
					: undefined,
		});
	}

	function formatLastMessage(value: string | null) {
		if (!value) return "—";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "—";

		const today = new Date();
		const isToday =
			date.getFullYear() === today.getFullYear() &&
			date.getMonth() === today.getMonth() &&
			date.getDate() === today.getDate();

		if (isToday) {
			return date.toLocaleTimeString(undefined, {
				hour: "numeric",
				minute: "2-digit",
			});
		}
		return shortDate(value);
	}

	const groups = $derived.by((): ThreadGroup[] => {
		const result: ThreadGroup[] = [];
		for (const thread of threads) {
			const key = dateKey(thread.lastMessageAt);
			const existing = result.find((group) => group.key === key);
			if (existing) {
				existing.threads.push(thread);
			} else {
				result.push({
					key,
					label: shortDate(thread.lastMessageAt),
					threads: [thread],
				});
			}
		}
		return result;
	});

	async function loadThreads() {
		loading = true;
		error = false;

		try {
			const response = await fetch("/api/chats");
			const payload: unknown = await response.json();

			if (
				!response.ok ||
				!isRecord(payload) ||
				!Array.isArray(payload.chats)
			) {
				throw new Error("Unable to load threads.");
			}

			threads = payload.chats
				.filter(
					(item): item is Record<string, unknown> =>
						isRecord(item) &&
						typeof item.id === "string" &&
						typeof item.title === "string",
				)
				.map((item) => ({
					id: item.id as string,
					title: item.title as string,
					createdBy:
						typeof item.createdBy === "string"
							? item.createdBy
							: null,
					source:
						typeof item.source === "string" ? item.source : null,
					lastMessageAt:
						typeof item.lastMessageAt === "string"
							? item.lastMessageAt
							: null,
					updatedAt:
						typeof item.updatedAt === "string"
							? item.updatedAt
							: null,
				}));
		} catch {
			error = true;
		} finally {
			loading = false;
		}
	}

	function openThread(id: string) {
		if (busy) return;
		openingId = id;
		void goto(resolve("/(chat)/chat/[id]", { id }), { noScroll: true });
	}

	function newThread() {
		if (busy) return;
		void goto(resolve("/(chat)"), { noScroll: true });
	}

	function toggleMenu(id: string, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (busy) return;
		menuThreadId = menuThreadId === id ? undefined : id;
	}

	async function deleteThread(id: string, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		menuThreadId = undefined;
		if (busy) return;

		const confirmed = await confirm({
			tone: "danger",
			title: "Delete thread?",
			description:
				"This permanently deletes the thread and all of its messages. This cannot be undone.",
			confirmLabel: "Delete",
		});
		if (!confirmed) return;

		deletingId = id;
		const previous = threads;
		threads = threads.filter((thread) => thread.id !== id);

		try {
			const response = await fetch(
				`/api/chats/${encodeURIComponent(id)}`,
				{ method: "DELETE" },
			);
			if (!response.ok) {
				throw new Error("Unable to delete thread.");
			}
			toast.success("Thread deleted");
		} catch {
			threads = previous;
			toast.error("Couldn't delete thread", {
				description: "Something went wrong. Please try again.",
			});
		} finally {
			deletingId = undefined;
		}
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && menuThreadId !== undefined) {
			menuThreadId = undefined;
		}
	}

	function onWindowPointerDown(event: PointerEvent) {
		if (menuThreadId === undefined) return;
		const target = event.target;
		if (!(target instanceof Element) || !target.closest(".thread-menu")) {
			menuThreadId = undefined;
		}
	}

	onMount(() => {
		void loadThreads();
	});
</script>

<svelte:window onkeydown={onWindowKeydown} onpointerdown={onWindowPointerDown} />

<svelte:head>
	<title>Threads</title>
	<meta name="description" content="Browse and open all your conversations." />
</svelte:head>

<Page title="Threads" lead="Browse and open all your conversations." wide>
	{#snippet actions()}
		<button
			type="button"
			class="new-btn"
			disabled={busy}
			onclick={newThread}
		>
			<Plus size={15} strokeWidth={2} />
			<span>New chat</span>
		</button>
	{/snippet}

	<section class="list-section" aria-label="Thread list">
		{#if loading}
			<div class="state-block" aria-busy="true">
				<UnicodeSpinner label="Loading threads" />
				<p class="state-text">Loading threads…</p>
			</div>
		{:else if error}
			<div class="state-block">
				<p class="state-text">Unable to load threads.</p>
				<button type="button" class="retry-btn" onclick={loadThreads}
					>Retry</button
				>
			</div>
		{:else if threads.length === 0}
			<div class="state-block">
				<p class="state-title">No threads yet</p>
				<p class="state-text">Start a chat to see it here.</p>
			</div>
		{:else}
			<div class="board">
				{#each groups as group (group.key)}
					<section class="board-group" aria-label={group.label}>
						<header class="board-group-head">
							<div class="board-group-title-row">
								<h2 class="board-group-title">{group.label}</h2>
								<span class="board-group-count"
									>{group.threads.length}</span
								>
							</div>
						</header>

						<ul class="board-list">
							{#each group.threads as thread (thread.id)}
								<li
									class="thread-row"
									class:opening={thread.id === openingId}
									class:closing={thread.id === deletingId}
								>
									<button
										type="button"
										class="thread-row-main"
										title={thread.title}
										disabled={busy}
										onclick={() => openThread(thread.id)}
									>
										<span class="thread-copy">
											<span class="thread-title"
												>{thread.title}</span
											>
											<span class="thread-meta">
												<span class="thread-source">
													{thread.createdBy ??
														"Unknown"}
												</span>
												{#if thread.source}
													<span
														class="thread-source-badge"
														>{thread.source}</span
													>
												{/if}
											</span>
										</span>

										<span class="thread-side">
											<span class="thread-time">
												{formatLastMessage(
													thread.lastMessageAt,
												)}
											</span>
											{#if thread.id === openingId}
												<UnicodeSpinner
													class="row-spinner"
													label="Opening thread"
												/>
											{/if}
										</span>
									</button>

									<div
										class="thread-menu"
										class:open={menuThreadId === thread.id}
									>
										<button
											type="button"
											class="thread-menu-btn"
											aria-label="Thread options"
											aria-haspopup="menu"
											aria-expanded={menuThreadId ===
												thread.id}
											title="Thread options"
											disabled={busy}
											onclick={(event) =>
												toggleMenu(thread.id, event)}
										>
											{#if thread.id === deletingId}
												<UnicodeSpinner
													class="row-spinner"
													label="Deleting thread"
												/>
											{:else}
												<Ellipsis
													size={13}
													strokeWidth={2}
												/>
											{/if}
										</button>
										{#if menuThreadId === thread.id}
											<div
												class="thread-menu-popover"
												role="menu"
											>
												<button
													type="button"
													class="thread-menu-item"
													role="menuitem"
													onclick={(event) =>
														deleteThread(
															thread.id,
															event,
														)}
												>
													Delete
												</button>
											</div>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		{/if}
	</section>
</Page>

<style>
	.new-btn,
	.retry-btn,
	.thread-row-main,
	.thread-menu-btn,
	.thread-menu-item {
		border: 0;
		background: transparent;
		font: inherit;
		cursor: pointer;
		text-decoration: none;
	}

	.new-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 9px;
		border-radius: var(--radius-sm);
		color: var(--color-text-2);
		background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
		box-shadow: inset 0 0 0 1px
			color-mix(in srgb, var(--color-line) 75%, transparent);
		font-size: 12px;
		font-weight: 500;
		transition: background 120ms ease;
	}

	.new-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-elevate) 92%, transparent);
	}

	.new-btn:disabled {
		cursor: wait;
		opacity: 0.75;
	}

	.new-btn :global(svg) {
		flex-shrink: 0;
	}

	.list-section {
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: 100%;
	}

	.board {
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
	}

	.board-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.board-group-head {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-inline: 2px;
	}

	.board-group-title-row {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.board-group-title {
		margin: 0;
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.board-group-count {
		color: var(--color-muted);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11px;
		font-weight: 500;
	}

	.board-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.thread-row {
		display: flex;
		align-items: center;
		gap: 2px;
		border-radius: var(--radius-sm);
		transition: background 120ms ease;
	}

	.thread-row:hover {
		background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
	}

	.thread-row.opening,
	.thread-row.closing {
		opacity: 0.65;
	}

	.thread-row-main {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
		flex: 1;
		padding: 10px 6px 10px 10px;
		color: inherit;
		text-align: left;
		border-radius: var(--radius-sm);
	}

	.thread-row-main:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.thread-copy {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		flex: 1;
	}

	.thread-title {
		min-width: 0;
		overflow: hidden;
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.thread-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.thread-source {
		min-width: 0;
		overflow: hidden;
		color: var(--color-muted);
		font-size: 11.5px;
		line-height: 1.35;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.thread-source-badge {
		flex-shrink: 0;
		padding: 1px 6px;
		border-radius: 999px;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-line) 30%, transparent);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.thread-side {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.thread-time {
		flex-shrink: 0;
		color: var(--color-muted);
		font-size: 11.5px;
		white-space: nowrap;
	}

	.thread-menu {
		position: relative;
		flex-shrink: 0;
		margin-right: 4px;
	}

	.thread-menu-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		color: var(--color-muted);
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 120ms ease,
			background 120ms ease,
			color 120ms ease;
	}

	.thread-row:hover .thread-menu-btn,
	.thread-menu-btn:focus-visible,
	.thread-row.closing .thread-menu-btn,
	.thread-menu.open .thread-menu-btn,
	.thread-menu:focus-within .thread-menu-btn {
		opacity: 1;
		pointer-events: auto;
	}

	.thread-menu-btn:hover:not(:disabled) {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
	}

	.thread-menu-btn:disabled {
		cursor: wait;
	}

	.thread-menu-popover {
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

	.thread-menu-item {
		display: block;
		width: 100%;
		padding: 6px 8px;
		border-radius: 5px;
		color: var(--color-text-3);
		font-size: 12px;
		text-align: left;
	}

	.thread-menu-item:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
	}

	.thread-row :global(.row-spinner) {
		flex-shrink: 0;
		opacity: 0.85;
	}

	.state-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 48px 16px;
		text-align: center;
	}

	.state-title {
		margin: 0;
		color: var(--color-ink);
		font-size: 15px;
		font-weight: 500;
	}

	.state-text {
		margin: 0;
		color: var(--color-muted);
		font-size: 13px;
		line-height: 1.45;
	}

	.retry-btn {
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		color: var(--color-accent);
		font-size: 12.5px;
	}

	.retry-btn:hover {
		background: color-mix(in srgb, var(--color-elevate) 60%, transparent);
	}
</style>

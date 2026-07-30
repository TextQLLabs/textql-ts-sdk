<script lang="ts">
	import Database from "@lucide/svelte/icons/database";
	import Star from "@lucide/svelte/icons/star";
	import CalendarClock from "@lucide/svelte/icons/calendar-clock";
	import { onMount } from "svelte";
	import { resolve } from "$app/paths";
	import UnicodeSpinner from "$lib/components/UnicodeSpinner.svelte";
	import { PagedList } from "$lib/pagedList.svelte";
	import { FilterToolbar, Page } from "$lib/primitives";
	import type { FilterField } from "$lib/primitives";
	import { isRecord } from "$lib/utils";

	type AppListItem = {
		id: string;
		name: string;
		description: string | null;
		screenshotUrl: string | null;
		isFavorited: boolean;
		hasUnpublishedChanges: boolean;
		scheduleEnabled: boolean;
		dataSourceCount: number;
		updatedAt: string | null;
	};

	let sentinel = $state<HTMLDivElement | undefined>();

	const list = new PagedList<AppListItem>({
		endpoint: "/api/apps",
		rowsKey: "apps",
		parse: parseApp,
	});

	const apps = $derived(list.items);

	// ListApps has no creator/date/sort params, so the toolbar only exposes the
	// facets the RPC can honour — anything else would silently do nothing.
	const fields: FilterField[] = [
		{
			id: "scope",
			header: "Apps",
			filterable: true,
			filterOptions: [
				{ value: "shared", label: "Shared with me" },
				{ value: "uncategorized", label: "Uncategorized" },
			],
		},
	];

	function monogram(name: string): string {
		return name?.trim().charAt(0).toUpperCase() || "A";
	}

	function formatUpdated(value: string | null) {
		if (!value) return null;
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return null;
		const today = new Date();
		return `Updated ${date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year:
				date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
		})}`;
	}

	function parseApp(item: unknown): AppListItem | null {
		if (!isRecord(item) || typeof item.id !== "string") return null;
		return {
			id: item.id,
			name: typeof item.name === "string" ? item.name : "Untitled app",
			description:
				typeof item.description === "string" ? item.description : null,
			screenshotUrl:
				typeof item.screenshotUrl === "string" ? item.screenshotUrl : null,
			isFavorited: item.isFavorited === true,
			hasUnpublishedChanges: item.hasUnpublishedChanges === true,
			scheduleEnabled: item.scheduleEnabled === true,
			dataSourceCount:
				typeof item.dataSourceCount === "number" ? item.dataSourceCount : 0,
			updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
		};
	}

	onMount(() => {
		void list.load();
	});

	$effect(() => list.watchQuery());

	// Auto-advance when the sentinel scrolls into view; the button below it stays
	// as the keyboard-reachable and post-error path.
	$effect(() => {
		const target = sentinel;
		if (!target) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting) && !list.moreError) {
					void list.loadMore();
				}
			},
			{ rootMargin: "320px" },
		);
		observer.observe(target);
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>Data apps</title>
	<meta name="description" content="Browse the data apps in your workspace." />
</svelte:head>

<Page title="Data apps" lead="Browse the data apps in your workspace." wide>
	<FilterToolbar
		{fields}
		items={[]}
		placeholder="Search apps…"
		searching={list.searching}
		bind:search={list.search}
		bind:filters={list.filters}
		bind:sortEntries={list.sortEntries}
	/>

	<section class="list-section" aria-label="Data app list">
		{#if list.loading}
			<div class="state-block" aria-busy="true">
				<UnicodeSpinner label="Loading apps" />
				<p class="state-text">Loading apps…</p>
			</div>
		{:else if list.error}
			<div class="state-block">
				<p class="state-text">Unable to load apps.</p>
				<button type="button" class="retry-btn" onclick={list.load}>Retry</button>
			</div>
		{:else if apps.length === 0}
			<div class="state-block">
				<p class="state-title">
					{list.narrowed ? "No matching data apps" : "No data apps yet"}
				</p>
				<p class="state-text">
					{list.narrowed
						? "Try clearing a filter or searching for something else."
						: "Data apps you create will show up here."}
				</p>
				{#if list.narrowed}
					<button type="button" class="retry-btn" onclick={() => list.clearFilters()}
						>Clear filters</button
					>
				{/if}
			</div>
		{:else}
			<ul class="app-grid">
				{#each apps as app (app.id)}
					{@const updated = formatUpdated(app.updatedAt)}
					<li>
						<a
							class="app-card"
							href={resolve("/(chat)/apps/[id]", { id: app.id })}
						>
							<span class="app-thumb fallback-tile" aria-hidden="true">
								{#if app.screenshotUrl}
									<!-- Screenshot framed as a mini window rising from the card body. -->
									<span class="app-window">
										<span class="app-window-bar">
											<span class="app-window-dot"></span>
											<span class="app-window-dot"></span>
											<span class="app-window-dot"></span>
										</span>
										<img
											class="app-shot"
											src={app.screenshotUrl}
											alt=""
											loading="lazy"
										/>
										<span class="app-fade"></span>
									</span>
								{:else}
									<span class="app-monogram">{monogram(app.name)}</span>
								{/if}
								{#if app.isFavorited}
									<Star
										class="app-fav"
										size={14}
										strokeWidth={2}
										fill="currentColor"
									/>
								{/if}
							</span>

							<span class="app-body">
								<span class="app-name" title={app.name}>{app.name}</span>
								{#if app.description}
									<span class="app-desc">{app.description}</span>
								{/if}

								<span class="app-meta">
									<span class="app-tag" title="Data sources">
										<Database size={12} strokeWidth={1.75} />
										{app.dataSourceCount}
									</span>
									{#if app.scheduleEnabled}
										<span class="app-tag" title="Scheduled">
											<CalendarClock size={12} strokeWidth={1.75} />
											Scheduled
										</span>
									{/if}
									{#if app.hasUnpublishedChanges}
										<span class="app-tag tone-warn" title="Unpublished changes"
											>Draft</span
										>
									{/if}
									{#if updated}
										<span class="app-updated">{updated}</span>
									{/if}
								</span>
							</span>
						</a>
					</li>
				{/each}
			</ul>

			{#if list.hasMore || list.loadingMore}
				<div class="board-more" bind:this={sentinel}>
					{#if list.moreError}
						<p class="state-text">Couldn't load more apps.</p>
						<button type="button" class="retry-btn" onclick={list.loadMore}>Retry</button>
					{:else if list.loadingMore}
						<UnicodeSpinner label="Loading more apps" />
					{:else}
						<button type="button" class="retry-btn" onclick={list.loadMore}>Load more</button>
					{/if}
				</div>
			{:else}
				<p class="board-end">{apps.length} of {list.totalCount} apps</p>
			{/if}
		{/if}
	</section>
</Page>

<style>
	.list-section {
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: 100%;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.board-more {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 12px 16px 4px;
		text-align: center;
	}

	.board-end {
		margin: 0;
		padding: 12px 16px 4px;
		color: var(--color-muted);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11px;
		text-align: center;
	}

	.app-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 12px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.app-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: 1px solid color-mix(in srgb, var(--color-line) 60%, transparent);
		border-radius: var(--radius-md, 10px);
		overflow: hidden;
		color: inherit;
		text-decoration: none;
		background: color-mix(in srgb, var(--color-elevate) 40%, transparent);
		transition:
			background 120ms ease,
			border-color 120ms ease;
	}

	.app-card:hover {
		border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-line));
		background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
	}

	.app-thumb {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 128px;
		flex-shrink: 0;
		overflow: hidden;
	}

	/* Dot-grid tile behind card previews so any app palette sits well on the surface. */
	.fallback-tile {
		background-color: var(--color-bg, #fff);
		background-image: radial-gradient(
			circle,
			color-mix(in srgb, var(--color-accent) 12%, transparent) 1px,
			transparent 1.5px
		);
		background-size: 14px 14px;
	}

	.app-window {
		position: absolute;
		inset: 20px 24px 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-line) 60%, transparent);
		border-bottom: 0;
		border-radius: 8px 8px 0 0;
		background: var(--color-bg, #fff);
		box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.25);
	}

	.app-window-bar {
		display: flex;
		align-items: center;
		gap: 5px;
		flex-shrink: 0;
		height: 18px;
		padding-inline: 8px;
		border-bottom: 1px solid color-mix(in srgb, var(--color-line) 40%, transparent);
		background: var(--color-bg, #fff);
	}

	.app-window-dot {
		width: 5px;
		height: 5px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-line) 70%, transparent);
	}

	.app-shot {
		min-height: 0;
		width: 100%;
		flex: 1;
		object-fit: cover;
		object-position: top;
	}

	/* Fade the preview into the card body so the cut-off isn't abrupt. */
	.app-fade {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		height: 48px;
		background: linear-gradient(to bottom, transparent, var(--color-bg, #fff));
		pointer-events: none;
	}

	.app-monogram {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border: 1px solid color-mix(in srgb, var(--color-line) 60%, transparent);
		border-radius: 12px;
		background: var(--color-bg, #fff);
		box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.06));
		color: var(--color-accent);
		font-family: var(--font-sans);
		font-size: 22px;
		font-weight: 650;
	}

	:global(.app-thumb .app-fav) {
		position: absolute;
		top: 8px;
		right: 8px;
		color: var(--color-accent);
	}

	.app-body {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 12px;
		min-width: 0;
	}

	.app-name {
		overflow: hidden;
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-size: 13.5px;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.app-desc {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		color: var(--color-muted);
		font-size: 12px;
		line-height: 1.45;
	}

	.app-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		margin-top: 3px;
	}

	.app-tag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 1px 7px;
		border-radius: 999px;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-line) 30%, transparent);
		font-size: 10.5px;
		font-weight: 500;
	}

	.app-tag.tone-warn {
		color: var(--color-warn, #b58900);
		background: color-mix(in srgb, var(--color-warn, #b58900) 16%, transparent);
	}

	.app-updated {
		color: var(--color-muted);
		font-size: 10.5px;
		white-space: nowrap;
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
		border: 0;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-accent);
		font: inherit;
		font-size: 12.5px;
		cursor: pointer;
	}

	.retry-btn:hover {
		background: color-mix(in srgb, var(--color-elevate) 60%, transparent);
	}
</style>

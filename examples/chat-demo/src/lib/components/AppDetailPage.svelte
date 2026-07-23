<script lang="ts">
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import CalendarClock from "@lucide/svelte/icons/calendar-clock";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import Database from "@lucide/svelte/icons/database";
	import ExternalLink from "@lucide/svelte/icons/external-link";
	import FileCode from "@lucide/svelte/icons/file-code";
	import FunctionSquare from "@lucide/svelte/icons/square-function";
	import MessageSquare from "@lucide/svelte/icons/message-square";
	import ShieldCheck from "@lucide/svelte/icons/shield-check";
	import Star from "@lucide/svelte/icons/star";
	import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
	import { afterNavigate } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { attachAppBridge } from "$lib/appBridge";
	import UnicodeSpinner from "$lib/components/UnicodeSpinner.svelte";
	import { toEmbeddablePreviewUrl } from "$lib/previewUrl";
	import { isRecord } from "$lib/utils";

	type DataSource = { type: string | null; name: string | null };
	type ComputeFunction = {
		name: string | null;
		description: string | null;
		returns: string | null;
		paramCount: number;
	};
	type Capability = {
		type: string | null;
		name: string | null;
		connectorId: number | null;
	};
	type AppFile = { path: string; size: number };

	type AppDetail = {
		id: string;
		name: string;
		description: string | null;
		code: string;
		htmlUrl: string | null;
		publishedHtmlUrl: string | null;
		screenshotUrl: string | null;
		chatId: string | null;
		folderId: string | null;
		isFavorited: boolean;
		hasUnpublishedChanges: boolean;
		scheduleEnabled: boolean;
		cronString: string | null;
		consoleErrors: string[];
		dataSources: DataSource[];
		computeFunctions: ComputeFunction[];
		capabilities: Capability[];
		files: AppFile[];
		createdAt: string | null;
		updatedAt: string | null;
		refreshedAt: string | null;
		publishedAt: string | null;
	};

	let app = $state.raw<AppDetail | undefined>();
	let resolvedId = $state<string | undefined>();
	let loadError = $state<string | undefined>();
	let loadRequest: AbortController | undefined;

	const appId = $derived(
		typeof page.params.id === "string" ? page.params.id : undefined,
	);
	const showLoading = $derived(
		Boolean(appId && resolvedId !== appId && !loadError),
	);
	const previewUrl = $derived(
		app ? toEmbeddablePreviewUrl(app.publishedHtmlUrl ?? app.htmlUrl) : null,
	);
	const openUrl = $derived(app?.publishedHtmlUrl ?? app?.htmlUrl ?? null);

	let frameLoaded = $state(false);
	let detailsOpen = $state(false);
	// New app document → show the loading veil again until the fresh frame reports load.
	$effect(() => {
		previewUrl;
		frameLoaded = false;
	});

	// Boots the sandboxed app and relays its ana.compute calls; torn down when the frame remounts.
	function bridge(node: HTMLIFrameElement, options: { appId: string; functionNames: string[] }) {
		const detach = attachAppBridge(node, options);
		return { destroy: detach };
	}

	function apiErrorDetail(payload: unknown, fallback: string): string {
		if (isRecord(payload) && typeof payload.error === "string") {
			return payload.error;
		}
		return fallback;
	}

	function toStr(value: unknown): string | null {
		return typeof value === "string" && value.trim() ? value.trim() : null;
	}

	function parseDetail(value: unknown): AppDetail | null {
		if (!isRecord(value) || typeof value.id !== "string") return null;
		const dataSources = Array.isArray(value.dataSources)
			? value.dataSources.filter(isRecord).map(
					(d): DataSource => ({ type: toStr(d.type), name: toStr(d.name) }),
				)
			: [];
		const computeFunctions = Array.isArray(value.computeFunctions)
			? value.computeFunctions.filter(isRecord).map(
					(f): ComputeFunction => ({
						name: toStr(f.name),
						description: toStr(f.description),
						returns: toStr(f.returns),
						paramCount: typeof f.paramCount === "number" ? f.paramCount : 0,
					}),
				)
			: [];
		const capabilities = Array.isArray(value.capabilities)
			? value.capabilities.filter(isRecord).map(
					(c): Capability => ({
						type: toStr(c.type),
						name: toStr(c.name),
						connectorId: typeof c.connectorId === "number" ? c.connectorId : null,
					}),
				)
			: [];
		const files = Array.isArray(value.files)
			? value.files
					.filter(isRecord)
					.map((f): AppFile | null =>
						typeof f.path === "string"
							? { path: f.path, size: typeof f.size === "number" ? f.size : 0 }
							: null,
					)
					.filter((f): f is AppFile => f !== null)
			: [];
		return {
			id: value.id,
			name: toStr(value.name) ?? "Untitled app",
			description: toStr(value.description),
			code: typeof value.code === "string" ? value.code : "",
			htmlUrl: toStr(value.htmlUrl),
			publishedHtmlUrl: toStr(value.publishedHtmlUrl),
			screenshotUrl: toStr(value.screenshotUrl),
			chatId: toStr(value.chatId),
			folderId: toStr(value.folderId),
			isFavorited: value.isFavorited === true,
			hasUnpublishedChanges: value.hasUnpublishedChanges === true,
			scheduleEnabled: value.scheduleEnabled === true,
			cronString: toStr(value.cronString),
			consoleErrors: Array.isArray(value.consoleErrors)
				? value.consoleErrors.filter((e): e is string => typeof e === "string")
				: [],
			dataSources,
			computeFunctions,
			capabilities,
			files,
			createdAt: toStr(value.createdAt),
			updatedAt: toStr(value.updatedAt),
			refreshedAt: toStr(value.refreshedAt),
			publishedAt: toStr(value.publishedAt),
		};
	}

	function formatTimestamp(value: string | null): string | null {
		if (!value) return null;
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return null;
		return date.toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	}

	async function loadApp(id: string, force = false) {
		if (!force && resolvedId === id && app) return;

		loadRequest?.abort();
		const request = new AbortController();
		loadRequest = request;
		loadError = undefined;

		try {
			const response = await fetch(`/api/apps/${encodeURIComponent(id)}`, {
				signal: request.signal,
			});
			const payload: unknown = await response.json();
			if (!response.ok) {
				throw new Error(apiErrorDetail(payload, "Unable to load app."));
			}
			if (!isRecord(payload)) throw new Error("Unable to load app.");

			const detail = parseDetail(payload.app);
			if (!detail) throw new Error("App not found.");

			app = detail;
			resolvedId = id;
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return;
			loadError =
				error instanceof Error ? error.message : "Unable to load app.";
		}
	}

	afterNavigate(() => {
		if (appId) void loadApp(appId);
	});

	const timestamps = $derived(
		app
			? [
					{ label: "Created", value: formatTimestamp(app.createdAt) },
					{ label: "Updated", value: formatTimestamp(app.updatedAt) },
					{ label: "Refreshed", value: formatTimestamp(app.refreshedAt) },
					{ label: "Published", value: formatTimestamp(app.publishedAt) },
				].filter((row) => row.value !== null)
			: [],
	);
</script>

<svelte:head>
	<title>{app ? app.name : "Data app"}</title>
</svelte:head>

<div class="workspace">
	<header class="bar">
		<a class="back-link" href={resolve("/(chat)/apps")} aria-label="All data apps">
			<ArrowLeft size={15} strokeWidth={2} />
		</a>

		<div class="bar-title">
			<span class="bar-name" title={app?.name}>{app?.name ?? "Data app"}</span>
			{#if app?.isFavorited}
				<Star size={13} strokeWidth={2} fill="currentColor" class="bar-star" />
			{/if}
			{#if app?.hasUnpublishedChanges}
				<span class="badge tone-warn">Unpublished changes</span>
			{/if}
			{#if app?.scheduleEnabled}
				<span class="badge">
					<CalendarClock size={11} strokeWidth={1.75} />
					{app.cronString ?? "Scheduled"}
				</span>
			{/if}
		</div>

		<div class="bar-actions">
			{#if app?.chatId}
				<a
					class="bar-btn"
					href={resolve("/(chat)/chat/[id]", { id: app.chatId })}
					title="Source chat"
				>
					<MessageSquare size={14} strokeWidth={1.75} />
					<span class="bar-btn-label">Chat</span>
				</a>
			{/if}
			{#if openUrl}
				<a class="bar-btn" href={openUrl} target="_blank" rel="noreferrer">
					<ExternalLink size={14} strokeWidth={1.75} />
					<span class="bar-btn-label">Open</span>
				</a>
			{/if}
		</div>
	</header>

	<div class="stage">
		{#if showLoading}
			<div class="stage-state" aria-busy="true">
				<UnicodeSpinner label="Loading app" />
				<p class="stage-text">Loading app…</p>
			</div>
		{:else if loadError}
			<div class="stage-state">
				<p class="stage-text">{loadError}</p>
				{#if appId}
					<button
						type="button"
						class="retry-btn"
						onclick={() => appId && loadApp(appId, true)}>Retry</button
					>
				{/if}
			</div>
		{:else if app && previewUrl}
			<!-- The app renders here, full-bleed, exactly like the standalone /app view. -->
			{#key previewUrl}
				<iframe
					class="app-frame"
					src={previewUrl}
					title={app.name}
					sandbox="allow-scripts"
					loading="lazy"
					use:bridge={{
						appId: app.id,
						functionNames: app.computeFunctions
							.map((fn) => fn.name)
							.filter((name): name is string => name !== null),
					}}
					onload={() => (frameLoaded = true)}
				></iframe>
			{/key}
			{#if !frameLoaded}
				<div class="stage-veil" aria-busy="true">
					<UnicodeSpinner label="Rendering app" />
				</div>
			{/if}
		{:else if app?.screenshotUrl}
			<img class="app-shot" src={app.screenshotUrl} alt={`${app.name} preview`} />
		{:else if app}
			<div class="stage-state">
				<p class="stage-text">This app has no rendered preview yet.</p>
			</div>
		{/if}
	</div>

	{#if app}
		<section class="details" class:open={detailsOpen}>
			<button
				type="button"
				class="details-toggle"
				aria-expanded={detailsOpen}
				onclick={() => (detailsOpen = !detailsOpen)}
			>
				<ChevronDown size={14} strokeWidth={2} class="details-chevron" />
				<span>Details</span>
				<span class="details-summary">
					{app.dataSources.length} sources · {app.computeFunctions.length} functions
					· {app.files.length} files{#if app.consoleErrors.length}
						· <span class="details-error">{app.consoleErrors.length} errors</span>{/if}
				</span>
			</button>

			{#if detailsOpen}
				<div class="details-body">
					{#if app.description}
						<p class="details-lead">{app.description}</p>
					{/if}

					{#if app.consoleErrors.length > 0}
						<div class="console-errors" role="alert">
							<p class="console-errors-title">
								<TriangleAlert size={13} strokeWidth={2} />
								Console errors ({app.consoleErrors.length})
							</p>
							<ul class="console-errors-list">
								{#each app.consoleErrors as message, i (i)}
									<li>{message}</li>
								{/each}
							</ul>
						</div>
					{/if}

					<div class="section-grid">
						<section class="detail-section">
							<h2 class="section-title">
								<Database size={13} strokeWidth={1.75} />
								Data sources
								<span class="section-count">{app.dataSources.length}</span>
							</h2>
							{#if app.dataSources.length === 0}
								<p class="section-empty">No data sources.</p>
							{:else}
								<ul class="row-list">
									{#each app.dataSources as source, i (i)}
										<li class="row">
											<span class="row-name">{source.name ?? "Unnamed source"}</span>
											{#if source.type}
												<span class="row-tag">{source.type}</span>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}
						</section>

						<section class="detail-section">
							<h2 class="section-title">
								<FunctionSquare size={13} strokeWidth={1.75} />
								Compute functions
								<span class="section-count">{app.computeFunctions.length}</span>
							</h2>
							{#if app.computeFunctions.length === 0}
								<p class="section-empty">No compute functions.</p>
							{:else}
								<ul class="row-list">
									{#each app.computeFunctions as fn, i (i)}
										<li class="row row-col">
											<span class="row-name-line">
												<span class="row-name">{fn.name ?? "Unnamed function"}</span>
												<span class="row-tag">{fn.paramCount} params</span>
												{#if fn.returns}
													<span class="row-tag">→ {fn.returns}</span>
												{/if}
											</span>
											{#if fn.description}
												<span class="row-desc">{fn.description}</span>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}
						</section>

						<section class="detail-section">
							<h2 class="section-title">
								<ShieldCheck size={13} strokeWidth={1.75} />
								Capabilities
								<span class="section-count">{app.capabilities.length}</span>
							</h2>
							{#if app.capabilities.length === 0}
								<p class="section-empty">No capabilities.</p>
							{:else}
								<ul class="row-list">
									{#each app.capabilities as cap, i (i)}
										<li class="row">
											<span class="row-name">{cap.name ?? cap.type ?? "Capability"}</span>
											{#if cap.connectorId !== null}
												<span class="row-tag">connector {cap.connectorId}</span>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}
						</section>

						<section class="detail-section">
							<h2 class="section-title">
								<FileCode size={13} strokeWidth={1.75} />
								Files
								<span class="section-count">{app.files.length}</span>
							</h2>
							{#if app.files.length === 0}
								<p class="section-empty">No files.</p>
							{:else}
								<ul class="row-list">
									{#each app.files as file (file.path)}
										<li class="row">
											<span class="row-name mono">{file.path}</span>
											<span class="row-tag">{file.size.toLocaleString()} B</span>
										</li>
									{/each}
								</ul>
							{/if}
						</section>
					</div>

					{#if timestamps.length > 0}
						<section class="detail-section">
							<h2 class="section-title">Timeline</h2>
							<dl class="meta-list">
								{#each timestamps as row (row.label)}
									<div class="meta-row">
										<dt>{row.label}</dt>
										<dd>{row.value}</dd>
									</div>
								{/each}
							</dl>
						</section>
					{/if}
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	.workspace {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 0;
		background: var(--color-paper);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
		padding: 7px 12px;
		border-bottom: 1px solid color-mix(in srgb, var(--color-line) 80%, transparent);
		background: color-mix(in srgb, var(--color-paper) 92%, var(--color-elevate));
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		color: var(--color-muted);
	}

	.back-link:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
	}

	.bar-title {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		flex: 1;
	}

	.bar-name {
		min-width: 0;
		overflow: hidden;
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.bar-title .bar-star) {
		flex-shrink: 0;
		color: var(--color-accent);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
		padding: 2px 8px;
		border-radius: 999px;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-line) 30%, transparent);
		font-size: 10.5px;
		font-weight: 500;
	}

	.badge.tone-warn {
		color: var(--color-warn, #b58900);
		background: color-mix(in srgb, var(--color-warn, #b58900) 16%, transparent);
	}

	.bar-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.bar-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 10px;
		border: 1px solid color-mix(in srgb, var(--color-line) 60%, transparent);
		border-radius: var(--radius-sm);
		color: var(--color-ink);
		font-size: 12px;
		font-weight: 500;
		text-decoration: none;
	}

	.bar-btn:hover {
		border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-line));
		background: color-mix(in srgb, var(--color-elevate) 60%, transparent);
	}

	.stage {
		position: relative;
		flex: 1;
		min-height: 0;
		background: var(--color-bg, #fff);
	}

	.app-frame {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}

	.app-shot {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: top;
	}

	.stage-veil {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg, #fff);
		/* Cosmetic only — never trap clicks meant for the app underneath. */
		pointer-events: none;
	}

	.stage-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 24px;
		text-align: center;
	}

	.stage-text {
		margin: 0;
		color: var(--color-muted);
		font-size: 13px;
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

	.details {
		flex-shrink: 0;
		border-top: 1px solid color-mix(in srgb, var(--color-line) 80%, transparent);
		background: color-mix(in srgb, var(--color-paper) 94%, var(--color-elevate));
	}

	.details-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 9px 14px;
		border: 0;
		background: transparent;
		color: var(--color-ink);
		font: inherit;
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
	}

	.details-toggle:hover {
		background: color-mix(in srgb, var(--color-elevate) 50%, transparent);
	}

	:global(.details .details-chevron) {
		transition: transform 140ms ease;
	}

	.details.open :global(.details-chevron) {
		transform: rotate(180deg);
	}

	.details-summary {
		color: var(--color-muted);
		font-weight: 400;
		font-size: 11.5px;
	}

	.details-error {
		color: var(--color-danger, #d64545);
	}

	.details-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-height: 42vh;
		overflow-y: auto;
		padding: 4px 16px 20px;
	}

	.details-lead {
		margin: 0;
		max-width: 68ch;
		color: var(--color-muted);
		font-size: 13px;
		line-height: 1.5;
	}

	.console-errors {
		padding: 12px 14px;
		border: 1px solid color-mix(in srgb, var(--color-danger, #d64545) 40%, transparent);
		border-radius: var(--radius-md, 10px);
		background: color-mix(in srgb, var(--color-danger, #d64545) 10%, transparent);
	}

	.console-errors-title {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0 0 6px;
		color: var(--color-danger, #d64545);
		font-size: 12.5px;
		font-weight: 600;
	}

	.console-errors-list {
		margin: 0;
		padding-left: 20px;
		color: var(--color-muted);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11.5px;
		line-height: 1.5;
	}

	.section-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
	}

	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.section-count {
		color: var(--color-muted);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11px;
		font-weight: 500;
	}

	.section-empty {
		margin: 0;
		color: var(--color-muted);
		font-size: 12.5px;
	}

	.row-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-elevate) 45%, transparent);
	}

	.row-col {
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
	}

	.row-name-line {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.row-name {
		min-width: 0;
		overflow: hidden;
		color: var(--color-ink);
		font-size: 12.5px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-name.mono {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 12px;
	}

	.row-desc {
		color: var(--color-muted);
		font-size: 12px;
		line-height: 1.45;
	}

	.row-tag {
		flex-shrink: 0;
		margin-left: auto;
		padding: 1px 7px;
		border-radius: 999px;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-line) 30%, transparent);
		font-size: 10.5px;
		font-weight: 500;
	}

	.row-col .row-tag {
		margin-left: 0;
	}

	.meta-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 10px;
		margin: 0;
	}

	.meta-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-row dt {
		color: var(--color-muted);
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.meta-row dd {
		margin: 0;
		color: var(--color-ink);
		font-size: 12.5px;
	}

	@media (max-width: 560px) {
		.bar-btn-label {
			display: none;
		}
	}
</style>

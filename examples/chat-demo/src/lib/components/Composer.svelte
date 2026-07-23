<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Boxes from '@lucide/svelte/icons/boxes';
	import Cable from '@lucide/svelte/icons/cable';
	import Check from '@lucide/svelte/icons/check';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Plus from '@lucide/svelte/icons/plus';
	import { CHAT_MODELS, DEFAULT_CHAT_MODEL } from '$lib/chatModels';
	import { connectorIconSrc } from '$lib/connectorIcons';
	import { connectorsCache } from '$lib/connectorsCache.svelte';

	type Flyout = 'models' | 'connectors';

	interface Props {
		value?: string;
		sending?: boolean;
		docked?: boolean;
		/** When true, model + connectors are read-only (existing chat). */
		configLocked?: boolean;
		selectedConnectorIds?: number[];
		selectedModel?: string;
		onsend?: () => void;
		class?: string;
	}

	let {
		value = $bindable(''),
		sending = false,
		docked = false,
		configLocked = false,
		selectedConnectorIds = $bindable<number[]>([]),
		selectedModel = $bindable(DEFAULT_CHAT_MODEL as string),
		onsend,
		class: className = ''
	}: Props = $props();

	const ROOT_ITEMS = [
		{ id: 'models' as const, label: 'Models', icon: Boxes },
		{ id: 'connectors' as const, label: 'Connectors', icon: Cable }
	];

	let menuOpen = $state(false);
	let flyout = $state<Flyout | null>(null);
	let connectorQuery = $state('');
	let menuRoot: HTMLDivElement | undefined;
	let textareaEl: HTMLTextAreaElement | undefined;

	const normalizedConnectorQuery = $derived(connectorQuery.trim().toLowerCase());

	const filteredConnectors = $derived(
		connectorsCache.connectors.filter((connector) => {
			if (!normalizedConnectorQuery) return true;
			return (
				connector.name.toLowerCase().includes(normalizedConnectorQuery) ||
				connector.type.toLowerCase().includes(normalizedConnectorQuery)
			);
		})
	);

	const selectedModelLabel = $derived(
		CHAT_MODELS.find((model) => model.id === selectedModel)?.label ??
			selectedModel.replace(/^MODEL_/, '').replaceAll('_', ' ')
	);

	const selectedChips = $derived(
		selectedConnectorIds.map((id) => {
			const match = connectorsCache.connectors.find((connector) => connector.id === id);
			return {
				id,
				name: match?.name ?? `Connector ${id}`,
				type: match?.type ?? 'UNKNOWN'
			};
		})
	);

	function openMenu(initialFlyout: Flyout | null = null) {
		if (configLocked) return;
		menuOpen = true;
		flyout = initialFlyout;
		connectorQuery = '';
		if (initialFlyout === 'connectors') {
			void connectorsCache.load();
		}
	}

	function closeMenu() {
		menuOpen = false;
		flyout = null;
		connectorQuery = '';
	}

	function toggleMenu() {
		if (configLocked) return;
		if (menuOpen) {
			closeMenu();
			return;
		}
		openMenu();
	}

	function openFlyout(next: Flyout) {
		if (configLocked) return;
		if (flyout === next) return;
		flyout = next;
		connectorQuery = '';
		if (next === 'connectors') {
			void connectorsCache.load();
		}
	}

	function selectModel(modelId: string) {
		if (configLocked) return;
		selectedModel = modelId;
		closeMenu();
		textareaEl?.focus();
	}

	function toggleConnector(connector: { id: number; name: string }) {
		if (configLocked) return;

		if (selectedConnectorIds.includes(connector.id)) {
			selectedConnectorIds = selectedConnectorIds.filter((id) => id !== connector.id);
		} else {
			selectedConnectorIds = [...selectedConnectorIds, connector.id];
		}
	}

	function removeConnector(id: number) {
		if (configLocked) return;
		selectedConnectorIds = selectedConnectorIds.filter((selectedId) => selectedId !== id);
	}

	const TEXTAREA_MAX_PX = 160;

	function resizeTextarea() {
		const el = textareaEl;
		if (!el) return;
		el.style.height = '0px';
		const next = Math.min(el.scrollHeight, TEXTAREA_MAX_PX);
		el.style.height = `${next}px`;
		el.style.overflowY = el.scrollHeight > TEXTAREA_MAX_PX ? 'auto' : 'hidden';
	}

	function insertNewline() {
		const el = textareaEl;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		value = `${value.slice(0, start)}\n${value.slice(end)}`;
		queueMicrotask(() => {
			el.selectionStart = el.selectionEnd = start + 1;
			resizeTextarea();
			el.focus();
		});
	}

	function handleComposerKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;

		// Cmd/Ctrl+Enter or Shift+Enter → new line (grows until max, then scrolls).
		if (event.metaKey || event.ctrlKey || event.shiftKey) {
			event.preventDefault();
			insertNewline();
			return;
		}

		event.preventDefault();
		onsend?.();
	}

	$effect(() => {
		value;
		queueMicrotask(resizeTextarea);
	});

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && menuOpen) {
			event.preventDefault();
			if (flyout) {
				flyout = null;
				connectorQuery = '';
				return;
			}
			closeMenu();
		}
	}

	function handleWindowPointerDown(event: PointerEvent) {
		if (!menuOpen || !menuRoot) return;
		const target = event.target;
		if (!(target instanceof Node) || menuRoot.contains(target)) return;
		closeMenu();
	}

	function attachMenuRoot(element: HTMLDivElement) {
		menuRoot = element;
		return () => {
			if (menuRoot === element) menuRoot = undefined;
		};
	}

	function attachConnectorSearchInput(element: HTMLInputElement) {
		queueMicrotask(() => element.focus());
	}

	function attachTextarea(element: HTMLTextAreaElement) {
		textareaEl = element;
		queueMicrotask(resizeTextarea);
		return () => {
			if (textareaEl === element) textareaEl = undefined;
		};
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} onpointerdown={handleWindowPointerDown} />

<div class={['composer', docked && 'docked', className]}>
	<textarea
		{@attach attachTextarea}
		bind:value
		onkeydown={handleComposerKeydown}
		rows="1"
		placeholder="Plan, @ for context, / for commands"
		aria-label="Message"
	></textarea>

	<div class="composer-toolbar">
		<div class="toolbar-left" {@attach attachMenuRoot}>
			{#if !configLocked}
				<button
					type="button"
					class="icon-circle"
					class:active={menuOpen || selectedConnectorIds.length > 0}
					aria-label="Composer settings"
					aria-haspopup="menu"
					aria-expanded={menuOpen}
					onclick={toggleMenu}
				>
					<Plus size={15} strokeWidth={1.5} aria-hidden="true" />
				</button>
			{/if}

			{#if selectedChips.length > 0}
				<div class="meta-row">
					<div class="connector-stack" aria-label="Attached connectors">
						{#each selectedChips.slice(0, 3) as chip (chip.id)}
							{#if configLocked}
								<span class="connector-dot" aria-label={chip.name}>
									<img src={connectorIconSrc(chip.type)} alt="" />
									<span class="connector-tip">{chip.name}</span>
								</span>
							{:else}
								<button
									type="button"
									class="connector-dot"
									aria-label={`Remove ${chip.name}`}
									onclick={() => removeConnector(chip.id)}
								>
									<img src={connectorIconSrc(chip.type)} alt="" />
									<span class="connector-tip">{chip.name}</span>
								</button>
							{/if}
						{/each}
						{#if selectedChips.length > 3}
							<button
								type="button"
								class="connector-more"
								aria-label={`${selectedChips.length - 3} more connectors`}
								onclick={() => openMenu('connectors')}
								disabled={configLocked}
							>
								+{selectedChips.length - 3}
								<span class="connector-tip"
									>{selectedChips.length - 3} more</span
								>
							</button>
						{/if}
					</div>
				</div>
			{/if}

			{#if menuOpen && !configLocked}
				<div class="menu-shell">
					<div class="popover root-popover" role="menu" aria-label="Composer settings">
						<div class="menu-section">
							{#each ROOT_ITEMS as item (item.id)}
								<button
									type="button"
									class="menu-row"
									class:flyout-open={flyout === item.id}
									role="menuitem"
									aria-haspopup="menu"
									aria-expanded={flyout === item.id}
									onmouseenter={() => openFlyout(item.id)}
									onfocus={() => openFlyout(item.id)}
									onclick={() => openFlyout(item.id)}
								>
									<span class="menu-row-main">
										<span class="menu-icon" aria-hidden="true">
											<item.icon size={14} strokeWidth={1.5} />
										</span>
										{item.label}
									</span>
									<span class="menu-meta">
										{#if item.id === 'connectors' && selectedConnectorIds.length > 0}
											<span class="badge">{selectedConnectorIds.length}</span>
										{:else if item.id === 'models'}
											<span class="menu-hint">{selectedModelLabel}</span>
										{/if}
										<ChevronRight class="chevron" size={14} strokeWidth={1.5} aria-hidden="true" />
									</span>
								</button>
							{/each}
						</div>
					</div>

					{#if flyout === 'models'}
						<div class="popover flyout-popover" role="menu" aria-label="Models">
							<div class="menu-section models-list">
								{#each CHAT_MODELS as model (model.id)}
									<button
										type="button"
										class="menu-row model-row"
										class:selected={selectedModel === model.id}
										role="menuitem"
										onclick={() => selectModel(model.id)}
									>
										<span class="model-row-main">
											<img
												class="model-logo"
												src={connectorIconSrc(model.provider)}
												alt=""
											/>
											<span class="menu-row-main column">
												<span class="model-title">{model.label}</span>
												<span class="model-hint">{model.hint}</span>
											</span>
										</span>
										{#if selectedModel === model.id}
											<span class="check-mark" aria-hidden="true">
												<Check size={14} strokeWidth={1.5} />
											</span>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{:else if flyout === 'connectors'}
						<div class="popover flyout-popover" role="menu" aria-label="Connectors">
							<label class="search-field">
								<span class="sr-only">Search connectors</span>
								<input
									{@attach attachConnectorSearchInput}
									type="search"
									bind:value={connectorQuery}
									placeholder="Search connectors..."
									autocomplete="off"
								/>
							</label>

							<div class="connectors-list" aria-live="polite" aria-busy={connectorsCache.loading}>
								{#if connectorsCache.loading && !connectorsCache.loaded}
									<p class="state-copy">Loading connectors…</p>
								{:else if connectorsCache.error && !connectorsCache.loaded}
									<div class="state-block">
										<p class="state-copy tight">Couldn’t load connectors.</p>
										<button type="button" class="retry-btn" onclick={() => connectorsCache.load(true)}>
											Retry
										</button>
									</div>
								{:else if connectorsCache.connectors.length === 0}
									<p class="state-copy">No connectors available.</p>
								{:else if filteredConnectors.length === 0}
									<p class="state-copy">No matches.</p>
								{:else}
									{#each filteredConnectors as connector (connector.id)}
										<button
											type="button"
											class="connector-row"
											class:attached={selectedConnectorIds.includes(connector.id)}
											onclick={() => toggleConnector(connector)}
										>
											<img
												class="connector-icon"
												src={connectorIconSrc(connector.type)}
												alt=""
											/>
											<span class="connector-name">{connector.name}</span>
											{#if selectedConnectorIds.includes(connector.id)}
												<span class="check-mark" aria-hidden="true">
													<Check size={14} strokeWidth={1.5} />
												</span>
											{/if}
										</button>
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="toolbar-right">
			<span class="model-label" aria-label={`Model: ${selectedModelLabel}`}>{selectedModelLabel}</span>
			<button
				type="button"
				class="send-btn"
				disabled={!value.trim() || sending}
				aria-label="Send message"
				onclick={() => onsend?.()}
			>
				<ArrowUp size={15} strokeWidth={2} aria-hidden="true" />
			</button>
		</div>
	</div>
</div>

<style>
	.composer {
		display: flex;
		width: min(640px, 100%);
		flex-direction: column;
		gap: 8px;
		padding: 12px 14px 10px;
		border: 1px solid color-mix(in srgb, var(--color-line) 95%, #cfcfd4);
		border-radius: var(--radius-lg);
		background: var(--color-elevate);
		box-shadow:
			0 1px 2px rgba(15, 15, 20, 0.03),
			0 10px 28px rgba(15, 15, 20, 0.06);
	}

	.composer.docked {
		width: min(720px, 100%);
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
		min-height: 22px;
		max-height: 160px;
		padding: 0 4px;
		resize: none;
		overflow-y: hidden;
		border: 0;
		outline: 0;
		color: var(--color-ink);
		background: transparent;
		font: inherit;
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

	.toolbar-left {
		position: relative;
		display: flex;
		min-width: 0;
		flex: 1;
		align-items: center;
		gap: 6px;
	}

	.toolbar-right {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 8px;
	}

	.icon-circle,
	.send-btn,
	.menu-row,
	.retry-btn,
	.connector-row,
	.connector-dot,
	.connector-more {
		border: 0;
		font: inherit;
		cursor: pointer;
	}

	.icon-circle {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 1px solid transparent;
		border-radius: 999px;
		color: #a1a1aa;
		background: transparent;
	}

	.icon-circle:hover,
	.icon-circle.active {
		color: #71717a;
		background: color-mix(in srgb, var(--color-ink) 4%, transparent);
	}

	.model-label {
		display: inline-block;
		max-width: 160px;
		overflow: hidden;
		color: #a1a1aa;
		font-size: 12px;
		font-weight: 500;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
		user-select: none;
		pointer-events: none;
	}

	.meta-row {
		display: inline-flex;
		min-width: 0;
		align-items: center;
	}

	.connector-stack {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
	}

	.connector-dot {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		margin-left: -6px;
		padding: 0;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-accent) 8%, var(--color-elevate));
		box-shadow: 0 0 0 1.5px #fff;
		transition:
			transform 0.12s ease,
			background 0.12s ease;
	}

	.connector-dot:first-child {
		margin-left: 0;
	}

	.connector-dot img {
		width: 13px;
		height: 13px;
		object-fit: contain;
	}

	.connector-dot:hover,
	.connector-dot:focus-visible,
	.connector-dot:active {
		z-index: 2;
		background: #e0e7ff;
		transform: translateY(-1px) scale(1.06);
	}

	.connector-dot:active {
		transform: translateY(0) scale(0.96);
		background: #c7d2fe;
	}

	.connector-tip {
		position: absolute;
		bottom: calc(100% + 6px);
		left: 50%;
		z-index: 5;
		padding: 3px 7px;
		border-radius: 6px;
		color: #fafafa;
		background: #27272a;
		font-size: 11px;
		font-weight: 500;
		line-height: 1.2;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transform: translateX(-50%) translateY(2px);
		transition:
			opacity 0.12s ease,
			transform 0.12s ease;
	}

	.connector-dot:hover .connector-tip,
	.connector-dot:focus-visible .connector-tip,
	.connector-dot:active .connector-tip,
	.connector-more:hover .connector-tip,
	.connector-more:focus-visible .connector-tip {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}

	.connector-more {
		position: relative;
		margin-left: 4px;
		padding: 0 2px;
		color: #a1a1aa;
		background: transparent;
		font-size: 11px;
		font-weight: 600;
	}

	.connector-more:hover:not(:disabled) {
		color: #71717a;
	}

	.connector-more:disabled {
		cursor: default;
	}

	@media (prefers-reduced-motion: reduce) {
		.connector-dot {
			transition: none;
		}

		.connector-tip {
			transition: none;
		}
	}

	.menu-shell {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 0;
		z-index: 20;
	}

	.popover {
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, #d4d4d8);
		border-radius: 12px;
		background: var(--color-elevate);
		box-shadow:
			0 1px 2px rgba(15, 15, 20, 0.04),
			0 14px 32px rgba(15, 15, 20, 0.1);
	}

	.root-popover {
		position: relative;
		width: min(240px, calc(100vw - 32px));
	}

	.flyout-popover {
		position: absolute;
		bottom: 0;
		left: calc(100% + 4px);
		width: min(272px, calc(100vw - 32px));
		animation: flyout-in 120ms ease;
	}

	@keyframes flyout-in {
		from {
			opacity: 0;
			transform: translateX(-4px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.search-field {
		display: block;
		padding: 6px 6px 4px;
	}

	.search-field input {
		width: 100%;
		padding: 6px 8px;
		border: 0;
		border-radius: 7px;
		color: var(--color-ink);
		background: var(--color-fill);
		font: inherit;
		font-size: 12px;
		outline: 0;
	}

	.search-field input::placeholder {
		color: #a1a1aa;
	}

	.search-field input:focus {
		background: var(--color-sidebar);
	}

	.menu-section {
		display: flex;
		flex-direction: column;
		padding: 2px;
	}

	.models-list {
		max-height: 240px;
		overflow-y: auto;
		padding-bottom: 4px;
	}

	.menu-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
		padding: 6px 8px;
		border-radius: 7px;
		color: var(--color-text-strong);
		background: transparent;
		font-size: 12.5px;
		text-align: left;
	}

	.menu-row:hover,
	.menu-row.flyout-open,
	.menu-row.selected,
	.model-row:hover {
		background: var(--color-fill);
	}

	.menu-row-main {
		display: inline-flex;
		min-width: 0;
		align-items: center;
		gap: 8px;
	}

	.menu-row-main.column {
		flex-direction: column;
		align-items: flex-start;
		gap: 1px;
	}

	.model-row-main {
		display: inline-flex;
		min-width: 0;
		align-items: center;
		gap: 8px;
	}

	.model-logo {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		object-fit: contain;
		border-radius: 3px;
	}

	.menu-icon {
		display: inline-flex;
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		color: #71717a;
	}

	.menu-meta {
		display: inline-flex;
		min-width: 0;
		align-items: center;
		gap: 6px;
	}

	.menu-hint {
		overflow: hidden;
		max-width: 90px;
		color: var(--color-muted);
		font-size: 10.5px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		display: inline-flex;
		min-width: 18px;
		align-items: center;
		justify-content: center;
		padding: 1px 6px;
		border-radius: 999px;
		color: var(--color-text-2);
		background: var(--color-sidebar);
		font-size: 11px;
		font-weight: 600;
	}

	.menu-meta :global(.chevron) {
		flex-shrink: 0;
		color: #a1a1aa;
	}

	.model-title {
		overflow: hidden;
		color: var(--color-text-strong);
		font-size: 12.5px;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.model-hint {
		overflow: hidden;
		color: var(--color-muted);
		font-size: 11px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.connectors-list {
		display: flex;
		max-height: 220px;
		flex-direction: column;
		gap: 1px;
		overflow-y: auto;
		padding: 2px 2px 6px;
	}

	.connector-row {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 7px 8px;
		border-radius: 7px;
		color: inherit;
		background: transparent;
		text-align: left;
	}

	.connector-row:hover,
	.connector-row.attached {
		background: var(--color-fill);
	}

	.connector-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		object-fit: contain;
	}

	.connector-name {
		min-width: 0;
		flex: 1;
		overflow: hidden;
		color: var(--color-text-strong);
		font-size: 12.5px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.check-mark {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		color: var(--color-text-3);
	}

	.state-block {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 6px;
		padding: 6px 8px;
	}

	.state-copy {
		margin: 0;
		padding: 8px;
		color: var(--color-muted);
		font-size: 11.5px;
		line-height: 1.35;
	}

	.state-copy.tight,
	.state-block .state-copy {
		padding: 0;
	}

	.retry-btn {
		padding: 5px 10px;
		border-radius: 8px;
		color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, var(--color-elevate));
		font-size: 12px;
		font-weight: 500;
	}

	.retry-btn:hover {
		background: color-mix(in srgb, var(--color-accent) 14%, var(--color-elevate));
	}

	.send-btn {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		color: #fff;
		background: #171717;
		transition:
			opacity 120ms ease,
			transform 120ms ease;
	}

	.send-btn:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.send-btn:disabled {
		cursor: not-allowed;
		opacity: 0.35;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 560px) {
		.model-label {
			max-width: 110px;
		}

		.flyout-popover {
			left: 0;
			bottom: calc(100% + 4px);
			width: min(240px, calc(100vw - 32px));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.send-btn {
			transition: none;
		}

		.flyout-popover {
			animation: none;
		}
	}
</style>

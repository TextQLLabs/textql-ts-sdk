<script lang="ts">
	import type { Component } from 'svelte';
	import AppWindow from '@lucide/svelte/icons/app-window';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Boxes from '@lucide/svelte/icons/boxes';
	import Braces from '@lucide/svelte/icons/braces';
	import Cable from '@lucide/svelte/icons/cable';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Cloud from '@lucide/svelte/icons/cloud';
	import CodeXml from '@lucide/svelte/icons/code-xml';
	import Database from '@lucide/svelte/icons/database';
	import Globe from '@lucide/svelte/icons/globe';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Mail from '@lucide/svelte/icons/mail';
	import Network from '@lucide/svelte/icons/network';
	import Plus from '@lucide/svelte/icons/plus';
	import Terminal from '@lucide/svelte/icons/terminal';
	import {
		enabledToolDisplays,
		previewToolsFromSelection,
		type ChatTools,
		type ToolFlagKey
	} from '$lib/chatTools';
	import { connectorIconSrc } from '$lib/connectorIcons';
	import { connectorsCache } from '$lib/connectorsCache.svelte';

	type ModelOption = {
		id: string;
		label: string;
		hint: string;
	};

	type Flyout = 'models' | 'connectors';

	interface Props {
		value?: string;
		sending?: boolean;
		docked?: boolean;
		/** When true, model + connectors are read-only (existing chat). */
		configLocked?: boolean;
		selectedConnectorIds?: number[];
		selectedModel?: string;
		/**
		 * Enabled tools from GetChat (existing chat). When null/undefined on a blank chat,
		 * tools are inferred from the current selection (connectors → SQL).
		 */
		tools?: ChatTools | null;
		onsend?: () => void;
		class?: string;
	}

	const TOOL_ICONS: Record<ToolFlagKey, Component> = {
		sqlEnabled: Database,
		pythonEnabled: Braces,
		webSearchEnabled: Globe,
		bashEnabled: Terminal,
		javascriptEnabled: CodeXml,
		ontologyEnabled: Network,
		googleDriveEnabled: Cloud,
		gmailEnabled: Mail,
		googleCalendarEnabled: Calendar,
		microsoft365Enabled: AppWindow,
		powerbiEnabled: ChartColumn,
		streamlitEnabled: LayoutDashboard
	};

	const CLAUDE_MODELS: ModelOption[] = [
		{ id: 'MODEL_HAIKU_4_5', label: 'Claude Haiku 4.5', hint: 'Fast responses for quick tasks' },
		{ id: 'MODEL_SONNET_5', label: 'Claude Sonnet 5', hint: 'Balanced speed and quality' },
		{ id: 'MODEL_OPUS_4_8', label: 'Claude Opus 4.8', hint: 'Highest capability for hard work' }
	];

	let {
		value = $bindable(''),
		sending = false,
		docked = false,
		configLocked = false,
		selectedConnectorIds = $bindable<number[]>([]),
		selectedModel = $bindable('MODEL_SONNET_5'),
		tools = null,
		onsend,
		class: className = ''
	}: Props = $props();

	const ROOT_ITEMS = [
		{ id: 'models' as const, label: 'Models' },
		{ id: 'connectors' as const, label: 'Connectors' }
	];

	let menuOpen = $state(false);
	let flyout = $state<Flyout | null>(null);
	let connectorQuery = $state('');
	let connectorNames = $state.raw<Record<number, string>>({});
	let menuRoot: HTMLDivElement | undefined;
	let connectorSearchInput: HTMLInputElement | undefined;
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
		CLAUDE_MODELS.find((model) => model.id === selectedModel)?.label ??
			selectedModel.replace(/^MODEL_/, '').replaceAll('_', ' ')
	);

	const selectedChips = $derived(
		selectedConnectorIds.map((id) => {
			const match = connectorsCache.connectors.find((connector) => connector.id === id);
			return {
				id,
				name: connectorsCache.nameFor(id, connectorNames),
				type: match?.type ?? 'UNKNOWN'
			};
		})
	);

	const activeTools = $derived(
		tools != null ? tools : previewToolsFromSelection(selectedConnectorIds)
	);
	const toolItems = $derived(enabledToolDisplays(activeTools));

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
		connectorNames = { ...connectorNames, [connector.id]: connector.name };

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

	function handleComposerKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			onsend?.();
		}
	}

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
		connectorSearchInput = element;
		queueMicrotask(() => element.focus());
		return () => {
			if (connectorSearchInput === element) connectorSearchInput = undefined;
		};
	}

	function attachTextarea(element: HTMLTextAreaElement) {
		textareaEl = element;
		return () => {
			if (textareaEl === element) textareaEl = undefined;
		};
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} onpointerdown={handleWindowPointerDown} />

<div class={['composer', docked && 'docked', className]}>
	{#if selectedChips.length > 0}
		<div class="attachments" aria-label="Attached connectors">
			{#each selectedChips as chip (chip.id)}
				<span class="attachment-pill">
					<img class="attachment-icon" src={connectorIconSrc(chip.type)} alt="" />
					<span class="attachment-label">{chip.name}</span>
					{#if !configLocked}
						<button
							type="button"
							class="attachment-remove"
							aria-label={`Remove ${chip.name}`}
							onclick={() => removeConnector(chip.id)}
						>
							×
						</button>
					{/if}
				</span>
			{/each}
		</div>
	{/if}

	<textarea
		{@attach attachTextarea}
		bind:value
		onkeydown={handleComposerKeydown}
		rows="3"
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
					aria-label="Add context"
					aria-haspopup="menu"
					aria-expanded={menuOpen}
					onclick={toggleMenu}
				>
					<Plus size={15} strokeWidth={1.5} aria-hidden="true" />
				</button>
			{/if}

			<button
				type="button"
				class="model-pill"
				class:locked={configLocked}
				disabled={configLocked}
				aria-disabled={configLocked}
				onclick={() => openMenu('models')}
			>
				<span>{selectedModelLabel}</span>
				{#if !configLocked}
					<ChevronDown class="chevron-down" size={14} strokeWidth={1.5} aria-hidden="true" />
				{/if}
			</button>

			{#if toolItems.length > 0}
				<div class="tools-row" aria-label="Available tools">
					{#each toolItems as tool (tool.key)}
						{@const Icon = TOOL_ICONS[tool.key]}
						<span class="tool-chip" title={tool.label} aria-label={tool.label}>
							<Icon size={13} strokeWidth={1.5} aria-hidden="true" />
						</span>
					{/each}
				</div>
			{/if}

			{#if menuOpen && !configLocked}
				<div class="menu-shell">
					<div class="popover root-popover" role="menu" aria-label="Add context">
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
											{#if item.id === 'models'}
												<Boxes size={14} strokeWidth={1.5} />
											{:else}
												<Cable size={14} strokeWidth={1.5} />
											{/if}
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
								{#each CLAUDE_MODELS as model (model.id)}
									<button
										type="button"
										class="menu-row model-row"
										class:selected={selectedModel === model.id}
										role="menuitem"
										onclick={() => selectModel(model.id)}
									>
										<span class="menu-row-main column">
											<span class="model-title">{model.label}</span>
											<span class="model-hint">{model.hint}</span>
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

<style>
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

	.attachments {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.attachment-pill {
		display: inline-flex;
		max-width: 220px;
		align-items: center;
		gap: 6px;
		padding: 4px 6px 4px 8px;
		border: 1px solid color-mix(in srgb, var(--color-line) 88%, #d4d4d8);
		border-radius: 999px;
		color: #3f3f46;
		background: #f4f4f5;
		font-size: 12px;
		line-height: 1.2;
	}

	.attachment-icon {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		object-fit: contain;
	}

	.attachment-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.attachment-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border: 0;
		border-radius: 999px;
		color: #71717a;
		background: transparent;
		font: inherit;
		font-size: 13px;
		line-height: 1;
		cursor: pointer;
	}

	.attachment-remove:hover {
		color: var(--color-ink);
		background: #e4e4e7;
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

	.icon-circle,
	.send-btn,
	.menu-row,
	.retry-btn,
	.connector-row,
	.model-pill,
	.attachment-remove {
		border: 0;
		font: inherit;
		cursor: pointer;
	}

	.icon-circle {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		color: #71717a;
		background: #fff;
	}

	.icon-circle:hover,
	.icon-circle.active,
	.model-pill:hover {
		background: #f4f4f5;
	}

	.model-pill {
		display: inline-flex;
		max-width: 180px;
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

	.model-pill.locked {
		cursor: default;
		opacity: 0.92;
	}

	.model-pill.locked:hover {
		background: #fafafa;
	}

	.model-pill span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.model-pill :global(.chevron-down) {
		flex-shrink: 0;
		color: #8b8b93;
	}

	.tools-row {
		display: inline-flex;
		min-width: 0;
		align-items: center;
		gap: 2px;
		margin-left: 2px;
		padding-left: 6px;
		border-left: 1px solid color-mix(in srgb, var(--color-line) 90%, #d4d4d8);
	}

	.tool-chip {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 999px;
		color: #71717a;
	}

	.tool-chip:hover {
		color: #3f3f46;
		background: #f4f4f5;
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
		background: #fff;
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
		background: #f4f4f5;
		font: inherit;
		font-size: 12px;
		outline: 0;
	}

	.search-field input::placeholder {
		color: #a1a1aa;
	}

	.search-field input:focus {
		background: #ececee;
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
		color: #27272a;
		background: transparent;
		font-size: 12.5px;
		text-align: left;
	}

	.menu-row:hover,
	.menu-row.flyout-open,
	.menu-row.selected,
	.model-row:hover {
		background: #f3f3f3;
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
		color: #3f3f46;
		background: #ececee;
		font-size: 11px;
		font-weight: 600;
	}

	.menu-meta :global(.chevron) {
		flex-shrink: 0;
		color: #a1a1aa;
	}

	.model-title {
		overflow: hidden;
		color: #27272a;
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
		background: #f3f3f3;
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
		color: #27272a;
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
		color: #52525b;
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
		background: color-mix(in srgb, var(--color-accent) 8%, #fff);
		font-size: 12px;
		font-weight: 500;
	}

	.retry-btn:hover {
		background: color-mix(in srgb, var(--color-accent) 14%, #fff);
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
		.composer textarea {
			min-height: 56px;
		}

		.attachment-pill {
			max-width: 160px;
		}

		.model-pill {
			max-width: 120px;
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

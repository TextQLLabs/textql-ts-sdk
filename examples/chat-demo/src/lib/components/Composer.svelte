<script lang="ts">
	type ConnectorItem = {
		id: number;
		name: string;
		type: string;
	};

	interface Props {
		value?: string;
		sending?: boolean;
		docked?: boolean;
		selectedConnectorIds?: number[];
		onsend?: () => void;
		class?: string;
	}

	let {
		value = $bindable(''),
		sending = false,
		docked = false,
		selectedConnectorIds = $bindable<number[]>([]),
		onsend,
		class: className = ''
	}: Props = $props();

	let menuOpen = $state(false);
	let panel = $state<'menu' | 'connectors'>('menu');
	let connectors = $state.raw<ConnectorItem[]>([]);
	let connectorNames = $state.raw<Record<number, string>>({});
	let connectorsLoading = $state(false);
	let connectorsError = $state(false);
	let connectorsLoaded = $state(false);
	let search = $state('');
	let menuRoot: HTMLDivElement | undefined;

	const filteredConnectors = $derived(
		connectors.filter((connector) => {
			const query = search.trim().toLowerCase();
			if (!query) return true;
			return (
				connector.name.toLowerCase().includes(query) ||
				connector.type.toLowerCase().includes(query)
			);
		})
	);

	const selectedChips = $derived(
		selectedConnectorIds.map((id) => ({
			id,
			name: connectorNames[id] ?? connectors.find((connector) => connector.id === id)?.name ?? `Connector ${id}`
		}))
	);

	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	async function loadConnectors() {
		if (connectorsLoading) return;

		connectorsLoading = true;
		connectorsError = false;

		try {
			const response = await fetch('/api/connectors');
			const payload: unknown = await response.json();

			if (!response.ok || !isRecord(payload) || !Array.isArray(payload.connectors)) {
				throw new Error('Unable to load connectors.');
			}

			const next: ConnectorItem[] = [];
			const names = { ...connectorNames };

			for (const item of payload.connectors) {
				if (
					!isRecord(item) ||
					typeof item.id !== 'number' ||
					typeof item.name !== 'string' ||
					typeof item.type !== 'string'
				) {
					continue;
				}

				next.push({ id: item.id, name: item.name, type: item.type });
				names[item.id] = item.name;
			}

			connectors = next;
			connectorNames = names;
			connectorsLoaded = true;
		} catch {
			connectorsError = true;
		} finally {
			connectorsLoading = false;
		}
	}

	function openMenu() {
		menuOpen = true;
		panel = 'menu';
	}

	function closeMenu() {
		menuOpen = false;
		panel = 'menu';
		search = '';
	}

	function openConnectorsPanel() {
		panel = 'connectors';
		if (!connectorsLoaded || connectorsError) {
			void loadConnectors();
		}
	}

	function toggleMenu() {
		if (menuOpen) {
			closeMenu();
			return;
		}
		openMenu();
	}

	function toggleConnector(connector: ConnectorItem) {
		if (selectedConnectorIds.includes(connector.id)) {
			selectedConnectorIds = selectedConnectorIds.filter((id) => id !== connector.id);
			return;
		}

		selectedConnectorIds = [...selectedConnectorIds, connector.id];
		connectorNames = { ...connectorNames, [connector.id]: connector.name };
	}

	function removeConnector(id: number) {
		selectedConnectorIds = selectedConnectorIds.filter((selectedId) => selectedId !== id);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			onsend?.();
		}
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && menuOpen) {
			event.preventDefault();
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
</script>

<svelte:window onkeydown={handleWindowKeydown} onpointerdown={handleWindowPointerDown} />

<div class={['composer', docked && 'docked', className]}>
	<textarea
		bind:value
		onkeydown={handleKeydown}
		rows="3"
		placeholder="Plan, @ to add a connector, / for commands"
		aria-label="Message"
	></textarea>
	<div class="composer-toolbar">
		<div class="toolbar-left" {@attach attachMenuRoot}>
			<button
				type="button"
				class="icon-circle"
				class:active={menuOpen || selectedConnectorIds.length > 0}
				aria-label="Add context"
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				onclick={toggleMenu}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path d="M12 5v14M5 12h14" stroke-linecap="round" />
				</svg>
			</button>

			{#if selectedChips.length > 0}
				<div class="chips" aria-label="Selected connectors">
					{#each selectedChips as chip (chip.id)}
						<span class="chip">
							<span class="chip-label">{chip.name}</span>
							<button
								type="button"
								class="chip-remove"
								aria-label={`Remove ${chip.name}`}
								onclick={() => removeConnector(chip.id)}
							>
								×
							</button>
						</span>
					{/each}
				</div>
			{/if}

			{#if menuOpen}
				<div class="popover" aria-label="Composer menu">
					{#if panel === 'menu'}
						<button type="button" class="menu-item" onclick={openConnectorsPanel}>
							<span class="menu-item-label">
								<svg
									class="menu-item-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									aria-hidden="true"
								>
									<path
										d="M7 7h10v3H7V7Zm0 7h10v3H7v-3ZM4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
										stroke-linejoin="round"
									/>
								</svg>
								Connectors
							</span>
							{#if selectedConnectorIds.length > 0}
								<span class="badge">{selectedConnectorIds.length}</span>
							{/if}
						</button>
					{:else}
						<div class="connectors-panel">
							<div class="connectors-header">
								<button type="button" class="back-btn" onclick={() => (panel = 'menu')}>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.75"
										aria-hidden="true"
									>
										<path d="M15 6 9 12l6 6" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
									Connectors
								</button>
							</div>

							<label class="search-field">
								<span class="sr-only">Search connectors</span>
								<input
									type="search"
									bind:value={search}
									placeholder="Search connectors"
									autocomplete="off"
								/>
							</label>

							<div class="connectors-list" aria-live="polite" aria-busy={connectorsLoading}>
								{#if connectorsLoading}
									<p class="state-copy">Loading connectors…</p>
								{:else if connectorsError}
									<div class="state-block">
										<p class="state-copy">Couldn’t load connectors.</p>
										<button type="button" class="retry-btn" onclick={loadConnectors}>Retry</button>
									</div>
								{:else if connectors.length === 0}
									<p class="state-copy">No connectors available.</p>
								{:else if filteredConnectors.length === 0}
									<p class="state-copy">No matches.</p>
								{:else}
									{#each filteredConnectors as connector (connector.id)}
										<label class="connector-row">
											<input
												type="checkbox"
												checked={selectedConnectorIds.includes(connector.id)}
												onchange={() => toggleConnector(connector)}
											/>
											<span class="connector-meta">
												<span class="connector-name">{connector.name}</span>
												<span class="connector-type">{connector.type}</span>
											</span>
										</label>
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
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
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
		gap: 8px;
	}

	.icon-circle,
	.send-btn,
	.menu-item,
	.back-btn,
	.retry-btn,
	.chip-remove {
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

	.icon-circle svg {
		width: 15px;
		height: 15px;
	}

	.icon-circle:hover,
	.icon-circle.active {
		background: #f4f4f5;
	}

	.chips {
		display: flex;
		min-width: 0;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chip {
		display: inline-flex;
		max-width: 160px;
		align-items: center;
		gap: 4px;
		padding: 3px 6px 3px 8px;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, #d4d4d8);
		border-radius: 999px;
		color: #3f3f46;
		background: #fcfcfc;
		font-size: 11.5px;
		line-height: 1.2;
	}

	.chip-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chip-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border-radius: 999px;
		color: #71717a;
		background: transparent;
		font-size: 13px;
		line-height: 1;
	}

	.chip-remove:hover {
		color: var(--color-ink);
		background: #ececee;
	}

	.popover {
		position: absolute;
		bottom: calc(100% + 10px);
		left: 0;
		z-index: 20;
		width: min(280px, calc(100vw - 48px));
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-line) 92%, #d4d4d8);
		border-radius: 14px;
		background: #fcfcfc;
		box-shadow:
			0 1px 2px rgba(15, 15, 20, 0.04),
			0 16px 40px rgba(15, 15, 20, 0.1);
	}

	.menu-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		padding: 11px 12px;
		color: #27272a;
		background: transparent;
		font-size: 13px;
		font-weight: 500;
		text-align: left;
	}

	.menu-item:hover {
		background: #f4f4f5;
	}

	.menu-item-label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.menu-item-icon {
		width: 15px;
		height: 15px;
		color: #71717a;
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

	.connectors-panel {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px;
	}

	.connectors-header {
		display: flex;
		align-items: center;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
		border-radius: 8px;
		color: #3f3f46;
		background: transparent;
		font-size: 12.5px;
		font-weight: 550;
	}

	.back-btn svg {
		width: 14px;
		height: 14px;
	}

	.back-btn:hover {
		background: #f0f0f2;
	}

	.search-field input {
		width: 100%;
		padding: 8px 10px;
		border: 1px solid var(--color-line);
		border-radius: 10px;
		color: var(--color-ink);
		background: #fff;
		font: inherit;
		font-size: 12.5px;
		outline: 0;
	}

	.search-field input::placeholder {
		color: #a1a1aa;
	}

	.search-field input:focus {
		border-color: color-mix(in srgb, var(--color-accent) 40%, var(--color-line));
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent);
	}

	.connectors-list {
		display: flex;
		max-height: 220px;
		flex-direction: column;
		gap: 2px;
		overflow-y: auto;
		padding: 2px;
	}

	.connector-row {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 8px 8px;
		border-radius: 10px;
		cursor: pointer;
	}

	.connector-row:hover {
		background: #f4f4f5;
	}

	.connector-row input {
		margin-top: 2px;
		accent-color: var(--color-accent);
	}

	.connector-meta {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 2px;
	}

	.connector-name {
		overflow: hidden;
		color: #27272a;
		font-size: 12.5px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.connector-type {
		overflow: hidden;
		color: var(--color-muted);
		font-size: 11px;
		letter-spacing: 0.01em;
		text-overflow: ellipsis;
		text-transform: lowercase;
		white-space: nowrap;
	}

	.state-block {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		padding: 8px;
	}

	.state-copy {
		margin: 0;
		padding: 10px 8px;
		color: var(--color-muted);
		font-size: 12px;
		line-height: 1.4;
	}

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

	.send-btn svg {
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

		.chip {
			max-width: 120px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.send-btn {
			transition: none;
		}
	}
</style>

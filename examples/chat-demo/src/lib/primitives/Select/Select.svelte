<script lang="ts" generics="T extends string | number">
	import Check from "@lucide/svelte/icons/check";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import Search from "@lucide/svelte/icons/search";
	import type { Snippet } from "svelte";
	import { scale } from "svelte/transition";
	import type { SelectOption } from "./types";

	interface Props {
		/** Bindable selected value. */
		value: T;
		options: SelectOption<T>[];
		placeholder?: string;
		disabled?: boolean;
		/** Show a search box inside the popover to filter options by label. */
		searchable?: boolean;
		searchPlaceholder?: string;
		onValueChange?: (value: T) => void;
		class?: string;
		id?: string;
		"aria-label"?: string;
		/** Optional content rendered before the value inside the trigger. */
		leading?: Snippet;
	}

	let {
		value = $bindable(),
		options,
		placeholder = "Select…",
		disabled = false,
		searchable = false,
		searchPlaceholder = "Search…",
		onValueChange,
		class: className = "",
		id,
		"aria-label": ariaLabel,
		leading,
	}: Props = $props();

	let open = $state(false);
	let triggerEl = $state<HTMLButtonElement>();
	let popoverEl = $state<HTMLElement>();
	let listEl = $state<HTMLElement>();
	let searchEl = $state<HTMLInputElement>();
	let query = $state("");
	let activeIndex = $state(-1);
	let pos = $state({
		left: 0,
		top: 0,
		width: 0,
		maxHeight: 260,
		placement: "bottom" as "bottom" | "top",
	});

	const selected = $derived(options.find((option) => option.value === value));
	const filteredOptions = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!searchable || !q) return options;
		return options.filter((option) =>
			option.label.toLowerCase().includes(q),
		);
	});

	function place() {
		const el = triggerEl;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const margin = 8;
		const gap = 4;
		const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
		const spaceAbove = rect.top - gap - margin;
		// Prefer opening downward unless there's meaningfully more room above.
		const placement =
			spaceBelow >= 220 || spaceBelow >= spaceAbove ? "bottom" : "top";
		const available = placement === "bottom" ? spaceBelow : spaceAbove;
		pos = {
			left: rect.left,
			width: rect.width,
			top: placement === "bottom" ? rect.bottom + gap : rect.top - gap,
			maxHeight: Math.max(140, Math.min(320, available)),
			placement,
		};
	}

	function openMenu() {
		if (disabled) return;
		query = "";
		place();
		const current = filteredOptions.findIndex(
			(option) => option.value === value,
		);
		activeIndex = current >= 0 ? current : 0;
		open = true;
	}

	function closeMenu() {
		open = false;
		activeIndex = -1;
		query = "";
	}

	function toggle() {
		if (open) closeMenu();
		else openMenu();
	}

	function choose(option: SelectOption<T> | undefined) {
		if (!option || option.disabled) return;
		value = option.value;
		onValueChange?.(option.value);
		closeMenu();
		triggerEl?.focus();
	}

	function step(delta: number) {
		const count = filteredOptions.length;
		if (count === 0) return;
		let next = activeIndex < 0 ? (delta > 0 ? -1 : 0) : activeIndex;
		for (let i = 0; i < count; i += 1) {
			next = (next + delta + count) % count;
			if (!filteredOptions[next]?.disabled) break;
		}
		activeIndex = next;
	}

	/** Navigation keys shared by the trigger and the search box. */
	function onMenuNavKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case "Escape":
				event.preventDefault();
				closeMenu();
				triggerEl?.focus();
				return true;
			case "ArrowDown":
				event.preventDefault();
				step(1);
				return true;
			case "ArrowUp":
				event.preventDefault();
				step(-1);
				return true;
			case "Home":
				event.preventDefault();
				activeIndex = 0;
				return true;
			case "End":
				event.preventDefault();
				activeIndex = filteredOptions.length - 1;
				return true;
			case "Enter":
				event.preventDefault();
				choose(filteredOptions[activeIndex]);
				return true;
			case "Tab":
				closeMenu();
				return true;
		}
		return false;
	}

	function onTriggerKeydown(event: KeyboardEvent) {
		if (disabled) return;
		if (!open) {
			if (
				event.key === "ArrowDown" ||
				event.key === "ArrowUp" ||
				event.key === "Enter" ||
				event.key === " "
			) {
				event.preventDefault();
				openMenu();
			}
			return;
		}
		// When not searchable the trigger keeps focus, so it drives navigation.
		if (event.key === " ") {
			event.preventDefault();
			choose(filteredOptions[activeIndex]);
			return;
		}
		onMenuNavKeydown(event);
	}

	function onSearchKeydown(event: KeyboardEvent) {
		onMenuNavKeydown(event);
	}

	function onWindowPointerDown(event: PointerEvent) {
		if (!open) return;
		const target = event.target;
		if (
			target instanceof Node &&
			(triggerEl?.contains(target) || popoverEl?.contains(target))
		) {
			return;
		}
		closeMenu();
	}

	// Keep the popover glued to the trigger while it's open.
	$effect(() => {
		if (!open) return;
		const handler = () => place();
		window.addEventListener("scroll", handler, true);
		window.addEventListener("resize", handler);
		return () => {
			window.removeEventListener("scroll", handler, true);
			window.removeEventListener("resize", handler);
		};
	});

	// Keep the highlighted option in view during keyboard navigation.
	$effect(() => {
		if (!open || activeIndex < 0 || !listEl) return;
		const el = listEl.children[activeIndex];
		if (el instanceof HTMLElement) el.scrollIntoView({ block: "nearest" });
	});

	// Focus the search box as soon as the popover opens.
	$effect(() => {
		if (open && searchable && searchEl) searchEl.focus();
	});

	// Keep the highlight valid as the filtered list changes while typing.
	$effect(() => {
		const count = filteredOptions.length;
		if (activeIndex > count - 1) activeIndex = count > 0 ? 0 : -1;
	});
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<button
	bind:this={triggerEl}
	{id}
	type="button"
	{disabled}
	class="select-trigger {className}"
	class:open
	aria-haspopup="listbox"
	aria-expanded={open}
	aria-label={ariaLabel}
	onclick={toggle}
	onkeydown={onTriggerKeydown}
>
	{#if leading}
		<span class="select-leading">{@render leading()}</span>
	{/if}
	{#if selected?.iconSrc}
		<img class="select-icon" src={selected.iconSrc} alt="" />
	{/if}
	<span class="select-value" class:placeholder={!selected}>
		{selected ? selected.label : placeholder}
	</span>
	<ChevronDown
		class="select-chevron"
		size={15}
		strokeWidth={2}
		aria-hidden="true"
	/>
</button>

{#if open}
	<div
		bind:this={popoverEl}
		class="select-popover {pos.placement}"
		style="left:{pos.left}px; top:{pos.top}px; min-width:{pos.width}px; max-height:{pos.maxHeight}px;"
		transition:scale={{ duration: 120, start: 0.97 }}
	>
		{#if searchable}
			<div class="select-search">
				<Search size={14} strokeWidth={2} aria-hidden="true" />
				<input
					bind:this={searchEl}
					class="select-search-input"
					type="text"
					autocomplete="off"
					spellcheck="false"
					placeholder={searchPlaceholder}
					aria-label={searchPlaceholder}
					bind:value={query}
					onkeydown={onSearchKeydown}
				/>
			</div>
		{/if}

		<div
			bind:this={listEl}
			class="select-list"
			role="listbox"
			aria-label={ariaLabel}
		>
			{#each filteredOptions as option, index (option.value)}
				<button
					type="button"
					role="option"
					aria-selected={option.value === value}
					class="select-option"
					class:active={index === activeIndex}
					class:selected={option.value === value}
					disabled={option.disabled}
					onmouseenter={() => (activeIndex = index)}
					onclick={() => choose(option)}
				>
					{#if option.iconSrc}
						<img class="select-icon" src={option.iconSrc} alt="" />
					{/if}
					<span class="select-option-main">
						<span class="select-option-label">{option.label}</span>
						{#if option.hint}
							<span class="select-option-hint"
								>{option.hint}</span
							>
						{/if}
					</span>
					{#if option.value === value}
						<span class="select-check" aria-hidden="true">
							<Check size={14} strokeWidth={2.25} />
						</span>
					{/if}
				</button>
			{:else}
				<p class="select-empty">No matches.</p>
			{/each}
		</div>
	</div>
{/if}

<style>
	.select-trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 9px 11px;
		border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		border-radius: var(--radius-sm);
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-elevate) 78%, transparent);
		font: inherit;
		font-size: 13px;
		line-height: 1.4;
		text-align: left;
		cursor: pointer;
		transition:
			border-color 120ms ease,
			background 120ms ease;
	}

	.select-trigger:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-elevate) 92%, transparent);
	}

	.select-trigger:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
		outline-offset: 1px;
	}

	.select-trigger.open {
		border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
	}

	.select-trigger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.select-leading {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		color: var(--color-muted);
	}

	.select-icon {
		flex-shrink: 0;
		width: 16px;
		height: 16px;
		object-fit: contain;
		border-radius: 3px;
	}

	.select-value {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.select-value.placeholder {
		color: var(--color-muted);
	}

	.select-trigger :global(.select-chevron) {
		flex-shrink: 0;
		color: var(--color-muted);
		transition: transform 150ms ease;
	}

	.select-trigger.open :global(.select-chevron) {
		transform: rotate(180deg);
	}

	.select-popover {
		position: fixed;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		min-height: 0;
		padding: 4px;
		border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-paper) 96%, var(--color-elevate));
		box-shadow: 0 12px 32px rgba(15, 15, 20, 0.12);
		transform-origin: top;
	}

	.select-popover.top {
		translate: 0 -100%;
		transform-origin: bottom;
	}

	.select-search {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
		margin-bottom: 4px;
		padding: 6px 8px;
		border-radius: 7px;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-line) 30%, transparent);
	}

	.select-search-input {
		flex: 1;
		min-width: 0;
		border: 0;
		padding: 0;
		color: var(--color-ink);
		background: transparent;
		font: inherit;
		font-size: 13px;
	}

	.select-search-input:focus {
		outline: none;
	}

	.select-list {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-height: 0;
		overflow-y: auto;
	}

	.select-empty {
		margin: 0;
		padding: 10px 8px;
		color: var(--color-muted);
		font-size: 12.5px;
		text-align: center;
	}

	.select-option {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 7px 8px;
		border: 0;
		border-radius: 7px;
		color: var(--color-ink);
		background: transparent;
		font: inherit;
		font-size: 13px;
		text-align: left;
		cursor: pointer;
	}

	.select-option.active {
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
	}

	.select-option.selected {
		font-weight: 500;
	}

	.select-option:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.select-option-main {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
		flex: 1;
	}

	.select-option-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.select-option-hint {
		color: var(--color-muted);
		font-size: 11.5px;
		line-height: 1.3;
	}

	.select-check {
		display: inline-flex;
		flex-shrink: 0;
		color: var(--color-accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.select-trigger :global(.select-chevron) {
			transition: none;
		}
	}
</style>

<script lang="ts">
	import { Check, ChevronDown, Search } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import type { SelectOption } from "./types";

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
		label,
		leading,
	}: {
		value: string | number;
		options: SelectOption[];
		placeholder?: string;
		disabled?: boolean;
		searchable?: boolean;
		searchPlaceholder?: string;
		onValueChange?: (value: string | number) => void;
		class?: string;
		id?: string;
		label?: string;
		leading?: Snippet;
	} = $props();

	let open = $state(false);
	let query = $state("");
	let activeIndex = $state(-1);
	let root: HTMLDivElement;
	let trigger = $state<HTMLButtonElement>();
	let searchInput = $state<HTMLInputElement>();
	let list = $state<HTMLDivElement>();
	let placement = $state("");
	const selected = $derived(options.find((option) => option.value === value));
	const filtered = $derived(
		options.filter(
			(option) =>
				!query.trim() ||
				option.label.toLowerCase().includes(query.trim().toLowerCase()),
		),
	);

	$effect(() => {
		if (!open || typeof window === "undefined") return;
		const outside = (event: PointerEvent) => {
			if (event.target instanceof Node && !root.contains(event.target))
				close();
		};
		window.addEventListener("pointerdown", outside);
		window.addEventListener("resize", place);
		window.addEventListener("scroll", place, true);
		return () => {
			window.removeEventListener("pointerdown", outside);
			window.removeEventListener("resize", place);
			window.removeEventListener("scroll", place, true);
		};
	});

	$effect(() => {
		if (open && searchable) queueMicrotask(() => searchInput?.focus());
	});

	$effect(() => {
		if (!open || activeIndex < 0) return;
		list?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
	});

	function place(): void {
		if (!trigger) return;
		const rect = trigger.getBoundingClientRect();
		const width = Math.min(
			Math.max(rect.width, 220),
			Math.max(220, window.innerWidth - 16),
		);
		const left = Math.min(
			Math.max(8, rect.right - width),
			window.innerWidth - width - 8,
		);
		const below = window.innerHeight - rect.bottom - 12;
		const above = rect.top - 12;
		const flip = below < Math.min(220, above);
		placement =
			`left:${Math.round(left)}px;width:${Math.round(width)}px;` +
			`max-height:${Math.round(Math.min(300, flip ? above : below))}px;` +
			(flip
				? `bottom:${Math.round(window.innerHeight - rect.top + 4)}px;`
				: `top:${Math.round(rect.bottom + 4)}px;`);
	}

	function show(): void {
		if (disabled) return;
		place();
		query = "";
		activeIndex = Math.max(
			0,
			options.findIndex((option) => option.value === value),
		);
		open = true;
	}

	function close(): void {
		open = false;
		query = "";
		activeIndex = -1;
	}
	function choose(option: SelectOption | undefined): void {
		if (!option || option.disabled) return;
		value = option.value;
		onValueChange?.(value);
		close();
	}

	function step(delta: number): void {
		if (!filtered.length) return;
		let next = activeIndex;
		for (let i = 0; i < filtered.length; i += 1) {
			next = (next + delta + filtered.length) % filtered.length;
			if (!filtered[next]?.disabled) break;
		}
		activeIndex = next;
	}

	function keydown(event: KeyboardEvent): void {
		if (
			!open &&
			["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)
		) {
			event.preventDefault();
			show();
			return;
		}
		if (!open) return;
		if (event.key === "Escape") {
			event.preventDefault();
			close();
		} else if (event.key === "ArrowDown") {
			event.preventDefault();
			step(1);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			step(-1);
		} else if (event.key === "Home") {
			event.preventDefault();
			activeIndex = 0;
		} else if (event.key === "End") {
			event.preventDefault();
			activeIndex = filtered.length - 1;
		} else if (
			event.key === "Enter" ||
			(!searchable && event.key === " ")
		) {
			event.preventDefault();
			choose(filtered[activeIndex]);
		} else if (event.key === "Tab") close();
	}
</script>

<div class={`select-root ${className}`} bind:this={root}>
	<button
		bind:this={trigger}
		{id}
		class:open
		type="button"
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label={label}
		onclick={() => (open ? close() : show())}
		onkeydown={keydown}
	>
		{#if leading}<span class="leading">{@render leading()}</span>{/if}
		{#if selected?.iconSrc}<img src={selected.iconSrc} alt="" />{/if}
		<span class:placeholder={!selected} class="value"
			>{selected?.label ?? placeholder}</span
		>
		<ChevronDown size={15} class={open ? "rotate" : ""} />
	</button>
	{#if open}
		<div class="popover" style={placement}>
			{#if searchable}
				<div class="search">
					<Search size={14} /><input
						bind:this={searchInput}
						bind:value={query}
						placeholder={searchPlaceholder}
						aria-label={searchPlaceholder}
						onkeydown={keydown}
					/>
				</div>
			{/if}
			<div
				class="options"
				role="listbox"
				aria-label={label}
				bind:this={list}
			>
				{#if !filtered.length}<p>No matches.</p>{/if}
				{#each filtered as option, index (option.value)}
					<button
						type="button"
						role="option"
						aria-selected={option.value === value}
						class:active={index === activeIndex}
						class:selected={option.value === value}
						disabled={option.disabled}
						onpointerenter={() => (activeIndex = index)}
						onclick={() => choose(option)}
					>
						{#if option.iconSrc}<img
								src={option.iconSrc}
								alt=""
							/>{/if}
						<span class="option-text">
							<span class="option-line">
								<strong>{option.label}</strong>
								{#if option.meta}<em>{option.meta}</em>{/if}
							</span>
							{#if option.hint}<small>{option.hint}</small>{/if}
						</span>
						<Check
							size={13}
							class={option.value === value ? "" : "hidden-check"}
						/>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.select-root {
		position: relative;
		width: 100%;
	}
	.select-root > button {
		display: inline-flex;
		width: 100%;
		align-items: center;
		gap: 8px;
		border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		border-radius: 10px;
		background: color-mix(in srgb, var(--color-elevate) 78%, transparent);
		padding: 9px 11px;
		color: var(--color-ink);
		font-size: 13px;
		line-height: 1.4;
		text-align: left;
		cursor: pointer;
	}
	.select-root > button:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-elevate) 92%, transparent);
	}
	.select-root > button.open {
		border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
	}
	.select-root > button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.leading {
		display: inline-flex;
		flex: 0 0 auto;
		color: var(--color-muted);
	}
	.value {
		min-width: 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.placeholder {
		color: var(--color-muted);
	}
	img {
		width: 16px;
		height: 16px;
		flex: 0 0 auto;
		border-radius: 3px;
		object-fit: contain;
	}
	:global(.rotate) {
		transform: rotate(180deg);
	}
	/* Right-anchored to the trigger by place(), so a popover wider than a narrow
	   trigger grows inward instead of spilling past the panel edge beside it. */
	.popover {
		position: fixed;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		border-radius: 10px;
		background: var(--color-elevate);
		padding: 4px;
		box-shadow:
			0 10px 30px rgba(15, 15, 20, 0.1),
			0 1px 2px rgba(15, 15, 20, 0.06);
	}
	.search {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: -4px -4px 4px;
		border-bottom: 1px solid
			color-mix(in srgb, var(--color-line) 70%, transparent);
		padding: 8px 10px;
		color: var(--color-muted);
	}
	.search input {
		min-width: 0;
		flex: 1;
		border: 0;
		outline: 0;
		background: transparent;
		padding: 0;
		color: var(--color-ink);
		font-size: 12.5px;
	}
	.search input::placeholder {
		color: var(--color-muted);
	}
	.options {
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	.options > button {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 8px;
		border: 0;
		border-radius: 6px;
		background: transparent;
		padding: 5px 7px;
		color: var(--color-ink);
		font-size: 12.5px;
		line-height: 1.35;
		text-align: left;
		cursor: pointer;
	}
	.options > button.active {
		background: color-mix(in srgb, var(--color-line) 45%, transparent);
	}
	.options > button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	.options > button :global(svg) {
		flex: 0 0 auto;
		color: var(--color-accent);
	}
	.options > button :global(.hidden-check) {
		visibility: hidden;
	}
	.option-text {
		min-width: 0;
		flex: 1;
	}
	.option-line {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.options strong,
	.options small {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.options strong {
		min-width: 0;
		flex: 1;
		font-weight: 400;
	}
	.options > button.selected strong {
		font-weight: 500;
	}
	.options em {
		flex: 0 0 auto;
		color: var(--color-muted);
		font-size: 11.5px;
		font-style: normal;
		font-variant-numeric: tabular-nums;
	}
	.options small {
		margin-top: 1px;
		color: var(--color-muted);
		font-size: 11.5px;
	}
	.options p {
		margin: 0;
		padding: 10px 8px;
		color: var(--color-muted);
		font-size: 12.5px;
		text-align: center;
	}
</style>

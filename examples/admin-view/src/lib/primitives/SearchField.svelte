<script lang="ts">
	import { Search } from '@lucide/svelte';
	import TextField from './TextField.svelte';
	import type { FieldSize } from './types';

	let {
		value = $bindable(''),
		placeholder = 'Search…',
		label = placeholder,
		size = 'sm',
		disabled = false,
		class: className = ''
	}: {
		value?: string;
		placeholder?: string;
		label?: string;
		size?: FieldSize;
		disabled?: boolean;
		class?: string;
	} = $props();
</script>

{#snippet icon()}<Search size={size === 'sm' ? 13 : 14} />{/snippet}

<TextField bind:value type="search" {placeholder} {label} {size} {disabled} class={className} leading={icon} />

<script lang="ts">
	import { AlertTriangle, Info } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';
	import type { ConfirmTone } from './types';
	let { open = $bindable(false), title = 'Are you sure?', description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'info', loading = false, onConfirm, onCancel, children }: {
		open?: boolean; title?: string; description?: string; confirmLabel?: string; cancelLabel?: string; tone?: ConfirmTone; loading?: boolean; onConfirm?: () => void; onCancel?: () => void; children?: Snippet;
	} = $props();
	function cancel(): void { if (loading) return; open = false; onCancel?.(); }
</script>

{#snippet actions()}
	<Button variant="ghost" disabled={loading} onclick={cancel}>{cancelLabel}</Button>
	<Button variant={tone === 'danger' ? 'danger' : 'solid'} disabled={loading} onclick={onConfirm}>{loading ? 'Working…' : confirmLabel}</Button>
{/snippet}

<Modal bind:open {title} dismissable={!loading} onClose={onCancel} {actions}>
	<div class="confirm-body" data-tone={tone}>
		<span>{#if tone === 'danger' || tone === 'warning'}<AlertTriangle size={16} />{:else}<Info size={16} />{/if}</span>
		<div>{#if children}{@render children()}{:else if description}<p>{description}</p>{/if}</div>
	</div>
</Modal>

<style>
	.confirm-body { display: flex; align-items: flex-start; gap: 12px; }
	.confirm-body > span { display: grid; width: 28px; height: 28px; flex: 0 0 auto; place-items: center; border-radius: 999px; background: color-mix(in srgb,var(--color-accent) 12%,transparent); color: var(--color-accent); }
	.confirm-body[data-tone='danger'] > span { background: rgba(239,68,68,.12); color: #dc2626; }
	.confirm-body[data-tone='warning'] > span { background: rgba(245,158,11,.12); color: #d97706; }
	p { margin: 0; }
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		lead,
		actions,
		children,
		wide = false,
		class: className
	}: {
		title: string;
		lead?: string;
		actions?: Snippet;
		children?: Snippet;
		/** Full-width body (no 840px column). Header is always full-bleed. */
		wide?: boolean;
		class?: string;
	} = $props();
</script>

<div class={['page', wide && 'wide', className]}>
	<header class="header">
		<div class="header-inner">
			<div class="title-block">
				<h1 class="title">{title}</h1>
				{#if lead}
					<p class="lead">{lead}</p>
				{/if}
			</div>
			{#if actions}
				<div class="actions">
					{@render actions()}
				</div>
			{/if}
		</div>
	</header>

	<div class="body">
		{@render children?.()}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 100%;
		color: var(--color-ink);
		background: var(--color-paper);
		font-family: var(--font-sans);
	}

	.header {
		flex-shrink: 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-line) 80%, transparent);
		background: color-mix(in srgb, var(--color-paper) 92%, var(--color-elevate));
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		width: 100%;
		padding: 8px 16px;
		min-height: 40px;
	}

	.page.wide .body {
		width: 100%;
		max-width: none;
	}

	.title-block {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.title {
		margin: 0;
		color: var(--color-ink);
		font-size: 13.5px;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.25;
	}

	.lead {
		margin: 0;
		color: var(--color-muted);
		font-size: 11.5px;
		line-height: 1.3;
	}

	.actions {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		gap: 6px;
	}

	.body {
		display: flex;
		flex-direction: column;
		flex: 1;
		width: min(840px, 100%);
		margin: 0 auto;
		padding: 28px 20px 48px;
		min-height: 0;
	}

	.page.wide .body {
		padding: 16px 16px 24px;
	}

	@media (max-width: 560px) {
		.header-inner {
			padding-inline: 12px;
		}

		.body {
			padding-inline: 14px;
		}
	}
</style>

<script lang="ts">
	import { PlugZap } from '@lucide/svelte';

	let {
		mode,
		error
	}: {
		mode: 'unconfigured' | 'error';
		error?: string;
	} = $props();
</script>

<div class="panel empty-state">
	<div>
		<div class="empty-state-icon"><PlugZap size={20} strokeWidth={1.7} /></div>
		<h2>{mode === 'unconfigured' ? 'Connect a TextQL organization' : 'Organization data could not load'}</h2>
		<p>
			{#if mode === 'unconfigured'}
				Set <code>TEXTQL_API_KEY</code> and, for non-cloud deployments,
				<code>TEXTQL_SERVER_URL</code>. This example only displays records returned by that
				organization—there is no fixture data.
			{:else}
				{error ?? 'Check the API key, server URL, and the key’s organization permissions.'}
			{/if}
		</p>
	</div>
</div>

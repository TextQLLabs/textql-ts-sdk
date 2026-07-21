<script lang="ts">
	import ChatPage from "$lib/components/ChatPage.svelte";

	let { children } = $props();
</script>

<ChatPage />
{@render children()}

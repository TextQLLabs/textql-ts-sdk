<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
	let advancedOpened = $state(false);
	// Stay open across a failed submit that round-tripped a server URL.
	const showAdvanced = $derived(advancedOpened || Boolean(form?.serverURL));
</script>

<svelte:head>
	<title>Sign in · TextQL Chat</title>
	<meta
		name="description"
		content="The TextQL app, rebuilt on the public TextQL API. Bring your own API key."
	/>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-6 py-12">
	<div class="w-full max-w-[26rem]">
		<div class="mb-8">
			<p class="font-pixel text-ink text-lg tracking-tight">TextQL</p>
			<h1 class="text-ink mt-4 text-2xl leading-snug font-medium tracking-tight">
				The whole app, rebuilt on the public API.
			</h1>
			<p class="text-text-3 mt-3 text-sm leading-relaxed">
				Chats, live runs, agents, playbooks, ontology — every screen here is served by
				<code class="bg-fill text-text-2 rounded-[6px] px-1.5 py-0.5 font-mono text-[0.8125rem]"
					>@textql/sdk</code
				> calling the same endpoints you can. Bring your key and it's your workspace.
			</p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
				};
			}}
			class="border-line bg-elevate rounded-[16px] border p-5 shadow-sm"
		>
			<input type="hidden" name="next" value={data.next} />

			<label for="apiKey" class="text-text-2 block text-[0.8125rem] font-medium">
				TextQL API key
			</label>
			<input
				id="apiKey"
				name="apiKey"
				type="password"
				autocomplete="off"
				spellcheck="false"
				autocapitalize="off"
				placeholder="tql_…"
				required
				disabled={submitting}
				class="border-line bg-paper text-ink placeholder:text-muted focus:border-accent mt-2 w-full rounded-[10px] border px-3 py-2.5 font-mono text-sm outline-none disabled:opacity-60"
			/>

			{#if showAdvanced}
				<label for="serverURL" class="text-text-2 mt-4 block text-[0.8125rem] font-medium">
					Server URL <span class="text-muted font-normal">— on-prem only</span>
				</label>
				<input
					id="serverURL"
					name="serverURL"
					type="url"
					autocomplete="off"
					spellcheck="false"
					placeholder="https://textql.your-company.com"
					value={form?.serverURL ?? ''}
					disabled={submitting}
					class="border-line bg-paper text-ink placeholder:text-muted focus:border-accent mt-2 w-full rounded-[10px] border px-3 py-2.5 font-mono text-sm outline-none disabled:opacity-60"
				/>
			{:else}
				<button
					type="button"
					onclick={() => (advancedOpened = true)}
					class="text-muted hover:text-text-2 mt-3 text-[0.8125rem] underline underline-offset-2"
				>
					Using an on-prem deployment?
				</button>
			{/if}

			{#if form?.error}
				<p role="alert" class="mt-4 text-[0.8125rem] leading-relaxed text-red-600">
					{form.error}
				</p>
			{/if}

			<button
				type="submit"
				disabled={submitting}
				class="bg-ink text-paper mt-5 w-full rounded-[10px] px-3 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
			>
				{submitting ? 'Checking key…' : 'Open workspace'}
			</button>
		</form>

		<div class="text-muted mt-6 space-y-2 text-[0.8125rem] leading-relaxed">
			<p>
				No key yet? In TextQL, go to <span class="text-text-3">Settings → Developers → API
					Keys</span> and create one. Requires an admin.
			</p>
			<p>
				Your key is encrypted and stored only in a cookie on your device. This site keeps no
				database and never sees your data — requests go straight to TextQL.
			</p>
			<p>
				<a
					href="https://github.com/TextQLLabs/textql-ts-sdk/tree/main/examples/chat-demo"
					class="hover:text-text-2 underline underline-offset-2">Source on GitHub</a
				>
			</p>
		</div>
	</div>
</main>

<script lang="ts">
	import { Check, Minus, X } from '@lucide/svelte';

	import { CEILING_LABELS, TOOL_FIELDS, TOOL_PAYLOAD_FIELDS, resolveTool } from '$lib/tools';

	let { data } = $props();

	let selectedKey = $state('bashEnabled');
	let ceiling = $state(true);
	let orgDefault = $state(false);
	let memberOverride = $state<'inherit' | 'on' | 'off'>('inherit');
	let isAdmin = $state(false);

	const field = $derived(TOOL_FIELDS.find((f) => f.key === selectedKey) ?? TOOL_FIELDS[0]);

	const result = $derived(
		resolveTool(field, {
			ceiling,
			orgDefault,
			memberOverride:
				memberOverride === 'inherit' ? null : memberOverride === 'on' ? true : false,
			isAdmin
		})
	);

	/** Live org values, if an API key is configured. */
	const liveParadigm = $derived(
		(data.live.organization?.paradigmParams ?? undefined) as Record<string, unknown> | undefined
	);
	const liveRestrictions = $derived(
		(data.live.organization?.toolRestrictions ?? undefined) as Record<string, unknown> | undefined
	);

	function liveValue(source: Record<string, unknown> | undefined, key: string) {
		if (!source) return null;
		return source[key] === true;
	}

	const CEILING_STYLES: Record<string, string> = {
		and: 'bg-ok-bg text-ok',
		override: 'bg-info-bg text-info',
		'forced-on': 'bg-warn-bg text-warn',
		or: 'bg-warn-bg text-warn',
		none: 'bg-dead-bg text-dead'
	};
</script>

<div class="space-y-10">
	<section>
		<h1 class="text-2xl font-semibold tracking-tight">Tool permissions</h1>
		<p class="text-muted mt-2 max-w-3xl text-sm leading-relaxed">
			<code class="text-ink">tool_restrictions</code> and
			<code class="text-ink">paradigm_params</code> are the same proto message in two columns. The
			ceiling decides what is permitted; the default decides what starts switched on. Change the
			inputs below to see how one field resolves.
		</p>
	</section>

	<!-- resolver -->
	<section class="border-line bg-panel rounded-sm border">
		<div class="border-line grid gap-6 border-b p-5 md:grid-cols-[220px_1fr]">
			<div class="space-y-4">
				<label class="block">
					<span class="text-muted mb-1.5 block text-[11px] font-medium uppercase tracking-wide"
						>Field</span
					>
					<select
						bind:value={selectedKey}
						class="border-line w-full rounded-sm border bg-white px-2 py-1.5 font-mono text-xs"
					>
						{#each TOOL_FIELDS as f (f.key)}
							<option value={f.key}>{f.key}</option>
						{/each}
					</select>
				</label>

				<label class="flex items-center gap-2 text-xs">
					<input type="checkbox" bind:checked={ceiling} />
					<code>tool_restrictions</code>
				</label>

				<label class="flex items-center gap-2 text-xs">
					<input type="checkbox" bind:checked={orgDefault} />
					<code>org paradigm_params</code>
				</label>

				<div>
					<span class="text-muted mb-1.5 block text-[11px] font-medium uppercase tracking-wide"
						>Member override</span
					>
					<div class="flex gap-1">
						{#each [['inherit', 'Inherit'], ['on', 'On'], ['off', 'Off']] as [value, label] (value)}
							<button
								type="button"
								onclick={() => (memberOverride = value as typeof memberOverride)}
								class="flex-1 rounded-sm px-2 py-1 text-[11px] transition-colors
									{memberOverride === value ? 'bg-info-bg text-info font-medium' : 'text-muted hover:text-ink'}"
							>
								{label}
							</button>
						{/each}
					</div>
				</div>

				<label class="flex items-center gap-2 text-xs">
					<input type="checkbox" bind:checked={isAdmin} />
					caller is an admin
				</label>
			</div>

			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<span class="text-muted text-[11px] font-medium uppercase tracking-wide">Result</span>
					<span
						class="rounded-sm px-2 py-1 text-xs font-semibold
							{result.enabled ? 'bg-ok-bg text-ok' : 'bg-dead-bg text-dead'}"
					>
						{field.label} is {result.enabled ? 'ON' : 'OFF'} in a new chat
					</span>
				</div>

				<ol class="space-y-1.5">
					{#each result.steps as step, i (i)}
						<li class="flex items-start gap-2 text-xs">
							<span class="text-muted mt-0.5 font-mono text-[10px]">{i + 1}</span>
							<span
								class="mt-0.5 rounded-sm px-1 font-mono text-[10px]
									{step.value ? 'bg-ok-bg text-ok' : 'bg-dead-bg text-dead'}"
							>
								{step.value}
							</span>
							<span>
								<span class="text-ink font-medium">{step.label}</span>
								<span class="text-muted"> — {step.detail}</span>
							</span>
						</li>
					{/each}
				</ol>

				{#if field.note}
					<p class="bg-warn-bg text-warn rounded-sm p-2.5 text-xs leading-relaxed">
						{field.note}
					</p>
				{/if}
			</div>
		</div>

		<div class="text-muted p-5 text-xs leading-relaxed">
			<span class="text-ink font-medium">Why the admin checkbox matters.</span>
			<code>shouldApplyToolRestrictions</code> returns false for any admin auth context, including admin
			API keys, so the mask never runs and the seed goes straight to the chat row. The ceiling still
			applies to that admin on the sandbox-exec, forms and datasets surfaces, which read it live.
		</div>
	</section>

	<!-- all fields -->
	<section class="space-y-3">
		<h2 class="text-sm font-semibold tracking-tight">Every field in the message</h2>

		<div class="border-line bg-panel overflow-x-auto rounded-sm border">
			<table class="w-full text-left text-xs">
				<thead class="border-line text-muted border-b">
					<tr>
						<th class="px-3 py-2 font-medium">Field</th>
						<th class="px-3 py-2 font-medium">Ceiling</th>
						<th class="px-3 py-2 font-medium">New-org default</th>
						<th class="px-3 py-2 font-medium">Live</th>
						<th class="px-3 py-2 font-medium">Also gated by</th>
					</tr>
				</thead>
				<tbody>
					{#each TOOL_FIELDS as f (f.key)}
						{@const restrictionValue = liveValue(liveRestrictions, f.key)}
						{@const defaultValue = liveValue(liveParadigm, f.key)}
						<tr class="border-line border-b last:border-0">
							<td class="px-3 py-2">
								<button
									type="button"
									onclick={() => (selectedKey = f.key)}
									class="hover:text-info text-left font-mono"
								>
									{f.key}
								</button>
								{#if f.internal}
									<span class="text-muted ml-1.5 text-[10px]">internal</span>
								{/if}
							</td>
							<td class="px-3 py-2">
								<span class="rounded-sm px-1.5 py-0.5 text-[10px] {CEILING_STYLES[f.ceiling]}">
									{CEILING_LABELS[f.ceiling]}
								</span>
								{#if f.liveReRead}
									<span class="text-muted ml-1.5 text-[10px]">live</span>
								{/if}
							</td>
							<td class="px-3 py-2">
								{#if f.defaultOn}
									<Check size={13} class="text-ok" />
								{:else}
									<Minus size={13} class="text-muted" />
								{/if}
							</td>
							<td class="px-3 py-2">
								{#if restrictionValue === null}
									<span class="text-muted">—</span>
								{:else}
									<span class="flex items-center gap-2 font-mono text-[10px]">
										<span title="tool_restrictions">
											{#if restrictionValue}<Check size={12} class="text-ok" />{:else}<X
													size={12}
													class="text-dead"
												/>{/if}
										</span>
										<span class="text-line">/</span>
										<span title="paradigm_params">
											{#if defaultValue}<Check size={12} class="text-ok" />{:else}<X
													size={12}
													class="text-dead"
												/>{/if}
										</span>
									</span>
								{/if}
							</td>
							<td class="text-muted px-3 py-2">
								{f.nonChatGates?.join(', ') ?? '—'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<p class="text-muted text-xs leading-relaxed">
			{#if liveRestrictions}
				Live column shows <span class="font-mono">ceiling / default</span> for this org.
			{:else}
				Set <code>TEXTQL_API_KEY</code> in <code>.env</code> to populate the Live column.
			{/if}
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="text-sm font-semibold tracking-tight">Non-toggle members</h2>
		<div class="border-line bg-panel rounded-sm border p-4">
			<ul class="space-y-2 text-xs">
				{#each TOOL_PAYLOAD_FIELDS as f (f.key)}
					<li>
						<code class="text-ink">{f.key}</code>
						<span class="text-muted font-mono text-[11px]"> : {f.type}</span>
						<span class="text-muted"> — {f.note}</span>
					</li>
				{/each}
			</ul>
		</div>
	</section>
</div>

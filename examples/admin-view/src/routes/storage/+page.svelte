<script lang="ts">
	import { MEMBER_FIELDS, ORG_FIELDS, type Storage } from '$lib/catalog';

	const STORES: { id: Storage | 'chat'; title: string; blurb: string; absent: string }[] = [
		{
			id: 'organization',
			title: 'organization',
			blurb:
				'The main row. Boolean gates, scalar config, and the two ParadigmParams JSONB blobs. Written by one targeted UPDATE.',
			absent: 'Column is NULL — the value was never set.'
		},
		{
			id: 'organization.org_meta',
			title: 'organization.org_meta',
			blurb:
				'A JSONB column on the same row, not a separate table. Merge-patched with || rather than replaced, so writes only touch the keys you send.',
			absent: 'Key is not present in the object.'
		},
		{
			id: 'feature_flags',
			title: 'feature_flags',
			blurb:
				'(flag_key, org_id, enabled, rollout_pct). A NULL org_id row is the global default; an org row overrides it. Resolution is org row, else global row, else a default passed by the calling code.',
			absent:
				'Depends on the call site. config_objects defaults to off; its playbooks and dashboards sub-toggles default to ON.'
		},
		{
			id: 'org_default_connectors',
			title: 'org_default_connectors',
			blurb:
				'Join table of (org_id, connector_id). Every write deletes all rows for the org and re-inserts, so it is a full replace even when you send a partial list.',
			absent: 'No rows — the org has no default connectors.'
		},
		{
			id: 'member_meta',
			title: 'member_meta',
			blurb:
				'Per-member overrides, keyed on member_id. Someone in two orgs has two independent sets. There is no member-level tool_restrictions.',
			absent: 'Member inherits the org default.'
		},
		{
			id: 'chat',
			title: 'chat',
			blurb:
				'paradigm, paradigm_version and paradigm_options. Where the resolved snapshot lands at creation, and what the tool registry reads at runtime.',
			absent: 'n/a — always written at chat creation.'
		}
	];

	function fieldsFor(store: Storage | 'chat') {
		return ORG_FIELDS.filter((f) => f.storage === store);
	}

	const MAP = `  org-level gating   →  organization           bool columns
                        feature_flags          5 via API, 4 SQL-only

  org default gating →  organization           .paradigm_params
                        member_meta            .paradigm_params
                        org_default_connectors join table

  paradigm           →  organization           .default_paradigm_mode
                        chat                   .paradigm_options

  tool restriction   →  organization           .tool_restrictions`;
</script>

<div class="space-y-10">
	<section>
		<h1 class="text-2xl font-semibold tracking-tight">Storage</h1>
		<p class="text-muted mt-2 max-w-3xl text-sm leading-relaxed">
			One RPC, four write paths, all inside a single transaction. The reason this matters is the
			last line of each card: a missing value means something different in every store.
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="text-sm font-semibold tracking-tight">Where to look</h2>
		<div class="border-line bg-panel rounded-sm border p-5">
			<pre class="diagram text-ink">{MAP}</pre>
		</div>
	</section>

	<section class="space-y-3">
		{#each STORES as store (store.id)}
			{@const fields = store.id === 'chat' ? [] : fieldsFor(store.id)}
			<div class="border-line bg-panel rounded-sm border p-5">
				<div class="flex items-baseline justify-between gap-4">
					<h3 class="text-ink font-mono text-sm">{store.title}</h3>
					{#if fields.length}
						<span class="text-muted font-mono text-xs">{fields.length} fields</span>
					{/if}
				</div>

				<p class="text-muted mt-2 max-w-3xl text-xs leading-relaxed">{store.blurb}</p>

				<p class="text-warn mt-2 text-xs leading-relaxed">
					<span class="font-medium">Absent means:</span>
					{store.absent}
				</p>

				{#if store.id === 'member_meta'}
					<ul class="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
						{#each MEMBER_FIELDS as f (f.key)}
							<li>
								<code class="text-ink">{f.key}</code>
								{#if f.gotcha}
									<span class="text-warn"> — {f.gotcha}</span>
								{:else}
									<span class="text-muted"> — {f.summary}</span>
								{/if}
							</li>
						{/each}
					</ul>
				{:else if fields.length}
					<div class="mt-3 flex flex-wrap gap-1.5">
						{#each fields as f (f.key)}
							<code class="bg-paper text-muted rounded-sm px-1.5 py-0.5 text-[10px]">{f.key}</code>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</section>

	<section class="space-y-3">
		<h2 class="text-sm font-semibold tracking-tight">If you are diffing config</h2>
		<div class="border-line bg-panel space-y-2.5 rounded-sm border p-5 text-xs leading-relaxed">
			<p>
				<span class="text-ink font-medium">Read-modify-write the two blobs.</span>
				<code>paradigm_params</code> and <code>tool_restrictions</code> have no field presence, so a
				partial write turns every omitted toggle off.
			</p>
			<p>
				<span class="text-ink font-medium">Use the clear sentinel for connectors.</span> A repeated
				proto3 field cannot express "empty", so <code>clearDefaultConnectorIds</code> exists. Do not
				send it alongside a list — the list wins, which is the opposite of how the model-id clear flags
				resolve.
			</p>
			<p>
				<span class="text-ink font-medium">Send the retention fields together.</span> Sandbox and
				thread windows cross-validate in both directions, so applying them one at a time produces
				spurious InvalidArgument errors depending on order.
			</p>
			<p>
				<span class="text-ink font-medium">Exclude the fields that cannot round-trip.</span>
				<code>restrictedModelIds</code> is rewritten on read, <code>defaultConnectorIds</code> is
				derived, and <code>emailOutputEnabled</code>, <code>configMigrationsEnabled</code> and
				<code>configAutofixEnabled</code> are accepted and discarded. Diffing them produces permanent
				phantom drift.
			</p>
			<p>
				<span class="text-ink font-medium">Watch the implicit writes.</span>
				<code>secretsEnabled</code> also sets <code>allowAllApiAccess</code>;
				<code>dashboardsEnabled: false</code> clears <code>defaultDashboardOutput</code>; writing
				<code>toolRestrictions</code> forces <code>multipleConnectorMode</code> true.
			</p>
			<p>
				<span class="text-ink font-medium">Feature flags hide their provenance.</span> The response
				gives you a resolved boolean, not whether it came from an org row, the global row, or a code
				default. Writing it back pins an org-specific row and silently stops the org tracking the
				global default — drift your differ cannot see, because before and after both read true.
			</p>
		</div>
	</section>
</div>

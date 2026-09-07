<script lang="ts">
	import { MEMBER_FIELDS, ORG_FIELDS, type Storage } from '$lib/catalog';
	import { Badge, Page, Panel } from '$lib/primitives';

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

<Page
	title="Storage"
	lead="One RPC, four write paths, all inside a single transaction."
	wide
>
	<Panel title="Where to look" subtitle="A missing value means something different in every store." padded>
		<pre class="diagram">{MAP}</pre>
	</Panel>

	<div class="store-list">
		{#each STORES as store (store.id)}
			{@const fields = store.id === 'chat' ? [] : fieldsFor(store.id)}
			<Panel padded class="store-card">
				<div class="store-head">
					<h3 class="store-title">{store.title}</h3>
					{#if fields.length}<Badge>{fields.length} fields</Badge>{/if}
				</div>

				<p class="store-blurb">{store.blurb}</p>
				<p class="store-absent"><strong>Absent means:</strong> {store.absent}</p>

				{#if store.id === 'member_meta'}
					<ul class="member-fields">
						{#each MEMBER_FIELDS as f (f.key)}
							<li>
								<code>{f.key}</code>
								<span class:gotcha={Boolean(f.gotcha)}> — {f.gotcha ?? f.summary}</span>
							</li>
						{/each}
					</ul>
				{:else if fields.length}
					<div class="field-chips">
						{#each fields as f (f.key)}<code>{f.key}</code>{/each}
					</div>
				{/if}
			</Panel>
		{/each}
	</div>

	<Panel title="If you are diffing config" padded class="diff-notes">
		<div class="notes">
			<p>
				<strong>Read-modify-write the two blobs.</strong>
				<code>paradigm_params</code> and <code>tool_restrictions</code> have no field presence, so a
				partial write turns every omitted toggle off.
			</p>
			<p>
				<strong>Use the clear sentinel for connectors.</strong> A repeated
				proto3 field cannot express "empty", so <code>clearDefaultConnectorIds</code> exists. Do not
				send it alongside a list — the list wins, which is the opposite of how the model-id clear flags
				resolve.
			</p>
			<p>
				<strong>Send the retention fields together.</strong> Sandbox and
				thread windows cross-validate in both directions, so applying them one at a time produces
				spurious InvalidArgument errors depending on order.
			</p>
			<p>
				<strong>Exclude the fields that cannot round-trip.</strong>
				<code>restrictedModelIds</code> is rewritten on read, <code>defaultConnectorIds</code> is
				derived, and <code>emailOutputEnabled</code>, <code>configMigrationsEnabled</code> and
				<code>configAutofixEnabled</code> are accepted and discarded. Diffing them produces permanent
				phantom drift.
			</p>
			<p>
				<strong>Watch the implicit writes.</strong>
				<code>secretsEnabled</code> also sets <code>allowAllApiAccess</code>;
				<code>dashboardsEnabled: false</code> clears <code>defaultDashboardOutput</code>; writing
				<code>toolRestrictions</code> forces <code>multipleConnectorMode</code> true.
			</p>
			<p>
				<strong>Feature flags hide their provenance.</strong> The response
				gives you a resolved boolean, not whether it came from an org row, the global row, or a code
				default. Writing it back pins an org-specific row and silently stops the org tracking the
				global default — drift your differ cannot see, because before and after both read true.
			</p>
		</div>
	</Panel>
</Page>

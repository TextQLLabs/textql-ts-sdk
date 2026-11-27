<script lang="ts">
	import { Badge, Page, Panel } from '$lib/primitives';
	import { CATEGORY_BLURBS, CATEGORY_LABELS, ORG_FIELDS, type Category } from '$lib/catalog';
	import { TOOL_FIELDS } from '$lib/tools';

	const CATEGORIES: Category[] = ['identity', 'config', 'policy', 'feature-gate'];

	const counts = $derived(
		Object.fromEntries(
			CATEGORIES.map((c) => [c, ORG_FIELDS.filter((f) => f.category === c).length])
		) as Record<Category, number>
	);

	const maskedCount = TOOL_FIELDS.filter((f) => f.ceiling === 'and').length;
	const inertCount = TOOL_FIELDS.filter((f) => f.ceiling === 'none').length;

	const LAYERS = `  organization row
  ┌──────────────────────────────────────────────────┐
  │  tool_restrictions : ParadigmParams   ← AVAILABLE│
  │      "may this tool be used at all?"             │
  │                                                  │
  │  paradigm_params   : ParadigmParams   ← DEFAULT  │
  │      "is it on when a new thread opens?"         │
  └──────────────────────────────────────────────────┘
                        │
                        │  a member may override the DEFAULT only
                        ▼
  member_meta row
  ┌──────────────────────────────────────────────────┐
  │  paradigm_params : ParadigmParams                │
  │      replaces the org default wholesale          │
  └──────────────────────────────────────────────────┘

  There is no member-level Available. It is org-only.`;

	const PIPELINE = `  member.paradigm_params ?? org.paradigm_params
                 │  member wins wholesale if non-null
                 ▼
        context degradation      ontology → false when no attached
                 │               connector has an ontology
                 ▼
        caller override          CreateChat accepts an explicit
                 │               paradigm; nothing validates it
                 ▼
        ┌────────────────────────────────────┐
        │  admin?  ──yes──▶  skip the mask   │
        └────────────────┬───────────────────┘
                         │ no
                         ▼
        applyRestrictions(seed, tool_restrictions)
                         │
                         ▼
        written to chat.paradigm_options     ← a snapshot.
                                                never re-masked.`;

	const MECHANISMS = `                   UpdateOrganizationSettings
                             │
       ┌─────────────────┬───┴────────────┬─────────────────┐
       ▼                 ▼                ▼                 ▼
  organization      feature_flags   org_default_      organization
     row               table         connectors        .org_meta
       │                 │                │                 │
  bool columns +    org row, else     join table,      merge-patched
  2 JSONB blobs     global row,       delete-then-      JSONB column
                    else code          insert
                    default
       │                 │                │                 │
  absent = NULL     absent means     no sentinel =     absent = key
  (unset)           whatever the     "leave alone"     not present
                    call site says`;
</script>

<Page
	title="The model behind the switches"
	lead="What is underneath the two columns on the Features page."
	wide
>
	<Panel
		title="Three mechanisms, one RPC"
		subtitle="All four writes happen inside one transaction; an absent value means something different in each store."
		padded
		class="stack"
	>
		<pre class="diagram">{MECHANISMS}</pre>
	</Panel>

	<Panel title="Available and Default are the same message" padded class="stack">
		<pre class="diagram">{LAYERS}</pre>
		<p class="note">
			Both columns hold the <em>same</em> proto type, so they accept identical JSON. Position is the
			entire semantic difference — nothing inside the object says which role it is playing.
			<a href="/tools">Try the resolver →</a>
		</p>
	</Panel>

	<Panel title="How a thread resolves its tools" padded class="stack">
		<pre class="diagram">{PIPELINE}</pre>
		<div class="stat-grid">
			<div class="stat"><strong>{maskedCount}</strong><span>fields Available actually gates</span></div>
			<div class="stat"><strong>{inertCount}</strong><span>fields stored but never consulted</span></div>
			<div class="stat"><strong>{TOOL_FIELDS.length}</strong><span>toggles in the message</span></div>
		</div>
	</Panel>

	<Panel title="The four kinds of org setting" padded class="stack">
		<div class="category-grid">
			{#each CATEGORIES as category (category)}
				<div class="category">
					<div class="category-head">
						<h3>{CATEGORY_LABELS[category]}</h3>
						<Badge>{counts[category]}</Badge>
					</div>
					<p>{CATEGORY_BLURBS[category]}</p>
				</div>
			{/each}
		</div>
		<p class="note"><a href="/fields">Browse the catalog →</a></p>
	</Panel>

	<Panel title="Things that surprise people" padded class="stack">
		<ul class="surprises">
			<li>
				<strong>Available is a snapshot.</strong> It is applied once, when a
				thread is created. Turning a capability off later does not disable it in threads that already
				exist.
			</li>
			<li>
				<strong>Admins skip it.</strong> The mask is not applied for any
				admin auth context, including admin API keys — so on the chat path it is not a security
				boundary for them. The sandbox-exec, forms and datasets gates have no such bypass.
			</li>
			<li>
				<strong>Python cannot be turned off.</strong> It is hard-set on
				after the mask runs, and the sandbox gate always allows it.
			</li>
			<li>
				<strong>Both blobs are whole-message replaces.</strong> The message
				has no field presence, so anything left out of a write is stored as false. Read, modify, then
				write.
			</li>
			<li>
				<strong>proto3 omits false.</strong> A response with four keys is not
				truncated — the other toggles are false. Decode with the schema rather than reading raw JSON.
			</li>
		</ul>
	</Panel>
</Page>

<style>
	:global(.stack) { margin-bottom: 14px; }
	.note { margin: 12px 0 0; max-width: 70ch; color: var(--color-muted); font-size: 10.5px; line-height: 1.6; }
	.note a { color: var(--color-access); text-decoration: none; }
	.note a:hover { text-decoration: underline; }
	.stat-grid { display: grid; gap: 10px; margin-top: 14px; }
	.stat { border: 1px solid var(--color-line); border-radius: 8px; background: var(--color-elevate); padding: 11px 12px; }
	.stat strong { display: block; font-size: 17px; font-weight: 650; }
	.stat span { display: block; margin-top: 2px; color: var(--color-muted); font-size: 10px; }
	.category-grid { display: grid; gap: 10px; }
	.category { border: 1px solid var(--color-line); border-radius: 8px; background: var(--color-elevate); padding: 11px 12px; }
	.category-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
	.category h3 { margin: 0; font-size: 11.5px; font-weight: 600; }
	.category p { margin: 6px 0 0; color: var(--color-muted); font-size: 10px; line-height: 1.55; }
	.surprises { display: grid; gap: 9px; margin: 0; padding: 0; list-style: none; color: var(--color-muted); font-size: 10.5px; line-height: 1.6; }
	.surprises strong { color: var(--color-ink); font-weight: 600; }
	@media (min-width: 640px) {
		.stat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
		.category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}
</style>

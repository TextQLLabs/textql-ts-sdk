<script lang="ts">
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

<div class="space-y-12">
	<section>
		<h1 class="text-2xl font-semibold tracking-tight">The model behind the switches</h1>
		<p class="text-muted mt-2 max-w-3xl text-sm leading-relaxed">
			The Features page shows two columns. This page explains what is underneath them — why there
			are two, where each is stored, and what happens between an org setting and a running thread.
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="text-sm font-semibold tracking-tight">Three mechanisms, one RPC</h2>
		<div class="border-line bg-panel rounded-sm border p-5">
			<pre class="diagram text-ink">{MECHANISMS}</pre>
		</div>
		<p class="text-muted text-xs leading-relaxed">
			All four writes happen inside one transaction. The row that matters for anyone diffing config
			is the last one: an absent value means something different in each store.
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="text-sm font-semibold tracking-tight">Available and Default are the same message</h2>
		<div class="border-line bg-panel rounded-sm border p-5">
			<pre class="diagram text-ink">{LAYERS}</pre>
		</div>
		<p class="text-muted max-w-3xl text-xs leading-relaxed">
			Both columns hold the <em>same</em> proto type, so they accept identical JSON. Position is the
			entire semantic difference — nothing inside the object says which role it is playing.
			<a class="text-info underline underline-offset-2" href="/tools">Try the resolver →</a>
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="text-sm font-semibold tracking-tight">How a thread resolves its tools</h2>
		<div class="border-line bg-panel rounded-sm border p-5">
			<pre class="diagram text-ink">{PIPELINE}</pre>
		</div>
		<div class="grid gap-3 sm:grid-cols-3">
			<div class="border-line bg-panel rounded-sm border p-4">
				<div class="text-ink text-lg font-semibold">{maskedCount}</div>
				<div class="text-muted mt-0.5 text-xs">fields Available actually gates</div>
			</div>
			<div class="border-line bg-panel rounded-sm border p-4">
				<div class="text-ink text-lg font-semibold">{inertCount}</div>
				<div class="text-muted mt-0.5 text-xs">fields stored but never consulted</div>
			</div>
			<div class="border-line bg-panel rounded-sm border p-4">
				<div class="text-ink text-lg font-semibold">{TOOL_FIELDS.length}</div>
				<div class="text-muted mt-0.5 text-xs">toggles in the message</div>
			</div>
		</div>
	</section>

	<section class="space-y-3">
		<h2 class="text-sm font-semibold tracking-tight">The four kinds of org setting</h2>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each CATEGORIES as category (category)}
				<div class="border-line bg-panel rounded-sm border p-4">
					<div class="flex items-baseline justify-between">
						<h3 class="text-ink text-[13px] font-medium">{CATEGORY_LABELS[category]}</h3>
						<span class="text-muted font-mono text-xs">{counts[category]}</span>
					</div>
					<p class="text-muted mt-1.5 text-xs leading-relaxed">{CATEGORY_BLURBS[category]}</p>
				</div>
			{/each}
		</div>
		<p class="text-muted text-xs leading-relaxed">
			<a class="text-info underline underline-offset-2" href="/fields">Browse the catalog →</a>
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="text-sm font-semibold tracking-tight">Things that surprise people</h2>
		<ul class="text-muted space-y-2 text-xs leading-relaxed">
			<li>
				<span class="text-ink font-medium">Available is a snapshot.</span> It is applied once, when a
				thread is created. Turning a capability off later does not disable it in threads that already
				exist.
			</li>
			<li>
				<span class="text-ink font-medium">Admins skip it.</span> The mask is not applied for any
				admin auth context, including admin API keys — so on the chat path it is not a security
				boundary for them. The sandbox-exec, forms and datasets gates have no such bypass.
			</li>
			<li>
				<span class="text-ink font-medium">Python cannot be turned off.</span> It is hard-set on
				after the mask runs, and the sandbox gate always allows it.
			</li>
			<li>
				<span class="text-ink font-medium">Both blobs are whole-message replaces.</span> The message
				has no field presence, so anything left out of a write is stored as false. Read, modify, then
				write.
			</li>
			<li>
				<span class="text-ink font-medium">proto3 omits false.</span> A response with four keys is not
				truncated — the other toggles are false. Decode with the schema rather than reading raw JSON.
			</li>
		</ul>
	</section>
</div>

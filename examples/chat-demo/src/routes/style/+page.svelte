<script lang="ts">
	import {
		Button,
		Text,
		Switch,
		Modal,
		Toaster,
		toast,
		Marquee,
		Page
	} from '$lib/primitives';

	const buttonVariants = [
		'solid',
		'classic',
		'soft',
		'surface',
		'outline',
		'ghost',
	] as const;
	const buttonSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
	const textSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
	const textColors = ['black', 'muted', 'accent'] as const;
	const textTypes = ['paragraph', 'label', 'heading', 'important'] as const;

	let switchOn = $state(true);
	let switchOff = $state(false);
	let modalOpen = $state(false);
	let scrambleKey = $state(0);
</script>

<svelte:head>
	<title>Style guide · chat-demo</title>
</svelte:head>

<Toaster />

<div class="style-shell">
	<Page
		title="Style guide"
		lead="Inventory of UI primitives — variants, sizes, and interactive states."
	>
		{#snippet actions()}
			<a class="back-link" href="/">← Chat demo</a>
		{/snippet}

		<div class="guide">
			<nav class="toc" aria-label="On this page">
				<a href="#button">Button</a>
				<a href="#text">Text</a>
				<a href="#switch">Switch</a>
				<a href="#modal">Modal</a>
				<a href="#toaster">Toaster</a>
				<a href="#marquee">Marquee</a>
				<a href="#page">Page</a>
				<a href="#layout">Layout</a>
			</nav>

			<section id="button" class="card">
		<div class="card-head">
			<h2>Button</h2>
			<p>Variants × sizes, disabled, and link (<code>href</code>) rendering.</p>
		</div>

		<div class="block">
			<h3 class="block-label">Variants</h3>
			<div class="row">
				{#each buttonVariants as variant (variant)}
					<Button {variant}>{variant}</Button>
				{/each}
			</div>
		</div>

		<div class="block">
			<h3 class="block-label">Sizes</h3>
			<div class="row items-end">
				{#each buttonSizes as size (size)}
					<Button {size}>{size}</Button>
				{/each}
			</div>
		</div>

		<div class="block">
			<h3 class="block-label">Matrix</h3>
			<div class="matrix">
				{#each buttonVariants as variant (variant)}
					<div class="matrix-row">
						<span class="matrix-label">{variant}</span>
						<div class="row items-end">
							{#each buttonSizes as size (size)}
								<Button {variant} {size}>{size}</Button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="block">
			<h3 class="block-label">States &amp; link</h3>
			<div class="row">
				<Button disabled>Disabled solid</Button>
				<Button variant="outline" disabled>Disabled outline</Button>
				<Button variant="ghost" disabled>Disabled ghost</Button>
				<Button href="/">Link to home</Button>
				<Button href="/" variant="soft">Soft link</Button>
			</div>
		</div>
	</section>

	<section id="text" class="card">
		<div class="card-head">
			<h2>Text</h2>
			<p>Sizes, colors, types, and optional scramble animation.</p>
		</div>

		<div class="block">
			<h3 class="block-label">Sizes</h3>
			<div class="stack">
				{#each textSizes as size (size)}
					<div class="sample-row">
						<span class="sample-meta">{size}</span>
						<Text {size}>The quick brown fox jumps over the lazy dog.</Text>
					</div>
				{/each}
			</div>
		</div>

		<div class="block">
			<h3 class="block-label">Colors</h3>
			<div class="row wrap">
				{#each textColors as color (color)}
					<Text {color} size="md">{color}</Text>
				{/each}
				<span class="swatch">
					<Text color="white" size="md">white</Text>
				</span>
			</div>
		</div>

		<div class="block">
			<h3 class="block-label">Types</h3>
			<div class="stack">
				{#each textTypes as type (type)}
					<div class="sample-row">
						<span class="sample-meta">{type}</span>
						<Text {type} size={type === 'heading' || type === 'important' ? 'xl' : 'md'}>
							{type === 'label' ? 'Section label' : 'Sample ' + type + ' text'}
						</Text>
					</div>
				{/each}
			</div>
		</div>

		<div class="block">
			<h3 class="block-label">Animate</h3>
			<div class="row items-center">
				{#key scrambleKey}
					<Text type="heading" size="xl" animate duration={900}>Scramble on mount</Text>
				{/key}
				<Button
					variant="outline"
					size="sm"
					onclick={() => {
						scrambleKey += 1;
					}}
				>
					Replay
				</Button>
			</div>
			<p class="hint">Hover the line below to re-scramble.</p>
			<Text type="heading" size="lg" animateOnHover>Hover to scramble</Text>
		</div>
	</section>

	<section id="switch" class="card">
		<div class="card-head">
			<h2>Switch</h2>
			<p>Bindable on/off state; disabled when interaction should be locked.</p>
		</div>
		<div class="row wrap">
			<label class="switch-label">
				<span>On</span>
				<Switch bind:checked={switchOn} />
			</label>
			<label class="switch-label">
				<span>Off</span>
				<Switch bind:checked={switchOff} />
			</label>
			<label class="switch-label">
				<span>Disabled on</span>
				<Switch checked={true} disabled />
			</label>
			<label class="switch-label">
				<span>Disabled off</span>
				<Switch checked={false} disabled />
			</label>
		</div>
		<p class="hint">Live: on={String(switchOn)} · off={String(switchOff)}</p>
	</section>

	<section id="modal" class="card">
		<div class="card-head">
			<h2>Modal</h2>
			<p>Dialog with title, body, and action row. Backdrop / Escape dismiss by default.</p>
		</div>
		<Button variant="solid" onclick={() => (modalOpen = true)}>Open sample modal</Button>

		<Modal bind:open={modalOpen} title="Confirm action">
			<p>
				This is sample modal body copy. Use the actions snippet for dismiss + primary buttons
				(dismiss first, primary last).
			</p>
			{#snippet actions()}
				<Button variant="ghost" onclick={() => (modalOpen = false)}>Cancel</Button>
				<Button
					variant="solid"
					onclick={() => {
						modalOpen = false;
						toast.success('Confirmed');
					}}
				>
					Confirm
				</Button>
			{/snippet}
		</Modal>
	</section>

	<section id="toaster" class="card">
		<div class="card-head">
			<h2>Toaster</h2>
			<p>
				<code>Toaster</code> mounts a Sonner host; <code>toast</code> is re-exported from
				<code>$lib/primitives</code>.
			</p>
		</div>
		<div class="row wrap">
			<Button variant="soft" onclick={() => toast('Default toast')}>Default</Button>
			<Button variant="soft" onclick={() => toast.success('Saved successfully')}>Success</Button>
			<Button variant="soft" onclick={() => toast.error('Something went wrong')}>Error</Button>
			<Button
				variant="soft"
				onclick={() =>
					toast('With description', {
						description: 'Optional secondary line for context.',
					})}
			>
				With description
			</Button>
		</div>
	</section>

	<section id="marquee" class="card">
		<div class="card-head">
			<h2>Marquee</h2>
			<p>Horizontal scroll when text overflows the container; centers when it fits.</p>
		</div>
		<div class="marquee-frame">
			<Marquee
				text="Streaming status · analyzing datasets · waiting for input · tool sequence complete · "
				speed={48}
				gap={40}
			/>
		</div>
		<div class="marquee-frame narrow">
			<Marquee text="Fits — centered" center speed={40} />
		</div>
	</section>

	<section id="page" class="card">
		<div class="card-head">
			<h2>Page</h2>
			<p>
				App page shell: full-bleed header (title, optional lead, optional actions with space-between) + max-width body.
				Works embedded in the chat shell or standalone — not mounted here to avoid nesting
				another full-height frame.
			</p>
		</div>
		<div class="api-box">
			<pre class="api-code">{`<Page title="Playbooks" lead="Optional supporting line." wide={false}>
  {#snippet actions()}
    <button type="button">New playbook</button>
  {/snippet}

  <!-- body -->
</Page>`}</pre>
			<ul class="api-list">
				<li><strong>title</strong> — required page heading</li>
				<li><strong>lead</strong> — muted supporting sentence under the title</li>
				<li><strong>actions</strong> — snippet for header-right controls</li>
				<li><strong>children</strong> — body content in a centered 840px column</li>
				<li><strong>wide</strong> — full-width body/header (e.g. ontology)</li>
				<li><strong>class</strong> — optional class on the root</li>
			</ul>
		</div>
	</section>

	<section id="layout" class="card">
		<div class="card-head">
			<h2>Layout</h2>
			<p>
				App chrome: desktop sidebar nav + mobile top bar, breakpoint / scroll listeners, optional
				debug overlay. Shell-only — skip mounting on this inventory page.
			</p>
		</div>
		<div class="api-box">
			<pre class="api-code">{`<Layout path={page.url.pathname}>
  {@render children()}
</Layout>`}</pre>
			<ul class="api-list">
				<li><strong>path</strong> — active route for nav highlight</li>
				<li>Links: home, blog; components when <code>?debug</code></li>
				<li>Wraps route content; pair with <code>Page</code> inside children</li>
			</ul>
		</div>
	</section>
		</div>
	</Page>
</div>

<style>
	.style-shell {
		min-height: 100dvh;
	}

	.guide {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.back-link {
		font-size: 13px;
		font-weight: 500;
		color: #52525b;
		text-decoration: none;
	}

	.back-link:hover {
		color: var(--color-ink);
	}

	.toc {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.85rem;
		padding-bottom: 0.85rem;
		border-bottom: 1px solid var(--color-line);
	}

	.toc a {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-accent);
		text-decoration: none;
	}

	.toc a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.25rem 1.35rem 1.4rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-paper) 88%, white);
		box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset;
	}

	.card-head h2 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 560;
		letter-spacing: -0.01em;
		color: var(--color-ink);
	}

	.card-head p {
		margin: 0.35rem 0 0;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--color-muted);
	}

	.card-head code,
	.api-list code {
		font-family: var(--font-mono);
		font-size: 0.78em;
		padding: 0.05em 0.3em;
		border-radius: 4px;
		background: var(--color-sidebar);
		color: var(--color-ink);
	}

	.block {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.block-label {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.items-end {
		align-items: flex-end;
	}

	.items-center {
		align-items: center;
	}

	.wrap {
		flex-wrap: wrap;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.matrix {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.matrix-row {
		display: grid;
		grid-template-columns: 4.5rem 1fr;
		gap: 0.75rem;
		align-items: end;
	}

	.matrix-label {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--color-muted);
		padding-bottom: 0.35rem;
	}

	.sample-row {
		display: grid;
		grid-template-columns: 5.5rem 1fr;
		gap: 0.75rem;
		align-items: baseline;
	}

	.sample-meta {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--color-muted);
	}

	.swatch {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.65rem;
		border-radius: var(--radius-sm);
		background: var(--color-ink);
	}

	.hint {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-muted);
	}

	.switch-label {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-ink);
		cursor: pointer;
	}

	.marquee-frame {
		width: 100%;
		max-width: 28rem;
		padding: 0.75rem 0.9rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-md);
		background: var(--color-sidebar);
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--color-ink);
	}

	.marquee-frame.narrow {
		max-width: 12rem;
	}

	.api-box {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.api-code {
		margin: 0;
		padding: 0.9rem 1rem;
		overflow-x: auto;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-line);
		background: var(--color-sidebar);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		line-height: 1.55;
		color: var(--color-ink);
		white-space: pre;
	}

	.api-list {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.8125rem;
		line-height: 1.55;
		color: var(--color-muted);
	}

	.api-list strong {
		color: var(--color-ink);
		font-weight: 550;
	}

	@media (max-width: 640px) {
		.matrix-row,
		.sample-row {
			grid-template-columns: 1fr;
			gap: 0.35rem;
		}
	}
</style>

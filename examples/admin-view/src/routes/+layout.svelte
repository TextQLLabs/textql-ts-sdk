<script lang="ts">
	import { navigating, page } from '$app/state';
	import {
		BookOpenText,
		Bot,
		ChevronDown,
		Flag,
		History,
		LayoutDashboard,
		ShieldCheck,
		Users
	} from '@lucide/svelte';

	import '../app.css';
	import { initials } from '$lib/admin';
	import { mutations } from '$lib/mutate.svelte';
	import { Toaster } from '$lib/primitives';

	let { data, children } = $props();
	let referenceOpen = $state(false);

	const NAV = [
		{ href: '/', label: 'Overview', icon: LayoutDashboard },
		{ href: '/people', label: 'People & access', icon: Users },
		{ href: '/roles', label: 'Roles', icon: ShieldCheck },
		{ href: '/models', label: 'Models', icon: Bot },
		{ href: '/features', label: 'Features', icon: Flag },
		{ href: '/changes', label: 'Audit log', icon: History }
	];

	const REFERENCE = [
		{ href: '/model', label: 'Configuration model' },
		{ href: '/tools', label: 'Tool resolver' },
		{ href: '/fields', label: 'Field catalog' },
		{ href: '/storage', label: 'Storage map' }
	];

	// Two separate signals: `navigating` covers route changes, `mutations.busy`
	// covers writes — `invalidateAll` is not a navigation and never sets the former.
	const busy = $derived(navigating.to !== null || mutations.busy);
	const current = $derived(page.url.pathname);

	function navActive(href: string): boolean {
		return href === '/' ? current === '/' : current === href || current.startsWith(`${href}/`);
	}
</script>

{#if busy}<div class="route-progress" role="progressbar" aria-label="Loading"></div>{/if}

<div class="app-shell">
	<aside class="sidebar">
		<div class="brand-block">
			<a href="/" class="brand-mark" aria-label="TextQL administration">
				<span class="brand-glyph">T</span>
				<span>
					<span class="brand-name">TextQL</span>
					<span class="brand-product">Administration</span>
				</span>
			</a>
		</div>

		<div class="org-switcher">
			<div class="org-avatar">{initials(data.admin.organizationName)}</div>
			<div class="min-w-0 flex-1">
				<div class="org-name">{data.admin.organizationName}</div>
				<div class="org-meta">
					{data.admin.mode === 'live' ? 'Live organization' : 'Not connected'}
				</div>
			</div>
		</div>

		<nav class="primary-nav" aria-label="Administration">
			<div class="nav-eyebrow">Manage</div>
			{#each NAV as item (item.href)}
				{@const active = navActive(item.href)}
				<a
					href={item.href}
					class:active
					class="nav-item"
					aria-current={active ? 'page' : undefined}
				>
					<item.icon size={16} strokeWidth={1.8} />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="sidebar-spacer"></div>

		<div class="reference-nav">
			<button
				type="button"
				class="reference-trigger"
				onclick={() => (referenceOpen = !referenceOpen)}
				aria-expanded={referenceOpen}
			>
				<BookOpenText size={15} />
				<span>Developer reference</span>
				<ChevronDown size={13} class={referenceOpen ? 'rotate-180' : ''} />
			</button>
			{#if referenceOpen}
				<div class="reference-links">
					{#each REFERENCE as item (item.href)}
						<a href={item.href}>{item.label}</a>
					{/each}
				</div>
			{/if}
		</div>

		<div class="connection-state" class:connected={data.admin.mode === 'live'}>
			<span class="status-dot"></span>
			<span>{data.admin.mode === 'live' ? 'TextQL SDK connected' : '@textql/sdk 1.4.21'}</span>
		</div>
	</aside>

	<div class="main-column">
		<nav class="mobile-nav" aria-label="Administration">
			{#each NAV as item (item.href)}
				{@const active = navActive(item.href)}
				<a href={item.href} class:active aria-current={active ? 'page' : undefined}>{item.label}</a>
			{/each}
		</nav>

		<main class="main-content">
			{@render children()}
		</main>
	</div>
</div>
<Toaster />

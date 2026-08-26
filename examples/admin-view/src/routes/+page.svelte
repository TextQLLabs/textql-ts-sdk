<script lang="ts">
	import { AlertTriangle, ArrowRight, CheckCircle2, KeyRound, ShieldCheck, UserRound } from '@lucide/svelte';

	import ConnectionEmpty from '$lib/ConnectionEmpty.svelte';
	import { connectorLogoForType, connectorNameForType } from '$lib/connectorBranding';
	import { getModelIconSrc, getModelName, resolveDefaultModel } from '$lib/modelCatalog';
	import { Badge, BrandLogo, EmptyState, Page, Pager, Panel, Select } from '$lib/primitives';

	let { data } = $props();
	const admin = $derived(data.admin);

	const peopleWithoutRoles = $derived(
		admin.people.filter((person) => person.kind === 'person' && person.roleIds.length === 0)
	);
	const rolesWithoutPermissions = $derived(
		admin.roles.filter(
			(role) => !role.isSystem && (admin.rolePermissions[role.id]?.length ?? 0) === 0
		)
	);
	const expiringKeys = $derived(
		admin.apiKeys.filter((key) => {
			if (!key.expiresAt || key.status === 'revoked') return false;
			const remaining = new Date(key.expiresAt).getTime() - Date.now();
			return remaining > 0 && remaining < 1000 * 60 * 60 * 24 * 30;
		})
	);
	const reviewCount = $derived(
		peopleWithoutRoles.length + rolesWithoutPermissions.length + expiringKeys.length
	);

	// A large org runs dozens of connectors; the panel sits beside Models in a
	// fixed-height row, so the list is filtered and paged rather than unbounded.
	const CONNECTORS_PER_PAGE = 6;
	let connectorType = $state<string | number>('all');
	let connectorPage = $state(0);

	const connectorTypeOptions = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const connector of admin.connectors) {
			counts.set(connector.type, (counts.get(connector.type) ?? 0) + 1);
		}
		return [
			{ value: 'all', label: 'All types', meta: `${admin.connectors.length}` },
			...[...counts]
				.sort((a, b) => b[1] - a[1] || connectorNameForType(a[0]).localeCompare(connectorNameForType(b[0])))
				.map(([type, count]) => ({
					value: type,
					label: connectorNameForType(type),
					meta: `${count}`,
					iconSrc: connectorLogoForType(type) || undefined
				}))
		];
	});

	const filteredConnectors = $derived(
		connectorType === 'all'
			? admin.connectors
			: admin.connectors.filter((connector) => connector.type === connectorType)
	);
	const connectorPageCount = $derived(
		Math.max(1, Math.ceil(filteredConnectors.length / CONNECTORS_PER_PAGE))
	);
	const connectorPageStart = $derived(connectorPage * CONNECTORS_PER_PAGE);
	const visibleConnectors = $derived(
		filteredConnectors.slice(connectorPageStart, connectorPageStart + CONNECTORS_PER_PAGE)
	);

	/**
	 * organization.default_llm_model when set, otherwise .system_default_model —
	 * either way the panel names the model new threads start on.
	 */
	const orgDefaultModel = $derived(resolveDefaultModel(admin.organization ?? {}));
	const restrictedModels = $derived(
		(Array.isArray(admin.organization?.restrictedModelIds)
			? (admin.organization.restrictedModelIds as unknown[])
			: []
		)
			.filter((id): id is number => typeof id === 'number')
			.map((id) => ({ id, name: getModelName(id), logo: getModelIconSrc(id) }))
	);

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(value));
	}
</script>

{#snippet reviewBadge()}
	<Badge tone={reviewCount === 0 ? 'success' : 'warning'}>
		{reviewCount === 0 ? 'Clear' : reviewCount}
	</Badge>
{/snippet}

{#snippet connectorFilter()}
	<div class="connector-filter">
		<Select
			value={connectorType}
			options={connectorTypeOptions}
			label="Filter connectors by type"
			searchable={connectorTypeOptions.length > 8}
			searchPlaceholder="Find a type"
			onValueChange={(value) => {
				connectorType = value;
				connectorPage = 0;
			}}
		/>
	</div>
{/snippet}

{#snippet actions()}
	{#if admin.mode === 'live'}
		<Badge tone="success"><CheckCircle2 size={11} /> Live organization</Badge>
	{/if}
{/snippet}

<Page title="Overview" lead="Know who can do what across this organization." wide {actions}>

{#if admin.mode !== 'live'}
	<ConnectionEmpty mode={admin.mode} error={admin.error} />
{:else}
	<div class="overview-grid">
		<Panel
			class="review-panel"
			title="Review first"
			subtitle={reviewCount === 0
				? 'No obvious access hygiene issues found.'
				: `${reviewCount} items need attention.`}
			actions={reviewBadge}
		>

			{#if reviewCount === 0}
				<div class="review-clear">
					<CheckCircle2 size={19} />
					<div>
						<strong>Access posture looks healthy</strong>
						<span>Every person has a role, custom roles grant permissions, and no key expires soon.</span>
					</div>
				</div>
			{:else}
				<div class="review-list">
					{#if peopleWithoutRoles.length}
						<a href="/people?filter=no-role" class="review-row">
							<span class="review-icon warning"><UserRound size={16} /></span>
							<span>
								<strong>{peopleWithoutRoles.length} {peopleWithoutRoles.length === 1 ? 'person has' : 'people have'} no role</strong>
								<small>They may be unable to use organization resources.</small>
							</span>
							<ArrowRight size={14} />
						</a>
					{/if}
					{#if rolesWithoutPermissions.length}
						<a href="/roles" class="review-row">
							<span class="review-icon warning"><ShieldCheck size={16} /></span>
							<span>
								<strong>{rolesWithoutPermissions.length} empty custom {rolesWithoutPermissions.length === 1 ? 'role' : 'roles'}</strong>
								<small>Members assigned to them receive no RBAC permissions.</small>
							</span>
							<ArrowRight size={14} />
						</a>
					{/if}
					{#if expiringKeys.length}
						<a href="/people?view=keys" class="review-row">
							<span class="review-icon warning"><KeyRound size={16} /></span>
							<span>
								<strong>{expiringKeys.length} API {expiringKeys.length === 1 ? 'key expires' : 'keys expire'} within 30 days</strong>
								<small>Rotate or replace credentials before dependent workflows stop.</small>
							</span>
							<ArrowRight size={14} />
						</a>
					{/if}
				</div>
			{/if}
		</Panel>

		<Panel class="posture-panel" title="Access posture" subtitle="Current organization records.">
			<dl class="posture-list">
				<div><dt>People</dt><dd>{admin.people.filter((person) => person.kind === 'person').length}</dd></div>
				<div><dt>Service accounts</dt><dd>{admin.people.filter((person) => person.kind === 'service-account').length}</dd></div>
				<div><dt>Roles</dt><dd>{admin.roles.length}</dd></div>
				<div><dt>Active API keys</dt><dd>{admin.apiKeys.filter((key) => key.status === 'active').length}</dd></div>
			</dl>
		</Panel>
	</div>

	<div class="overview-grid">
		<Panel
			class="connector-panel"
			title="Connectors"
			subtitle={`${admin.connectors.length} data sources this organization can query.`}
			actions={admin.connectors.length ? connectorFilter : undefined}
		>
			{#if visibleConnectors.length}
				<div class="brand-list">
					{#each visibleConnectors as connector (connector.id)}
						<div class="brand-row">
							<BrandLogo src={connectorLogoForType(connector.type)} name={connector.name} size={16} />
							<strong>{connector.name}</strong>
							<!-- Always occupied: grid auto-placement would otherwise slide the type
							     label into the badge column on rows that have no badge. -->
							<span>{#if connector.isDefault}<Badge tone="accent">Default</Badge>{/if}</span>
							<small>{connectorNameForType(connector.type)}</small>
						</div>
					{/each}
				</div>
				<Pager
					bind:page={connectorPage}
					pageCount={connectorPageCount}
					total={filteredConnectors.length}
					shown={visibleConnectors.length}
					perPage={CONNECTORS_PER_PAGE}
				/>
			{:else}
				<EmptyState
					icon={AlertTriangle}
					title={admin.connectors.length ? 'No connectors of that type' : 'No connectors returned'}
					description={admin.connectors.length ? 'Clear the type filter to see the rest.' : undefined}
				/>
			{/if}
		</Panel>

		<Panel title="Models" subtitle="Which model new threads resolve to." actions={modelsLink}>
			<div class="brand-list">
				<div class="brand-row">
					<BrandLogo src={orgDefaultModel.iconSrc} name={orgDefaultModel.name} size={20} />
					<span>
						<strong>{orgDefaultModel.name}</strong>
						<small>Org default{orgDefaultModel.inherited ? ' · from the system default' : ''}</small>
					</span>
				</div>
				{#each restrictedModels as model (model.id)}
					<div class="brand-row muted-row">
						<BrandLogo src={model.logo} name={model.name} size={20} />
						<span><strong>{model.name}</strong><small>Restricted org-wide</small></span>
					</div>
				{/each}
			</div>
		</Panel>
	</div>

	<Panel
		class="recent-panel"
		title="Recent audit activity"
		subtitle="Latest security and operational events."
		actions={auditLink}
	>
		{#if admin.changes.length}
			<div class="recent-list">
				{#each admin.changes.slice(0, 5) as change (change.id)}
					<div class="recent-row">
						<div class="activity-mark"></div>
						<div>
							<strong>{change.action}</strong>
							<span>{change.actor} · {change.resourceType}{change.resourceId ? ` · ${change.resourceId}` : ''}</span>
						</div>
						<time datetime={change.createdAt}>{formatDate(change.createdAt)}</time>
					</div>
				{/each}
			</div>
		{:else}
			<EmptyState icon={AlertTriangle} title="No audit entries were returned" />
		{/if}
	</Panel>
{/if}
</Page>

{#snippet modelsLink()}
	<a href="/models" class="quiet-link">Manage <ArrowRight size={12} /></a>
{/snippet}

{#snippet auditLink()}
	<a href="/changes" class="quiet-link">View audit log <ArrowRight size={12} /></a>
{/snippet}

<style>
	.overview-grid { display: grid; grid-template-columns: minmax(0,1.7fr) minmax(240px,.8fr); gap: 16px; margin-bottom: 16px; }
	.review-list { display: grid; }
	.review-row { display: grid; grid-template-columns: 34px minmax(0,1fr) auto; align-items: center; gap: 11px; border-bottom: 1px solid var(--color-line); padding: 14px 18px; color: var(--color-ink); text-decoration: none; }
	.review-row:last-child { border: 0; }
	.review-row:hover { background: var(--color-paper); }
	.review-row > :global(svg) { color: var(--color-subtle); }
	.review-icon { display: grid; height: 32px; width: 32px; place-items: center; border-radius: 8px; }
	.review-icon.warning { background: var(--color-warning-soft); color: var(--color-warning); }
	.review-row strong, .review-row small { display: block; }
	.review-row strong { font-size: 11px; font-weight: 650; }
	.review-row small { margin-top: 3px; color: var(--color-muted); font-size: 10px; }
	.review-clear { display: flex; align-items: flex-start; gap: 11px; padding: 22px 18px; color: var(--color-decision); }
	.review-clear strong, .review-clear span { display: block; }
	.review-clear strong { font-size: 12px; }
	.review-clear span { margin-top: 4px; color: var(--color-muted); font-size: 10px; }
	.posture-list { margin: 0; padding: 7px 18px; }
	.posture-list div { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-line); padding: 11px 0; }
	.posture-list div:last-child { border: 0; }
	.posture-list dt { color: var(--color-muted); font-size: 10px; }
	.posture-list dd { margin: 0; font-family: var(--font-mono); font-size: 12px; font-weight: 650; }
	:global(.quiet-link) { display: inline-flex; align-items: center; gap: 5px; color: var(--color-access); font-size: 10px; text-decoration: none; }
	.recent-list { display: grid; }
	.recent-row { display: grid; grid-template-columns: 10px minmax(0,1fr) auto; align-items: center; gap: 10px; border-bottom: 1px solid var(--color-line); padding: 12px 18px; }
	.recent-row:last-child { border: 0; }
	.activity-mark { height: 6px; width: 6px; border-radius: 50%; background: var(--color-access); }
	.recent-row strong, .recent-row span { display: block; }
	.recent-row strong { font-size: 10px; font-weight: 620; }
	.recent-row span { margin-top: 3px; color: var(--color-muted); font-size: 9px; }
	.recent-row time { color: var(--color-subtle); font-family: var(--font-mono); font-size: 9px; }
	.brand-list { display: grid; }
	.brand-row { display: grid; grid-template-columns: 20px minmax(0,1fr) auto; align-items: center; gap: 11px; border-bottom: 1px solid var(--color-line); padding: 11px 18px; }
	.brand-row:last-child { border: 0; }
	.brand-row.muted-row { opacity: .6; }
	.brand-row strong, .brand-row small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.brand-row strong { font-size: 11px; font-weight: 650; }
	.brand-row small { margin-top: 3px; color: var(--color-muted); font-size: 9px; }
	/* Connectors run to dozens of rows, so they get a one-line variant: the type
	   moves onto the title line as a right-aligned label instead of a second row. */
	:global(.connector-panel) .brand-row { grid-template-columns: 16px auto auto minmax(0,1fr); gap: 9px; padding: 8px 18px; }
	:global(.connector-panel) .brand-row small { margin: 0; text-align: right; }
	.connector-filter { width: 190px; flex: 0 0 auto; }
	.connector-filter :global(.select-root > button) { border-radius: 7px; padding: 5px 8px; font-size: 11.5px; }
	.connector-filter :global(.select-root > button img) { width: 14px; height: 14px; }
	@media (max-width: 800px) { .overview-grid { grid-template-columns: 1fr; } }
</style>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Bot, KeyRound, Plus, Shield, UserPlus, Users, X } from '@lucide/svelte';

	import ConnectionEmpty from '$lib/ConnectionEmpty.svelte';
	import { EXPIRING_SOON_DAYS, formatDate, initials, isAdminRole, isExpiringSoon, personRoles, rolesById } from '$lib/admin';
	import { MutationTracker } from '$lib/mutate.svelte';
	import { Badge, Button, Page, Panel, SearchField, SegmentedControl, Select, Spinner } from '$lib/primitives';

	let { data } = $props();
	const saving = new MutationTracker();
	const admin = $derived(data.admin);
	/** Overview review links; each filter implies a view. */
	const FILTERS = {
		'no-role': { view: 'people', label: 'with no role' },
		expiring: { view: 'keys', label: `expiring within ${EXPIRING_SOON_DAYS} days` }
	} as const;
	type FilterKey = keyof typeof FILTERS;

	const requested = page.url.searchParams.get('filter');
	const requestedFilter: FilterKey | null =
		requested === 'no-role' || requested === 'expiring' ? requested : null;

	let focus = $state<FilterKey | null>(requestedFilter);
	let view = $state<'people' | 'service' | 'keys'>(
		requestedFilter
			? FILTERS[requestedFilter].view
			: page.url.searchParams.get('view') === 'keys'
				? 'keys'
				: 'people'
	);
	let query = $state('');
	let selectedId = $state('');
	let addRoleId = $state('');

	const viewOptions = $derived([
		{
			value: 'people',
			label: 'People',
			count: admin.people.filter((person) => person.kind === 'person').length
		},
		{
			value: 'service',
			label: 'Service accounts',
			count: admin.people.filter((person) => person.kind === 'service-account').length
		},
		{ value: 'keys', label: 'API keys', count: admin.apiKeys.length }
	]);

	const humanPeople = $derived(
		admin.people.filter(
			(person) =>
				person.kind === 'person' &&
				matches(person.name, person.email) &&
				(focus !== 'no-role' || person.roleIds.length === 0)
		)
	);
	const serviceAccounts = $derived(
		admin.people.filter(
			(person) => person.kind === 'service-account' && matches(person.name, person.email)
		)
	);
	const keys = $derived(
		admin.apiKeys.filter(
			(key) =>
				matches(key.name, key.ownerName, key.short) &&
				(focus !== 'expiring' || isExpiringSoon(key))
		)
	);
	const selectedPerson = $derived(
		admin.people.find((person) => person.id === selectedId) ??
		(view === 'people' ? humanPeople[0] : serviceAccounts[0])
	);
	const availableRoles = $derived(
		selectedPerson
			? admin.roles.filter((role) => !selectedPerson.roleIds.includes(role.id))
			: []
	);

	const focusCount = $derived(view === 'keys' ? keys.length : humanPeople.length);
	const focusNoun = $derived(
		view === 'keys' ? (focusCount === 1 ? 'key' : 'keys') : focusCount === 1 ? 'person' : 'people'
	);

	const roleLookup = $derived(rolesById(admin.roles));
	/** Enough to show admin plus one more before the column starts crowding. */
	const ROLE_TAG_LIMIT = 2;

	function matches(...values: string[]): boolean {
		const needle = query.trim().toLowerCase();
		return !needle || values.some((value) => value.toLowerCase().includes(needle));
	}

	function selectView(next: typeof view): void {
		view = next;
		selectedId = '';
		query = '';
		focus = null;
	}
</script>

{#snippet actions()}<Button variant="surface" size="sm" disabled={admin.mode !== 'live'}><UserPlus size={14} /> Invite person</Button>{/snippet}
<Page title="People & access" lead="People, service accounts, API keys, and their assigned roles." wide {actions}>

{#if admin.mode !== 'live'}
	<ConnectionEmpty mode={admin.mode} error={admin.error} />
{:else}

	<div class="identity-tabs">
		<SegmentedControl
			value={view}
			options={viewOptions}
			label="Identity type"
			onValueChange={(next) => selectView(next as typeof view)}
		/>
	</div>

	<div class="identity-layout" class:keys-view={view === 'keys'}>
		<Panel class="identity-list">
			<div class="list-toolbar">
				<SearchField bind:value={query} placeholder="Search this list" label="Search identities" />
			</div>

			{#if focus}
				<div class="focus-note">
					<Badge tone="warning">Filtered</Badge>
					<span>Showing {focusCount} {focusNoun} {FILTERS[focus].label}.</span>
					<Button variant="ghost" size="sm" onclick={() => (focus = null)}>
						<X size={13} /> Show all
					</Button>
				</div>
			{/if}

			{#if view === 'keys'}
				<div class="table-wrap">
					<table>
						<thead><tr><th>Key</th><th>Owner</th><th>Status</th><th>Expires</th></tr></thead>
						<tbody>
							{#each keys as key (key.id)}
								<tr>
									<td><strong>{key.name}</strong><small class="mono">{key.short}</small></td>
									<td>{key.ownerName}</td>
									<td><Badge tone={key.status === 'active' ? 'success' : 'neutral'}>{key.statusLabel}</Badge></td>
									<td>{key.expiresAt ? formatDate(key.expiresAt, 'date') : 'Never'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if keys.length === 0}<div class="list-empty">No API keys match this {focus ? 'filter' : 'search'}.</div>{/if}
			{:else}
				<div class="person-rows">
					{#each view === 'people' ? humanPeople : serviceAccounts as person (person.id)}
						{@const roles = personRoles(person, roleLookup)}
						<button
							type="button"
							class:selected={selectedPerson?.id === person.id}
							onclick={() => (selectedId = person.id)}
						>
							<span class:service={person.kind === 'service-account'} class="avatar">{initials(person.name)}</span>
							<span class="person-copy">
								<strong>{person.name}</strong>
								<small>{person.email}</small>
							</span>
							<span class="role-tags">
								{#each roles.slice(0, ROLE_TAG_LIMIT) as role (role.id)}
									<Badge tone={isAdminRole(role) ? 'accent' : 'neutral'}>
										{#if isAdminRole(role)}<Shield size={10} />{/if}{role.name}
									</Badge>
								{:else}
									<em>No role</em>
								{/each}
								{#if roles.length > ROLE_TAG_LIMIT}
									<Badge>+{roles.length - ROLE_TAG_LIMIT}</Badge>
								{/if}
							</span>
						</button>
					{/each}
				</div>
				{#if (view === 'people' ? humanPeople : serviceAccounts).length === 0}
					<div class="list-empty">No identities match this {focus ? 'filter' : 'search'}.</div>
				{/if}
			{/if}
		</Panel>

		{#if view !== 'keys' && selectedPerson}
			<aside class="panel identity-detail">
				<div class="detail-header">
					<span class:service={selectedPerson.kind === 'service-account'} class="avatar large">{initials(selectedPerson.name)}</span>
					<div>
						<h2>{selectedPerson.name}</h2>
						<p>{selectedPerson.email}</p>
					</div>
				</div>
				<div class="identity-facts">
					<div><span>Identity</span><strong>{selectedPerson.kind === 'person' ? 'Person' : 'Service account'}</strong></div>
					<div><span>Added</span><strong>{formatDate(selectedPerson.createdAt, 'date')}</strong></div>
					<div><span>Provisioning</span><strong>{selectedPerson.isScimManaged ? 'SCIM managed' : 'Direct'}</strong></div>
				</div>

				<div class="detail-section">
					<div class="detail-section-title"><span>Assigned roles</span><span>{selectedPerson.roleIds.length}</span></div>
					<div class="assigned-roles">
						{#each personRoles(selectedPerson, roleLookup) as role (role.id)}
							<div class="assigned-role">
								<span><Shield size={13} /><strong>{role.name}</strong></span>
								{#if selectedPerson.kind === 'person' && !selectedPerson.isScimManaged}
									{@const key = `remove:${role.id}`}
									<form
										method="POST"
										action="?/removeRole"
										use:enhance={saving.submit(key, () => `Remove ${role.name}`)}
									>
										<input type="hidden" name="memberId" value={selectedPerson.id} />
										<input type="hidden" name="roleId" value={role.id} />
										<button type="submit" disabled={saving.busy} aria-busy={saving.is(key) || undefined}>
											{#if saving.is(key)}<Spinner size={10} /> Removing{:else}Remove{/if}
										</button>
									</form>
								{/if}
							</div>
						{/each}
						{#if selectedPerson.roleIds.length === 0}<p>No roles assigned.</p>{/if}
					</div>

					{#if selectedPerson.kind === 'person' && !selectedPerson.isScimManaged}
						<form
							class="add-role"
							method="POST"
							action="?/assignRole"
							use:enhance={saving.submit('assign', 'Assign role')}
						>
							<input type="hidden" name="memberId" value={selectedPerson.id} />
							<input type="hidden" name="roleId" value={addRoleId} />
							<Select bind:value={addRoleId} options={availableRoles.map((role) => ({ value: role.id, label: role.name, hint: role.description }))} placeholder="Choose a role" label="Role to assign" searchable disabled={saving.busy} />
							<Button
								variant="surface"
								size="sm"
								type="submit"
								loading={saving.is('assign')}
								disabled={!addRoleId || saving.busy}
							>
								{#if !saving.is('assign')}<Plus size={13} />{/if} Add
							</Button>
						</form>
					{:else}
						<p class="managed-note">
							{selectedPerson.isScimManaged
								? 'Role membership is managed by your identity provider.'
								: 'Service-account roles are fixed when the account is created.'}
						</p>
					{/if}
				</div>
			</aside>
		{/if}
	</div>
{/if}
</Page>

<style>
	.identity-tabs { display: flex; gap: 4px; margin-bottom: 14px; }
	.identity-layout { display: grid; grid-template-columns: minmax(0,1.5fr) minmax(280px,.72fr); gap: 14px; align-items: start; }
	.identity-layout.keys-view { grid-template-columns: 1fr; }
	.list-toolbar { border-bottom: 1px solid var(--color-line); padding: 12px; }
	.focus-note { display: flex; align-items: center; gap: 9px; border-bottom: 1px solid var(--color-line); background: var(--color-warning-soft); padding: 8px 12px; color: var(--color-ink); font-size: 10px; }
	.focus-note > span { flex: 1; }
	.person-rows { display: grid; }
	.person-rows > button { display: grid; grid-template-columns: 34px minmax(0,1fr) minmax(100px,.65fr); align-items: center; gap: 10px; border: 0; border-bottom: 1px solid var(--color-line); background: transparent; padding: 12px 14px; text-align: left; cursor: pointer; }
	.person-rows > button:last-child { border: 0; }
	.person-rows > button:hover, .person-rows > button.selected { background: var(--color-paper); }
	.person-rows > button.selected { box-shadow: inset 2px 0 var(--color-access); }
	.avatar { display: grid; height: 31px; width: 31px; place-items: center; border-radius: 9px; background: var(--color-access-soft); color: var(--color-access); font-size: 9px; font-weight: 700; }
	.avatar.service { background: #eef0f7; color: #535e88; font-family: var(--font-mono); }
	.avatar.large { height: 42px; width: 42px; font-size: 11px; }
	.person-copy strong, .person-copy small { display: block; }
	.person-copy strong { font-size: 11px; font-weight: 650; }
	.person-copy small { margin-top: 3px; color: var(--color-muted); font-size: 9px; }
	.role-tags { display: flex; align-items: center; justify-content: flex-end; gap: 4px; overflow: hidden; }
	.role-tags :global(.badge) { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
	.role-tags em { color: var(--color-subtle); font-size: 9px; font-style: normal; }
	.identity-detail { overflow: hidden; }
	.detail-header { display: flex; align-items: center; gap: 11px; border-bottom: 1px solid var(--color-line); padding: 17px; }
	.detail-header h2 { margin: 0; font-size: 13px; font-weight: 650; }
	.detail-header p { margin: 3px 0 0; color: var(--color-muted); font-size: 9px; }
	.identity-facts { display: grid; grid-template-columns: repeat(3,1fr); border-bottom: 1px solid var(--color-line); padding: 13px 17px; }
	.identity-facts span, .identity-facts strong { display: block; }
	.identity-facts span { color: var(--color-subtle); font-size: 8px; text-transform: uppercase; }
	.identity-facts strong { margin-top: 4px; font-size: 9px; font-weight: 600; }
	.detail-section { padding: 16px 17px; }
	.detail-section-title { display: flex; justify-content: space-between; margin-bottom: 9px; color: var(--color-muted); font-size: 9px; font-weight: 650; text-transform: uppercase; }
	.assigned-roles { display: grid; gap: 6px; }
	.assigned-role { display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--color-line); border-radius: 7px; padding: 8px 9px; }
	.assigned-role > span { display: flex; align-items: center; gap: 7px; color: var(--color-access); }
	.assigned-role strong { color: var(--color-ink); font-size: 10px; }
	.assigned-role button { border: 0; background: transparent; color: var(--color-danger); font-size: 9px; cursor: pointer; }
	.assigned-roles p, .managed-note { margin: 5px 0; color: var(--color-muted); font-size: 10px; line-height: 1.5; }
	.add-role { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 7px; margin-top: 10px; }
	.table-wrap { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 10px; text-align: left; }
	th { color: var(--color-subtle); font-size: 8px; letter-spacing: .06em; text-transform: uppercase; }
	th, td { border-bottom: 1px solid var(--color-line); padding: 11px 14px; }
	tbody tr:last-child td { border: 0; }
	td strong, td small { display: block; }
	td strong { font-size: 10px; }
	td small { margin-top: 3px; color: var(--color-muted); font-size: 8px; }
	.list-empty { padding: 34px 18px; color: var(--color-muted); font-size: 11px; text-align: center; }
	@media (max-width: 900px) { .identity-layout { grid-template-columns: 1fr; } }
	@media (max-width: 560px) { .identity-tabs { overflow-x: auto; } .person-rows > button { grid-template-columns: 34px 1fr; } .role-tags { display: none; } }
</style>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Bot, KeyRound, Plus, Search, Shield, UserPlus, Users } from '@lucide/svelte';

	import ConnectionEmpty from '$lib/ConnectionEmpty.svelte';
	import { initials, roleNames, rolesById } from '$lib/admin';
	import { MutationTracker } from '$lib/mutate.svelte';
	import { Button, Page, Select, Spinner } from '$lib/primitives';

	let { data } = $props();
	const saving = new MutationTracker();
	const admin = $derived(data.admin);
	let view = $state<'people' | 'service' | 'keys'>(
		page.url.searchParams.get('view') === 'keys' ? 'keys' : 'people'
	);
	let query = $state('');
	let selectedId = $state('');
	let addRoleId = $state('');

	const humanPeople = $derived(
		admin.people.filter((person) => person.kind === 'person' && matches(person.name, person.email))
	);
	const serviceAccounts = $derived(
		admin.people.filter(
			(person) => person.kind === 'service-account' && matches(person.name, person.email)
		)
	);
	const keys = $derived(
		admin.apiKeys.filter((key) => matches(key.name, key.ownerName, key.short))
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

	const roleLookup = $derived(rolesById(admin.roles));

	function matches(...values: string[]): boolean {
		const needle = query.trim().toLowerCase();
		return !needle || values.some((value) => value.toLowerCase().includes(needle));
	}

	function selectView(next: typeof view): void {
		view = next;
		selectedId = '';
		query = '';
	}

	function formatDate(value: string | undefined): string {
		return value
			? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
			: 'Unknown';
	}
</script>

{#snippet actions()}<Button variant="surface" size="sm" disabled={admin.mode !== 'live'}><UserPlus size={14} /> Invite person</Button>{/snippet}
<Page title="People & access" lead="People, service accounts, API keys, and their assigned roles." wide {actions}>

{#if admin.mode !== 'live'}
	<ConnectionEmpty mode={admin.mode} error={admin.error} />
{:else}

	<div class="identity-tabs" role="tablist" aria-label="Identity type">
		<button class:active={view === 'people'} onclick={() => selectView('people')} type="button">
			<Users size={14} /> People <span>{admin.people.filter((person) => person.kind === 'person').length}</span>
		</button>
		<button class:active={view === 'service'} onclick={() => selectView('service')} type="button">
			<Bot size={14} /> Service accounts <span>{admin.people.filter((person) => person.kind === 'service-account').length}</span>
		</button>
		<button class:active={view === 'keys'} onclick={() => selectView('keys')} type="button">
			<KeyRound size={14} /> API keys <span>{admin.apiKeys.length}</span>
		</button>
	</div>

	<div class="identity-layout" class:keys-view={view === 'keys'}>
		<section class="panel identity-list">
			<div class="list-toolbar">
				<div class="search-box">
					<Search size={14} />
					<input bind:value={query} placeholder="Search this list" aria-label="Search identities" />
				</div>
			</div>

			{#if view === 'keys'}
				<div class="table-wrap">
					<table>
						<thead><tr><th>Key</th><th>Owner</th><th>Status</th><th>Expires</th></tr></thead>
						<tbody>
							{#each keys as key (key.id)}
								<tr>
									<td><strong>{key.name}</strong><small class="mono">{key.short}</small></td>
									<td>{key.ownerName}</td>
									<td><span class:success={key.status === 'active'} class="badge neutral">{key.statusLabel}</span></td>
									<td>{key.expiresAt ? formatDate(key.expiresAt) : 'Never'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if keys.length === 0}<div class="list-empty">No API keys match this search.</div>{/if}
			{:else}
				<div class="person-rows">
					{#each view === 'people' ? humanPeople : serviceAccounts as person (person.id)}
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
							<span class="role-summary">{roleNames(person, roleLookup).join(', ') || 'No role'}</span>
						</button>
					{/each}
				</div>
				{#if (view === 'people' ? humanPeople : serviceAccounts).length === 0}
					<div class="list-empty">No identities match this search.</div>
				{/if}
			{/if}
		</section>

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
					<div><span>Added</span><strong>{formatDate(selectedPerson.createdAt)}</strong></div>
					<div><span>Provisioning</span><strong>{selectedPerson.isScimManaged ? 'SCIM managed' : 'Direct'}</strong></div>
				</div>

				<div class="detail-section">
					<div class="detail-section-title"><span>Assigned roles</span><span>{selectedPerson.roleIds.length}</span></div>
					<div class="assigned-roles">
						{#each selectedPerson.roleIds as roleId (roleId)}
							{@const role = admin.roles.find((item) => item.id === roleId)}
							{#if role}
								<div class="assigned-role">
									<span><Shield size={13} /><strong>{role.name}</strong></span>
									{#if selectedPerson.kind === 'person' && !selectedPerson.isScimManaged}
										{@const key = `remove:${role.id}`}
										<form
											method="POST"
											action="?/removeRole"
											use:enhance={saving.submit(key, `Remove ${role.name}`)}
										>
											<input type="hidden" name="memberId" value={selectedPerson.id} />
											<input type="hidden" name="roleId" value={role.id} />
											<button type="submit" disabled={saving.busy} aria-busy={saving.is(key) || undefined}>
												{#if saving.is(key)}<Spinner size={10} /> Removing{:else}Remove{/if}
											</button>
										</form>
									{/if}
								</div>
							{/if}
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
	.identity-tabs button { display: flex; align-items: center; gap: 7px; border: 0; border-radius: 7px; background: transparent; padding: 8px 10px; color: var(--color-muted); font-size: 11px; cursor: pointer; }
	.identity-tabs button.active { background: white; color: var(--color-access); box-shadow: 0 1px 2px rgba(23,33,43,.07); }
	.identity-tabs button span { border-radius: 999px; background: var(--color-paper); padding: 1px 5px; font-family: var(--font-mono); font-size: 8px; }
	.identity-layout { display: grid; grid-template-columns: minmax(0,1.5fr) minmax(280px,.72fr); gap: 14px; align-items: start; }
	.identity-layout.keys-view { grid-template-columns: 1fr; }
	.list-toolbar { border-bottom: 1px solid var(--color-line); padding: 12px; }
	.search-box { display: flex; align-items: center; gap: 8px; border: 1px solid var(--color-line); border-radius: 7px; padding: 7px 9px; color: var(--color-subtle); }
	.search-box input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--color-ink); font-size: 11px; }
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
	.person-copy small, .role-summary { margin-top: 3px; color: var(--color-muted); font-size: 9px; }
	.role-summary { overflow: hidden; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
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
	@media (max-width: 560px) { .identity-tabs { overflow-x: auto; } .person-rows > button { grid-template-columns: 34px 1fr; } .role-summary { display: none; } }
</style>

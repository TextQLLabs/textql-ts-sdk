<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, ChevronRight, LockKeyhole, Plus, Search, ShieldCheck, Trash2, Users } from '@lucide/svelte';

	import ConnectionEmpty from '$lib/ConnectionEmpty.svelte';
	import ModelCatalogPicker from '$lib/ModelCatalogPicker.svelte';
	import { expandPermissionIds, type AdminPermission, type AdminRole } from '$lib/admin';
	import {
		CATALOG_MODELS,
		getModelEnumName,
		getModelIconSrcByEnum
	} from '$lib/modelCatalog';
	import { MutationTracker } from '$lib/mutate.svelte';
	import { Button, Page, Select, Switch, confirm as confirmDialog } from '$lib/primitives';

	let { data } = $props();
	const saving = new MutationTracker();
	let deleteForm = $state<HTMLFormElement>();
	const admin = $derived(data.admin);
	let selectedRoleId = $state('');
	let draftPermissionIds = $state<string[]>([]);
	let draftName = $state('');
	let draftDescription = $state('');
	let draftModels = $state<string[]>([]);
	let draftModelScope = $state<'all' | 'selected'>('all');
	let draftDefaultModel = $state<string | number>('MODEL_UNKNOWN');
	let draftModelChoice = $state(false);
	let permissionQuery = $state('');
	let showCreate = $state(false);

	const selectedRole = $derived(admin.roles.find((role) => role.id === selectedRoleId));
	const organization = $derived(admin.organization ?? {});
	const organizationEnabledIds = $derived(
		Array.isArray(organization.enabledModelIds)
			? organization.enabledModelIds.filter((id): id is number => typeof id === 'number')
			: []
	);
	const organizationRestrictedIds = $derived(
		Array.isArray(organization.restrictedModelIds)
			? organization.restrictedModelIds.filter((id): id is number => typeof id === 'number')
			: []
	);
	const deploymentEnabledIds = $derived(
		Array.isArray(organization.deploymentEnabledModelIds)
			? organization.deploymentEnabledModelIds.filter((id): id is number => typeof id === 'number')
			: []
	);
	const organizationModels = $derived(
		CATALOG_MODELS.filter((model) =>
			(organizationEnabledIds.length === 0 || organizationEnabledIds.includes(model.id)) &&
			!organizationRestrictedIds.includes(model.id) &&
			(deploymentEnabledIds.length === 0 || deploymentEnabledIds.includes(model.id))
		).map((model) => model.enumName)
	);
	const unavailableModels = $derived(
		CATALOG_MODELS.filter((model) => !organizationModels.includes(model.enumName)).map((model) => model.enumName)
	);
	const effectiveDraftModels = $derived(
		(draftModelScope === 'all' ? organizationModels : draftModels).filter((model) => organizationModels.includes(model))
	);
	const defaultModelOptions = $derived([
		{ value: 'MODEL_UNKNOWN', label: 'Inherit organization default', hint: 'No role override' },
		{ value: 'MODEL_DEFAULT', label: 'Organization default', hint: 'Resolve through the organization policy' },
		{ value: 'MODEL_DEFAULT_SYSTEM', label: 'System default', hint: 'Skip the organization override' },
		...CATALOG_MODELS.filter((model) => effectiveDraftModels.includes(model.enumName)).map((model) => ({
			value: model.enumName,
			label: model.name,
			iconSrc: getModelIconSrcByEnum(model.enumName)
		}))
	]);
	const currentPermissionIds = $derived(admin.rolePermissions[selectedRoleId] ?? []);
	const effectiveDraftPermissionIds = $derived(expandPermissionIds(draftPermissionIds, admin.permissions));
	const impliedByDraft = $derived.by(() => {
		const result = new Map<string, AdminPermission>();
		for (const explicitId of draftPermissionIds) {
			const source = admin.permissions.find((permission) => permission.id === explicitId);
			if (!source) continue;
			for (const impliedId of expandPermissionIds([explicitId], admin.permissions)) {
				if (impliedId !== explicitId && !draftPermissionIds.includes(impliedId)) {
					result.set(impliedId, source);
				}
			}
		}
		return result;
	});
	const changedPermissionCount = $derived(
		new Set([...currentPermissionIds, ...draftPermissionIds]).size -
		currentPermissionIds.filter((id) => draftPermissionIds.includes(id)).length
	);
	const metadataChanged = $derived(
		Boolean(
			selectedRole &&
				(draftName !== selectedRole.name ||
					draftDescription !== selectedRole.description ||
					draftModelScope !== (selectedRole.allowedModels.length === 0 ? 'all' : 'selected') ||
					(draftModelScope === 'selected' &&
						effectiveDraftModels.slice().sort().join(',') !== selectedRole.allowedModels.slice().sort().join(',')) ||
					String(draftDefaultModel) !== (selectedRole.defaultModel ?? 'MODEL_UNKNOWN') ||
					draftModelChoice !== (selectedRole.allowModelChoice ?? false))
		)
	);
	const hasChanges = $derived(changedPermissionCount > 0 || metadataChanged);
	/** System and SCIM-managed roles are read-only; so is anything mid-save. */
	const roleLocked = $derived(
		Boolean(selectedRole?.isSystem || selectedRole?.isScimManaged) || saving.busy
	);
	const affectedPeople = $derived(
		admin.people.filter((person) => person.roleIds.includes(selectedRoleId))
	);
	const permissionGroups = $derived.by(() => {
		const groups = new Map<string, AdminPermission[]>();
		for (const permission of admin.permissions) {
			if (
				permissionQuery &&
				!`${permission.resource} ${permission.action} ${permission.description}`
					.toLowerCase()
					.includes(permissionQuery.toLowerCase())
			) continue;
			const label = permission.resource.replaceAll('_', ' ');
			groups.set(label, [...(groups.get(label) ?? []), permission]);
		}
		return [...groups.entries()];
	});

	function selectRole(role: AdminRole): void {
		selectedRoleId = role.id;
		draftPermissionIds = [...(admin.rolePermissions[role.id] ?? [])];
		draftName = role.name;
		draftDescription = role.description;
		draftModels = [...role.allowedModels];
		draftModelScope = role.allowedModels.length === 0 ? 'all' : 'selected';
		draftDefaultModel = role.defaultModel ?? 'MODEL_UNKNOWN';
		draftModelChoice = role.allowModelChoice ?? false;
		permissionQuery = '';
	}

	$effect(() => {
		if (!selectedRoleId && admin.roles[0]) selectRole(admin.roles[0]);
	});

	function togglePermission(id: string): void {
		draftPermissionIds = draftPermissionIds.includes(id)
			? draftPermissionIds.filter((item) => item !== id)
			: [...draftPermissionIds, id];
	}

	function setModelScope(next: 'all' | 'selected'): void {
		draftModelScope = next;
		if (next === 'selected' && draftModels.length === 0) draftModels = [...organizationModels];
	}

	/**
	 * requestSubmit rather than submit: the latter bypasses the submit event, so
	 * `use:enhance` would never see the delete and it would full-page navigate.
	 */
	async function requestDelete(): Promise<void> {
		if (!selectedRole) return;
		const approved = await confirmDialog({
			tone: 'danger',
			title: `Delete ${selectedRole.name}?`,
			description: 'This removes the role from the organization and cannot be undone.',
			confirmLabel: 'Delete role'
		});
		if (approved) deleteForm?.requestSubmit();
	}
</script>

{#snippet actions()}<Button variant="surface" size="sm" onclick={() => (showCreate = !showCreate)} disabled={admin.mode !== 'live'}><Plus size={14} /> Create role</Button>{/snippet}
<Page title="Roles" lead="Product permissions and model policy, reviewed as one change." wide {actions}>

{#if admin.mode !== 'live'}
	<ConnectionEmpty mode={admin.mode} error={admin.error} />
{:else}
	{#if showCreate}
		<form
			class="panel create-role"
			method="POST"
			action="?/createRole"
			use:enhance={saving.submit('create', 'Create role')}
		>
			<div><strong>Create a custom role</strong><span>Start empty, then add permissions after creation.</span></div>
			<input class="field-input" name="name" placeholder="Role name" required />
			<input class="field-input" name="description" placeholder="What should this role be used for?" />
			<Button variant="solid" size="sm" type="submit" loading={saving.is('create')} disabled={saving.busy}>
				Create role
			</Button>
		</form>
	{/if}

	<div class="role-workspace">
		<aside class="panel role-list">
			<div class="panel-heading">
				<div><h2 class="panel-title">Organization roles</h2><p class="panel-subtitle">{admin.roles.length} total</p></div>
			</div>
			<div class="role-items">
				{#each admin.roles as role (role.id)}
					<button class:selected={selectedRoleId === role.id} type="button" onclick={() => selectRole(role)}>
						<span class="role-symbol"><ShieldCheck size={15} /></span>
						<span><strong>{role.name}</strong><small>{admin.people.filter((person) => person.roleIds.includes(role.id)).length} members · {expandPermissionIds(admin.rolePermissions[role.id] ?? [], admin.permissions).size} permissions</small></span>
						{#if role.isSystem}<LockKeyhole size={12} class="role-lock" />{:else}<ChevronRight size={13} />{/if}
					</button>
				{/each}
			</div>
		</aside>

		{#if selectedRole}
			<form
				class="panel role-editor"
				method="POST"
				action="?/saveRole"
				use:enhance={saving.submit('save', `Save ${selectedRole.name}`)}
			>
				<input type="hidden" name="roleId" value={selectedRole.id} />
				<input type="hidden" name="permissionIds" value={draftPermissionIds.join(',')} />
				<input type="hidden" name="modelScope" value={draftModelScope} />
				<!-- Only meaningful for the "selected" scope; "all" clears the allow list. -->
				<input
					type="hidden"
					name="allowedModels"
					value={draftModelScope === 'all' ? '' : effectiveDraftModels.join(',')}
				/>
				<input type="hidden" name="modelScope" value={draftModelScope} />
				<input type="hidden" name="defaultModel" value={String(draftDefaultModel)} />
				{#if draftModelChoice}<input type="hidden" name="allowModelChoice" value="on" />{/if}
				<div class="editor-header">
					<div class="editor-title-row">
						<div>
							<div class="editor-badges">
								{#if selectedRole.isSystem}<span class="badge neutral">System role</span>{/if}
								{#if selectedRole.isScimManaged}<span class="badge access">SCIM managed</span>{/if}
							</div>
							<input class="role-name-input" name="name" bind:value={draftName} disabled={selectedRole.isSystem || selectedRole.isScimManaged} />
						</div>
						<div class="impact"><Users size={13} /><strong>{affectedPeople.length}</strong><span>affected</span></div>
					</div>
					<textarea class="role-description" name="description" bind:value={draftDescription} rows="2" disabled={selectedRole.isSystem || selectedRole.isScimManaged}></textarea>
				</div>

				<div class="model-policy">
					<div class="model-policy-head">
						<div><strong>Model policy</strong><span>Narrow the <a href="/models">organization catalog</a> for this role.</span></div>
						<span class="badge access">{effectiveDraftModels.length} available</span>
					</div>
					<div class="model-policy-controls">
						<label class="scope-toggle">
							<Switch
								checked={draftModelScope === 'selected'}
								disabled={roleLocked || saving.busy}
								onCheckedChange={(on) => setModelScope(on ? 'selected' : 'all')}
								label="Restrict this role to selected models"
							/>
							<span>
								<strong>Restrict to selected models</strong>
								<small>Off inherits the whole organization catalog, including future models.</small>
							</span>
						</label>
						<div class="default-model">
							<label for="role-default-model">Default model</label>
							<Select
								id="role-default-model"
								bind:value={draftDefaultModel}
								options={defaultModelOptions}
								searchable
								disabled={roleLocked || saving.busy}
								label="Role default model"
								searchPlaceholder="Find a model"
							/>
						</div>
						<label class="choice-toggle">
							<Switch bind:checked={draftModelChoice} disabled={roleLocked || saving.busy} label="Members can choose a model" />
							<span><strong>Members can choose</strong><small>Show the model picker for this role.</small></span>
						</label>
					</div>
					{#if draftModelScope === 'selected'}
						<ModelCatalogPicker
							bind:selected={draftModels}
							unavailable={unavailableModels}
							disabled={roleLocked || saving.busy}
							dense
							unavailableLabel="Not in the organization catalog"
						/>
					{/if}
				</div>

				<div class="permissions-toolbar">
					<div><strong>Permissions</strong><span>{effectiveDraftPermissionIds.size} effective · {draftPermissionIds.length} explicit</span></div>
					<div class="permission-search"><Search size={13} /><input bind:value={permissionQuery} placeholder="Find a permission" /></div>
				</div>

				<div class="permission-groups">
					{#each permissionGroups as [group, permissions] (group)}
						<section class="permission-group">
							<h3>{group}</h3>
							{#each permissions as permission (permission.id)}
								<button
									type="button"
									class:checked={effectiveDraftPermissionIds.has(permission.id)}
									class:implied={impliedByDraft.has(permission.id)}
									onclick={() => togglePermission(permission.id)}
									disabled={selectedRole.isSystem || selectedRole.isScimManaged || impliedByDraft.has(permission.id)}
									title={impliedByDraft.has(permission.id) ? `Included by ${impliedByDraft.get(permission.id)?.action.replaceAll('_', ' ')}` : undefined}
								>
									<span class="permission-check">{#if effectiveDraftPermissionIds.has(permission.id)}<Check size={12} />{/if}</span>
									<span><strong>{permission.action.replaceAll('_', ' ')}</strong><small>{permission.description}{#if impliedByDraft.has(permission.id)}<em>[Included by {impliedByDraft.get(permission.id)?.action.replaceAll('_', ' ')}]</em>{/if}</small></span>
								</button>
							{/each}
						</section>
					{/each}
				</div>

				<div class="change-bar">
					<div>
						<strong>{hasChanges ? `${changedPermissionCount + (metadataChanged ? 1 : 0)} pending changes` : 'No pending changes'}</strong>
						<span>{affectedPeople.length} people and service accounts receive this role.</span>
					</div>
					{#if !selectedRole.isSystem && !selectedRole.isScimManaged}
						<div class="change-actions">
							<Button variant="ghost" size="sm" disabled={saving.busy} onclick={() => selectRole(selectedRole)}>
								Discard
							</Button>
							<Button
								variant="solid"
								size="sm"
								type="submit"
								loading={saving.is('save')}
								disabled={!hasChanges || saving.busy}
							>
								{saving.is('save') ? 'Saving…' : 'Save role'}
							</Button>
						</div>
					{/if}
				</div>
			</form>
		{/if}
	</div>

	{#if selectedRole && !selectedRole.isSystem && !selectedRole.isScimManaged}
		<form
			class="delete-role"
			method="POST"
			action="?/deleteRole"
			bind:this={deleteForm}
			use:enhance={saving.submit('delete', `Delete ${selectedRole.name}`)}
		>
			<input type="hidden" name="roleId" value={selectedRole.id} />
			<Button
				type="button"
				variant="danger-soft"
				size="sm"
				loading={saving.is('delete')}
				disabled={saving.busy}
				onclick={requestDelete}
			>
				{#if !saving.is('delete')}<Trash2 size={13} />{/if}
				Delete {selectedRole.name}
			</Button>
		</form>
	{/if}
{/if}
</Page>

<style>
	.create-role { display: grid; grid-template-columns: minmax(180px,.8fr) 1fr 1.5fr auto; align-items: center; gap: 10px; margin-bottom: 14px; padding: 13px; }
	.create-role strong, .create-role span { display: block; }
	.create-role strong { font-size: 11px; }.create-role span { margin-top: 3px; color: var(--color-muted); font-size: 9px; }
	.role-workspace { display: grid; grid-template-columns: 245px minmax(0,1fr); gap: 14px; align-items: start; }
	.role-list { overflow: hidden; }
	.role-items { display: grid; }
	.role-items > button { display: grid; grid-template-columns: 31px minmax(0,1fr) auto; align-items: center; gap: 9px; border: 0; border-bottom: 1px solid var(--color-line); background: transparent; padding: 12px 13px; text-align: left; cursor: pointer; }
	.role-items > button:last-child { border: 0; }
	.role-items > button:hover, .role-items > button.selected { background: var(--color-paper); }
	.role-items > button.selected { box-shadow: inset 2px 0 var(--color-access); }
	.role-symbol { display: grid; height: 29px; width: 29px; place-items: center; border-radius: 7px; background: var(--color-access-soft); color: var(--color-access); }
	.role-items strong, .role-items small { display: block; }.role-items strong { font-size: 10px; }.role-items small { margin-top: 4px; color: var(--color-muted); font-size: 8px; }
	.role-items > button > :global(svg) { color: var(--color-subtle); }
	.role-editor { overflow: hidden; }
	.editor-header { border-bottom: 1px solid var(--color-line); padding: 18px; }
	.editor-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
	.editor-badges { display: flex; gap: 5px; min-height: 18px; margin-bottom: 4px; }
	.role-name-input { width: min(440px,70vw); border: 0; background: transparent; padding: 0; color: var(--color-ink); font-size: 21px; font-weight: 620; letter-spacing: -.025em; outline: 0; }
	.role-description { width: min(650px,100%); resize: vertical; border: 0; background: transparent; margin-top: 6px; padding: 0; color: var(--color-muted); font-size: 11px; line-height: 1.5; outline: 0; }
	.impact { display: grid; grid-template-columns: auto auto; align-items: center; gap: 3px 6px; color: var(--color-access); }.impact span { grid-column: 1 / -1; color: var(--color-muted); font-size: 8px; text-transform: uppercase; }.impact strong { font-family: var(--font-mono); font-size: 13px; }
	.model-policy { display: grid; gap: 12px; border-bottom: 1px solid var(--color-line); background: var(--color-paper); padding: 13px 18px; }
	.model-policy-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
	.model-policy-controls { display: grid; grid-template-columns: minmax(0,1.3fr) minmax(180px,1fr) auto; align-items: center; gap: 14px; }
	.scope-toggle { display: flex; align-items: center; gap: 9px; }
	.default-model > label { display: block; }
	.choice-toggle { display: flex; align-items: center; gap: 6px; }
	.model-policy a { color: var(--color-access); text-decoration: none; }
	@media (max-width: 900px) { .model-policy-controls { grid-template-columns: 1fr; } }
	.model-policy strong, .model-policy span { display: block; }.model-policy strong { font-size: 10px; }.model-policy span, .model-policy label { margin-top: 3px; color: var(--color-muted); font-size: 8px; }.model-policy label { display: flex; align-items: center; gap: 6px; }
	.permissions-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--color-line); padding: 13px 18px; }
	.permissions-toolbar strong, .permissions-toolbar span { display: block; }.permissions-toolbar strong { font-size: 11px; }.permissions-toolbar span { margin-top: 2px; color: var(--color-muted); font-size: 8px; }
	.permission-search { display: flex; align-items: center; gap: 7px; border: 1px solid var(--color-line); border-radius: 7px; padding: 6px 8px; color: var(--color-subtle); }.permission-search input { width: 170px; border: 0; outline: 0; font-size: 9px; }
	.permission-groups { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px 26px; padding: 18px; }
	.permission-group h3 { margin: 0 0 7px; color: var(--color-subtle); font-size: 8px; letter-spacing: .08em; text-transform: uppercase; }
	.permission-group button { display: grid; width: 100%; grid-template-columns: 18px minmax(0,1fr); align-items: center; gap: 8px; border: 0; border-radius: 6px; background: transparent; padding: 7px 6px; text-align: left; cursor: pointer; }
	.permission-group button:hover { background: var(--color-paper); }.permission-group button:disabled { cursor: default; }
	.permission-check { display: grid; height: 16px; width: 16px; place-items: center; border: 1px solid var(--color-line); border-radius: 4px; color: white; }.checked .permission-check { border-color: var(--color-access); background: var(--color-access); }
	.permission-group button.implied { cursor: default; }.permission-group button.implied .permission-check { border-color: color-mix(in srgb,var(--color-access) 55%,var(--color-line)); background: color-mix(in srgb,var(--color-access) 72%,white); }
	.permission-group strong, .permission-group small { display: block; }.permission-group strong { font-size: 9px; font-weight: 620; text-transform: capitalize; }.permission-group small { margin-top: 2px; color: var(--color-muted); font-size: 8px; line-height: 1.35; }.permission-group small em { display: inline-block; margin-left: 6px; color: var(--color-access); font-style: normal; white-space: nowrap; }
	.change-bar { position: sticky; bottom: 0; display: flex; align-items: center; justify-content: space-between; gap: 15px; border-top: 1px solid var(--color-line); background: rgba(255,255,255,.94); padding: 12px 18px; backdrop-filter: blur(10px); }.change-bar strong, .change-bar span { display: block; }.change-bar strong { font-size: 10px; }.change-bar span { margin-top: 3px; color: var(--color-muted); font-size: 8px; }.change-actions { display: flex; gap: 7px; }
	.delete-role { display: flex; justify-content: flex-end; margin-top: 12px; }
	@media (max-width: 900px) { .create-role { grid-template-columns: 1fr; }.role-workspace { grid-template-columns: 1fr; }.role-items { grid-template-columns: repeat(2,minmax(0,1fr)); }.model-policy { grid-template-columns: 1fr; } }
	@media (max-width: 620px) { .role-items, .permission-groups { grid-template-columns: 1fr; }.permission-search input { width: 120px; }.change-bar { align-items: flex-start; flex-direction: column; }.change-actions { width: 100%; }.change-actions :global(.primitive-button) { flex: 1; } }
</style>

<script lang="ts">
	import { Check, Minus, X } from '@lucide/svelte';

	import { CEILING_LABELS, TOOL_FIELDS, TOOL_PAYLOAD_FIELDS, resolveTool, type ToolField } from '$lib/tools';
	import {
		Badge,
		Checkbox,
		DataTable,
		Page,
		Panel,
		SegmentedControl,
		Select,
		type BadgeTone,
		type TableColumn
	} from '$lib/primitives';

	let { data } = $props();

	let selectedKey = $state('bashEnabled');
	let ceiling = $state(true);
	let orgDefault = $state(false);
	let memberOverride = $state<'inherit' | 'on' | 'off'>('inherit');
	let isAdmin = $state(false);

	const field = $derived(TOOL_FIELDS.find((f) => f.key === selectedKey) ?? TOOL_FIELDS[0]);

	const result = $derived(
		resolveTool(field, {
			ceiling,
			orgDefault,
			memberOverride:
				memberOverride === 'inherit' ? null : memberOverride === 'on' ? true : false,
			isAdmin
		})
	);

	/** Live org values, if an API key is configured. */
	const liveParadigm = $derived(
		(data.admin.organization?.paradigmParams ?? undefined) as Record<string, unknown> | undefined
	);
	const liveRestrictions = $derived(
		(data.admin.organization?.toolRestrictions ?? undefined) as Record<string, unknown> | undefined
	);

	function liveValue(source: Record<string, unknown> | undefined, key: string) {
		if (!source) return null;
		return source[key] === true;
	}

	const CEILING_TONES: Record<string, BadgeTone> = {
		and: 'success',
		override: 'accent',
		'forced-on': 'warning',
		or: 'warning',
		none: 'danger'
	};

	const fieldOptions = TOOL_FIELDS.map((f) => ({ value: f.key, label: f.key }));
	const OVERRIDE_OPTIONS = [
		{ value: 'inherit', label: 'Inherit' },
		{ value: 'on', label: 'On' },
		{ value: 'off', label: 'Off' }
	];
	const columns: TableColumn[] = [
		{ label: 'Field' },
		{ label: 'Ceiling' },
		{ label: 'New-org default' },
		{ label: 'Live' },
		{ label: 'Also gated by' }
	];
</script>

<Page
	title="Tool permissions"
	lead="tool_restrictions and paradigm_params are the same proto message in two columns."
	wide
>
	<Panel class="stack">
		<div class="resolver">
			<div class="resolver-inputs">
				<label class="control">
					<span class="control-label" id="resolver-field-label">Field</span>
					<Select bind:value={selectedKey} options={fieldOptions} searchable label="Field" />
				</label>

				<Checkbox bind:checked={ceiling} label="tool_restrictions" />
				<Checkbox bind:checked={orgDefault} label="org paradigm_params" />

				<div class="control">
					<span class="control-label">Member override</span>
					<SegmentedControl
						bind:value={memberOverride}
						options={OVERRIDE_OPTIONS}
						label="Member override"
					/>
				</div>

				<Checkbox bind:checked={isAdmin} label="caller is an admin" />
			</div>

			<div class="resolver-output">
				<div class="result-line">
					<span class="control-label">Result</span>
					<Badge tone={result.enabled ? 'success' : 'danger'}>
						{field.label} is {result.enabled ? 'ON' : 'OFF'} in a new chat
					</Badge>
				</div>

				<ol class="steps">
					{#each result.steps as step, i (i)}
						<li>
							<span class="step-index">{i + 1}</span>
							<Badge tone={step.value ? 'success' : 'danger'}>{step.value}</Badge>
							<span><strong>{step.label}</strong> — {step.detail}</span>
						</li>
					{/each}
				</ol>

				{#if field.note}<p class="field-note">{field.note}</p>{/if}
			</div>
		</div>

		<p class="admin-note">
			<strong>Why the admin checkbox matters.</strong>
			<code>shouldApplyToolRestrictions</code> returns false for any admin auth context, including admin
			API keys, so the mask never runs and the seed goes straight to the chat row. The ceiling still
			applies to that admin on the sandbox-exec, forms and datasets surfaces, which read it live.
		</p>
	</Panel>

	<Panel title="Every field in the message" class="stack table-panel">
		<DataTable {columns} items={TOOL_FIELDS} key={(f: ToolField) => f.key} {row} />
	</Panel>

	<p class="footnote">
		{#if liveRestrictions}
			Live column shows <span class="mono">ceiling / default</span> for this org.
		{:else}
			Set <code>TEXTQL_API_KEY</code> in <code>.env</code> to populate the Live column.
		{/if}
	</p>

	<Panel title="Non-toggle members" padded class="stack">
		<ul class="payload-fields">
			{#each TOOL_PAYLOAD_FIELDS as f (f.key)}
				<li>
					<code>{f.key}</code><span class="mono type"> : {f.type}</span>
					<span class="muted"> — {f.note}</span>
				</li>
			{/each}
		</ul>
	</Panel>
</Page>

{#snippet row(f: ToolField)}
	{@const restrictionValue = liveValue(liveRestrictions, f.key)}
	{@const defaultValue = liveValue(liveParadigm, f.key)}
	<td>
		<button type="button" class="field-link" onclick={() => (selectedKey = f.key)}>{f.key}</button>
		{#if f.internal}<span class="tag">internal</span>{/if}
	</td>
	<td>
		<Badge tone={CEILING_TONES[f.ceiling]}>{CEILING_LABELS[f.ceiling]}</Badge>
		{#if f.liveReRead}<span class="tag">live</span>{/if}
	</td>
	<td>
		{#if f.defaultOn}<Check size={13} class="ok" />{:else}<Minus size={13} class="muted-icon" />{/if}
	</td>
	<td>
		{#if restrictionValue === null}
			<span class="muted">—</span>
		{:else}
			<span class="live-pair">
				<span title="tool_restrictions">
					{#if restrictionValue}<Check size={12} class="ok" />{:else}<X size={12} class="bad" />{/if}
				</span>
				<span class="sep">/</span>
				<span title="paradigm_params">
					{#if defaultValue}<Check size={12} class="ok" />{:else}<X size={12} class="bad" />{/if}
				</span>
			</span>
		{/if}
	</td>
	<td class="muted">{f.nonChatGates?.join(', ') ?? '—'}</td>
{/snippet}

<style>
	:global(.stack) { margin-bottom: 14px; }
	:global(.table-panel) { overflow: hidden; }
	.resolver { display: grid; gap: 20px; border-bottom: 1px solid var(--color-line); padding: 16px 18px; }
	.resolver-inputs { display: grid; align-content: start; gap: 12px; }
	.control { display: block; }
	.control-label { display: block; margin-bottom: 6px; color: var(--color-subtle); font-size: 9px; font-weight: 680; letter-spacing: .06em; text-transform: uppercase; }
	.resolver-output { display: grid; align-content: start; gap: 12px; }
	.result-line { display: flex; align-items: center; gap: 10px; }
	.result-line .control-label { margin: 0; }
	.steps { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }
	.steps li { display: flex; align-items: flex-start; gap: 8px; color: var(--color-muted); font-size: 10.5px; line-height: 1.5; }
	.steps strong { color: var(--color-ink); font-weight: 600; }
	.step-index { color: var(--color-subtle); font-family: var(--font-mono); font-size: 9.5px; }
	.field-note { margin: 0; border-radius: 7px; background: var(--color-warning-soft); padding: 9px 10px; color: var(--color-warning); font-size: 10.5px; line-height: 1.6; }
	.admin-note { margin: 0; padding: 14px 18px; color: var(--color-muted); font-size: 10.5px; line-height: 1.6; }
	.admin-note strong { color: var(--color-ink); font-weight: 600; }
	.field-link { border: 0; background: transparent; padding: 0; color: var(--color-ink); font-family: var(--font-mono); font-size: 11px; text-align: left; cursor: pointer; }
	.field-link:hover { color: var(--color-access); }
	.tag { margin-left: 6px; color: var(--color-subtle); font-size: 9px; }
	.live-pair { display: inline-flex; align-items: center; gap: 6px; }
	.sep { color: var(--color-line); }
	.muted { color: var(--color-muted); }
	.mono { font-family: var(--font-mono); }
	.type { color: var(--color-muted); font-size: 10px; }
	.payload-fields { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; font-size: 10.5px; }
	.payload-fields code { color: var(--color-ink); }
	.footnote { margin: 0 0 14px; color: var(--color-muted); font-size: 10px; line-height: 1.6; }
	:global(.ok) { color: var(--color-decision); }
	:global(.bad) { color: var(--color-danger); }
	:global(.muted-icon) { color: var(--color-muted); }
	@media (min-width: 768px) { .resolver { grid-template-columns: 220px minmax(0, 1fr); } }
</style>

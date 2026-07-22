<script lang="ts">
	import { asRecords, asString, asStrings, getCellPayload, type CellLike } from '$lib/cells';
	import { toast } from 'svelte-sonner';

	let { cell }: { cell: CellLike } = $props();

	// Cell payloads arrive as untyped proto JSON; read them with the same
	// coercion helpers the rest of the demo uses (enums are string names).
	const payload = $derived(getCellPayload(cell));
	const status = $derived(asString(payload.status));
	const questions = $derived(asRecords(payload.questions));
	const summary = $derived(asRecords(payload.answers));
	const pending = $derived(status === '' || status.endsWith('PENDING'));
	const dismissed = $derived(status.endsWith('DISMISSED'));

	type Working = { selected: string[]; custom: string; other: boolean; inputs: string[] };
	let working = $state<Working[]>([]);
	let submitting = $state(false);
	let done = $state(false); // optimistic: hide the form as soon as we submit

	// Re-seed the form only when a different questions cell mounts, so streamed
	// re-renders of the same cell don't wipe in-progress edits.
	let initId = '';
	$effect(() => {
		const id = asString(cell.id);
		if (id === initId) return;
		initId = id;
		working = questions.map((q) => ({
			selected: [],
			custom: '',
			other: false,
			inputs: asRecords(q.inputs).map(() => '')
		}));
	});

	function kindOf(q: Record<string, unknown>): 'choice' | 'multichoice' | 'inputs' {
		const k = asString(q.kind);
		if (k.endsWith('MULTICHOICE')) return 'multichoice';
		if (k.endsWith('INPUTS')) return 'inputs';
		return 'choice';
	}
	function inputType(input: Record<string, unknown>): 'text' | 'multiline' | 'password' {
		if (input.sensitive === true) return 'password';
		return asString(input.kind).endsWith('MULTILINE') ? 'multiline' : 'text';
	}

	function pickChoice(qi: number, name: string) {
		working[qi].selected = [name];
		working[qi].other = false;
	}
	function pickOther(qi: number) {
		working[qi].selected = [];
		working[qi].other = true;
	}
	function toggleMulti(qi: number, name: string, checked: boolean) {
		const set = new Set(working[qi].selected);
		if (checked) set.add(name);
		else set.delete(name);
		working[qi].selected = [...set];
	}

	async function send(action: 'submit' | 'dismiss') {
		submitting = true;
		try {
			const answers = working.map((w, i) => {
				const inputs = asRecords(questions[i].inputs);
				return {
					selected: w.selected,
					custom: w.other && w.custom ? w.custom : undefined,
					inputs: w.inputs,
					provided: inputs.map((_, j) => (w.inputs[j] ?? '').length > 0)
				};
			});
			const res = await fetch('/api/questions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action, cellId: asString(cell.id), answers })
			});
			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(body.error ?? `Request failed (${res.status})`);
			}
			done = true;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to send answers.');
		} finally {
			submitting = false;
		}
	}
</script>

<section class="questions" class:resolved={!pending || done}>
	{#if pending && !done}
		<header class="questions-head">Please answer to continue</header>

		{#each questions as q, qi (qi)}
			{@const kind = kindOf(q)}
			<fieldset class="question">
				<legend class="question-title">{asString(q.question)}</legend>
				{#if asString(q.explanation)}
					<p class="question-explain">{asString(q.explanation)}</p>
				{/if}

				{#if kind === 'choice'}
					{#each asRecords(q.options) as opt (asString(opt.name))}
						<label class="option">
							<input
								type="radio"
								name={`q-${qi}`}
								checked={working[qi]?.selected[0] === asString(opt.name)}
								onchange={() => pickChoice(qi, asString(opt.name))}
							/>
							<span>
								{asString(opt.name)}
								{#if asString(opt.description)}
									<em class="option-desc">{asString(opt.description)}</em>
								{/if}
							</span>
						</label>
					{/each}
					{#if q.allowCustom === true}
						<label class="option">
							<input
								type="radio"
								name={`q-${qi}`}
								checked={working[qi]?.other}
								onchange={() => pickOther(qi)}
							/>
							<span>Other…</span>
						</label>
						{#if working[qi]?.other}
							<input class="text-input" bind:value={working[qi].custom} placeholder="Your answer" />
						{/if}
					{/if}
				{:else if kind === 'multichoice'}
					{#each asRecords(q.options) as opt (asString(opt.name))}
						<label class="option">
							<input
								type="checkbox"
								checked={working[qi]?.selected.includes(asString(opt.name))}
								onchange={(e) => toggleMulti(qi, asString(opt.name), e.currentTarget.checked)}
							/>
							<span>
								{asString(opt.name)}
								{#if asString(opt.description)}
									<em class="option-desc">{asString(opt.description)}</em>
								{/if}
							</span>
						</label>
					{/each}
					{#if q.allowCustom === true}
						<label class="option">
							<input
								type="checkbox"
								checked={working[qi]?.other}
								onchange={(e) => (working[qi].other = e.currentTarget.checked)}
							/>
							<span>Other…</span>
						</label>
						{#if working[qi]?.other}
							<input class="text-input" bind:value={working[qi].custom} placeholder="Your answer" />
						{/if}
					{/if}
				{:else}
					{#each asRecords(q.inputs) as input, ii (ii)}
						{@const type = inputType(input)}
						<label class="field">
							<span class="field-label">
								{asString(input.label)}
								{#if asString(input.formPathLabel)}
									<em class="option-desc">→ {asString(input.formPathLabel)}</em>
								{/if}
							</span>
							{#if type === 'multiline'}
								<textarea class="text-input" rows="3" bind:value={working[qi].inputs[ii]}></textarea>
							{:else}
								<input
									class="text-input"
									type={type === 'password' ? 'password' : 'text'}
									bind:value={working[qi].inputs[ii]}
								/>
							{/if}
						</label>
					{/each}
				{/if}
			</fieldset>
		{/each}

		<div class="actions">
			<button type="button" class="btn-submit" disabled={submitting} onclick={() => send('submit')}>
				Submit
			</button>
			<button type="button" class="btn-skip" disabled={submitting} onclick={() => send('dismiss')}>
				Skip
			</button>
		</div>
	{:else}
		<header class="questions-head">{dismissed ? 'Questions skipped' : 'Answers submitted'}</header>
		{#each questions as q, qi (qi)}
			{@const ans = summary[qi]}
			{@const chosen = ans ? [...asStrings(ans.selected), asString(ans.custom)].filter(Boolean) : []}
			{@const filled = ans ? asStrings(ans.inputs).filter(Boolean) : []}
			<div class="answered">
				<span class="answered-q">{asString(q.question)}</span>
				<span class="answered-a">{[...chosen, ...filled].join(', ') || '—'}</span>
			</div>
		{/each}
	{/if}
</section>

<style>
	.questions {
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm, 10px);
		padding: 0.7rem 0.8rem;
		margin: 0.25rem 0;
		background: color-mix(in srgb, var(--color-ink) 3.5%, transparent);
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		font-size: 12.5px;
		color: var(--color-ink);
	}
	.questions-head {
		font-weight: 600;
		font-size: 12.5px;
		color: var(--color-muted);
	}
	.question {
		border: 0;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.question-title {
		font-weight: 500;
		font-size: 13px;
		padding: 0;
	}
	.question-explain,
	.option-desc {
		font-size: 11.5px;
		color: var(--color-muted);
		font-style: normal;
		margin: 0;
	}
	.option-desc {
		margin-left: 0.4rem;
	}
	.option {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		cursor: pointer;
		line-height: 1.5;
	}
	.option input {
		accent-color: var(--color-accent);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.field-label {
		font-weight: 500;
	}
	.text-input {
		font: inherit;
		font-size: 12.5px;
		padding: 0.3rem 0.5rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-xs, 6px);
		background: #fff;
		width: 100%;
		color: var(--color-ink);
	}
	.text-input:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
		border-color: transparent;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.15rem;
	}
	.btn-submit {
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		padding: 0.3rem 0.8rem;
		border: 0;
		border-radius: var(--radius-xs, 6px);
		background: var(--color-accent);
		color: #fff;
		cursor: pointer;
	}
	.btn-submit:hover {
		background: color-mix(in srgb, var(--color-accent) 88%, #000);
	}
	.btn-skip {
		font: inherit;
		font-size: 12px;
		padding: 0.3rem 0.2rem;
		border: 0;
		background: transparent;
		color: var(--color-muted);
		cursor: pointer;
	}
	.btn-skip:hover {
		color: var(--color-ink);
	}
	.btn-submit:disabled,
	.btn-skip:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.answered {
		display: flex;
		flex-direction: column;
	}
	.answered-q {
		font-weight: 500;
	}
	.answered-a {
		color: var(--color-muted);
	}
</style>

<script lang="ts">
	import Check from "@lucide/svelte/icons/check";
	import {
		asRecords,
		asString,
		asStrings,
		getCellPayload,
		type CellLike,
	} from "$lib/cells";
	import { toast } from "svelte-sonner";

	// onAnswered lets the page re-attach its watch stream so the resumed run's
	// cells show up (submitting halts → resumes the run on the backend).
	let { cell, onAnswered }: { cell: CellLike; onAnswered?: () => void } =
		$props();

	// Cell payloads arrive as untyped proto JSON; read them with the same
	// coercion helpers the rest of the demo uses (enums are string names).
	const payload = $derived(getCellPayload(cell));
	const status = $derived(asString(payload.status));
	const questions = $derived(asRecords(payload.questions));
	const summary = $derived(asRecords(payload.answers));
	const pending = $derived(status === "" || status.endsWith("PENDING"));
	const dismissed = $derived(status.endsWith("DISMISSED"));

	type Working = {
		selected: string[];
		custom: string;
		other: boolean;
		inputs: string[];
	};
	let working = $state<Working[]>([]);
	let submitting = $state(false);
	let done = $state(false); // optimistic: hide the form as soon as we submit

	const blank = (q: Record<string, unknown>): Working => ({
		selected: [],
		custom: "",
		other: false,
		inputs: asRecords(q.inputs).map(() => ""),
	});

	let initId = "";
	$effect(() => {
		const id = asString(cell.id);
		const reset = id !== initId;
		if (reset) initId = id;
		if (reset || working.length !== questions.length) {
			working = questions.map((q, i) =>
				reset ? blank(q) : (working[i] ?? blank(q)),
			);
		}
	});

	function kindOf(
		q: Record<string, unknown>,
	): "choice" | "multichoice" | "inputs" {
		const k = asString(q.kind);
		if (k.endsWith("MULTICHOICE")) return "multichoice";
		if (k.endsWith("INPUTS")) return "inputs";
		return "choice";
	}
	function inputType(
		input: Record<string, unknown>,
	): "text" | "multiline" | "password" {
		if (input.sensitive === true) return "password";
		return asString(input.kind).endsWith("MULTILINE")
			? "multiline"
			: "text";
	}

	function pickChoice(qi: number, name: string) {
		working[qi].selected = [name];
		working[qi].other = false;
	}
	function pickOther(qi: number, multi: boolean) {
		if (multi) {
			working[qi].other = !working[qi].other;
		} else {
			working[qi].selected = [];
			working[qi].other = true;
		}
	}
	function toggleMulti(qi: number, name: string) {
		const set = new Set(working[qi].selected);
		if (set.has(name)) set.delete(name);
		else set.add(name);
		working[qi].selected = [...set];
	}

	function answerText(qi: number): string {
		const ans = summary[qi];
		const server = ans
			? [
					...asStrings(ans.selected),
					asString(ans.custom),
					...asStrings(ans.inputs),
				].filter(Boolean)
			: [];
		if (server.length) return server.join(", ");
		const w = working[qi];
		if (!w) return "";
		const local = [
			...w.selected,
			w.other ? w.custom : "",
			...w.inputs,
		].filter(Boolean);
		return local.join(", ");
	}

	async function send(action: "submit" | "dismiss") {
		submitting = true;
		try {
			const answers = working.map((w, i) => {
				const inputs = asRecords(questions[i].inputs);
				return {
					selected: w.selected,
					custom: w.other && w.custom ? w.custom : undefined,
					inputs: w.inputs,
					provided: inputs.map(
						(_, j) => (w.inputs[j] ?? "").length > 0,
					),
				};
			});
			const res = await fetch("/api/questions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action,
					cellId: asString(cell.id),
					answers,
				}),
			});
			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as {
					error?: string;
				};
				throw new Error(body.error ?? `Request failed (${res.status})`);
			}
			done = true;
			onAnswered?.();
			toast.success(
				action === "submit" ? "Answers submitted" : "Questions skipped",
			);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to send answers.",
			);
		} finally {
			submitting = false;
		}
	}
</script>

{#snippet indicator(chosen: boolean, round: boolean)}
	<span class="indicator" class:round class:on={chosen}>
		{#if chosen}
			{#if round}<span class="dot"></span>{:else}<Check
					size={11}
					strokeWidth={3}
				/>{/if}
		{/if}
	</span>
{/snippet}

<section class="questions" class:resolved={!pending || done}>
	{#if pending && !done}
		<header class="questions-head">Please answer to continue</header>

		{#each questions as q, qi (qi)}
			{@const kind = kindOf(q)}
			<div class="question">
				<p class="question-title">{asString(q.question)}</p>
				{#if asString(q.explanation)}
					<p class="question-explain">{asString(q.explanation)}</p>
				{/if}

				{#if kind === "choice" || kind === "multichoice"}
					{@const multi = kind === "multichoice"}
					<div class="options">
						{#each asRecords(q.options) as opt (asString(opt.name))}
							{@const name = asString(opt.name)}
							{@const chosen =
								working[qi]?.selected.includes(name) ?? false}
							<button
								type="button"
								class="option"
								class:selected={chosen}
								aria-pressed={chosen}
								onclick={() =>
									multi
										? toggleMulti(qi, name)
										: pickChoice(qi, name)}
							>
								{@render indicator(chosen, !multi)}
								<span class="option-body">
									<span class="option-name">{name}</span>
									{#if asString(opt.description)}
										<span class="option-desc"
											>{asString(opt.description)}</span
										>
									{/if}
								</span>
							</button>
						{/each}
						{#if q.allowCustom === true}
							{@const chosen = working[qi]?.other ?? false}
							<button
								type="button"
								class="option"
								class:selected={chosen}
								aria-pressed={chosen}
								onclick={() => pickOther(qi, multi)}
							>
								{@render indicator(chosen, !multi)}
								<span class="option-body"
									><span class="option-name">Other…</span
									></span
								>
							</button>
							{#if chosen}
								<input
									class="text-input"
									bind:value={working[qi].custom}
									placeholder="Type your answer"
								/>
							{/if}
						{/if}
					</div>
				{:else}
					<div class="inputs">
						{#each asRecords(q.inputs) as input, ii (ii)}
							{@const type = inputType(input)}
							<label class="field">
								<span class="field-label">
									{asString(input.label)}
									{#if asString(input.formPathLabel)}
										<em class="option-desc"
											>→ {asString(
												input.formPathLabel,
											)}</em
										>
									{/if}
								</span>
								{#if type === "multiline"}
									<textarea
										class="text-input"
										rows="3"
										bind:value={working[qi].inputs[ii]}
									></textarea>
								{:else}
									<input
										class="text-input"
										type={type === "password"
											? "password"
											: "text"}
										bind:value={working[qi].inputs[ii]}
									/>
								{/if}
							</label>
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		<div class="actions">
			<button
				type="button"
				class="btn-submit"
				disabled={submitting}
				onclick={() => send("submit")}
			>
				Submit
			</button>
			<button
				type="button"
				class="btn-skip"
				disabled={submitting}
				onclick={() => send("dismiss")}
			>
				Skip
			</button>
		</div>
	{:else}
		<header class="questions-head">
			{dismissed ? "Questions skipped" : "Answers submitted"}
		</header>
		{#each questions as q, qi (qi)}
			<div class="answered">
				<span class="answered-q">{asString(q.question)}</span>
				<span class="answered-a">{answerText(qi) || "—"}</span>
			</div>
		{/each}
	{/if}
</section>

<style>
	.questions {
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm, 10px);
		padding: 0.75rem 0.85rem;
		margin: 0.25rem 0;
		background: color-mix(in srgb, var(--color-ink) 3.5%, transparent);
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		font-size: 12.5px;
		color: var(--color-ink);
	}
	.questions-head {
		font-weight: 600;
		font-size: 12px;
		letter-spacing: 0.01em;
		color: var(--color-muted);
	}
	.question {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.question-title {
		font-weight: 500;
		font-size: 13px;
		margin: 0;
	}
	.question-explain,
	.option-desc {
		font-size: 11.5px;
		color: var(--color-muted);
		font-style: normal;
		margin: 0;
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	/* Selectable card: neutral by default, accent border + tint when picked. */
	.option {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		width: 100%;
		text-align: left;
		font: inherit;
		font-size: 12.5px;
		color: var(--color-ink);
		padding: 0.4rem 0.55rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-xs, 6px);
		background: color-mix(in srgb, var(--color-paper) 60%, var(--color-elevate));
		cursor: pointer;
		transition:
			border-color 0.12s ease,
			background 0.12s ease;
	}
	.option:hover {
		border-color: color-mix(
			in srgb,
			var(--color-accent) 45%,
			var(--color-line)
		);
	}
	.option.selected {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, var(--color-elevate));
	}
	.option:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}
	/* Custom radio/checkbox indicator so the picked state reads clearly. */
	.indicator {
		flex: 0 0 auto;
		width: 15px;
		height: 15px;
		margin-top: 1px;
		border: 1.5px solid
			color-mix(in srgb, var(--color-ink) 25%, transparent);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		transition:
			border-color 0.12s ease,
			background 0.12s ease;
	}
	.indicator.round {
		border-radius: 50%;
	}
	.option.selected .indicator {
		border-color: var(--color-accent);
		background: var(--color-accent);
	}
	.option.selected .indicator.round {
		background: #fff;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-accent);
	}
	.option-body {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
		min-width: 0;
	}
	.option-name {
		font-weight: 450;
	}
	.inputs {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.field-label {
		font-weight: 500;
	}
	.text-input {
		font: inherit;
		font-size: 12.5px;
		padding: 0.35rem 0.55rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-xs, 6px);
		background: var(--color-elevate);
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
		gap: 0.6rem;
		margin-top: 0.15rem;
	}
	.btn-submit {
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		padding: 0.32rem 0.85rem;
		border: 0;
		border-radius: var(--radius-xs, 6px);
		background: var(--color-accent);
		color: #fff;
		cursor: pointer;
		transition: background 0.12s ease;
	}
	.btn-submit:hover {
		background: color-mix(in srgb, var(--color-accent) 88%, #000);
	}
	.btn-skip {
		font: inherit;
		font-size: 12px;
		padding: 0.32rem 0.3rem;
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

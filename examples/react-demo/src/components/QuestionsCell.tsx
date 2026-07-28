import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { asRecords, asString, asStrings, getCellPayload, type CellLike } from '../lib/cells';
import { cx } from '../lib/cx';

// onAnswered lets the page re-attach its watch stream so the resumed run's
// cells show up (submitting halts → resumes the run on the backend).
type Props = { cell: CellLike; onAnswered?: () => void };

type Working = {
	selected: string[];
	custom: string;
	other: boolean;
	inputs: string[];
};

const blank = (q: Record<string, unknown>): Working => ({
	selected: [],
	custom: '',
	other: false,
	inputs: asRecords(q.inputs).map(() => '')
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

const HEAD =
	'flex items-center justify-between gap-2 text-[12px] font-semibold tracking-[0.01em] text-muted';
const DESC = 'm-0 text-[11.5px] not-italic text-muted';
/** Selectable card: neutral by default, accent border + tint when picked. */
const OPTION =
	'flex w-full cursor-pointer items-start gap-2 rounded-xs border px-[0.55rem] py-[0.4rem] text-left text-[12.5px] text-ink transition-[border-color,background] duration-[0.12s] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';
const TEXT_INPUT =
	'w-full rounded-xs border border-line bg-elevate px-[0.55rem] py-[0.35rem] text-[12.5px] text-ink focus-visible:border-transparent focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-accent';
const BTN_SUBMIT =
	'cursor-pointer rounded-xs border-0 bg-accent px-[0.85rem] py-[0.32rem] text-[12px] font-medium text-white transition-[background] duration-[0.12s] hover:bg-[color-mix(in_srgb,var(--color-accent)_88%,#000)] disabled:cursor-not-allowed disabled:opacity-50';
const BTN_SKIP =
	'cursor-pointer border-0 bg-transparent px-[0.3rem] py-[0.32rem] text-[12px] text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-50';

/** Custom radio/checkbox indicator so the picked state reads clearly. */
function Indicator({ chosen, round }: { chosen: boolean; round: boolean }) {
	return (
		<span
			className={cx(
				'mt-px flex size-[15px] flex-none items-center justify-center border-[1.5px] text-white transition-[border-color,background] duration-[0.12s]',
				round ? 'rounded-full' : 'rounded-[4px]',
				chosen ? 'border-accent' : 'border-ink/25',
				chosen && (round ? 'bg-white' : 'bg-accent')
			)}
		>
			{chosen && (round ? <span className="size-[7px] rounded-full bg-accent" /> : <Check size={11} strokeWidth={3} />)}
		</span>
	);
}

export function QuestionsCell({ cell, onAnswered }: Props) {
	// Cell payloads arrive as untyped proto JSON; read them with the same
	// coercion helpers the rest of the demo uses (enums are string names).
	const payload = getCellPayload(cell);
	const status = asString(payload.status);
	const questions = asRecords(payload.questions);
	const summary = asRecords(payload.answers);
	const pending = status === '' || status.endsWith('PENDING');
	const dismissed = status.endsWith('DISMISSED');

	const [working, setWorking] = useState<Working[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false); // optimistic: hide the form as soon as we submit
	const [step, setStep] = useState(0); // one-question-at-a-time cursor into `questions`
	const initId = useRef('');

	useEffect(() => {
		const id = asString(cell.id);
		const reset = id !== initId.current;
		if (reset) {
			initId.current = id;
			setStep(0);
		}
		setWorking((current) => {
			if (!reset && current.length === questions.length) return current;
			return questions.map((q, i) => (reset ? blank(q) : (current[i] ?? blank(q))));
		});
		// keep the cursor in range if the question set shrinks
		setStep((current) => (current > questions.length - 1 ? Math.max(0, questions.length - 1) : current));
	}, [cell.id, questions.length]);

	const isLast = step >= questions.length - 1;

	function patch(qi: number, next: Partial<Working>) {
		setWorking((current) => current.map((w, i) => (i === qi ? { ...w, ...next } : w)));
	}

	function pickChoice(qi: number, name: string) {
		patch(qi, { selected: [name], other: false });
	}

	function pickOther(qi: number, multi: boolean) {
		if (multi) {
			patch(qi, { other: !working[qi]?.other });
		} else {
			patch(qi, { selected: [], other: true });
		}
	}

	function toggleMulti(qi: number, name: string) {
		const set = new Set(working[qi]?.selected ?? []);
		if (set.has(name)) set.delete(name);
		else set.add(name);
		patch(qi, { selected: [...set] });
	}

	function setInput(qi: number, ii: number, value: string) {
		setWorking((current) =>
			current.map((w, i) =>
				i === qi ? { ...w, inputs: w.inputs.map((v, j) => (j === ii ? value : v)) } : w
			)
		);
	}

	function answerText(qi: number): string {
		const ans = summary[qi];
		const server = ans
			? [...asStrings(ans.selected), asString(ans.custom), ...asStrings(ans.inputs)].filter(Boolean)
			: [];
		if (server.length) return server.join(', ');
		const w = working[qi];
		if (!w) return '';
		const local = [...w.selected, w.other ? w.custom : '', ...w.inputs].filter(Boolean);
		return local.join(', ');
	}

	async function send(action: 'submit' | 'dismiss') {
		setSubmitting(true);
		try {
			const answers = working.map((w, i) => {
				const inputs = asRecords(questions[i]!.inputs);
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
			setDone(true);
			onAnswered?.();
			toast.success(action === 'submit' ? 'Answers submitted' : 'Questions skipped');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to send answers.');
		} finally {
			setSubmitting(false);
		}
	}

	function renderQuestionCard(q: Record<string, unknown>, qi: number) {
		const kind = kindOf(q);
		const multi = kind === 'multichoice';

		return (
			<div className="flex flex-col gap-[0.35rem]">
				<p className="m-0 text-[13px] font-medium">{asString(q.question)}</p>
				{asString(q.explanation) && <p className={DESC}>{asString(q.explanation)}</p>}

				{kind === 'choice' || kind === 'multichoice' ? (
					<div className="flex flex-col gap-[0.3rem]">
						{asRecords(q.options).map((opt) => {
							const name = asString(opt.name);
							const chosen = working[qi]?.selected.includes(name) ?? false;
							return (
								<button
									key={name}
									type="button"
									className={cx(
										OPTION,
										chosen
											? 'border-accent bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-elevate))]'
											: 'border-line bg-[color-mix(in_srgb,var(--color-paper)_60%,var(--color-elevate))] hover:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))]'
									)}
									aria-pressed={chosen}
									onClick={() => (multi ? toggleMulti(qi, name) : pickChoice(qi, name))}
								>
									<Indicator chosen={chosen} round={!multi} />
									<span className="flex min-w-0 flex-col gap-[0.05rem]">
										<span className="font-[450]">{name}</span>
										{asString(opt.description) && (
											<span className={DESC}>{asString(opt.description)}</span>
										)}
									</span>
								</button>
							);
						})}
						{q.allowCustom === true && (
							<>
								<button
									type="button"
									className={cx(
										OPTION,
										working[qi]?.other
											? 'border-accent bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-elevate))]'
											: 'border-line bg-[color-mix(in_srgb,var(--color-paper)_60%,var(--color-elevate))] hover:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))]'
									)}
									aria-pressed={working[qi]?.other ?? false}
									onClick={() => pickOther(qi, multi)}
								>
									<Indicator chosen={working[qi]?.other ?? false} round={!multi} />
									<span className="flex min-w-0 flex-col gap-[0.05rem]">
										<span className="font-[450]">Other…</span>
									</span>
								</button>
								{working[qi]?.other && (
									<input
										className={TEXT_INPUT}
										value={working[qi]?.custom ?? ''}
										onChange={(event) => patch(qi, { custom: event.target.value })}
										placeholder="Type your answer"
									/>
								)}
							</>
						)}
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{asRecords(q.inputs).map((input, ii) => {
							const type = inputType(input);
							return (
								<label className="flex flex-col gap-1" key={ii}>
									<span className="font-medium">
										{asString(input.label)}
										{asString(input.formPathLabel) && (
											<em className={DESC}> → {asString(input.formPathLabel)}</em>
										)}
									</span>
									{type === 'multiline' ? (
										<textarea
											className={TEXT_INPUT}
											rows={3}
											value={working[qi]?.inputs[ii] ?? ''}
											onChange={(event) => setInput(qi, ii, event.target.value)}
										/>
									) : (
										<input
											className={TEXT_INPUT}
											type={type === 'password' ? 'password' : 'text'}
											value={working[qi]?.inputs[ii] ?? ''}
											onChange={(event) => setInput(qi, ii, event.target.value)}
										/>
									)}
								</label>
							);
						})}
					</div>
				)}
			</div>
		);
	}

	return (
		<section className="my-1 flex flex-col gap-[0.7rem] rounded-sm border border-line bg-ink/3.5 px-[0.85rem] py-3 text-[12.5px] text-ink">
			{pending && !done ? (
				<>
					<header className={HEAD}>
						<span>Please answer to continue</span>
						{questions.length > 1 && (
							<span className="flex-none font-semibold tabular-nums text-muted">
								{step + 1}/{questions.length}
							</span>
						)}
					</header>

					{questions[step] && renderQuestionCard(questions[step]!, step)}

					<div className="mt-[0.15rem] flex items-center gap-[0.6rem]">
						{step > 0 && (
							<button
								type="button"
								className={BTN_SKIP}
								disabled={submitting}
								onClick={() => setStep((s) => Math.max(0, s - 1))}
							>
								Back
							</button>
						)}
						{isLast ? (
							<button
								type="button"
								className={BTN_SUBMIT}
								disabled={submitting}
								onClick={() => send('submit')}
							>
								Submit
							</button>
						) : (
							<button
								type="button"
								className={BTN_SUBMIT}
								disabled={submitting}
								onClick={() => setStep((s) => Math.min(questions.length - 1, s + 1))}
							>
								Next
							</button>
						)}
						<button
							type="button"
							className={BTN_SKIP}
							disabled={submitting}
							onClick={() => send('dismiss')}
						>
							Skip
						</button>
					</div>
				</>
			) : (
				<>
					<header className={HEAD}>{dismissed ? 'Questions skipped' : 'Answers submitted'}</header>
					{questions.map((q, qi) => (
						<div className="flex flex-col" key={qi}>
							<span className="font-medium">{asString(q.question)}</span>
							<span className="text-muted">{answerText(qi) || '—'}</span>
						</div>
					))}
				</>
			)}
		</section>
	);
}

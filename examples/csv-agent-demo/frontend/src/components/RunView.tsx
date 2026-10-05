import { Check, CircleAlert, FileSpreadsheet, PanelLeftClose, PanelLeftOpen, Settings2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ToolSequence } from '@ui/components/ToolSequence';
import { UnicodeSpinner } from '@ui/components/UnicodeSpinner';
import { cx } from '@ui/lib/cx';
import { Tooltip } from '@ui/primitives';

import { defaultParams, scopeSheet, summarizeParams, type ForecastParams } from '../lib/forecast';
import { collectOutputs } from '../lib/outputs';
import type { Phase, RunState } from '../lib/run';
import { OutputsPane } from './OutputsPane';
import { ParametersModal } from './ParametersModal';

const STEPS: { label: string; phases: Phase[] }[] = [
	{ label: 'Upload', phases: ['uploading'] },
	{ label: 'Prepare', phases: ['preparing'] },
	{ label: 'Forecast', phases: ['running', 'loading'] },
	{ label: 'Done', phases: ['done'] }
];

function stepState(index: number, phase: Phase): 'done' | 'active' | 'todo' {
	const current = STEPS.findIndex((s) => s.phases.includes(phase));
	if (phase === 'done') return 'done';
	if (current === -1) return 'todo';
	if (index < current) return 'done';
	return index === current ? 'active' : 'todo';
}

function Stepper({ phase }: { phase: Phase }) {
	return (
		<ol className="m-0 flex list-none items-center gap-1 p-0">
			{STEPS.map((step, i) => {
				const state = stepState(i, phase);
				return (
					<li key={step.label} className="flex items-center gap-1">
						{i > 0 && (
							<span className={cx('h-px w-4', state === 'todo' ? 'bg-line' : 'bg-accent/60')} aria-hidden />
						)}
						<span
							className={cx(
								'inline-flex h-6 items-center gap-1 rounded-sm px-1.5 text-[11.5px] font-medium',
								state === 'done' && 'text-text-3',
								state === 'active' && 'bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-accent',
								state === 'todo' && 'text-muted/70'
							)}
						>
							{state === 'done' ? (
								<Check size={12} className="text-accent" />
							) : state === 'active' ? (
								<UnicodeSpinner label={step.label} />
							) : (
								<span className="size-1.5 rounded-[2px] bg-current opacity-50" />
							)}
							{step.label}
						</span>
					</li>
				);
			})}
		</ol>
	);
}

function Chips({ params, small = false }: { params: ForecastParams; small?: boolean }) {
	return (
		<span className="flex min-w-0 flex-wrap gap-1">
			{summarizeParams(params).map((chip) => (
				<span
					key={chip}
					className={cx(
						'rounded-xs bg-fill whitespace-nowrap text-text-2',
						small ? 'px-1.5 py-px text-[10.5px]' : 'px-2 py-0.5 text-[11.5px]'
					)}
				>
					{chip}
				</span>
			))}
		</span>
	);
}

const EDIT_BTN =
	'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-sm border-0 bg-ink px-3 text-[12.5px] font-medium text-paper hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';

type Props = { state: RunState; fileName: string; onApply: (params: ForecastParams) => void };

export function RunView({ state, fileName, onApply }: Props) {
	const [activityOpen, setActivityOpen] = useState(true);
	const [editing, setEditing] = useState(false);
	const cells = useMemo(() => state.turns.flatMap((t) => t.cells), [state.turns]);
	const outputs = useMemo(() => collectOutputs(cells), [cells]);
	const scoped = useMemo(
		() => (state.data && state.params ? scopeSheet(state.data, state.params) : state.data),
		[state.data, state.params]
	);
	const live = ['uploading', 'preparing', 'running'].includes(state.phase);
	const current = state.turns[state.turns.length - 1];

	// A fresh session opens straight onto the parameters.
	useEffect(() => {
		if (state.data && state.phase === 'idle' && !state.chatId) setEditing(true);
	}, [state.data, state.phase, state.chatId]);

	return (
		<div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
			<header className="flex min-h-12 min-w-0 items-center gap-3 border-b border-line/80 px-4 py-2">
				<Tooltip label={activityOpen ? 'Hide agent activity' : 'Show agent activity'} side="bottom">
					<button
						type="button"
						aria-label={activityOpen ? 'Hide agent activity' : 'Show agent activity'}
						className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-xs border-0 bg-transparent text-text-3 hover:bg-fill hover:text-ink"
						onClick={() => setActivityOpen((v) => !v)}
					>
						{activityOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
					</button>
				</Tooltip>
				<FileSpreadsheet size={16} strokeWidth={1.75} className="shrink-0 text-accent" />
				<h1 className="m-0 shrink-0 truncate text-[13.5px] font-semibold text-ink">{fileName}</h1>
				{state.params && <Chips params={state.params} />}
				<div className="ml-auto flex shrink-0 items-center gap-3">
					<span className="max-[1100px]:hidden">
						{state.phase === 'error' ? (
							<span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-danger">
								<CircleAlert size={13} /> Failed
							</span>
						) : (
							state.phase !== 'idle' && <Stepper phase={state.phase} />
						)}
					</span>
					<button type="button" className={EDIT_BTN} disabled={!state.data || live} onClick={() => setEditing(true)}>
						<Settings2 size={14} />
						Edit parameters
					</button>
				</div>
			</header>

			<div
				className={cx(
					'grid min-h-0 max-[960px]:grid-cols-1 max-[960px]:grid-rows-[minmax(0,40%)_minmax(0,1fr)]',
					activityOpen ? 'grid-cols-[minmax(320px,400px)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]'
				)}
			>
				{activityOpen && (
					<aside
						className="min-h-0 overflow-y-auto border-r border-line/80 bg-paper max-[960px]:border-r-0 max-[960px]:border-b"
						aria-label="Agent activity"
					>
						<div className="flex flex-col gap-5 px-4 pt-4 pb-10">
							{state.turns.length === 0 && state.phase !== 'loading' && (
								<div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-line px-4 py-5">
									<p className="m-0 text-[13px] leading-[1.5] text-text-2">
										Set the forecast parameters. The grid narrows to the rows they select, and the agent
										forecasts from them.
									</p>
									<button type="button" className={EDIT_BTN} disabled={!state.data} onClick={() => setEditing(true)}>
										<Settings2 size={14} />
										Set parameters
									</button>
								</div>
							)}
							{state.turns.map((turn, i) => {
								const active = turn === current && live;
								return (
									<section key={turn.key} className="flex flex-col gap-2">
										<div className="flex flex-col gap-1.5 rounded-sm border border-[rgba(0,0,0,0.06)] bg-fill px-3 py-2.5">
											<p className="m-0 text-[10.5px] font-semibold tracking-[0.05em] text-muted uppercase">
												Forecast {i + 1}
											</p>
											<Chips params={turn.params} small />
										</div>
										{turn.cells.length > 0 && (
											<div className="text-[13px] [&_p]:text-[13px]">
												<ToolSequence cells={turn.cells} streaming={active && state.phase === 'running'} />
											</div>
										)}
										{active && turn.cells.length === 0 && (
											<div className="flex items-center gap-2 text-[12.5px] text-muted">
												<UnicodeSpinner label="Working" />
												{state.phase === 'uploading'
													? `Uploading ${fileName}… ${Math.round(state.uploadProgress * 100)}%`
													: state.phase === 'preparing'
														? 'Preparing the file for the agent…'
														: 'Starting the forecast…'}
											</div>
										)}
									</section>
								);
							})}
							{state.phase === 'loading' && (
								<div className="flex items-center gap-2 text-[12.5px] text-muted">
									<UnicodeSpinner label="Loading" /> Loading session…
								</div>
							)}
							{state.error && (
								<p className="m-0 rounded-sm border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_7%,transparent)] px-3 py-2 text-[12.5px] text-danger">
									{state.error}
								</p>
							)}
						</div>
					</aside>
				)}
				<OutputsPane
					outputs={outputs}
					fileName={fileName}
					input={scoped}
					inputError={state.dataError}
					chatId={state.chatId}
					live={live}
				/>
			</div>

			{editing && state.data && (
				<ParametersModal
					sheet={state.data}
					value={state.params ?? defaultParams(state.data)}
					onClose={() => setEditing(false)}
					onApply={(params) => {
						setEditing(false);
						onApply(params);
					}}
				/>
			)}
		</div>
	);
}

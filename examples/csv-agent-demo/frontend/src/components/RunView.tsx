import { Check, CircleAlert, FileSpreadsheet, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ToolSequence } from '@ui/components/ToolSequence';
import { UnicodeSpinner } from '@ui/components/UnicodeSpinner';
import { cx } from '@ui/lib/cx';
import { Tooltip } from '@ui/primitives';

import { collectOutputs } from '../lib/outputs';
import type { Phase, RunState } from '../lib/run';
import { OutputsPane } from './OutputsPane';

const STEPS: { label: string; phases: Phase[] }[] = [
	{ label: 'Upload', phases: ['uploading'] },
	{ label: 'Prepare', phases: ['preparing'] },
	{ label: 'Analyze', phases: ['running', 'loading'] },
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

export function RunView({ state }: { state: RunState }) {
	const [activityOpen, setActivityOpen] = useState(true);
	const outputs = useMemo(() => collectOutputs(state.cells), [state.cells]);
	const live = ['uploading', 'preparing', 'running'].includes(state.phase);
	const waiting = live && state.cells.length === 0;

	return (
		<div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
			<header className="flex h-12 min-w-0 items-center gap-3 border-b border-line/80 px-4">
				<Tooltip label={activityOpen ? 'Hide agent activity' : 'Show agent activity'} side="bottom">
					<button
						type="button"
						aria-label={activityOpen ? 'Hide agent activity' : 'Show agent activity'}
						className="inline-flex size-7 cursor-pointer items-center justify-center rounded-xs border-0 bg-transparent text-text-3 hover:bg-fill hover:text-ink"
						onClick={() => setActivityOpen((v) => !v)}
					>
						{activityOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
					</button>
				</Tooltip>
				<FileSpreadsheet size={16} strokeWidth={1.75} className="shrink-0 text-accent" />
				<h1 className="m-0 min-w-0 truncate text-[13.5px] font-semibold text-ink">
					{state.fileName || 'Loading run…'}
				</h1>
				<div className="ml-auto flex shrink-0 items-center gap-3 max-[860px]:hidden">
					{state.phase === 'error' ? (
						<span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-danger">
							<CircleAlert size={13} /> Failed
						</span>
					) : (
						<Stepper phase={state.phase} />
					)}
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
						<div className="flex flex-col gap-3 px-4 pt-4 pb-10">
							<div className="rounded-sm border border-[rgba(0,0,0,0.06)] bg-fill px-3 py-2.5">
								<p className="m-0 mb-1 text-[10.5px] font-semibold tracking-[0.05em] text-muted uppercase">Task</p>
								<p className="m-0 text-[12.5px] leading-[1.5] text-text-strong">
									Parse and clean <span className="font-mono">{state.fileName}</span>, save derived tables as CSVs,
									and draw three charts.
								</p>
								{state.instruction && (
									<p className="m-0 mt-1.5 border-t border-line/70 pt-1.5 text-[12.5px] leading-[1.5] text-text-2">
										{state.instruction}
									</p>
								)}
							</div>

							<span className="text-[12px] font-medium text-accent">Agent</span>
							{state.cells.length > 0 && (
								<div className="text-[13px] [&_p]:text-[13px]">
									<ToolSequence cells={state.cells} streaming={state.phase === 'running'} />
								</div>
							)}
							{waiting && (
								<div className="flex items-center gap-2 text-[12.5px] text-muted">
									<UnicodeSpinner label="Working" />
									{state.phase === 'uploading'
										? `Uploading your file… ${Math.round(state.uploadProgress * 100)}%`
										: state.phase === 'preparing'
											? 'Preparing the file for the agent…'
											: 'Starting the analysis…'}
								</div>
							)}
							{state.phase === 'loading' && (
								<div className="flex items-center gap-2 text-[12.5px] text-muted">
									<UnicodeSpinner label="Loading" /> Loading run…
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
					fileName={state.fileName}
					input={state.input}
					inputError={state.inputError}
					chatId={state.chatId}
					live={live}
				/>
			</div>
		</div>
	);
}

import { Moon, Plus, Sun, Table2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { UnicodeSpinner } from '@ui/components/UnicodeSpinner';
import { RETRY_BTN } from '@ui/components/pageStyles';
import { cx } from '@ui/lib/cx';
import { groupByDay } from '@ui/lib/dates';
import { themePref, useResolvedTheme } from '@ui/lib/themePref';

import { listRuns, type Run } from '../lib/api';
import type { ForecastParams } from '../lib/forecast';
import { run, useRun } from '../lib/run';
import { RunView } from './RunView';

const ACTIVE_RING = 'shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_70%,transparent)]';
const NAV_BTN =
	'inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded-sm border-0 px-2.5 py-[7px] text-[13px] font-medium text-text-2 transition-[background] duration-[120ms] hover:bg-elevate/82 [&_svg]:shrink-0';

export function Workspace() {
	const { id } = useParams();
	const navigate = useNavigate();
	const state = useRun();
	const resolvedTheme = useResolvedTheme();
	const [runs, setRuns] = useState<Run[] | null>(null);
	const [runsError, setRunsError] = useState(false);

	const loadRuns = useCallback(() => {
		setRunsError(false);
		listRuns()
			.then(setRuns)
			.catch(() => setRunsError(true));
	}, []);

	useEffect(loadRuns, [loadRuns]);
	useEffect(() => run.loadData(), []);

	useEffect(() => {
		if (id) void run.open(id);
		else if (state.chatId) run.reset();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	// The sidebar picks up a run's generated title once it finishes.
	useEffect(() => {
		if (state.phase === 'running' || state.phase === 'done') loadRuns();
	}, [state.phase, loadRuns]);

	const groups = useMemo(() => groupByDay(runs ?? [], (r) => r.updated_at), [runs]);

	function apply(params: ForecastParams) {
		void run.apply(params, (chatId) => navigate(`/run/${chatId}`));
	}

	return (
		<div className="grid h-dvh grid-cols-[248px_minmax(0,1fr)] bg-paper font-sans text-ink max-[780px]:grid-cols-1">
			<aside
				className="flex min-h-0 flex-col border-r border-line/80 bg-sidebar px-3 pt-3.5 pb-3 max-[780px]:hidden"
				aria-label="Runs"
			>
				<div className="flex items-center gap-2 px-2 pb-3">
					<span className="inline-flex size-6 items-center justify-center rounded-xs bg-ink text-paper">
						<Table2 size={13} strokeWidth={2} />
					</span>
					<span className="font-pixel text-[15px] tracking-[0.01em] text-ink">Forecast Agent</span>
				</div>
				<button
					type="button"
					className={cx(NAV_BTN, 'justify-center bg-elevate/62')}
					onClick={() => {
						run.reset();
						navigate('/');
					}}
				>
					<Plus size={15} strokeWidth={2} />
					New session
				</button>

				<div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-0.5">
					{runs === null && !runsError ? (
						<div className="mx-2.5 my-3.5">
							<UnicodeSpinner label="Loading runs" />
						</div>
					) : runsError ? (
						<button type="button" className={cx(RETRY_BTN, 'm-2')} onClick={loadRuns}>
							Retry
						</button>
					) : runs!.length === 0 ? (
						<p className="m-0 px-2.5 pt-2.5 text-[12px] leading-[1.4] text-muted">
							No runs yet. Upload a CSV to start.
						</p>
					) : (
						groups.map((group) => (
							<div key={group.key} className="mb-3.5 flex flex-col gap-0.5 last:mb-0">
								<p className="m-0 px-2.5 pt-1 pb-1.5 text-[11px] font-medium tracking-[0.01em] text-muted">
									{group.label}
								</p>
								{group.rows.map((r) => {
									const activeRow = r.id === id;
									const running = r.is_running || (activeRow && state.phase === 'running');
									return (
										<button
											key={r.id}
											type="button"
											title={r.title}
											onClick={() => navigate(`/run/${r.id}`)}
											className={cx(
												'flex w-full cursor-pointer items-center gap-2 rounded-sm border-0 py-[7px] pr-2 pl-2.5 text-left transition-[background] duration-[120ms]',
												activeRow ? `bg-elevate/78 text-ink ${ACTIVE_RING}` : 'bg-transparent text-text-3 hover:bg-elevate/55'
											)}
										>
											<span className="min-w-0 flex-1 truncate text-[12.5px]">{r.title}</span>
											{running && <UnicodeSpinner label="Running" />}
										</button>
									);
								})}
							</div>
						))
					)}
				</div>

				<div className="mt-2 shrink-0 border-t border-line/70 pt-2">
					<button
						type="button"
						className="flex w-full cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-[9px] py-[7px] text-[13px] text-text-3 transition-[background,color] duration-[120ms] hover:bg-ink/5 hover:text-ink"
						onClick={() => themePref.toggle()}
						aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
					>
						{resolvedTheme === 'dark' ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
						{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
					</button>
				</div>
			</aside>

			<main className="min-h-0 min-w-0">
				<RunView state={state} fileName={__DATA_NAME__} onApply={apply} />
			</main>
		</div>
	);
}

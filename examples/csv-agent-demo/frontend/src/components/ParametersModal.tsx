import { ArrowRight, ChevronDown, Settings2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { NEW_BTN, PANEL_ICON_BTN } from '@ui/components/pageStyles';
import { cx } from '@ui/lib/cx';
import { useDismissable } from '@ui/lib/useDismissable';

import type { Sheet } from '../lib/csv';
import {
	INCLUSION_LABEL,
	SCENARIO_LABEL,
	TYPE_LABEL,
	addMonths,
	dataMonths,
	monthLabel,
	monthsBetween,
	scopedRows,
	type ForecastParams,
	type ForecastType,
	type Inclusions,
	type Month,
	type Range,
	type Scenario
} from '../lib/forecast';
import { FIELD, Popover, Toggle } from './ColumnFilter';

/** Matches the grid's menu headings ("Columns"). */
const SECTION = 'text-[11px] font-semibold tracking-[0.05em] text-muted uppercase';
const SELECT = cx(FIELD, 'cursor-pointer appearance-none pr-7');
const CARD = 'rounded-md border border-line/80 bg-elevate';

const TYPE_VIEWS = (Object.keys(TYPE_LABEL) as ForecastType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] }));
const YES_NO = [
	{ value: 'yes', label: 'Yes' },
	{ value: 'no', label: 'No' }
];

function Chevron() {
	return <ChevronDown size={13} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted" />;
}

function MonthSelect({
	value,
	months,
	onChange,
	label
}: {
	value: Month;
	months: Month[];
	onChange: (month: Month) => void;
	label: string;
}) {
	return (
		<label className="relative min-w-0 flex-1">
			<span className="sr-only">{label}</span>
			<select className={SELECT} value={value} onChange={(e) => onChange(e.target.value)}>
				{months.map((m) => (
					<option key={m} value={m}>
						{monthLabel(m)}
					</option>
				))}
			</select>
			<Chevron />
		</label>
	);
}

function RangePicker({
	title,
	value,
	months,
	onChange
}: {
	title: string;
	value: Range;
	months: Month[];
	onChange: (range: Range) => void;
}) {
	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<span className="font-mono text-[10.5px] text-muted">{title}</span>
			<div className="flex items-center gap-1.5">
				<MonthSelect
					label={`${title} start`}
					value={value.from}
					months={months}
					onChange={(from) => onChange({ from, to: from > value.to ? from : value.to })}
				/>
				<ArrowRight size={12} className="shrink-0 text-muted" />
				<MonthSelect
					label={`${title} end`}
					value={value.to}
					months={months}
					onChange={(to) => onChange({ from: to < value.from ? to : value.from, to })}
				/>
			</div>
		</div>
	);
}

/** A multi-select laid out like the grid's Columns menu. */
function YearSelect({ years, value, onChange }: { years: string[]; value: string[]; onChange: (v: string[]) => void }) {
	const [anchor, setAnchor] = useState<DOMRect | null>(null);
	return (
		<>
			<button
				type="button"
				className={cx(SELECT, 'relative text-left')}
				onClick={(e) => setAnchor(e.currentTarget.getBoundingClientRect())}
			>
				<span className="block truncate">{value.length ? [...value].sort().join(', ') : 'Select years'}</span>
				<Chevron />
			</button>
			{anchor && (
				<Popover anchor={anchor} width={Math.max(200, anchor.width)} onClose={() => setAnchor(null)}>
					<div className="flex items-center justify-between px-2.5 pt-2 pb-1">
						<span className={SECTION}>Fiscal years</span>
						<button
							type="button"
							className="cursor-pointer border-0 bg-transparent p-0 text-[11.5px] text-accent"
							onClick={() => onChange(years)}
						>
							Select all
						</button>
					</div>
					<div className="p-1">
						{years.map((year) => (
							<label
								key={year}
								className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2 py-1.5 text-[12.5px] text-text-strong hover:bg-fill"
							>
								<input
									type="checkbox"
									className="accent-[var(--color-accent)]"
									checked={value.includes(year)}
									onChange={() =>
										onChange(value.includes(year) ? value.filter((y) => y !== year) : [...value, year])
									}
								/>
								FY {year}
							</label>
						))}
					</div>
				</Popover>
			)}
		</>
	);
}

type Props = {
	sheet: Sheet;
	value: ForecastParams;
	onApply: (params: ForecastParams) => void;
	onClose: () => void;
};

export function ParametersModal({ sheet, value, onApply, onClose }: Props) {
	const [draft, setDraft] = useState(value);
	useDismissable(true, onClose);

	const months = useMemo(() => dataMonths(sheet), [sheet]);
	const years = useMemo(() => [...new Set(months.map((m) => m.slice(0, 4)))], [months]);
	const forecastMonths = useMemo(
		() => monthsBetween(addMonths(draft.actual.to, 1), addMonths(draft.actual.to, 24)),
		[draft.actual.to]
	);
	const inScope = useMemo(() => scopedRows(sheet, draft).length, [sheet, draft]);

	const set = (patch: Partial<ForecastParams>) => setDraft((d) => ({ ...d, ...patch }));
	const setActual = (actual: Range) =>
		setDraft((d) => {
			// The forecast always starts after the last actual month.
			const start = addMonths(actual.to, 1);
			const forecast = d.forecast.from > actual.to ? d.forecast : { from: start, to: addMonths(start, 5) };
			return { ...d, actual, forecast };
		});
	const setInclude = (key: keyof Inclusions, on: boolean) =>
		setDraft((d) => ({ ...d, include: { ...d.include, [key]: on } }));

	const invalid = draft.fiscalYears.length === 0 ? 'Choose at least one fiscal year.' : null;

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Edit forecast parameters"
		>
			<button
				type="button"
				tabIndex={-1}
				aria-label="Close"
				className="absolute inset-0 animate-modal-fade cursor-default border-0 bg-ink/30 p-0 backdrop-blur-xs"
				onClick={onClose}
			/>
			<div className="relative z-10 flex max-h-[calc(100dvh-32px)] w-[min(600px,100%)] animate-modal-reveal flex-col overflow-hidden rounded-lg border border-line bg-paper shadow-[0_1px_2px_rgba(15,15,20,0.04),0_24px_48px_rgba(15,15,20,0.14)]">
				<header className="flex items-center gap-2 border-b border-line/80 px-4 py-3">
					<Settings2 size={15} className="text-accent" />
					<h2 className="m-0 flex-1 text-[13.5px] font-semibold text-ink">Forecast parameters</h2>
					<button
						type="button"
						aria-label="Close"
						className={cx(PANEL_ICON_BTN, 'text-muted hover:bg-fill hover:text-ink')}
						onClick={onClose}
					>
						<X size={15} />
					</button>
				</header>

				<div className="flex flex-col gap-5 overflow-y-auto px-4 py-4">
					<div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
						<div className="flex flex-col gap-1.5">
							<span className={SECTION}>Type</span>
							<Toggle
								views={TYPE_VIEWS}
								value={draft.type}
								clearable={false}
								className="text-[12px]"
								onChange={(type) => type && set({ type })}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<span className={SECTION}>Fiscal year</span>
							<YearSelect years={years} value={draft.fiscalYears} onChange={(fiscalYears) => set({ fiscalYears })} />
						</div>
					</div>

					<label className="flex flex-col gap-1.5">
						<span className={SECTION}>Scenario</span>
						<span className="relative">
							<select
								className={SELECT}
								value={draft.scenario}
								onChange={(e) => set({ scenario: e.target.value as Scenario })}
							>
								{(Object.keys(SCENARIO_LABEL) as Scenario[]).map((s) => (
									<option key={s} value={s}>
										{SCENARIO_LABEL[s]}
									</option>
								))}
							</select>
							<Chevron />
						</span>
					</label>

					<div className="flex flex-col gap-1.5">
						<span className={SECTION}>Periods</span>
						<div className={cx(CARD, 'grid grid-cols-2 gap-4 p-3 max-[560px]:grid-cols-1')}>
							<RangePicker title="Actuals" value={draft.actual} months={months} onChange={setActual} />
							<RangePicker
								title="Forecast"
								value={draft.forecast}
								months={forecastMonths}
								onChange={(forecast) => set({ forecast })}
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<span className={SECTION}>Include</span>
						<div className={cx(CARD, 'flex flex-col')}>
							{(Object.keys(INCLUSION_LABEL) as (keyof Inclusions)[]).map((key) => (
								<div
									key={key}
									className="flex items-center justify-between gap-3 border-b border-line/60 px-3 py-2 last:border-b-0"
								>
									<span className="text-[12.5px] text-text-strong">{INCLUSION_LABEL[key]}</span>
									<Toggle
										views={YES_NO}
										value={draft.include[key] ? 'yes' : 'no'}
										clearable={false}
										className="w-[104px]"
										onChange={(v) => setInclude(key, v === 'yes')}
									/>
								</div>
							))}
						</div>
					</div>
				</div>

				<footer className="flex items-center gap-2 border-t border-line/80 bg-paper px-4 py-3">
					<span className={cx('mr-auto font-mono text-[11px] tabular-nums', invalid ? 'text-danger' : 'text-muted')}>
						{invalid ?? `${inScope.toLocaleString()} of ${sheet.rows.length.toLocaleString()} rows in scope`}
					</span>
					<button type="button" className={NEW_BTN} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						disabled={Boolean(invalid)}
						className="inline-flex h-7 cursor-pointer items-center rounded-sm border-0 bg-ink px-3 text-[12px] font-medium text-paper hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
						onClick={() => onApply(draft)}
					>
						Apply
					</button>
				</footer>
			</div>
		</div>
	);
}

import { ArrowDown, ArrowUp, EyeOff, Search } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { FLYOUT } from '@ui/components/pageStyles';
import { cx } from '@ui/lib/cx';
import { useDismissable } from '@ui/lib/useDismissable';
import { ViewSwitcher, ViewSwitcherItem, type View } from '@ui/primitives';

import { formatStat, type ColumnStats, type Filter } from '../lib/csv';

type PopoverProps = {
	anchor: DOMRect;
	align?: 'left' | 'right';
	width: number;
	onClose: () => void;
	children: ReactNode;
};

/** A fixed-position flyout under `anchor`, kept inside the viewport. */
export function Popover({ anchor, align = 'left', width, onClose, children }: PopoverProps) {
	const ref = useRef<HTMLDivElement | null>(null);
	const [top, setTop] = useState(anchor.bottom + 6);
	useDismissable(true, onClose, { contains: (t) => ref.current?.contains(t as Node) ?? false });

	useLayoutEffect(() => {
		const h = ref.current?.offsetHeight ?? 0;
		const below = anchor.bottom + 6;
		setTop(below + h > window.innerHeight - 8 ? Math.max(8, anchor.top - h - 6) : below);
	}, [anchor]);

	const rawLeft = align === 'right' ? anchor.right - width : anchor.left;
	const left = Math.max(8, Math.min(rawLeft, window.innerWidth - width - 8));
	return createPortal(
		<div
			ref={ref}
			className={cx(FLYOUT, 'fixed z-50 animate-select-in')}
			style={{ top, left, width }}
		>
			{children}
		</div>,
		document.body
	);
}

const TRACK = 'flex gap-0.5 rounded-sm bg-track p-0.5 text-[11.5px]';

const SORT_VIEWS: View[] = [
	{ value: 'asc', label: 'Ascending', icon: ArrowUp },
	{ value: 'desc', label: 'Descending', icon: ArrowDown }
];
const NULL_VIEWS: View[] = [
	{ value: 'empty', label: 'Empty' },
	{ value: 'filled', label: 'Not empty' }
];

/** A segmented control where pressing the active segment clears it. */
function Toggle<T extends string>({
	views,
	value,
	onChange
}: {
	views: View[];
	value: T | null;
	onChange: (value: T | null) => void;
}) {
	return (
		<ViewSwitcher views={views} value={value ?? ''} onValueChange={(v) => onChange(v === value ? null : (v as T))}>
			<span className={TRACK} role="group">
				{views.map((view) => (
					<ViewSwitcherItem key={view.value} view={view} className="h-6 flex-1 justify-center" />
				))}
			</span>
		</ViewSwitcher>
	);
}
const FIELD =
	'h-7 w-full min-w-0 rounded-[7px] border-0 bg-fill px-2 font-mono text-[12px] text-ink outline-0 placeholder:text-muted focus:shadow-[inset_0_0_0_1px_var(--color-accent)]';

type Props = {
	anchor: DOMRect;
	name: string;
	stats: ColumnStats;
	filter: Filter | undefined;
	sort: 'asc' | 'desc' | null;
	onChange: (filter: Filter | undefined) => void;
	onSort: (dir: 'asc' | 'desc' | null) => void;
	onHide: () => void;
	onClose: () => void;
};

function toInput(value: number | undefined, type: ColumnStats['type']): string {
	if (value === undefined) return '';
	return type === 'date' ? formatStat(value, 'date') : String(value);
}

type SectionProps = {
	stats: ColumnStats;
	filter: Filter | undefined;
	onChange: (filter: Filter | undefined) => void;
};

function fromInput(text: string, type: ColumnStats['type']): number | undefined {
	if (!text.trim()) return undefined;
	const n = type === 'date' ? Date.parse(text) : Number(text);
	return Number.isFinite(n) ? n : undefined;
}

function RangeFilter({ stats, filter, onChange }: SectionProps) {
	const range = filter?.kind === 'range' ? filter : undefined;
	const bins = stats.bins ?? [];
	const peak = Math.max(1, ...bins.map((b) => b.count));
	const [anchorBin, setAnchorBin] = useState<number | null>(null);

	function inRange(from: number, to: number) {
		if (!range) return true;
		return (range.min === undefined || to >= range.min) && (range.max === undefined || from <= range.max);
	}

	function pickBin(i: number, extend: boolean) {
		const start = extend && anchorBin !== null ? Math.min(anchorBin, i) : i;
		const end = extend && anchorBin !== null ? Math.max(anchorBin, i) : i;
		if (!extend) setAnchorBin(i);
		onChange({ kind: 'range', min: bins[start]!.from, max: bins[end]!.to });
	}

	const bound = (side: 'min' | 'max') => (
		<input
			className={FIELD}
			type={stats.type === 'date' ? 'date' : 'number'}
			placeholder={`${side} ${formatStat(stats[side], stats.type, true)}`}
			value={toInput(range?.[side], stats.type)}
			onChange={(e) =>
				onChange({ kind: 'range', min: range?.min, max: range?.max, [side]: fromInput(e.target.value, stats.type) })
			}
		/>
	);

	return (
		<div className="flex flex-col gap-2 px-3 pt-1 pb-3">
			{bins.length > 0 && (
				<div>
					<div className="flex h-16 items-end gap-[2px]">
						{bins.map((bin, i) => (
							<button
								type="button"
								key={i}
								title={`${formatStat(bin.from, stats.type, true)} – ${formatStat(bin.to, stats.type, true)}: ${bin.count.toLocaleString()} rows`}
								className={cx(
									'min-w-0 flex-1 cursor-pointer rounded-t-[2px] border-0 p-0 transition-[background]',
									inRange(bin.from, bin.to)
										? 'bg-[color-mix(in_srgb,var(--color-accent)_70%,transparent)] hover:bg-accent'
										: 'bg-line hover:bg-[color-mix(in_srgb,var(--color-accent)_35%,transparent)]'
								)}
								style={{ height: `${Math.max(4, (bin.count / peak) * 100)}%` }}
								onClick={(e) => pickBin(i, e.shiftKey)}
							/>
						))}
					</div>
					<div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
						<span>{formatStat(stats.min, stats.type, true)}</span>
						<span className="font-sans">click a bar · shift-click to extend</span>
						<span>{formatStat(stats.max, stats.type, true)}</span>
					</div>
				</div>
			)}
			<div className="flex items-center gap-1.5">
				{bound('min')}
				<span className="text-muted">–</span>
				{bound('max')}
			</div>
		</div>
	);
}

function ValuesFilter({ stats, filter, onChange }: SectionProps) {
	const [query, setQuery] = useState(filter?.kind === 'contains' ? filter.text : '');
	const selected = filter?.kind === 'values' ? filter.values : new Set<string>();
	const peak = stats.top[0]?.count ?? 1;
	const options = useMemo(() => {
		const q = query.trim().toLowerCase();
		return q ? stats.top.filter((v) => v.value.toLowerCase().includes(q)) : stats.top;
	}, [stats.top, query]);

	function toggle(value: string) {
		const next = new Set(selected);
		if (next.has(value)) next.delete(value);
		else next.add(value);
		onChange({ kind: 'values', values: next });
	}

	return (
		<div className="flex flex-col gap-1.5 px-2 pt-1 pb-2">
			<label className="relative mx-1 flex items-center">
				<Search size={12} className="pointer-events-none absolute left-2 text-muted" />
				<input
					autoFocus
					className={cx(FIELD, 'pl-6 font-sans')}
					placeholder={`Search ${stats.distinct.toLocaleString()} values`}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && query.trim()) onChange({ kind: 'contains', text: query });
					}}
				/>
			</label>
			{query.trim() && (
				<button
					type="button"
					className="mx-1 cursor-pointer rounded-[7px] border-0 bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] px-2 py-1.5 text-left text-[12px] text-text-2 hover:bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]"
					onClick={() => onChange({ kind: 'contains', text: query })}
				>
					Rows containing <span className="font-mono text-ink">“{query.trim()}”</span>
					<span className="ml-1 text-muted">↵</span>
				</button>
			)}
			<div className="flex max-h-[240px] flex-col overflow-y-auto">
				{options.map((v) => (
					<label
						key={v.value}
						className="relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-[7px] px-2 py-[5px] text-[12px] hover:bg-fill"
					>
						<span
							className="absolute inset-y-0.5 left-0 rounded-[6px] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
							style={{ width: `${(v.count / peak) * 100}%` }}
							aria-hidden
						/>
						<input
							type="checkbox"
							className="relative accent-[var(--color-accent)]"
							checked={selected.has(v.value)}
							onChange={() => toggle(v.value)}
						/>
						<span className="relative min-w-0 flex-1 truncate font-mono text-text-strong">{v.value}</span>
						<span className="relative font-mono text-[10.5px] text-muted tabular-nums">
							{v.count.toLocaleString()}
						</span>
					</label>
				))}
				{options.length === 0 && (
					<p className="m-0 px-2 py-2 text-[12px] text-muted">No listed values match.</p>
				)}
				{!query && stats.distinct > stats.top.length && (
					<p className="m-0 px-2 pt-1 text-[11px] text-muted">
						Top {stats.top.length} of {stats.distinct.toLocaleString()} shown — search to match any text.
					</p>
				)}
			</div>
		</div>
	);
}

export function ColumnFilterPopover({
	anchor,
	name,
	stats,
	filter,
	sort,
	onChange,
	onSort,
	onHide,
	onClose
}: Props) {
	const ranged = Boolean(stats.bins);
	const nulls = filter?.kind === 'nulls' ? filter.only : null;

	return (
		<Popover anchor={anchor} width={300} onClose={onClose}>
			<div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5">
				<div className="min-w-0">
					<p className="m-0 truncate text-[12.5px] font-semibold text-ink">{name}</p>
					<p className="m-0 font-mono text-[10.5px] text-muted">
						{stats.type} · {stats.distinct.toLocaleString()} distinct · {stats.nulls.toLocaleString()} empty
					</p>
				</div>
				<button
					type="button"
					className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-[6px] border-0 bg-transparent px-1.5 py-1 text-[11.5px] text-muted hover:bg-fill hover:text-ink"
					onClick={onHide}
				>
					<EyeOff size={12} />
					Hide
				</button>
			</div>

			<div className="mx-3 mb-2">
				<Toggle views={SORT_VIEWS} value={sort} onChange={onSort} />
			</div>

			<div className="border-t border-line/70 pt-2">
				{ranged ? (
					<RangeFilter stats={stats} filter={filter} onChange={onChange} />
				) : (
					<ValuesFilter stats={stats} filter={filter} onChange={onChange} />
				)}
			</div>

			<div className="flex items-center gap-1 border-t border-line/70 px-2 py-2">
				<Toggle
					views={NULL_VIEWS}
					value={nulls}
					onChange={(only) => onChange(only ? { kind: 'nulls', only } : undefined)}
				/>
				<button
					type="button"
					disabled={!filter}
					className="ml-auto cursor-pointer rounded-[6px] border-0 bg-transparent px-2 py-1 text-[12px] text-accent disabled:cursor-default disabled:text-muted"
					onClick={() => onChange(undefined)}
				>
					Clear filter
				</button>
			</div>
		</Popover>
	);
}

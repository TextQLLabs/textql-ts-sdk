import { Check } from 'lucide-react';

import { FACET_CHECK, FACET_CHECK_ON, FACET_ROW, FACET_ROW_LABEL } from './styles';

type Preset = { value: string; label: string };

type Props = {
	presets: Preset[];
	isPresetSelected: (value: string) => boolean;
	onSelectPreset: (value: string) => void;
	/** No date facet value selected — the default, "All time". */
	isAllTime?: boolean;
	onSelectAllTime: () => void;
	/** `YYYY-MM-DD` when a custom since-date is active. */
	sinceValue?: string;
	/** `YYYY-MM-DD` upper bound — a since-date in the future selects nothing. */
	maxValue: string;
	onSelectSince: (date: string | undefined) => void;
};

export function DateRangeFilter({
	presets,
	isPresetSelected,
	onSelectPreset,
	isAllTime = false,
	onSelectAllTime,
	sinceValue,
	maxValue,
	onSelectSince
}: Props) {
	return (
		<>
			<button type="button" className={FACET_ROW} onClick={onSelectAllTime}>
				<span className={isAllTime ? FACET_CHECK_ON : FACET_CHECK}>
					{isAllTime && <Check size={11} strokeWidth={3} />}
				</span>
				<span className={FACET_ROW_LABEL}>All time</span>
			</button>

			{presets.map((preset) => {
				const on = isPresetSelected(preset.value);
				return (
					<button
						key={preset.value}
						type="button"
						className={FACET_ROW}
						onClick={() => onSelectPreset(preset.value)}
					>
						<span className={on ? FACET_CHECK_ON : FACET_CHECK}>
							{on && <Check size={11} strokeWidth={3} />}
						</span>
						<span className={FACET_ROW_LABEL}>{preset.label}</span>
					</button>
				);
			})}

			{/* A *since* date, not a range — the same shape demo2's feed date filter
			    uses. There is deliberately no end-date control. */}
			<div className="mt-1 flex items-center gap-2 border-t border-line/55 px-2 pt-2 pb-0.5">
				<label className="text-[11px] text-muted" htmlFor="filter-since">
					Since
				</label>
				<input
					id="filter-since"
					type="date"
					className="min-w-0 flex-1 rounded-md border border-line/85 bg-paper px-1.5 py-1 text-[11.5px] text-ink"
					max={maxValue}
					value={sinceValue ?? ''}
					onChange={(event) => onSelectSince(event.currentTarget.value || undefined)}
				/>
			</div>
		</>
	);
}

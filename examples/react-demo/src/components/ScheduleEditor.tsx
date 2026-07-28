import { cronToHuman } from '../lib/cron';
import {
	ordinal,
	scheduleToCron,
	WEEKDAY_OPTIONS,
	type CronSchedule,
	type ScheduleFrequency
} from '../lib/cronSchedule';
import { Select, type SelectOption } from '../primitives';

const frequencyOptions: SelectOption<ScheduleFrequency>[] = [
	{ value: 'hourly', label: 'Every hour' },
	{ value: 'daily', label: 'Every day' },
	{ value: 'weekly', label: 'Every week' },
	{ value: 'monthly', label: 'Every month' },
	{ value: 'custom', label: 'Custom (cron)' }
];

const weekdayOptions: SelectOption<number>[] = WEEKDAY_OPTIONS.map((day) => ({
	value: day.value,
	label: day.label
}));

const dayOfMonthOptions: SelectOption<number>[] = Array.from({ length: 31 }, (_, i) => ({
	value: i + 1,
	label: ordinal(i + 1)
}));

const hourOptions: SelectOption<number>[] = Array.from({ length: 12 }, (_, i) => ({
	value: i + 1,
	label: String(i + 1).padStart(2, '0')
}));

const minuteOptions: SelectOption<number>[] = Array.from({ length: 60 }, (_, i) => ({
	value: i,
	label: String(i).padStart(2, '0')
}));

const periodOptions: SelectOption<string>[] = [
	{ value: 'AM', label: 'AM' },
	{ value: 'PM', label: 'PM' }
];

const INLINE = 'm-0 inline-flex items-center gap-1.5';
const INLINE_LABEL = 'text-[12px] text-muted';

type Props = {
	value: CronSchedule;
	onChange: (value: CronSchedule) => void;
	disabled?: boolean;
};

export function ScheduleEditor({ value, onChange, disabled = false }: Props) {
	const cron = scheduleToCron(value);
	const preview = (() => {
		const trimmed = cron.trim();
		if (!trimmed) return 'Runs only when triggered manually.';
		return cronToHuman(trimmed) ?? `Custom schedule (${trimmed})`;
	})();

	const hour12 = value.hour % 12 === 0 ? 12 : value.hour % 12;
	const period = value.hour >= 12 ? 'PM' : 'AM';

	function setHour12(next: number) {
		const base = next % 12;
		onChange({ ...value, hour: value.hour >= 12 ? base + 12 : base });
	}

	function setMinute(next: number) {
		onChange({ ...value, minute: next });
	}

	function setPeriod(next: string) {
		const base = value.hour % 12;
		onChange({ ...value, hour: next === 'PM' ? base + 12 : base });
	}

	return (
		<div className="flex min-w-0 flex-col gap-2">
			<div className="flex flex-wrap items-center gap-2">
				<div className="w-[150px] flex-none">
					<Select
						value={value.frequency}
						options={frequencyOptions}
						onValueChange={(frequency) => onChange({ ...value, frequency })}
						disabled={disabled}
						aria-label="Schedule frequency"
					/>
				</div>

				{value.frequency === 'hourly' ? (
					<div className={INLINE}>
						<span className={INLINE_LABEL}>at minute</span>
						<div className="w-[78px]">
							<Select
								value={value.minute}
								options={minuteOptions}
								onValueChange={setMinute}
								disabled={disabled}
								searchable
								searchPlaceholder="Minute"
								aria-label="Minute"
							/>
						</div>
					</div>
				) : value.frequency === 'custom' ? (
					<input
						className="w-auto flex-[1_1_160px] rounded-sm border border-line/90 bg-paper px-2.5 py-2 font-mono text-[13px] text-ink focus:border-accent focus:shadow-[inset_0_0_0_1px_var(--color-accent)] focus:outline-none"
						type="text"
						value={value.raw}
						onChange={(event) => onChange({ ...value, raw: event.target.value })}
						disabled={disabled}
						placeholder="0 9 * * *"
						spellCheck={false}
					/>
				) : (
					<>
						{value.frequency === 'weekly' && (
							<div className="w-[150px] flex-none">
								<Select
									value={value.dayOfWeek}
									options={weekdayOptions}
									onValueChange={(dayOfWeek) => onChange({ ...value, dayOfWeek })}
									disabled={disabled}
									aria-label="Day of week"
								/>
							</div>
						)}
						{value.frequency === 'monthly' && (
							<div className="w-[120px] flex-none">
								<Select
									value={value.dayOfMonth}
									options={dayOfMonthOptions}
									onValueChange={(dayOfMonth) => onChange({ ...value, dayOfMonth })}
									disabled={disabled}
									aria-label="Day of month"
								/>
							</div>
						)}
						<div className={INLINE}>
							<span className={INLINE_LABEL}>at</span>
							<div className="inline-flex items-center gap-1">
								<div className="w-[68px]">
									<Select
										value={hour12}
										options={hourOptions}
										onValueChange={setHour12}
										disabled={disabled}
										aria-label="Hour"
									/>
								</div>
								<span className="font-semibold text-muted">:</span>
								<div className="w-[68px]">
									<Select
										value={value.minute}
										options={minuteOptions}
										onValueChange={setMinute}
										disabled={disabled}
										searchable
										searchPlaceholder="Minute"
										aria-label="Minute"
									/>
								</div>
								<div className="w-[72px]">
									<Select
										value={period}
										options={periodOptions}
										onValueChange={setPeriod}
										disabled={disabled}
										aria-label="AM or PM"
									/>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
			<p className="m-0 text-xs leading-[1.4] text-muted">{preview}</p>
		</div>
	);
}

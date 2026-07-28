<script lang="ts">
	import { cronToHuman } from "$lib/cron";
	import {
		ordinal,
		scheduleToCron,
		WEEKDAY_OPTIONS,
		type CronSchedule,
		type ScheduleFrequency,
	} from "$lib/cronSchedule";
	import { Select, type SelectOption } from "$lib/primitives";

	let {
		value = $bindable(),
		disabled = false,
	}: {
		value: CronSchedule;
		disabled?: boolean;
	} = $props();

	const cron = $derived(scheduleToCron(value));
	const preview = $derived.by(() => {
		const trimmed = cron.trim();
		if (!trimmed) return "Runs only when triggered manually.";
		return cronToHuman(trimmed) ?? `Custom schedule (${trimmed})`;
	});

	const frequencyOptions: SelectOption<ScheduleFrequency>[] = [
		{ value: "hourly", label: "Every hour" },
		{ value: "daily", label: "Every day" },
		{ value: "weekly", label: "Every week" },
		{ value: "monthly", label: "Every month" },
		{ value: "custom", label: "Custom (cron)" },
	];

	const weekdayOptions: SelectOption<number>[] = WEEKDAY_OPTIONS.map((day) => ({
		value: day.value,
		label: day.label,
	}));

	const dayOfMonthOptions: SelectOption<number>[] = Array.from(
		{ length: 31 },
		(_, i) => ({ value: i + 1, label: ordinal(i + 1) }),
	);

	const hourOptions: SelectOption<number>[] = Array.from(
		{ length: 12 },
		(_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, "0") }),
	);

	const minuteOptions: SelectOption<number>[] = Array.from(
		{ length: 60 },
		(_, i) => ({ value: i, label: String(i).padStart(2, "0") }),
	);

	const periodOptions: SelectOption<string>[] = [
		{ value: "AM", label: "AM" },
		{ value: "PM", label: "PM" },
	];

	const hour12 = $derived(value.hour % 12 === 0 ? 12 : value.hour % 12);
	const period = $derived(value.hour >= 12 ? "PM" : "AM");

	function setHour12(next: number) {
		const base = next % 12;
		value = { ...value, hour: value.hour >= 12 ? base + 12 : base };
	}

	function setMinute(next: number) {
		value = { ...value, minute: next };
	}

	function setPeriod(next: string) {
		const base = value.hour % 12;
		value = { ...value, hour: next === "PM" ? base + 12 : base };
	}
</script>

<div class="schedule">
	<div class="schedule-controls">
		<div class="schedule-freq">
			<Select
				bind:value={value.frequency}
				options={frequencyOptions}
				{disabled}
				aria-label="Schedule frequency"
			/>
		</div>

		{#if value.frequency === "hourly"}
			<div class="schedule-inline">
				<span class="schedule-inline-label">at minute</span>
				<div class="time-field time-minute">
					<Select
						value={value.minute}
						options={minuteOptions}
						onValueChange={setMinute}
						{disabled}
						searchable
						searchPlaceholder="Minute"
						aria-label="Minute"
					/>
				</div>
			</div>
		{:else if value.frequency === "custom"}
			<input
				class="raw-input"
				type="text"
				bind:value={value.raw}
				{disabled}
				placeholder="0 9 * * *"
				spellcheck="false"
			/>
		{:else}
			{#if value.frequency === "weekly"}
				<div class="schedule-dow">
					<Select
						bind:value={value.dayOfWeek}
						options={weekdayOptions}
						{disabled}
						aria-label="Day of week"
					/>
				</div>
			{/if}
			{#if value.frequency === "monthly"}
				<div class="schedule-dom">
					<Select
						bind:value={value.dayOfMonth}
						options={dayOfMonthOptions}
						{disabled}
						aria-label="Day of month"
					/>
				</div>
			{/if}
			<div class="schedule-inline">
				<span class="schedule-inline-label">at</span>
				<div class="time-picker">
					<div class="time-field">
						<Select
							value={hour12}
							options={hourOptions}
							onValueChange={setHour12}
							{disabled}
							aria-label="Hour"
						/>
					</div>
					<span class="time-colon">:</span>
					<div class="time-field">
						<Select
							value={value.minute}
							options={minuteOptions}
							onValueChange={setMinute}
							{disabled}
							searchable
							searchPlaceholder="Minute"
							aria-label="Minute"
						/>
					</div>
					<div class="time-field time-period">
						<Select
							value={period}
							options={periodOptions}
							onValueChange={setPeriod}
							{disabled}
							aria-label="AM or PM"
						/>
					</div>
				</div>
			</div>
		{/if}
	</div>
	<p class="schedule-preview">{preview}</p>
</div>

<style>
	.schedule {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	.schedule-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.schedule-freq {
		flex: 0 0 auto;
		width: 150px;
	}

	.schedule-dow {
		flex: 0 0 auto;
		width: 150px;
	}

	.schedule-dom {
		flex: 0 0 auto;
		width: 120px;
	}

	.raw-input {
		flex: 1 1 160px;
		width: auto;
		padding: 8px 10px;
		border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
		border-radius: var(--radius-sm);
		color: var(--color-ink);
		background: var(--color-paper);
		font: inherit;
		font-size: 13px;
		font-family: var(--font-mono, ui-monospace, monospace);
	}

	.raw-input:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: inset 0 0 0 1px var(--color-accent);
	}

	.schedule-inline {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin: 0;
	}

	.schedule-inline-label {
		color: var(--color-muted);
		font-size: 12px;
	}

	.time-picker {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.time-field {
		width: 68px;
	}

	.time-field.time-period {
		width: 72px;
	}

	.time-field.time-minute {
		width: 78px;
	}

	.time-colon {
		color: var(--color-muted);
		font-weight: 600;
	}

	.schedule-preview {
		margin: 0;
		color: var(--color-muted);
		font-size: 12px;
		line-height: 1.4;
	}
</style>

// Structured, code-free representation of a cron schedule for the playbook
// editor. Covers the common cadences (hourly / daily / weekly / monthly) and
// falls back to a raw expression for anything more exotic.

export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

export type CronSchedule = {
	frequency: ScheduleFrequency;
	/** Minute past the hour (0-59). Used by every cadence. */
	minute: number;
	/** Hour of day (0-23). Used by daily / weekly / monthly. */
	hour: number;
	/** Day of week (0 = Sunday … 6 = Saturday). Used by weekly. */
	dayOfWeek: number;
	/** Day of month (1-31). Used by monthly. */
	dayOfMonth: number;
	/** Raw cron string, only meaningful when frequency === 'custom'. */
	raw: string;
};

export const WEEKDAY_OPTIONS = [
	{ value: 1, label: 'Monday' },
	{ value: 2, label: 'Tuesday' },
	{ value: 3, label: 'Wednesday' },
	{ value: 4, label: 'Thursday' },
	{ value: 5, label: 'Friday' },
	{ value: 6, label: 'Saturday' },
	{ value: 0, label: 'Sunday' }
] as const;

export function defaultSchedule(): CronSchedule {
	return {
		frequency: 'daily',
		minute: 0,
		hour: 9,
		dayOfWeek: 1,
		dayOfMonth: 1,
		raw: ''
	};
}

function clamp(value: number, min: number, max: number, fallback: number): number {
	if (!Number.isFinite(value)) return fallback;
	const rounded = Math.round(value);
	if (rounded < min) return min;
	if (rounded > max) return max;
	return rounded;
}

/** Build a 5-field cron string from a structured schedule. */
export function scheduleToCron(schedule: CronSchedule): string {
	const minute = clamp(schedule.minute, 0, 59, 0);
	const hour = clamp(schedule.hour, 0, 23, 9);
	const dow = clamp(schedule.dayOfWeek, 0, 6, 1);
	const dom = clamp(schedule.dayOfMonth, 1, 31, 1);

	switch (schedule.frequency) {
		case 'hourly':
			return `${minute} * * * *`;
		case 'daily':
			return `${minute} ${hour} * * *`;
		case 'weekly':
			return `${minute} ${hour} * * ${dow}`;
		case 'monthly':
			return `${minute} ${hour} ${dom} * *`;
		case 'custom':
			return schedule.raw.trim();
	}
}

function parseSingle(value: string | undefined, min: number, max: number): number | null {
	if (value === undefined) return null;
	if (!/^\d+$/.test(value)) return null;
	const n = Number(value);
	if (!Number.isInteger(n) || n < min || n > max) return null;
	return n;
}

/**
 * Best-effort parse of a cron string into a structured schedule. Anything that
 * doesn't match a simple hourly/daily/weekly/monthly shape becomes 'custom'
 * with the original expression preserved.
 */
export function cronToSchedule(cron: string | null | undefined): CronSchedule {
	const base = defaultSchedule();
	const trimmed = (cron ?? '').trim();
	// No schedule → represent as an empty custom expression so it round-trips
	// back to "" (i.e. it doesn't look "dirty" the moment it loads).
	if (!trimmed) {
		base.frequency = 'custom';
		base.raw = '';
		return base;
	}

	base.raw = trimmed;

	const parts = trimmed.split(/\s+/);
	const fields = parts.length === 6 ? parts.slice(1) : parts;
	if (fields.length !== 5) {
		base.frequency = 'custom';
		return base;
	}

	const [minutePart, hourPart, domPart, monthPart, dowPart] = fields;

	// Month must be wildcard for the simple cadences we support.
	if (monthPart !== '*') {
		base.frequency = 'custom';
		return base;
	}

	const minute = parseSingle(minutePart, 0, 59);
	if (minute === null) {
		base.frequency = 'custom';
		return base;
	}
	base.minute = minute;

	// Hourly: `M * * * *`
	if (hourPart === '*' && domPart === '*' && dowPart === '*') {
		base.frequency = 'hourly';
		return base;
	}

	const hour = parseSingle(hourPart, 0, 23);
	if (hour === null) {
		base.frequency = 'custom';
		return base;
	}
	base.hour = hour;

	// Daily: `M H * * *`
	if (domPart === '*' && dowPart === '*') {
		base.frequency = 'daily';
		return base;
	}

	// Weekly: `M H * * D`
	if (domPart === '*' && dowPart !== '*') {
		const dow = parseSingle(dowPart, 0, 6);
		if (dow === null) {
			base.frequency = 'custom';
			return base;
		}
		base.frequency = 'weekly';
		base.dayOfWeek = dow;
		return base;
	}

	// Monthly: `M H D * *`
	if (domPart !== '*' && dowPart === '*') {
		const dom = parseSingle(domPart, 1, 31);
		if (dom === null) {
			base.frequency = 'custom';
			return base;
		}
		base.frequency = 'monthly';
		base.dayOfMonth = dom;
		return base;
	}

	base.frequency = 'custom';
	return base;
}

/** Ordinal suffix for a day-of-month number (1 → "1st"). */
export function ordinal(n: number): string {
	const mod100 = n % 100;
	if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
	switch (n % 10) {
		case 1:
			return `${n}st`;
		case 2:
			return `${n}nd`;
		case 3:
			return `${n}rd`;
		default:
			return `${n}th`;
	}
}

/** Local-calendar helpers. All comparisons are day-granular so timezone
 *  offsets on ISO timestamps cannot shift the selected day. */

export function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, count: number): Date {
	const next = startOfDay(date);
	next.setDate(next.getDate() + count);
	return next;
}

export function addMonths(date: Date, count: number): Date {
	return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function isSameDay(a: Date | undefined, b: Date | undefined): boolean {
	if (!a || !b) return a === b;
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function compareDay(a: Date, b: Date): number {
	const left = startOfDay(a).getTime();
	const right = startOfDay(b).getTime();
	return left === right ? 0 : left < right ? -1 : 1;
}

export function isBetweenDays(date: Date, from: Date, to: Date): boolean {
	const time = startOfDay(date).getTime();
	const start = startOfDay(from).getTime();
	const end = startOfDay(to).getTime();
	return time > Math.min(start, end) && time < Math.max(start, end);
}

export function toISODate(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

const DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	year: 'numeric'
});
const MONTH_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const MONTH_SHORT_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'short' });

export function formatDay(date: Date): string {
	return DAY_FORMAT.format(date);
}

export function formatMonthYear(date: Date): string {
	return MONTH_FORMAT.format(date);
}

export function monthLabels(): string[] {
	return Array.from({ length: 12 }, (_, month) => MONTH_SHORT_FORMAT.format(new Date(2020, month, 1)));
}

/** `weekStartsOn`: 0 Sunday … 6 Saturday. 4 Jan 1970 is a Sunday. */
export function weekdayLabels(weekStartsOn = 0): string[] {
	const format = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
	return Array.from({ length: 7 }, (_, index) =>
		format.format(new Date(1970, 0, 4 + ((index + weekStartsOn) % 7))).slice(0, 2)
	);
}

export type CalendarCell = { date: Date; outside: boolean; hidden: boolean };

export function monthWeeks(month: Date, weekStartsOn = 0, showOutsideDays = true): CalendarCell[][] {
	const first = startOfMonth(month);
	const startOffset = (first.getDay() - weekStartsOn + 7) % 7;
	const gridStart = addDays(first, -startOffset);
	return Array.from({ length: 6 }, (_, week) =>
		Array.from({ length: 7 }, (_, day) => {
			const date = addDays(gridStart, week * 7 + day);
			const outside = date.getMonth() !== month.getMonth();
			return { date, outside, hidden: outside && !showOutsideDays };
		})
	);
}

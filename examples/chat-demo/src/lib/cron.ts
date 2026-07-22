const DAY_NAMES = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
] as const;

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
] as const;

type FieldKind = 'minute' | 'hour' | 'dom' | 'month' | 'dow';

type ParsedField =
	| { type: 'any' }
	| { type: 'step'; step: number; start: number }
	| { type: 'values'; values: number[] };

function parsePart(part: string, kind: FieldKind): ParsedField | null {
	const trimmed = part.trim();
	if (!trimmed) return null;

	const max =
		kind === 'minute' || kind === 'hour'
			? kind === 'minute'
				? 59
				: 23
			: kind === 'dom'
				? 31
				: kind === 'month'
					? 12
					: 6;
	const min = kind === 'dom' || kind === 'month' ? 1 : 0;

	if (trimmed === '*') return { type: 'any' };

	if (trimmed.includes('/')) {
		const [base, stepRaw] = trimmed.split('/');
		const step = Number(stepRaw);
		if (!Number.isInteger(step) || step <= 0) return null;
		if (base === '*') return { type: 'step', step, start: min };
		const start = Number(base);
		if (!Number.isInteger(start) || start < min || start > max) return null;
		return { type: 'step', step, start };
	}

	const values = new Set<number>();
	for (const chunk of trimmed.split(',')) {
		if (chunk.includes('-')) {
			const [aRaw, bRaw] = chunk.split('-');
			const a = Number(aRaw);
			const b = Number(bRaw);
			if (!Number.isInteger(a) || !Number.isInteger(b) || a > b) return null;
			if (a < min || b > max) return null;
			for (let i = a; i <= b; i += 1) values.add(i);
			continue;
		}
		const n = Number(chunk);
		if (!Number.isInteger(n) || n < min || n > max) return null;
		values.add(n);
	}

	if (values.size === 0) return null;
	return { type: 'values', values: [...values].sort((a, b) => a - b) };
}

function formatClock(hour: number, minute: number): string {
	const period = hour >= 12 ? 'PM' : 'AM';
	const h12 = hour % 12 === 0 ? 12 : hour % 12;
	return minute === 0
		? `${h12} ${period}`
		: `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

function joinList(items: string[]): string {
	if (items.length === 0) return '';
	if (items.length === 1) return items[0]!;
	if (items.length === 2) return `${items[0]} and ${items[1]}`;
	return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function describeDayOfWeek(field: ParsedField): string | null {
	if (field.type === 'any') return null;
	if (field.type === 'step') {
		if (field.step === 1) return 'every day';
		return `every ${field.step} days of the week`;
	}
	if (field.values.length === 7) return 'every day';
	if (
		field.values.length === 5 &&
		field.values[0] === 1 &&
		field.values[4] === 5
	) {
		return 'every weekday';
	}
	if (field.values.length === 2 && field.values[0] === 0 && field.values[1] === 6) {
		return 'every weekend';
	}
	return joinList(field.values.map((d) => DAY_NAMES[d] ?? `day ${d}`));
}

function describeDayOfMonth(field: ParsedField): string | null {
	if (field.type === 'any') return null;
	if (field.type === 'step') {
		return field.step === 1
			? 'every day of the month'
			: `every ${field.step} days of the month`;
	}
	const ordinals = field.values.map((d) => {
		const mod100 = d % 100;
		const suffix =
			mod100 >= 11 && mod100 <= 13
				? 'th'
				: d % 10 === 1
					? 'st'
					: d % 10 === 2
						? 'nd'
						: d % 10 === 3
							? 'rd'
							: 'th';
		return `${d}${suffix}`;
	});
	return `on the ${joinList(ordinals)}`;
}

function describeMonth(field: ParsedField): string | null {
	if (field.type === 'any') return null;
	if (field.type === 'step') {
		return field.step === 1 ? 'every month' : `every ${field.step} months`;
	}
	return joinList(field.values.map((m) => MONTH_NAMES[m - 1] ?? `month ${m}`));
}

/**
 * Convert a standard 5-field cron expression (`m h dom mon dow`) into a
 * short human-readable schedule. Returns `null` when the expression is empty
 * or cannot be parsed.
 *
 * Examples: `0 9 * * *` → "Every day at 9 AM";
 * `0 *\/3 * * *` → "Every 3 hours";
 * `0 13 * * 1-5` → "At 1 PM every weekday".
 */
export function cronToHuman(cron: string | null | undefined): string | null {
	if (typeof cron !== 'string') return null;
	const trimmed = cron.trim();
	if (!trimmed) return null;

	const parts = trimmed.split(/\s+/);
	// Support optional seconds prefix (6-field) by taking the last 5.
	const fields = parts.length === 6 ? parts.slice(1) : parts;
	if (fields.length !== 5) return null;

	const [minutePart, hourPart, domPart, monthPart, dowPart] = fields;
	const minute = parsePart(minutePart!, 'minute');
	const hour = parsePart(hourPart!, 'hour');
	const dom = parsePart(domPart!, 'dom');
	const month = parsePart(monthPart!, 'month');
	const dow = parsePart(dowPart!, 'dow');
	if (!minute || !hour || !dom || !month || !dow) return null;

	const monthText = describeMonth(month);
	const dowText = describeDayOfWeek(dow);
	const domText = describeDayOfMonth(dom);

	let when: string | null = null;

	if (minute.type === 'any' && hour.type === 'any') {
		when = 'Every minute';
	} else if (minute.type === 'step' && hour.type === 'any' && minute.start === 0) {
		when = minute.step === 1 ? 'Every minute' : `Every ${minute.step} minutes`;
	} else if (minute.type === 'values' && minute.values.length === 1 && hour.type === 'any') {
		const m = minute.values[0]!;
		when = m === 0 ? 'Every hour' : `Every hour at :${String(m).padStart(2, '0')}`;
	} else if (
		minute.type === 'values' &&
		minute.values.length === 1 &&
		hour.type === 'step' &&
		hour.start === 0
	) {
		const m = minute.values[0]!;
		when =
			hour.step === 1
				? m === 0
					? 'Every hour'
					: `Every hour at :${String(m).padStart(2, '0')}`
				: m === 0
					? `Every ${hour.step} hours`
					: `Every ${hour.step} hours at :${String(m).padStart(2, '0')}`;
	} else if (
		minute.type === 'values' &&
		hour.type === 'values' &&
		minute.values.length === 1 &&
		hour.values.length === 1
	) {
		when = `At ${formatClock(hour.values[0]!, minute.values[0]!)}`;
	} else if (minute.type === 'values' && hour.type === 'values') {
		const times = hour.values.flatMap((h) =>
			minute.values.map((m) => formatClock(h, m))
		);
		when = `At ${joinList(times)}`;
	} else {
		return null;
	}

	const cadenceParts: string[] = [];
	if (dowText && dowText !== 'every day') cadenceParts.push(dowText);
	if (domText) cadenceParts.push(domText);
	if (monthText && monthText !== 'every month') cadenceParts.push(`in ${monthText}`);

	if (cadenceParts.length === 0) {
		if (when.startsWith('Every')) return when;
		return `${when} every day`;
	}

	// "At 9 AM" + "every weekday" → "At 9 AM every weekday"
	// "Every 3 hours" + "Monday" → "Every 3 hours on Monday"
	const joiner = when.startsWith('Every') ? ' on ' : ' ';
	const cadence = cadenceParts.join(' ');
	if (when.startsWith('At ') && (dowText || domText)) {
		return `${when} ${cadence}`;
	}
	return `${when}${joiner}${cadence}`;
}

/** Like {@link cronToHuman}, but falls back to the raw cron (or a placeholder). */
export function formatCron(
	cron: string | null | undefined,
	fallback = 'No schedule'
): string {
	if (typeof cron !== 'string' || !cron.trim()) return fallback;
	return cronToHuman(cron) ?? cron.trim();
}

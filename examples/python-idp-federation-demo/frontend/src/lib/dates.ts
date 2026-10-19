/** Day bucketing for the chat sidebar and the threads board. */

export function dateKey(value: string | null): string {
	if (!value) return 'unknown';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'unknown';
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** `Today` / `Yesterday` / `12 Mar`, with the year once it isn't this one. */
export function shortDate(value: string | null): string {
	if (!value) return 'Older';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Older';

	const today = new Date();
	const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const dayDiff = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86_400_000);

	if (dayDiff === 0) return 'Today';
	if (dayDiff === 1) return 'Yesterday';
	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
	});
}

export type DayGroup<T> = { key: string; label: string; rows: T[] };

/** Rows in their existing order, split into day buckets in first-seen order. */
export function groupByDay<T>(rows: T[], getDate: (row: T) => string | null): DayGroup<T>[] {
	const groups: DayGroup<T>[] = [];
	const byKey = new Map<string, DayGroup<T>>();
	for (const row of rows) {
		const value = getDate(row);
		const key = dateKey(value);
		let group = byKey.get(key);
		if (!group) {
			group = { key, label: shortDate(value), rows: [] };
			byKey.set(key, group);
			groups.push(group);
		}
		group.rows.push(row);
	}
	return groups;
}

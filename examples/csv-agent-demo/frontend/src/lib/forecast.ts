import { buildSheet, isNull, type Sheet } from './csv';

/** The file's columns each parameter reads; a parameter whose column is missing is skipped. */
export const COLUMNS = {
	date: 'posted_date',
	category: 'gl_category',
	amount: 'amount_usd',
	status: 'status',
	memo: 'memo',
	currency: 'currency'
} as const;

export type ForecastType = 'revenue' | 'expenses';
export type Scenario = 'base' | 'upside' | 'downside';
/** `YYYY-MM`. */
export type Month = string;
export type Range = { from: Month; to: Month };

export type Inclusions = {
	pending: boolean;
	reversedVoid: boolean;
	intercompany: boolean;
	foreignEntities: boolean;
};

export type ForecastParams = {
	type: ForecastType;
	fiscalYears: string[];
	scenario: Scenario;
	actual: Range;
	forecast: Range;
	include: Inclusions;
};

export const TYPE_LABEL: Record<ForecastType, string> = { revenue: 'Revenue', expenses: 'Expenses' };

export const SCENARIO_LABEL: Record<Scenario, string> = {
	base: 'Base case',
	upside: 'Upside (+10% growth)',
	downside: 'Downside (−10% growth)'
};

export const INCLUSION_LABEL: Record<keyof Inclusions, string> = {
	pending: 'Pending transactions',
	reversedVoid: 'Reversed & void',
	intercompany: 'Intercompany transfers',
	foreignEntities: 'Non-USD entities'
};

const CATEGORIES: Record<ForecastType, string[]> = { revenue: ['Revenue'], expenses: ['COGS', 'Opex'] };

export function monthLabel(month: Month): string {
	const [year, m] = month.split('-').map(Number);
	return new Date(Date.UTC(year!, m! - 1, 1)).toLocaleDateString(undefined, {
		month: 'short',
		year: '2-digit',
		timeZone: 'UTC'
	});
}

export function addMonths(month: Month, n: number): Month {
	const [year, m] = month.split('-').map(Number);
	const d = new Date(Date.UTC(year!, m! - 1 + n, 1));
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Every month from `from` to `to`, inclusive. */
export function monthsBetween(from: Month, to: Month): Month[] {
	const out: Month[] = [];
	for (let m = from; m <= to && out.length < 600; m = addMonths(m, 1)) out.push(m);
	return out;
}

/** The months the file's date column spans. */
export function dataMonths(sheet: Sheet): Month[] {
	const c = sheet.columns.indexOf(COLUMNS.date);
	if (c === -1) return [];
	let min = '';
	let max = '';
	for (const row of sheet.rows) {
		const month = (row[c] ?? '').slice(0, 7);
		if (!/^\d{4}-\d{2}$/.test(month)) continue;
		if (!min || month < min) min = month;
		if (!max || month > max) max = month;
	}
	return min ? monthsBetween(min, max) : [];
}

export function defaultParams(sheet: Sheet): ForecastParams {
	const months = dataMonths(sheet);
	const last = months[months.length - 1] ?? '2025-12';
	const first = months[Math.max(0, months.length - 12)] ?? addMonths(last, -11);
	return {
		type: 'revenue',
		fiscalYears: [...new Set(months.map((m) => m.slice(0, 4)))],
		scenario: 'base',
		actual: { from: first, to: last },
		forecast: { from: addMonths(last, 1), to: addMonths(last, 6) },
		include: { pending: false, reversedVoid: false, intercompany: false, foreignEntities: true }
	};
}

/** The parameters as rules over the file's columns, for the grid and the agent alike. */
export function scopeRules(sheet: Sheet, p: ForecastParams): string[] {
	const has = (name: string) => sheet.columns.includes(name);
	const rules: string[] = [];
	if (has(COLUMNS.category)) rules.push(`${COLUMNS.category} is ${CATEGORIES[p.type].join(' or ')}`);
	if (has(COLUMNS.date)) {
		rules.push(`${COLUMNS.date} falls in fiscal year ${p.fiscalYears.join(', ')}`);
		rules.push(`${COLUMNS.date} is between ${p.actual.from} and ${p.actual.to} (inclusive, by month)`);
	}
	if (has(COLUMNS.status)) {
		if (!p.include.pending) rules.push(`exclude ${COLUMNS.status} = Pending`);
		if (!p.include.reversedVoid) rules.push(`exclude ${COLUMNS.status} = Reversed or Void`);
	}
	if (has(COLUMNS.memo) && !p.include.intercompany)
		rules.push(`exclude ${COLUMNS.memo} = Intercompany transfer`);
	if (has(COLUMNS.currency) && !p.include.foreignEntities) rules.push(`only ${COLUMNS.currency} = USD`);
	return rules;
}

/** The rows the parameters select. */
export function scopedRows(sheet: Sheet, p: ForecastParams): string[][] {
	const col = (name: string) => sheet.columns.indexOf(name);
	const [date, category, status, memo, currency] = [
		col(COLUMNS.date),
		col(COLUMNS.category),
		col(COLUMNS.status),
		col(COLUMNS.memo),
		col(COLUMNS.currency)
	];
	const categories = new Set(CATEGORIES[p.type]);
	const years = new Set(p.fiscalYears);
	return sheet.rows.filter((row) => {
		if (category !== -1 && !categories.has(row[category]!)) return false;
		if (date !== -1) {
			const month = (row[date] ?? '').slice(0, 7);
			if (!years.has(month.slice(0, 4)) || month < p.actual.from || month > p.actual.to) return false;
		}
		if (status !== -1) {
			const s = row[status];
			if (!p.include.pending && s === 'Pending') return false;
			if (!p.include.reversedVoid && (s === 'Reversed' || s === 'Void')) return false;
		}
		if (memo !== -1 && !p.include.intercompany && row[memo] === 'Intercompany transfer') return false;
		if (currency !== -1 && !p.include.foreignEntities && !isNull(row[currency]) && row[currency] !== 'USD')
			return false;
		return true;
	});
}

/** The rows the parameters select, as their own sheet. */
export function scopeSheet(sheet: Sheet, p: ForecastParams): Sheet {
	return buildSheet(sheet.columns, scopedRows(sheet, p), sheet.truncated);
}

export function summarizeParams(p: ForecastParams): string[] {
	return [
		TYPE_LABEL[p.type],
		`FY ${p.fiscalYears.join(', ')}`,
		SCENARIO_LABEL[p.scenario],
		`Actuals ${monthLabel(p.actual.from)}–${monthLabel(p.actual.to)}`,
		`Forecast ${monthLabel(p.forecast.from)}–${monthLabel(p.forecast.to)}`
	];
}

import Papa from 'papaparse';

export type ColumnType = 'number' | 'date' | 'boolean' | 'text';

export type Bin = { from: number; to: number; count: number };
export type ValueCount = { value: string; count: number };

export type ColumnStats = {
	type: ColumnType;
	nulls: number;
	distinct: number;
	/** Numeric and date columns: parsed bounds (dates as epoch ms). */
	min?: number;
	max?: number;
	bins?: Bin[];
	/** Most frequent values, for categorical filters and the header sparkline. */
	top: ValueCount[];
};

export type Sheet = {
	/** Unique per parse, so a view can key its state on the sheet it shows. */
	id: number;
	columns: string[];
	rows: string[][];
	stats: ColumnStats[];
	/** Parsed numeric (or epoch-ms) value per cell; NaN where it does not parse. */
	numeric: (Float64Array | null)[];
	/** Each row's cells, lowercased and joined, for search. */
	haystack: string[];
	/** True when the file has more rows than ROW_LIMIT and only the first are loaded. */
	truncated: boolean;
};

export type Filter =
	| { kind: 'range'; min?: number; max?: number }
	| { kind: 'values'; values: Set<string> }
	| { kind: 'contains'; text: string }
	| { kind: 'nulls'; only: 'empty' | 'filled' };

export type Sort = { column: number; dir: 'asc' | 'desc' } | null;

const NULLS = new Set(['', 'na', 'n/a', 'nan', 'null', 'none', '-', '—']);
const TRUE_FALSE = new Set(['true', 'false', 'yes', 'no', 't', 'f', 'y', 'n']);
const DATE_SHAPE = /^\d{4}-\d{1,2}-\d{1,2}([ t]\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?(z|[+-]\d{2}:?\d{2})?)?$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/i;
const SAMPLE = 2000;
const TOP_VALUES = 200;
const BIN_COUNT = 24;

export function isNull(value: string | undefined): boolean {
	return value === undefined || NULLS.has(value.trim().toLowerCase());
}

/** `1,234.5`, `$12`, `45%`, `(3.2)` → numbers; anything else → NaN. */
function parseNumber(value: string): number {
	let text = value.trim();
	if (!text) return NaN;
	let negative = false;
	if (text.startsWith('(') && text.endsWith(')')) {
		negative = true;
		text = text.slice(1, -1);
	}
	text = text.replace(/^[$€£¥]/, '').replace(/,/g, '').replace(/%$/, '');
	if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(text)) return NaN;
	const n = Number(text);
	return negative ? -n : n;
}

function parseDate(value: string): number {
	const text = value.trim();
	if (!DATE_SHAPE.test(text)) return NaN;
	return Date.parse(text);
}

function inferType(values: string[]): ColumnType {
	const filled = values.filter((v) => !isNull(v));
	if (filled.length === 0) return 'text';
	const share = (test: (v: string) => boolean) =>
		filled.filter(test).length / filled.length;
	if (share((v) => TRUE_FALSE.has(v.trim().toLowerCase())) === 1) return 'boolean';
	if (share((v) => !Number.isNaN(parseNumber(v))) >= 0.95) return 'number';
	if (share((v) => !Number.isNaN(parseDate(v))) >= 0.95) return 'date';
	return 'text';
}

function columnStats(rows: string[][], c: number): { stats: ColumnStats; numeric: Float64Array | null } {
	const step = Math.max(1, Math.floor(rows.length / SAMPLE));
	const sample: string[] = [];
	for (let r = 0; r < rows.length; r += step) sample.push(rows[r]![c] ?? '');
	const type = inferType(sample);

	const counts = new Map<string, number>();
	let nulls = 0;
	const parse = type === 'number' ? parseNumber : type === 'date' ? parseDate : null;
	const numeric = parse ? new Float64Array(rows.length) : null;
	for (let r = 0; r < rows.length; r++) {
		const value = rows[r]![c] ?? '';
		if (isNull(value)) {
			nulls++;
			if (numeric) numeric[r] = NaN;
			continue;
		}
		counts.set(value, (counts.get(value) ?? 0) + 1);
		if (numeric && parse) numeric[r] = parse(value);
	}

	const top = [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, TOP_VALUES)
		.map(([value, count]) => ({ value, count }));

	const stats: ColumnStats = { type, nulls, distinct: counts.size, top };
	const summary = numeric ? summarize(numeric) : null;
	if (numeric && summary && summary.count > 0) {
		stats.min = summary.min;
		stats.max = summary.max;
		stats.bins = histogram(numeric, summary.min, summary.max);
	}
	return { stats, numeric };
}

export type Summary = { sum: number; count: number; min: number; max: number };

/** Sum, count, and bounds of the parsed values, over `rows` or every row. */
export function summarize(numeric: Float64Array, rows?: Iterable<number>): Summary {
	const out: Summary = { sum: 0, count: 0, min: Infinity, max: -Infinity };
	const add = (x: number) => {
		if (Number.isNaN(x)) return;
		out.sum += x;
		out.count++;
		if (x < out.min) out.min = x;
		if (x > out.max) out.max = x;
	};
	if (rows) for (const r of rows) add(numeric[r]!);
	else for (const x of numeric) add(x);
	return out;
}

function histogram(values: Float64Array, min: number, max: number): Bin[] {
	const span = max - min;
	const count = span === 0 ? 1 : BIN_COUNT;
	const width = span === 0 ? 1 : span / count;
	const bins: Bin[] = Array.from({ length: count }, (_, i) => ({
		from: min + i * width,
		to: i === count - 1 ? max : min + (i + 1) * width,
		count: 0
	}));
	for (const x of values) {
		if (Number.isNaN(x)) continue;
		const i = span === 0 ? 0 : Math.min(count - 1, Math.floor((x - min) / width));
		bins[i]!.count++;
	}
	return bins;
}

let nextSheetId = 1;

export function buildSheet(columns: string[], rows: string[][], truncated = false): Sheet {
	const stats: ColumnStats[] = [];
	const numeric: (Float64Array | null)[] = [];
	columns.forEach((_, c) => {
		const result = columnStats(rows, c);
		stats.push(result.stats);
		numeric.push(result.numeric);
	});
	const haystack = rows.map((row) => row.join('\u0000').toLowerCase());
	return { id: nextSheetId++, columns, rows, stats, numeric, haystack, truncated };
}

/** The most rows the grid loads; larger files show their first rows. */
export const ROW_LIMIT = 200_000;

/** Header row plus body, padded to one width; Papa detects the delimiter. */
function toSheet(data: string[][], truncated: boolean): Sheet {
	const [header = [], ...body] = data;
	const columns = header.map((name, i) => name.replace(/^\uFEFF/, '').trim() || `column_${i + 1}`);
	const width = Math.max(columns.length, ...body.slice(0, 200).map((row) => row.length));
	while (columns.length < width) columns.push(`column_${columns.length + 1}`);
	const rows = body.map((row) => {
		const cells = row.slice(0, width);
		while (cells.length < width) cells.push('');
		return cells;
	});
	return buildSheet(columns, rows, truncated);
}

export function parseCsv(text: string): Sheet {
	return toSheet(Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' }).data, false);
}

/**
 * Stream a CSV/TSV from a File or a URL, stopping at ROW_LIMIT so a large
 * file never has to sit in memory whole.
 */
export function parseCsvSource(source: File | string): Promise<Sheet> {
	return new Promise((resolve, reject) => {
		const config = {
			preview: ROW_LIMIT + 2,
			skipEmptyLines: 'greedy' as const,
			complete: (results: Papa.ParseResult<string[]>) => {
				const truncated = results.data.length > ROW_LIMIT + 1;
				resolve(toSheet(results.data.slice(0, ROW_LIMIT + 1), truncated));
			},
			error: (err: Error) => reject(err)
		};
		if (typeof source === 'string') Papa.parse<string[]>(source, { ...config, download: true });
		else Papa.parse<string[]>(source, config);
	});
}

export function filterActive(filter: Filter | undefined): boolean {
	if (!filter) return false;
	switch (filter.kind) {
		case 'range':
			return filter.min !== undefined || filter.max !== undefined;
		case 'values':
			return filter.values.size > 0;
		case 'contains':
			return filter.text.trim() !== '';
		case 'nulls':
			return true;
	}
}

/** A filter as a row predicate, with its needle prepared once. */
function predicate(sheet: Sheet, c: number, filter: Filter): (r: number) => boolean {
	const cell = (r: number) => sheet.rows[r]![c] ?? '';
	switch (filter.kind) {
		case 'range': {
			const numeric = sheet.numeric[c];
			const { min = -Infinity, max = Infinity } = filter;
			return (r) => {
				const x = numeric?.[r] ?? NaN;
				return !Number.isNaN(x) && x >= min && x <= max;
			};
		}
		case 'values':
			return (r) => filter.values.has(cell(r));
		case 'contains': {
			const needle = filter.text.trim().toLowerCase();
			return (r) => cell(r).toLowerCase().includes(needle);
		}
		case 'nulls': {
			const empty = filter.only === 'empty';
			return (r) => isNull(cell(r)) === empty;
		}
	}
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Every row index in sort order; empty cells sink to the bottom either way. */
export function sortedRows(sheet: Sheet, sort: Sort): number[] {
	const all = sheet.rows.map((_, r) => r);
	if (!sort) return all;
	const { column, dir } = sort;
	const sign = dir === 'asc' ? 1 : -1;
	const numeric = sheet.numeric[column];
	const filled: number[] = [];
	const empty: number[] = [];
	for (const r of all) (isNull(sheet.rows[r]![column]) ? empty : filled).push(r);
	filled.sort((a, b) => {
		if (numeric) {
			const xa = numeric[a]!;
			const xb = numeric[b]!;
			if (!Number.isNaN(xa) && !Number.isNaN(xb)) return (xa - xb) * sign;
		}
		return collator.compare(sheet.rows[a]![column]!, sheet.rows[b]![column]!) * sign;
	});
	return filled.concat(empty);
}

/** The rows of `order` that pass every filter and the search, order kept. */
export function filterRows(
	sheet: Sheet,
	order: number[],
	filters: Map<number, Filter>,
	search: string
): number[] {
	const tests = [...filters].map(([c, f]) => predicate(sheet, c, f));
	const needle = search.trim().toLowerCase();
	if (needle) tests.push((r) => sheet.haystack[r]!.includes(needle));
	if (tests.length === 0) return order;
	return order.filter((r) => tests.every((test) => test(r)));
}

export function toCsv(sheet: Sheet, rows: number[], columns: number[]): string {
	return Papa.unparse({
		fields: columns.map((c) => sheet.columns[c]!),
		data: rows.map((r) => columns.map((c) => sheet.rows[r]![c] ?? ''))
	});
}

/** A1-style column letters: 0 → A, 26 → AA. */
export function columnLetter(index: number): string {
	let n = index + 1;
	let out = '';
	while (n > 0) {
		const rem = (n - 1) % 26;
		out = String.fromCharCode(65 + rem) + out;
		n = Math.floor((n - 1) / 26);
	}
	return out;
}

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 });
const precise = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 });

export function formatStat(value: number | undefined, type: ColumnType, short = false): string {
	if (value === undefined || !Number.isFinite(value)) return '—';
	if (type === 'date') return new Date(value).toISOString().slice(0, 10);
	return short ? compact.format(value) : precise.format(value);
}

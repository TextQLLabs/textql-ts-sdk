import { getCellCase, getCellPayload, type CellLike } from '$lib/cells';

export type PreviewItem = {
	id: string;
	name: string;
	previewType: string;
	url?: string | null;
	content?: string | null;
	error?: string | null;
	toolSummary?: string | null;
};

const WIDTH_KEY = 'chat-demo.previewPanelWidth';
const MIN_WIDTH = 280;
const MAX_WIDTH = 860;
const DEFAULT_WIDTH = 420;

function asString(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function records(value: unknown): Record<string, unknown>[] {
	return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(value: unknown): string[] {
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function clampPreviewWidth(value: number): number {
	const max =
		typeof window !== 'undefined'
			? Math.min(MAX_WIDTH, Math.floor(window.innerWidth * 0.7))
			: MAX_WIDTH;
	return Math.round(Math.min(max, Math.max(MIN_WIDTH, value)));
}

function loadWidth(): number {
	if (typeof localStorage === 'undefined') return DEFAULT_WIDTH;
	try {
		const raw = localStorage.getItem(WIDTH_KEY);
		if (!raw) return DEFAULT_WIDTH;
		const n = Number(raw);
		return Number.isFinite(n) ? clampPreviewWidth(n) : DEFAULT_WIDTH;
	} catch {
		return DEFAULT_WIDTH;
	}
}

function persistWidth(width: number) {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(WIDTH_KEY, String(width));
	} catch {
		/* ignore quota / private mode */
	}
}

/** Infer a preview type from a URL / filename when the cell doesn't specify one. */
export function guessPreviewType(url: string, fallback = 'file'): string {
	const path = url.split('?')[0]?.toLowerCase() ?? '';
	if (/\.(png|jpe?g|gif|webp|svg|bmp|ico)$/.test(path)) return 'image';
	if (/\.pdf$/.test(path)) return 'pdf';
	if (/\.html?$/.test(path)) return 'html';
	if (/\.(csv|tsv)$/.test(path)) return 'csv';
	if (/\.(md|markdown)$/.test(path)) return 'markdown';
	if (/\.(json|ya?ml|toml|txt|log|py|js|ts|sql)$/.test(path)) return 'file';
	return fallback;
}

function cellId(cell: CellLike, suffix: string): string {
	const base = typeof cell.id === 'string' && cell.id ? cell.id : 'cell';
	return `${base}:${suffix}`;
}

function pushItem(
	out: PreviewItem[],
	seen: Set<string>,
	item: PreviewItem | null | undefined
) {
	if (!item) return;
	const hasPayload = Boolean(item.url || item.content || item.error);
	if (!hasPayload) return;
	if (seen.has(item.id)) return;
	seen.add(item.id);
	out.push(item);
}

function itemFromUrl(opts: {
	id: string;
	name: string;
	url: string;
	previewType?: string;
	toolSummary?: string | null;
	error?: string | null;
}): PreviewItem {
	return {
		id: opts.id,
		name: opts.name || 'Asset',
		previewType: opts.previewType || guessPreviewType(opts.url),
		url: opts.url,
		content: null,
		error: opts.error ?? null,
		toolSummary: opts.toolSummary ?? null
	};
}

function itemFromContent(opts: {
	id: string;
	name: string;
	content: string;
	previewType?: string;
	toolSummary?: string | null;
	error?: string | null;
}): PreviewItem {
	return {
		id: opts.id,
		name: opts.name || 'Asset',
		previewType: opts.previewType || 'file',
		url: null,
		content: opts.content,
		error: opts.error ?? null,
		toolSummary: opts.toolSummary ?? null
	};
}

function toolSummaryOf(cell: CellLike): string | null {
	return typeof cell.toolSummary === 'string' ? cell.toolSummary : null;
}

function execErrorOf(cell: CellLike): string | null {
	return typeof cell.execError === 'string' && cell.execError ? cell.execError : null;
}

/** Collect every openable asset from a single cell (images, charts, files, embeds, …). */
export function previewItemsFromCell(cell: CellLike): PreviewItem[] {
	const cellCase = getCellCase(cell);
	const payload = getCellPayload(cell);
	const summary = toolSummaryOf(cell);
	const execError = execErrorOf(cell);
	const out: PreviewItem[] = [];
	const seen = new Set<string>();

	const addUrl = (
		url: unknown,
		name: string,
		suffix: string,
		previewType?: string
	) => {
		const href = asString(url);
		if (!href) return;
		pushItem(
			out,
			seen,
			itemFromUrl({
				id: cellId(cell, suffix),
				name,
				url: href,
				previewType,
				toolSummary: summary,
				error: execError
			})
		);
	};

	const addContent = (
		content: unknown,
		name: string,
		suffix: string,
		previewType?: string
	) => {
		const text = asString(content);
		if (!text) return;
		pushItem(
			out,
			seen,
			itemFromContent({
				id: cellId(cell, suffix),
				name,
				content: text,
				previewType,
				toolSummary: summary,
				error: execError
			})
		);
	};

	const addImageRefs = (value: unknown, prefix: string) => {
		records(value).forEach((ref, i) => {
			const url = asString(ref.url);
			if (!url) return;
			addUrl(url, asString(ref.name) || `Image ${i + 1}`, `${prefix}-${i}`, 'image');
		});
	};

	const addFileRefs = (value: unknown, prefix: string) => {
		records(value).forEach((ref, i) => {
			const url = asString(ref.url);
			if (!url) return;
			const name = asString(ref.name) || `File ${i + 1}`;
			addUrl(url, name, `${prefix}-${i}`, guessPreviewType(url, 'file'));
		});
	};

	switch (cellCase) {
		case 'previewCell': {
			const id =
				typeof cell.id === 'string' && cell.id
					? cell.id
					: `preview-${asString(payload.name) || 'asset'}`;
			const previewType = asString(payload.previewType) || 'file';
			const name =
				asString(payload.name) || asString(payload.target) || 'Preview';
			const url = typeof payload.url === 'string' ? payload.url : null;
			const content = typeof payload.content === 'string' ? payload.content : null;
			const error =
				(typeof payload.error === 'string' && payload.error) || execError || null;
			pushItem(out, seen, {
				id,
				name,
				previewType,
				url,
				content,
				error,
				toolSummary: summary
			});
			break;
		}
		case 'imageCell':
			addUrl(
				payload.url,
				asString(payload.name) || asString(payload.altText) || 'Image',
				'image',
				'image'
			);
			break;
		case 'documentCell':
			addUrl(
				payload.url,
				asString(payload.name) || 'Document',
				'doc',
				guessPreviewType(asString(payload.url), 'pdf')
			);
			if (!asString(payload.url)) {
				addContent(payload.preview, asString(payload.name) || 'Document', 'preview', 'markdown');
			}
			break;
		case 'textCell':
			addContent(
				payload.content,
				asString(payload.fileName) || 'Text file',
				'text',
				guessPreviewType(asString(payload.fileName), 'file')
			);
			break;
		case 'streamlitCell':
			addUrl(payload.url, asString(payload.name) || 'Streamlit app', 'app', 'app');
			addUrl(payload.screenshotUrl, 'App screenshot', 'screenshot', 'image');
			break;
		case 'dashboardCell':
			addUrl(
				payload.screenshotUrl,
				asString(payload.name) || 'Dashboard',
				'screenshot',
				'image'
			);
			break;
		case 'appCell':
			addUrl(payload.screenshotUrl, asString(payload.name) || 'Data app', 'screenshot', 'image');
			break;
		case 'pyCell':
			addImageRefs(payload.images, 'img');
			records(payload.charts).forEach((chart, i) => {
				const url = asString(chart.pngUrl) || asString(chart.url);
				if (!url) return;
				addUrl(
					url,
					asString(chart.title) || `Chart ${i + 1}`,
					`chart-${i}`,
					'chart'
				);
			});
			addFileRefs(payload.files, 'file');
			break;
		case 'javascriptCell':
			addImageRefs(payload.images, 'img');
			addFileRefs(payload.files, 'file');
			break;
		case 'ansCell':
			addImageRefs(payload.images, 'img');
			break;
		case 'feedPostCell':
			strings(payload.imageUrls).forEach((url, i) => {
				addUrl(url, `Image ${i + 1}`, `img-${i}`, 'image');
			});
			break;
		case 'tableauCell':
		case 'powerbiCell':
			records(payload.messageBlocks).forEach((block, i) => {
				const b64 = asString(block.imageBase64);
				if (b64) {
					addUrl(
						`data:image/png;base64,${b64}`,
						`Chart ${i + 1}`,
						`msg-img-${i}`,
						'image'
					);
				}
			});
			break;
		default:
			// Fallback: any obvious media fields on unknown / future cell types.
			addUrl(payload.url, asString(payload.name) || 'Asset', 'url');
			addUrl(payload.screenshotUrl, 'Screenshot', 'screenshot', 'image');
			addImageRefs(payload.images, 'img');
			addFileRefs(payload.files, 'file');
			break;
	}

	return out;
}

/** Primary asset for a cell (first collected), or null. */
export function previewItemFromCell(cell: CellLike): PreviewItem | null {
	return previewItemsFromCell(cell)[0] ?? null;
}

export function collectPreviewItems(cells: CellLike[]): PreviewItem[] {
	const out: PreviewItem[] = [];
	const seen = new Set<string>();
	for (const cell of cells) {
		for (const item of previewItemsFromCell(cell)) {
			if (seen.has(item.id)) continue;
			seen.add(item.id);
			out.push(item);
		}
	}
	return out;
}

/** Whether a cell has any openable preview assets. */
export function cellHasPreviewAssets(cell: CellLike): boolean {
	return previewItemsFromCell(cell).length > 0;
}

/**
 * Cells whose primary job is an asset — clicking the tool step opens the
 * preview sidebar instead of expanding inline detail. Hybrid cells (e.g. Python
 * with chart images) still expand; their assets open from CellDetail.
 */
const PREVIEW_STEP_CASES = new Set([
	'previewCell',
	'imageCell',
	'documentCell',
	'textCell',
	'streamlitCell',
	'dashboardCell',
	'appCell'
]);

export function cellOpensInPreviewPanel(cell: CellLike): boolean {
	const cellCase = getCellCase(cell);
	if (!cellCase || !PREVIEW_STEP_CASES.has(cellCase)) return false;
	return cellHasPreviewAssets(cell);
}

class PreviewPanelState {
	open = $state(false);
	selectedId = $state<string | null>(null);
	/** Open tabs (Cursor-style); accumulate on open, remove on close. */
	tabs = $state<PreviewItem[]>([]);
	width = $state(loadWidth());
	/** True while the user is dragging the resize handle. */
	resizing = $state(false);

	readonly selected = $derived(
		this.tabs.find((tab) => tab.id === this.selectedId) ?? this.tabs[0] ?? null
	);

	/** Refresh content of already-open tabs from latest chat cells. */
	syncFromCells(items: PreviewItem[]) {
		if (this.tabs.length === 0) return;
		const byId = new Map(items.map((item) => [item.id, item]));
		let changed = false;
		const next = this.tabs.map((tab) => {
			const fresh = byId.get(tab.id);
			if (!fresh) return tab;
			if (
				fresh.url === tab.url &&
				fresh.content === tab.content &&
				fresh.error === tab.error &&
				fresh.name === tab.name &&
				fresh.previewType === tab.previewType &&
				fresh.toolSummary === tab.toolSummary
			) {
				return tab;
			}
			changed = true;
			return { ...tab, ...fresh };
		});
		if (changed) this.tabs = next;
	}

	openItem(item: PreviewItem) {
		const idx = this.tabs.findIndex((tab) => tab.id === item.id);
		if (idx >= 0) {
			const next = [...this.tabs];
			next[idx] = item;
			this.tabs = next;
		} else {
			this.tabs = [...this.tabs, item];
		}
		this.selectedId = item.id;
		this.open = true;
	}

	/**
	 * Open the panel with the chat's assets as tabs.
	 * Keeps existing tab order, refreshes content, and appends any new assets.
	 */
	openPanel(items: PreviewItem[] = []) {
		if (items.length > 0) {
			const freshById = new Map(items.map((item) => [item.id, item]));
			const merged: PreviewItem[] = [];
			const seen = new Set<string>();

			for (const tab of this.tabs) {
				merged.push(freshById.get(tab.id) ?? tab);
				seen.add(tab.id);
			}
			for (const item of items) {
				if (seen.has(item.id)) continue;
				merged.push(item);
				seen.add(item.id);
			}

			this.tabs = merged;
			if (!this.selectedId || !seen.has(this.selectedId)) {
				this.selectedId = merged[0]?.id ?? null;
			}
		}
		this.open = true;
	}

	select(id: string) {
		if (!this.tabs.some((tab) => tab.id === id)) return;
		this.selectedId = id;
		this.open = true;
	}

	closeTab(id: string) {
		const idx = this.tabs.findIndex((tab) => tab.id === id);
		if (idx < 0) return;

		const next = this.tabs.filter((tab) => tab.id !== id);
		this.tabs = next;

		if (next.length === 0) {
			this.selectedId = null;
			this.open = false;
			return;
		}

		if (this.selectedId === id) {
			const neighbor = next[Math.min(idx, next.length - 1)];
			this.selectedId = neighbor?.id ?? null;
		}
	}

	close() {
		this.open = false;
	}

	reset() {
		this.open = false;
		this.selectedId = null;
		this.tabs = [];
	}

	setWidth(value: number) {
		const next = clampPreviewWidth(value);
		if (next === this.width) return;
		this.width = next;
	}

	commitWidth() {
		persistWidth(this.width);
	}
}

export const previewPanel = new PreviewPanelState();

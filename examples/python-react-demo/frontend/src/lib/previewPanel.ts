import { useSyncExternalStore } from 'react';

import type { CitationView } from './citations';
import {
	asRecords as records,
	asString,
	asStrings as strings,
	getCellCase,
	getCellPayload,
	getCellToolSummary,
	type CellLike
} from './cells';
import { Store, useStore } from './store';
import { storageGet, storageSet } from './utils';

export type PreviewItem = {
	id: string;
	name: string;
	previewType: string;
	url?: string | null;
	content?: string | null;
	error?: string | null;
	toolSummary?: string | null;
};

/**
 * Panel tabs that aren't assets. Citations and the timeline are views onto the
 * whole chat rather than a file, so their content is read from the store (see
 * `setInsights`) instead of being carried on the item — but they are tabs like
 * any other, and get the tab bar, width and close behaviour for free.
 */
export const INSIGHT_TYPES = { citations: 'citations', timeline: 'timeline' } as const;

export const INSIGHT_ITEMS: Record<keyof typeof INSIGHT_TYPES, PreviewItem> = {
	citations: { id: 'insight:citations', name: 'Citations', previewType: INSIGHT_TYPES.citations },
	timeline: { id: 'insight:timeline', name: 'Timeline', previewType: INSIGHT_TYPES.timeline }
};

export function isInsightType(previewType: string): boolean {
	return previewType === INSIGHT_TYPES.citations || previewType === INSIGHT_TYPES.timeline;
}

const WIDTH_KEY = 'chat-demo.previewPanelWidth';
const MIN_WIDTH = 280;
const MAX_WIDTH = 860;
const DEFAULT_WIDTH = 420;

export function clampPreviewWidth(value: number): number {
	const max =
		typeof window !== 'undefined'
			? Math.min(MAX_WIDTH, Math.floor(window.innerWidth * 0.7))
			: MAX_WIDTH;
	return Math.round(Math.min(max, Math.max(MIN_WIDTH, value)));
}

function loadWidth(): number {
	const raw = storageGet(WIDTH_KEY);
	if (!raw) return DEFAULT_WIDTH;
	const n = Number(raw);
	return Number.isFinite(n) ? clampPreviewWidth(n) : DEFAULT_WIDTH;
}

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

/**
 * The identity of one asset. Anything that opens a tab must derive it the same
 * way, or the collector and the opener produce two tabs for the same asset.
 */
export function previewItemId(cell: CellLike, suffix: string): string {
	const base = typeof cell.id === 'string' && cell.id ? cell.id : 'cell';
	return `${base}:${suffix}`;
}

function execErrorOf(cell: CellLike): string | null {
	return typeof cell.execError === 'string' && cell.execError ? cell.execError : null;
}

export function previewItemsFromCell(cell: CellLike): PreviewItem[] {
	const cellCase = getCellCase(cell);
	const payload = getCellPayload(cell);
	const summary = getCellToolSummary(cell);
	const execError = execErrorOf(cell);
	const out: PreviewItem[] = [];

	const addUrl = (url: unknown, name: string, suffix: string, previewType?: string) => {
		const href = asString(url);
		if (!href) return;
		out.push({
			id: previewItemId(cell, suffix),
			name: name || 'Asset',
			previewType: previewType || guessPreviewType(href),
			url: href,
			content: null,
			error: execError,
			toolSummary: summary
		});
	};

	const addContent = (content: unknown, name: string, suffix: string, previewType?: string) => {
		const text = asString(content);
		if (!text) return;
		out.push({
			id: previewItemId(cell, suffix),
			name: name || 'Asset',
			previewType: previewType || 'file',
			url: null,
			content: text,
			error: execError,
			toolSummary: summary
		});
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
			const name = asString(payload.name) || asString(payload.target) || 'Preview';
			const url = typeof payload.url === 'string' ? payload.url : null;
			const content = typeof payload.content === 'string' ? payload.content : null;
			const error = (typeof payload.error === 'string' && payload.error) || execError || null;
			if (url || content || error) {
				out.push({ id, name, previewType, url, content, error, toolSummary: summary });
			}
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
			addUrl(payload.screenshotUrl, asString(payload.name) || 'Dashboard', 'screenshot', 'image');
			break;
		case 'appCell':
			addUrl(payload.screenshotUrl, asString(payload.name) || 'Data app', 'screenshot', 'image');
			break;
		case 'pyCell':
			addImageRefs(payload.images, 'img');
			records(payload.charts).forEach((chart, i) => {
				const url = asString(chart.pngUrl) || asString(chart.url);
				if (!url) return;
				addUrl(url, asString(chart.title) || `Chart ${i + 1}`, `chart-${i}`, 'chart');
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
					addUrl(`data:image/png;base64,${b64}`, `Chart ${i + 1}`, `msg-img-${i}`, 'image');
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

type PanelState = {
	open: boolean;
	selectedId: string | null;
	/** Citation to highlight in the citations tab, set by an inline marker click. */
	citationKey: string | null;
	/** Every citation in the chat, in transcript order. */
	citations: CitationView[];
	/** The chat's cells, for the timeline tab. */
	insightCells: CellLike[];
	/** Everything the picker can open: the chat's assets. */
	catalog: PreviewItem[];
	/** Open tabs (Cursor-style); accumulate on open, remove on close. */
	tabs: PreviewItem[];
	width: number;
	/** True while the user is dragging the resize handle. */
	resizing: boolean;
};

class PreviewPanelState extends Store<PanelState> {
	constructor() {
		super({
			open: false,
			selectedId: null,
			citationKey: null,
			citations: [],
			insightCells: [],
			catalog: [],
			tabs: [],
			width: loadWidth(),
			resizing: false
		});
	}

	get open() {
		return this.state.open;
	}
	get selectedId() {
		return this.state.selectedId;
	}
	get tabs() {
		return this.state.tabs;
	}
	get width() {
		return this.state.width;
	}
	get resizing() {
		return this.state.resizing;
	}
	get citations() {
		return this.state.citations;
	}

	get selected(): PreviewItem | null {
		const { tabs, selectedId } = this.state;
		return tabs.find((tab) => tab.id === selectedId) ?? tabs[0] ?? null;
	}

	setResizing(value: boolean) {
		this.set({ resizing: value });
	}

	/** Refresh content of already-open tabs from latest chat cells. */
	syncFromCells(items: PreviewItem[]) {
		const tabs = this.state.tabs;
		if (tabs.length === 0) return;
		const byId = new Map(items.map((item) => [item.id, item]));
		let changed = false;
		const next = tabs.map((tab) => {
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
		if (changed) this.set({ tabs: next });
	}

	openItem(item: PreviewItem) {
		const tabs = this.state.tabs;
		const idx = tabs.findIndex((tab) => tab.id === item.id);
		let next: PreviewItem[];
		if (idx >= 0) {
			next = [...tabs];
			next[idx] = item;
		} else {
			next = [...tabs, item];
		}
		this.set({ tabs: next, selectedId: item.id, open: true });
	}

	/**
	 * Open the panel for assets that are not already tabs. A closed panel stays
	 * closed until something new arrives; the newest of those is selected.
	 */
	openNewItems(items: PreviewItem[]) {
		const known = new Set(this.state.tabs.map((tab) => tab.id));
		const fresh = items.filter((item) => !known.has(item.id));
		if (fresh.length === 0) {
			this.syncFromCells(items);
			return;
		}
		this.openPanel(items);
		const latest = fresh[fresh.length - 1];
		if (latest) this.select(latest.id);
	}

	/**
	 * Open the panel with the chat's assets as tabs.
	 * Keeps existing tab order, refreshes content, and appends any new assets.
	 */
	openPanel(items: PreviewItem[] = []) {
		if (items.length === 0) {
			this.set({ open: true });
			return;
		}

		const freshById = new Map(items.map((item) => [item.id, item]));
		const merged: PreviewItem[] = [];
		const seen = new Set<string>();

		for (const tab of this.state.tabs) {
			merged.push(freshById.get(tab.id) ?? tab);
			seen.add(tab.id);
		}
		for (const item of items) {
			if (seen.has(item.id)) continue;
			merged.push(item);
			seen.add(item.id);
		}

		const selectedId =
			!this.state.selectedId || !seen.has(this.state.selectedId)
				? (merged[0]?.id ?? null)
				: this.state.selectedId;

		this.set({ tabs: merged, selectedId, open: true });
	}

	select(id: string) {
		if (!this.state.tabs.some((tab) => tab.id === id)) return;
		const citationKey = id === this.state.selectedId ? this.state.citationKey : null;
		this.set({ selectedId: id, citationKey, open: true });
	}

	/** Open the citations tab, scrolled to the citation whose marker was clicked. */
	openCitations(key: string | null) {
		this.openItem(INSIGHT_ITEMS.citations);
		this.set({ citationKey: key });
	}

	/**
	 * What the insight tabs read. Called from the transcript on the same
	 * debounce as the asset walk, so an open tab follows a streaming answer.
	 */
	setInsights(input: { citations: CitationView[]; cells: CellLike[]; catalog: PreviewItem[] }) {
		this.set({
			citations: input.citations,
			insightCells: input.cells,
			catalog: input.catalog
		});
	}

	closeTab(id: string) {
		const tabs = this.state.tabs;
		const idx = tabs.findIndex((tab) => tab.id === id);
		if (idx < 0) return;

		const next = tabs.filter((tab) => tab.id !== id);

		if (next.length === 0) {
			this.set({ tabs: next, selectedId: null, open: false });
			return;
		}

		if (this.state.selectedId === id) {
			const neighbor = next[Math.min(idx, next.length - 1)];
			this.set({ tabs: next, selectedId: neighbor?.id ?? null });
			return;
		}

		this.set({ tabs: next });
	}

	close() {
		this.set({ open: false });
	}

	reset() {
		this.set({
			open: false,
			selectedId: null,
			citationKey: null,
			citations: [],
			insightCells: [],
			catalog: [],
			tabs: []
		});
	}

	setWidth(value: number) {
		const next = clampPreviewWidth(value);
		if (next === this.state.width) return;
		this.set({ width: next });
	}

	commitWidth() {
		storageSet(WIDTH_KEY, String(this.state.width));
	}
}

export const previewPanel = new PreviewPanelState();

export function usePreviewPanel(): PanelState {
	return useStore(previewPanel);
}

/**
 * Just the two fields the transcript reads. `setWidth` fires once per frame
 * while the resize handle is dragged, and every subscriber to the whole state
 * re-renders with it.
 */
export function usePreviewSelection(): { open: boolean; selectedId: string | null } {
	const open = useSyncExternalStore(previewPanel.subscribe, () => previewPanel.open);
	const selectedId = useSyncExternalStore(previewPanel.subscribe, () => previewPanel.selectedId);
	return { open, selectedId };
}

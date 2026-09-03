import { ExternalLink, PanelRightClose, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { titleCase } from '../lib/cells';
import { withChartFitShim } from '../lib/chartFitShim';
import { CELL_BODY, CELL_CODE, CELL_LABEL, CELL_META } from '../lib/cellText';
import { cx } from '../lib/cx';
import {
	clampPreviewWidth,
	guessPreviewType,
	INSIGHT_TYPES,
	isInsightType,
	previewPanel,
	usePreviewPanel,
	type PreviewItem
} from '../lib/previewPanel';
import { PREVIEW_PROXY_PATH, toEmbeddablePreviewUrl } from '../lib/previewUrl';
import { CellError } from './CellShell';
import { CitationList } from './CitationList';
import { PreviewPicker } from './PreviewPicker';
import { TimelinePanel } from './TimelinePanel';
import { Markdown } from './Markdown';
import { PierreCode } from './PierreCode';

/** Chart-ish embeds we want to force-fit (not interactive data-apps). */
const CHART_TYPES = new Set(['chart', 'echarts', 'plotly', 'vega', 'visualization']);

/** Charts / HTML / echarts — always iframe, never navigate or download. */
const HTML_EMBED_TYPES = new Set([
	'html',
	'chart',
	'echarts',
	'plotly',
	'vega',
	'visualization',
	'iframe',
	'app'
]);
const TABLE_TYPES = new Set(['table', 'dataframe', 'csv']);

const CHART_W_DEFAULT = 1100;
const CHART_H_DEFAULT = 720;
const CSV_ROW_CAP = 500;

const FRAME = 'w-full rounded-[8px] border border-line bg-elevate';
const CELL =
	'w-[1%] max-w-[260px] overflow-hidden px-3 py-[7px] text-left text-ellipsis whitespace-nowrap';
/** A data column: content-width, with the product's 96px floor. */
const DATA_CELL = `${CELL} min-w-[96px]`;
/** Muted, sticky row-number gutter. */
const ROWNUM =
	'sticky left-0 w-[1%] max-w-none border-r border-line/55 bg-fill text-right tabular-nums text-muted select-none';
/** Soaks up the width the data doesn't need, as the product's DataTable does:
 *  without it a two-column CSV strands its numbers against the far edge. */
const SPACER = 'w-full p-0';
const EMPTY = cx(CELL_BODY, 'm-0 text-[#a1a1aa]');

/** Trust a recognized declared type; otherwise sniff the URL extension. */
function previewKind(preview: PreviewItem): string {
	const t = preview.previewType.toLowerCase();
	if (t === 'image' || t === 'pdf' || HTML_EMBED_TYPES.has(t) || TABLE_TYPES.has(t)) {
		return t;
	}
	return guessPreviewType(preview.url ?? '', t || 'file');
}

const isImage = (preview: PreviewItem) => previewKind(preview) === 'image';
const isHtmlEmbed = (preview: PreviewItem) => HTML_EMBED_TYPES.has(previewKind(preview));
const isPdf = (preview: PreviewItem) => previewKind(preview) === 'pdf';
const isTable = (preview: PreviewItem) => TABLE_TYPES.has(previewKind(preview));

/** Minimal, quote-aware CSV/TSV parser → rows of cells. */
function parseCsv(text: string): string[][] {
	const firstLine = text.slice(0, text.indexOf('\n') + 1 || text.length);
	const delim = firstLine.split('\t').length > firstLine.split(',').length ? '\t' : ',';
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"' && text[i + 1] === '"') {
				field += '"';
				i++;
			} else if (c === '"') quoted = false;
			else field += c;
		} else if (c === '"') quoted = true;
		else if (c === delim) {
			row.push(field);
			field = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else field += c;
	}
	if (field !== '' || row.length) {
		row.push(field);
		rows.push(row);
	}
	return rows.filter((r) => r.length > 1 || (r[0] ?? '') !== '');
}

const NUM_RE = /^-?[$€£]?\s?[\d,]+(\.\d+)?%?$/;
const isNum = (v: string) => NUM_RE.test((v ?? '').trim());

/** A column is numeric if every non-empty cell (in the shown rows) is a
 *  number — used to right-align the whole column, header included. */
function numericColumns(rows: string[][]): boolean[] {
	const header = rows[0] ?? [];
	const last = Math.min(rows.length, CSV_ROW_CAP + 1);
	return header.map((_, col) => {
		let seen = 0;
		for (let r = 1; r < last; r++) {
			const v = (rows[r]?.[col] ?? '').trim();
			if (!v) continue;
			seen++;
			if (!isNum(v)) return false;
		}
		return seen > 0;
	});
}

function CsvTable({ rows, raw }: { rows: string[][]; raw: string }) {
	if (rows.length === 0 || (rows[0]?.length ?? 0) <= 1) {
		return <pre className={cx(CELL_CODE, 'm-0 overflow-auto rounded-[8px] border border-line bg-elevate px-3 py-2.5 whitespace-pre')}>
				{raw}
			</pre>;
	}
	const numCols = numericColumns(rows);
	return (
		<>
			<div className="max-h-full overflow-auto rounded-sm border border-line bg-elevate">
				<table className={cx(CELL_BODY, 'w-full border-separate border-spacing-0 text-text-strong')}>
					<thead>
						<tr>
							<th className={cx(CELL, ROWNUM, 'z-2 border-b border-line')}></th>
							{rows[0]!.map((h, i) => (
								<th
									key={i}
									className={cx(
										DATA_CELL,
										CELL_LABEL,
										'sticky top-0 z-1 border-b border-line bg-fill text-muted',
										numCols[i] && 'text-right'
									)}
									title={h}
								>
									{h}
								</th>
							))}
							<th aria-hidden="true" className={cx(SPACER, 'sticky top-0 z-1 border-b border-line bg-fill')} />
						</tr>
					</thead>
					<tbody className="[&_tr:last-child_td]:border-b-0">
						{rows.slice(1, CSV_ROW_CAP + 1).map((r, i) => (
							<tr key={i} className="group/csv">
								<td className={cx(CELL, ROWNUM, 'border-b border-line/55')}>{i + 1}</td>
								{r.map((c, ci) => (
									<td
										key={ci}
										className={cx(
											DATA_CELL,
											'border-b border-line/55 group-hover/csv:bg-ink/3',
											numCols[ci] && 'text-right tabular-nums'
										)}
										title={c}
									>
										{c}
									</td>
								))}
								<td
									aria-hidden="true"
									className={cx(SPACER, 'border-b border-line/55 group-hover/csv:bg-ink/3')}
								/>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{rows.length - 1 > CSV_ROW_CAP && (
				<p className={cx(CELL_META, 'mx-0.5 mt-2 text-muted')}>
					Showing first {CSV_ROW_CAP} of {rows.length - 1} rows
				</p>
			)}
		</>
	);
}

/** Fetch-and-render for a CSV that lives behind a URL. */
function RemoteCsv({ url, title }: { url: string; title: string }) {
	const [text, setText] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setText(null);
		setFailed(false);
		fetch(url)
			.then((r) => r.text())
			.then((body) => {
				if (!cancelled) setText(body);
			})
			.catch(() => {
				if (!cancelled) setFailed(true);
			});
		return () => {
			cancelled = true;
		};
	}, [url]);

	if (failed) {
		return (
			<iframe
				className={cx(FRAME, 'h-[min(70vh,640px)]')}
				src={url}
				title={title}
				sandbox="allow-scripts"
				referrerPolicy="no-referrer"
			/>
		);
	}
	if (text === null) return <p className={EMPTY}>Loading…</p>;
	return <CsvTable rows={parseCsv(text)} raw={text} />;
}

export function PreviewPanel() {
	const panel = usePreviewPanel();
	const item = previewPanel.selected;
	const tabs = panel.tabs;
	const panelRef = useRef<HTMLElement | null>(null);

	const rawEmbedUrl = toEmbeddablePreviewUrl(item?.url);
	const isChart = item ? CHART_TYPES.has(previewKind(item)) : false;
	// For proxied chart URLs, ask the proxy to inject the fit shim.
	const embedUrl =
		isChart && rawEmbedUrl?.startsWith(PREVIEW_PROXY_PATH)
			? `${rawEmbedUrl}&fit=chart`
			: rawEmbedUrl;

	// Natural size comes back from the injected shim; the fit width is measured.
	const [chartFitW, setChartFitW] = useState(0);
	const [chartNatW, setChartNatW] = useState(CHART_W_DEFAULT);
	const [chartNatH, setChartNatH] = useState(CHART_H_DEFAULT);
	const chartScale = chartFitW > 0 ? Math.min(1, chartFitW / chartNatW) : 1;
	const chartFitRef = useRef<HTMLDivElement | null>(null);

	// Reset to defaults when the shown item changes; the iframe re-reports.
	useEffect(() => {
		setChartNatW(CHART_W_DEFAULT);
		setChartNatH(CHART_H_DEFAULT);
	}, [item?.id]);

	// Receive the natural chart size from the injected shim.
	useEffect(() => {
		function onMessage(event: MessageEvent) {
			const d = event.data;
			if (d && typeof d === 'object' && d.__chartFit && d.w > 0 && d.h > 0) {
				setChartNatW(d.w);
				setChartNatH(d.h);
			}
		}
		window.addEventListener('message', onMessage);
		return () => window.removeEventListener('message', onMessage);
	}, []);

	// Track the chart wrapper's width (Svelte's `bind:clientWidth`).
	useEffect(() => {
		const el = chartFitRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => setChartFitW(el.clientWidth));
		ro.observe(el);
		setChartFitW(el.clientWidth);
		return () => ro.disconnect();
	}, [isChart, item?.id]);

	function shouldIframe(preview: PreviewItem): boolean {
		if (!embedUrl) return false;
		if (isImage(preview) || isTable(preview)) return false;
		if (isHtmlEmbed(preview) || isPdf(preview)) return true;
		// Unknown typed URL on the preview proxy — embed rather than <a download>.
		return Boolean(embedUrl.startsWith('/asset/') || embedUrl.startsWith(PREVIEW_PROXY_PATH));
	}

	function onResizePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
		if (event.button !== 0) return;
		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		previewPanel.setResizing(true);

		const workspace = panelRef.current?.closest('.workspace') as HTMLElement | null;

		const startX = event.clientX;
		const startW = previewPanel.width;
		let latestX = startX;
		let latestW = startW;
		let raf = 0;

		const flush = () => {
			raf = 0;
			latestW = clampPreviewWidth(startW + (startX - latestX));
			// Direct CSS var — skip React state until pointerup
			workspace?.style.setProperty('--preview-panel-width', `${latestW}px`);
		};

		const onMove = (ev: PointerEvent) => {
			latestX = ev.clientX;
			if (!raf) raf = requestAnimationFrame(flush);
		};

		const onUp = () => {
			if (raf) cancelAnimationFrame(raf);
			flush();
			previewPanel.setWidth(latestW);
			previewPanel.commitWidth();
			previewPanel.setResizing(false);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			document.body.style.removeProperty('cursor');
			document.body.style.removeProperty('user-select');
		};

		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
	}

	function onTabClose(event: React.MouseEvent, id: string) {
		event.stopPropagation();
		event.preventDefault();
		previewPanel.closeTab(id);
	}

	function renderBody() {
		if (!item) return <p className={EMPTY}>No preview selected.</p>;
		if (item.error) return <CellError message={item.error} />;
		// Insight tabs read the chat off the store: they are views onto the whole
		// conversation, not a file the item could carry.
		if (item.previewType === INSIGHT_TYPES.citations) {
			if (panel.citations.length === 0) {
				return <p className={EMPTY}>No citations in this chat yet.</p>;
			}
			return <CitationList citations={panel.citations} selectedKey={panel.citationKey} />;
		}
		if (item.previewType === INSIGHT_TYPES.timeline) {
			return <TimelinePanel cells={panel.insightCells} />;
		}
		if (isImage(item) && embedUrl) {
			return <img className={cx(FRAME, 'block h-auto')} src={embedUrl} alt={item.name} />;
		}
		if (isChart && (embedUrl || item.content)) {
			return (
				<div
					className="relative w-full overflow-hidden rounded-[8px] border border-line bg-elevate"
					ref={chartFitRef}
					style={{ height: `${Math.round(chartNatH * chartScale)}px` }}
				>
					<iframe
						className="block origin-top-left border-0 bg-elevate"
						title={item.name}
						sandbox="allow-scripts"
						referrerPolicy="no-referrer"
						src={embedUrl ?? undefined}
						srcDoc={!embedUrl && item.content ? withChartFitShim(item.content) : undefined}
						style={{
							width: `${chartNatW}px`,
							height: `${chartNatH}px`,
							transform: `scale(${chartScale})`
						}}
					/>
				</div>
			);
		}
		if (shouldIframe(item) && embedUrl) {
			return (
				<iframe
					className={cx(FRAME, 'h-[min(70vh,640px)]')}
					src={embedUrl}
					title={item.name}
					sandbox="allow-scripts"
					referrerPolicy="no-referrer"
				/>
			);
		}
		if (isHtmlEmbed(item) && item.content) {
			return (
				<iframe
					className={cx(FRAME, 'h-[min(70vh,640px)]')}
					title={item.name}
					sandbox="allow-scripts"
					srcDoc={item.content}
				/>
			);
		}
		if (isTable(item) && item.content) {
			return <CsvTable rows={parseCsv(item.content)} raw={item.content} />;
		}
		if (isTable(item) && embedUrl) {
			return <RemoteCsv url={embedUrl} title={item.name} />;
		}
		if (item.content) {
			if (item.previewType === 'markdown' || item.previewType === 'md') {
				return (
					<div className="px-0.5 py-1">
						<Markdown content={item.content} />
					</div>
				);
			}
			return <PierreCode fileName={item.name || 'preview.txt'} contents={item.content} />;
		}
		return <p className={EMPTY}>Nothing to preview yet.</p>;
	}

	return (
		// `preview-panel` stays unhashed so ChatPage can size it via :global().
		<aside
			ref={panelRef}
			className={cx(
				'preview-panel relative flex min-h-0 min-w-0 flex-col border-l border-line/85 bg-fill',
				panel.resizing ? 'animate-none select-none' : 'animate-preview-in'
			)}
			aria-label="Preview panel"
		>
			<button
				type="button"
				className={cx(
					'absolute top-0 left-[-4px] z-4 h-full w-2 touch-none cursor-col-resize border-0 p-0',
					panel.resizing ? 'bg-ink/14' : 'bg-transparent hover:bg-ink/14'
				)}
				aria-label="Resize preview panel"
				onPointerDown={onResizePointerDown}
			/>

			<header className="flex min-h-9 items-stretch gap-1 border-b border-line/80 bg-elevate pr-1.5">
				<div className="flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:thin]" role="tablist" aria-label="Open previews">
					{tabs.map((tab) => (
						<div
							key={tab.id}
							className={cx(
								'group/tab inline-flex max-w-[200px] min-w-[88px] shrink-0 items-stretch border-r border-line/70',
								tab.id === item?.id
									? 'bg-fill text-ink shadow-[inset_0_-1px_0_var(--color-ink)]'
									: 'bg-transparent text-[#71717a] hover:bg-ink/3 hover:text-text-3'
							)}
							role="presentation"
						>
							<button
								type="button"
								className="inline-flex min-w-0 flex-1 cursor-pointer items-center gap-[5px] border-0 bg-transparent pr-0.5 pl-2.5 text-inherit"
								role="tab"
								aria-selected={tab.id === item?.id}
								title={tab.name}
								onClick={() => previewPanel.select(tab.id)}
							>
								<span className={cx(CELL_BODY, 'min-w-0 flex-1 overflow-hidden font-[550] text-ellipsis whitespace-nowrap')}>{tab.name}</span>
								{/* The kind, for files. An insight tab's name already says it. */}
								<span
									className={cx(
										CELL_LABEL,
										'text-[#a1a1aa]',
										tab.id === item?.id && !isInsightType(tab.previewType) ? 'inline' : 'hidden'
									)}
								>
									{titleCase(tab.previewType) || 'File'}
								</span>
							</button>
							<button
								type="button"
								className={cx(
									'mr-1 inline-flex size-[18px] shrink-0 cursor-pointer items-center justify-center self-center rounded-[4px] border-0 bg-transparent p-0 text-[#a1a1aa] hover:bg-ink/8 hover:text-ink group-hover/tab:opacity-100 focus-visible:opacity-100',
									tab.id === item?.id ? 'opacity-100' : 'opacity-0'
								)}
								aria-label={`Close ${tab.name}`}
								onClick={(e) => onTabClose(e, tab.id)}
							>
								<X size={12} />
							</button>
						</div>
					))}
				</div>

				<PreviewPicker catalog={panel.catalog} citationCount={panel.citations.length} />

				<button
					type="button"
					className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center self-center rounded-[7px] border-0 bg-transparent text-[#71717a] hover:bg-ink/5 hover:text-ink"
					aria-label="Close preview panel"
					onClick={() => previewPanel.close()}
				>
					<PanelRightClose size={16} />
				</button>
			</header>

			{item?.toolSummary && <p className={cx(CELL_META, 'm-0 border-b border-line/70 px-3.5 py-2 text-[#71717a]')}>{item.toolSummary}</p>}

			{/* Avoid iframe/layout thrash while dragging the splitter. */}
			<div
				className={cx(
					'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3',
					panel.resizing &&
						'pointer-events-none [contain:strict] [&_iframe]:pointer-events-none [&_img]:pointer-events-none'
				)}
			>
				{renderBody()}
			</div>

			{item?.url && (
				<footer className="border-t border-line/80 bg-elevate px-3.5 py-2.5">
					<a
						className={cx(CELL_BODY, 'inline-flex items-center gap-1.5 font-medium text-[#2563eb] no-underline hover:underline')}
						href={embedUrl ?? item.url}
						target="_blank"
						rel="noreferrer noopener"
					>
						Open in new tab
						<ExternalLink size={12} />
					</a>
				</footer>
			)}
		</aside>
	);
}

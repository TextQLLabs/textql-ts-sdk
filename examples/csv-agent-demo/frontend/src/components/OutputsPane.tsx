import { ChartColumn, ExternalLink, FileText, Paperclip, Sparkles, Table2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { UnicodeSpinner } from '@ui/components/UnicodeSpinner';
import { cx } from '@ui/lib/cx';
import { previewPanel, type PreviewItem } from '@ui/lib/previewPanel';
import { toEmbeddablePreviewUrl } from '@ui/lib/previewUrl';

import { fetchOutputText } from '../lib/api';
import { parseCsv, type Sheet } from '../lib/csv';
import { IMAGE_TYPES, type Outputs } from '../lib/outputs';
import { Spreadsheet } from './Spreadsheet';

const INPUT_TAB = 'input';
const CHARTS_TAB = 'charts';
const FILES_TAB = 'files';

/** Parsed output tables, so flipping between tabs does not refetch; kept small. */
const CACHE_SIZE = 4;
const sheetCache = new Map<string, Sheet>();

function remember(key: string, sheet: Sheet) {
	sheetCache.delete(key);
	sheetCache.set(key, sheet);
	if (sheetCache.size > CACHE_SIZE) sheetCache.delete(sheetCache.keys().next().value!);
}

function useRemoteSheet(item: PreviewItem) {
	const key = `${item.id}:${item.url ?? ''}`;
	const [state, setState] = useState<{ sheet: Sheet | null; error: string | null }>({
		sheet: null,
		error: null
	});

	useEffect(() => {
		const cached = sheetCache.get(key);
		if (cached) {
			remember(key, cached);
			setState({ sheet: cached, error: null });
			return;
		}
		setState({ sheet: null, error: null });
		const abort = new AbortController();
		const text = item.content
			? Promise.resolve(item.content)
			: item.url
				? fetchOutputText(item.url, abort.signal)
				: Promise.reject(new Error('This file has no content.'));
		text
			.then((value) => {
				const sheet = parseCsv(value);
				remember(key, sheet);
				if (!abort.signal.aborted) setState({ sheet, error: null });
			})
			.catch((err: unknown) => {
				if (!abort.signal.aborted)
					setState({ sheet: null, error: err instanceof Error ? err.message : String(err) });
			});
		return () => abort.abort();
		// The key already covers the item's identity and source.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);
	return state;
}

function SheetState({ error, label }: { error: string | null; label: string }) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
			{error ? (
				<p className="m-0 max-w-[380px] text-[13px] text-danger">{error}</p>
			) : (
				<>
					<UnicodeSpinner label={label} />
					<p className="m-0 text-[12.5px] text-muted">{label}…</p>
				</>
			)}
		</div>
	);
}

const OUTPUT_BADGE = (
	<span className="mr-1 inline-flex h-7 items-center gap-1 rounded-sm bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] px-2 text-[11.5px] font-medium text-accent">
		<Sparkles size={12} />
		Agent output
	</span>
);

function TableTab({ item }: { item: PreviewItem }) {
	const { sheet, error } = useRemoteSheet(item);
	if (!sheet) return <SheetState error={error} label="Loading table" />;
	return <Spreadsheet key={sheet.id} sheet={sheet} name={item.name} badge={OUTPUT_BADGE} />;
}

function ChartCard({ item }: { item: PreviewItem }) {
	const src = toEmbeddablePreviewUrl(item.url) ?? '';
	const isHtml = !IMAGE_TYPES.has(item.previewType);
	return (
		<figure className="m-0 flex min-w-0 flex-col overflow-hidden rounded-md border border-line bg-elevate">
			<figcaption className="flex items-center gap-2 border-b border-line/70 px-3 py-2">
				<ChartColumn size={13} className="shrink-0 text-accent" />
				<span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-text-strong">{item.name}</span>
				{item.url && (
					<a
						href={src}
						target="_blank"
						rel="noreferrer"
						aria-label="Open chart in a new tab"
						className="inline-flex size-6 items-center justify-center rounded-xs text-muted hover:bg-fill hover:text-ink"
					>
						<ExternalLink size={12} />
					</a>
				)}
			</figcaption>
			<div className="flex aspect-[4/3] items-center justify-center bg-white p-2">
				{isHtml ? (
					<iframe title={item.name} src={src} className="h-full w-full border-0" sandbox="allow-scripts" />
				) : (
					<img src={src} alt={item.name} className="max-h-full max-w-full object-contain" />
				)}
			</div>
		</figure>
	);
}

function Empty({ text }: { text: string }) {
	return (
		<div className="flex h-full items-center justify-center px-6">
			<p className="m-0 text-[13px] text-muted">{text}</p>
		</div>
	);
}

type Props = {
	outputs: Outputs;
	fileName: string;
	input: Sheet | null;
	inputError: string | null;
	chatId: string | null;
	live: boolean;
};

export function OutputsPane({ outputs, fileName, input, inputError, chatId, live }: Props) {
	const [tab, setTab] = useState(INPUT_TAB);
	const seen = useRef<Set<string>>(new Set());

	// A new table arriving mid-run takes focus; reopening a run lands on the input.
	useEffect(() => {
		const fresh = outputs.tables.filter((t) => !seen.current.has(t.id));
		for (const t of outputs.tables) seen.current.add(t.id);
		if (live && fresh.length > 0) setTab(fresh[fresh.length - 1]!.id);
	}, [live, outputs.tables]);

	useEffect(() => {
		seen.current = new Set();
		setTab(INPUT_TAB);
	}, [chatId]);

	// Clicking an asset step in the activity feed opens it here.
	const selectedId = useSyncExternalStore(previewPanel.subscribe, () => previewPanel.selectedId);
	useEffect(() => {
		if (!selectedId) return;
		if (outputs.tables.some((t) => t.id === selectedId)) setTab(selectedId);
		else if (outputs.charts.some((c) => c.id === selectedId)) setTab(CHARTS_TAB);
	}, [selectedId, outputs]);

	const tabs = useMemo(
		() => [
			{ id: INPUT_TAB, label: fileName || 'Input', icon: FileText, hint: 'Input' },
			{ id: CHARTS_TAB, label: 'Charts', icon: ChartColumn, hint: String(outputs.charts.length) },
			...outputs.tables.map((t) => ({ id: t.id, label: t.name, icon: Table2, hint: '' })),
			...(outputs.files.length
				? [{ id: FILES_TAB, label: 'Files', icon: Paperclip, hint: String(outputs.files.length) }]
				: [])
		],
		[fileName, outputs]
	);
	const active = tabs.some((t) => t.id === tab) ? tab : INPUT_TAB;
	const table = outputs.tables.find((t) => t.id === active);

	return (
		<section className="flex h-full min-h-0 min-w-0 flex-col bg-paper" aria-label="Outputs">
			<div className="flex h-10 shrink-0 items-end gap-0.5 overflow-x-auto border-b border-line/80 px-2">
				{tabs.map((t, i) => {
					const Icon = t.icon;
					const on = t.id === active;
					return (
						<button
							key={t.id}
							type="button"
							onClick={() => setTab(t.id)}
							className={cx(
								'relative inline-flex h-8 max-w-[240px] shrink-0 cursor-pointer items-center gap-1.5 rounded-t-[8px] border-0 px-3 text-[12px] transition-[background,color]',
								on
									? 'bg-elevate font-medium text-ink shadow-[inset_0_1px_0_var(--color-line),inset_1px_0_0_var(--color-line),inset_-1px_0_0_var(--color-line)]'
									: 'bg-transparent text-text-3 hover:bg-elevate/60 hover:text-ink',
								i === 2 && 'ml-2'
							)}
						>
							<Icon size={13} className={cx('shrink-0', on ? 'text-accent' : 'text-muted')} />
							<span className="truncate">{t.label}</span>
							{t.hint && (
								<span className="rounded-[5px] bg-fill px-1 font-mono text-[10px] text-muted">{t.hint}</span>
							)}
							{on && <span className="absolute inset-x-0 -bottom-px h-px bg-elevate" />}
						</button>
					);
				})}
				{live && (
					<span className="ml-auto flex shrink-0 items-center gap-1.5 self-center px-2 text-[11.5px] text-muted">
						<UnicodeSpinner label="Agent working" />
						outputs appear as the agent writes them
					</span>
				)}
			</div>

			<div className="min-h-0 flex-1">
				{active === INPUT_TAB ? (
					input ? (
						<Spreadsheet key={input.id} sheet={input} name={fileName} />
					) : (
						<SheetState error={inputError} label="Reading file" />
					)
				) : table ? (
					<TableTab key={table.id} item={table} />
				) : active === CHARTS_TAB ? (
					outputs.charts.length === 0 ? (
						<Empty text={live ? 'Charts will appear here as the agent draws them.' : 'This run produced no charts.'} />
					) : (
						<div className="h-full overflow-y-auto p-4">
							<div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
								{outputs.charts.map((c) => (
									<ChartCard key={c.id} item={c} />
								))}
							</div>
						</div>
					)
				) : (
					<div className="flex flex-col gap-1 p-4">
						{outputs.files.map((f) => (
							<a
								key={f.id}
								href={toEmbeddablePreviewUrl(f.url) ?? '#'}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-2 rounded-sm px-3 py-2 text-[13px] text-text-2 no-underline hover:bg-elevate"
							>
								<Paperclip size={13} className="text-muted" />
								{f.name}
								<ExternalLink size={12} className="ml-auto text-muted" />
							</a>
						))}
					</div>
				)}
			</div>
		</section>
	);
}

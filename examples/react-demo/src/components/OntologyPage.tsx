import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { cx } from '../lib/cx';
import { initPierreIcons } from '../lib/pierreIcons';
import { isTqlName, resolveImport } from '../lib/tqlParse';
import { usePageTitle } from '../lib/usePageTitle';
import { isRecord } from '../lib/utils';
import { Page } from '../primitives';
import { Markdown } from './Markdown';
import { OntologyTreeNode, type Entry } from './OntologyTreeNode';
import { PierreCode } from './PierreCode';
import { TqlPreview } from './TqlPreview';
import { UnicodeSpinner } from './UnicodeSpinner';

type OpenFile = { path: string; name: string; content: string };

const HINT = 'p-[0.6rem] text-[12.5px] text-muted';

const LANGS: Record<string, string> = {
	py: 'python',
	sql: 'sql',
	yaml: 'yaml',
	yml: 'yaml',
	json: 'json',
	ts: 'typescript',
	js: 'javascript',
	toml: 'toml',
	txt: 'text'
};

function extOf(name: string) {
	return name.split('.').pop()?.toLowerCase() ?? '';
}

// Minimal RFC-4180-ish CSV parse (quotes + escaped quotes), capped for perf.
function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cur = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					cur += '"';
					i++;
				} else quoted = false;
			} else cur += c;
		} else if (c === '"') quoted = true;
		else if (c === ',') {
			row.push(cur);
			cur = '';
		} else if (c === '\n') {
			row.push(cur);
			rows.push(row);
			row = [];
			cur = '';
			if (rows.length >= 1000) break; // safety cap
		} else if (c !== '\r') cur += c;
	}
	if (cur !== '' || row.length) {
		row.push(cur);
		rows.push(row);
	}
	return rows;
}

export function OntologyPage() {
	usePageTitle('Ontology');
	const [searchParams, setSearchParams] = useSearchParams();

	const [roots, setRoots] = useState<Entry[]>([]);
	const [listing, setListing] = useState(false);
	const [listError, setListError] = useState<string | undefined>();

	const [file, setFile] = useState<OpenFile | undefined>();
	const [fileLoading, setFileLoading] = useState(false);
	const [fileError, setFileError] = useState<string | undefined>();
	const [revealPath, setRevealPath] = useState<string | undefined>();

	// Pick a viewer per native format.
	const kind: 'md' | 'csv' | 'tql' | 'code' | null = (() => {
		if (!file) return null;
		const e = extOf(file.name);
		if (e === 'md' || e === 'markdown') return 'md';
		if (e === 'csv') return 'csv';
		if (isTqlName(file.name)) return 'tql';
		return 'code';
	})();
	const csvRows = kind === 'csv' && file ? parseCsv(file.content) : [];

	async function loadRoots() {
		setListing(true);
		setListError(undefined);
		try {
			const res = await fetch('/api/ontology');
			const body: unknown = await res.json();
			if (!res.ok || !isRecord(body) || !Array.isArray(body.entries)) {
				throw new Error(
					isRecord(body) && typeof body.error === 'string' ? body.error : 'Failed to load.'
				);
			}
			setRoots(body.entries as Entry[]);
		} catch (err) {
			setListError(err instanceof Error ? err.message : 'Failed to load the ontology.');
		} finally {
			setListing(false);
		}
	}

	const open = useCallback(async (path: string) => {
		setFileLoading(true);
		setFileError(undefined);
		setFile(undefined);
		try {
			const res = await fetch(`/api/ontology/file?path=${encodeURIComponent(path)}`);
			const body: unknown = await res.json();
			if (!res.ok || !isRecord(body) || typeof body.content !== 'string') {
				throw new Error(
					isRecord(body) && typeof body.error === 'string' ? body.error : 'Failed to read the file.'
				);
			}
			setFile({
				path,
				name: String(body.name ?? path.split('/').pop() ?? path),
				content: body.content
			});
		} catch (err) {
			setFileError(err instanceof Error ? err.message : 'Failed to read the file.');
		} finally {
			setFileLoading(false);
		}
	}, []);

	useEffect(() => {
		void initPierreIcons();
		void loadRoots();
		const deepLink = searchParams.get('file');
		if (deepLink) {
			setRevealPath(deepLink);
			void open(deepLink);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
	}, []);

	// Reflect the open file in the URL so it can be shared / reloaded.
	function selectFile(entry: Entry) {
		setSearchParams({ file: entry.path }, { replace: true });
		void open(entry.path);
	}

	// Open an ontology file by its full path (from a TQL import or a markdown
	// link), reflecting it in the URL so it stays shareable / reloadable.
	function openOntologyFile(path: string) {
		setSearchParams({ file: path }, { replace: true });
		setRevealPath(path);
		void open(path);
	}

	// Intercept relative links inside rendered markdown and open the target in
	// the viewer instead of doing a full-page navigation. External `scheme:`
	// links navigate normally, `#anchors` scroll in place, everything else
	// resolves relative to the file.
	function handleMarkdownClick(event: React.MouseEvent<HTMLDivElement>) {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const anchor = target.closest('a');
		if (!anchor) return;
		const href = anchor.getAttribute('href') ?? '';
		if (!href || /^[a-z][a-z0-9+\-.]*:/i.test(href)) return;
		event.preventDefault();

		if (href.startsWith('#')) {
			const id = decodeURIComponent(href.slice(1));
			const container = event.currentTarget;
			if (id) {
				container.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}
			return;
		}

		if (!file) return;
		// Strip any query/hash before resolving the file path.
		const cleanHref = href.split('#')[0]!.split('?')[0]!;
		const resolved = resolveImport(file.path, cleanHref);
		if (resolved) openOntologyFile(resolved);
	}

	return (
		<Page title="Ontology" lead="Browse ontology files." wide>
			<div className="grid min-h-0 flex-1 grid-cols-[minmax(240px,340px)_1fr] grid-rows-[minmax(0,1fr)] gap-4">
				<aside className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-line bg-ink/2.5">
					<header className="border-b border-line px-3 py-[0.6rem] text-[12px] font-semibold text-muted">Files</header>
					<div className="min-h-0 flex-1 overflow-y-auto p-[0.35rem]">
						{listing ? (
							<div className={HINT}>
								<UnicodeSpinner label="Loading ontology" />
							</div>
						) : listError ? (
							<p className={cx(HINT, "text-[#dc2626]")}>{listError}</p>
						) : roots.length === 0 ? (
							<p className={HINT}>Ontology is empty</p>
						) : (
							roots.map((entry) => (
								<OntologyTreeNode
									key={entry.path}
									entry={entry}
									selectedPath={file?.path}
									revealPath={revealPath}
									onSelect={selectFile}
								/>
							))
						)}
					</div>
				</aside>

				<section className="flex min-h-0 flex-col rounded-sm border border-line bg-ink/2.5 p-2">
					{fileLoading ? (
						<div className={HINT}>
							<UnicodeSpinner label="Loading file" />
						</div>
					) : fileError ? (
						<p className={cx(HINT, "text-[#dc2626]")}>{fileError}</p>
					) : file && kind === 'md' ? (
						// eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
						<div className="min-h-0 flex-1 overflow-auto px-3 py-2 text-[13px] leading-[1.55]" role="presentation" onClick={handleMarkdownClick}>
							<Markdown content={file.content} />
						</div>
					) : file && kind === 'csv' ? (
						<div className="min-h-0 max-w-full flex-1 overflow-auto">
							<table className="border-collapse font-mono text-[12px] [&_td]:border [&_td]:border-line [&_td]:px-2 [&_td]:py-1 [&_td]:text-left [&_td]:whitespace-nowrap [&_th]:sticky [&_th]:top-0 [&_th]:border [&_th]:border-line [&_th]:bg-[color-mix(in_srgb,var(--color-ink)_6%,var(--color-paper))] [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_th]:whitespace-nowrap">
								{csvRows.length > 0 && (
									<>
										<thead>
											<tr>
												{csvRows[0]!.map((cell, i) => (
													<th key={i}>{cell}</th>
												))}
											</tr>
										</thead>
										<tbody>
											{csvRows.slice(1).map((row, r) => (
												<tr key={r}>
													{row.map((cell, c) => (
														<td key={c}>{cell}</td>
													))}
												</tr>
											))}
										</tbody>
									</>
								)}
							</table>
						</div>
					) : file && kind === 'tql' ? (
						<div className="min-h-0 flex-1 overflow-auto px-1 py-2">
							<TqlPreview
								content={file.content}
								filePath={file.path}
								onNavigateToImport={openOntologyFile}
							/>
						</div>
					) : file ? (
						<PierreCode
							fileName={file.name}
							contents={file.content}
							lang={LANGS[extOf(file.name)]}
							fill
						/>
					) : (
						<p className={HINT}>Select a file to view it.</p>
					)}
				</section>
			</div>
		</Page>
	);
}

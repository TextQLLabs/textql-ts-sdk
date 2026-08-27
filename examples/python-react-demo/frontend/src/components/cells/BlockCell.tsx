import { ExternalLink } from 'lucide-react';

import { buildCellBlocks } from '../../lib/cellBlocks';
import { CELL_BODY, CELL_CODE, CELL_LABEL, CELL_META } from '../../lib/cellText';
import { cx } from '../../lib/cx';
import { guessPreviewType, previewItemsFromCell, previewPanel } from '../../lib/previewPanel';
import { toEmbeddablePreviewUrl } from '../../lib/previewUrl';
import { CellError } from '../CellShell';
import { Markdown } from '../Markdown';
import { PierreCode } from '../PierreCode';
import type { CellComponentProps } from './types';

// Pierre detects language from the filename extension.
const LANG_FILENAMES: Record<string, string> = {
	sql: 'query.sql',
	python: 'code.py',
	javascript: 'code.js',
	bash: 'script.sh',
	json: 'data.json',
	diff: 'changes.diff'
};

function codeFileName(lang: string): string {
	return LANG_FILENAMES[lang] ?? `code.${lang}`;
}

const BLOCK_LABEL = cx(CELL_LABEL, 'mt-0.5 mb-0 text-muted');
const LINK = cx(
	CELL_BODY,
	'inline-flex cursor-pointer items-center gap-[5px] self-start border-0 bg-transparent p-0 text-left font-medium text-[#2563eb] no-underline hover:underline hover:underline-offset-2'
);

/**
 * The default cell body: renders whatever blocks `cellBlocks` derived for the
 * type. Every cell without a dedicated component falls back to this, so a new
 * backend cell type shows something sensible before anyone writes UI for it.
 */
export function BlockCell({ cell }: CellComponentProps) {
	// buildCellBlocks owns the Time row: it only appends one once the cell finishes.
	const blocks = buildCellBlocks(cell);
	const cellAssets = previewItemsFromCell(cell);
	const cellKey = typeof cell.id === 'string' && cell.id ? cell.id : 'cell';

	/** Prefer the collected chat-asset identity so topbar / steps share tabs. */
	function openUrlAsset(url: string, name: string, suffix: string, previewType?: string) {
		const match = cellAssets.find((item) => item.url === url);
		if (match) {
			previewPanel.openItem(match);
			return;
		}
		previewPanel.openItem({
			id: `${cellKey}:${suffix}`,
			name,
			previewType: previewType ?? guessPreviewType(url),
			url,
			content: null,
			error: null,
			toolSummary: typeof cell.toolSummary === 'string' ? cell.toolSummary : null
		});
	}

	return (
		<>
			{blocks.map((block, i) => {
				if (block.kind === 'kv') {
					return (
						<dl
							className="m-0 grid grid-cols-[max-content_1fr] gap-x-[14px] gap-y-0.5"
							key={i}
						>
							{block.rows.map((row) => (
								<div key={row.label} className="contents">
									<dt className={cx(CELL_META, 'font-medium text-muted')}>{row.label}</dt>
									<dd className={cx(CELL_BODY, 'm-0 min-w-0 text-ink wrap-anywhere')}>{row.value}</dd>
								</div>
							))}
						</dl>
					);
				}

				if (block.kind === 'code') {
					return (
						<div key={i} className="contents">
							{block.label && <p className={BLOCK_LABEL}>{block.label}</p>}
							{block.lang ? (
								<PierreCode
									fileName={codeFileName(block.lang)}
									contents={block.text}
									lang={block.lang}
								/>
							) : (
								<pre className={cx(CELL_CODE, 'm-0 max-h-80 overflow-auto rounded-xs bg-ink/5 px-2.5 py-2 whitespace-pre')}>
									{block.text}
								</pre>
							)}
						</div>
					);
				}

				if (block.kind === 'md') {
					return (
						<div key={i} className="contents">
							{block.label && <p className={BLOCK_LABEL}>{block.label}</p>}
							{/* .md carries its own 14px root; Tailwind can't take a composed
							    class name, so this literal must track CELL_BODY. */}
							<div className={cx(CELL_BODY, '[&_.md]:text-[12.5px]')}>
								<Markdown content={block.text} />
							</div>
						</div>
					);
				}

				if (block.kind === 'text') {
					// An error block reads as the cell's error, not as a labelled field,
					// so it renders exactly like execError above.
					if (block.label === 'Error') return <CellError key={i} message={block.text} />;
					return (
						<div key={i} className="contents">
							{block.label && <p className={BLOCK_LABEL}>{block.label}</p>}
							<p className={cx(CELL_BODY, 'm-0 whitespace-pre-wrap text-text-strong wrap-anywhere')}>
								{block.text}
							</p>
						</div>
					);
				}

				if (block.kind === 'table') {
					return (
						<div key={i} className="contents">
							{block.label && <p className={BLOCK_LABEL}>{block.label}</p>}
							<div className="flex min-w-0 flex-col gap-1">
								{block.caption && (
									<p className="m-0 text-[11.5px] leading-[1.5] whitespace-pre-wrap text-muted">
										{block.caption}
									</p>
								)}
								<div className="max-h-80 overflow-auto rounded-xs border border-line">
									<table className="w-full border-collapse text-left font-mono text-[11.5px]">
										<thead>
											<tr>
												{block.columns.map((column, c) => (
													<th
														key={c}
														// Sticky so the header survives scrolling a long result;
														// it needs its own background to cover the rows beneath.
														className="sticky top-0 z-[1] border-b border-line bg-fill px-2 py-1 font-medium whitespace-nowrap text-muted"
													>
														{column}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{block.rows.map((row, r) => (
												<tr key={r} className="border-b border-line/60 last:border-b-0">
													{row.map((value, c) => (
														<td
															key={c}
															className="px-2 py-1 align-top whitespace-nowrap text-text-strong"
														>
															{value}
														</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					);
				}

				if (block.kind === 'link') {
					return (
						<button
							key={i}
							type="button"
							className={LINK}
							onClick={() => openUrlAsset(block.href, block.label || 'Link', `link-${i}`)}
						>
							{block.label}
							<ExternalLink size={12} />
						</button>
					);
				}

				if (block.kind === 'image') {
					return (
						<button
							key={i}
							type="button"
							className="block max-w-full cursor-zoom-in border-0 bg-transparent p-0 text-left"
							onClick={() => openUrlAsset(block.url, block.alt || 'Image', `image-${i}`, 'image')}
						>
							<img
								className="max-w-full rounded-xs border border-line"
								src={toEmbeddablePreviewUrl(block.url) ?? block.url}
								alt={block.alt ?? ''}
								loading="lazy"
							/>
						</button>
					);
				}

				return (
					<div key={i} className="contents">
						{block.label && <p className={BLOCK_LABEL}>{block.label}</p>}
						<ul className="m-0 flex max-h-80 list-none flex-col gap-1 overflow-y-auto p-0 pr-0.5 [&_li]:flex [&_li]:min-w-0 [&_li]:flex-col [&_li]:gap-px">
							{block.items.map((item, j) => (
								<li key={j}>
									{item.href ? (
										<button
											type="button"
											className={LINK}
											onClick={() => openUrlAsset(item.href!, item.title || 'File', `list-${i}-${j}`)}
										>
											{item.title}
										</button>
									) : (
										<span className={cx(CELL_BODY, 'font-medium text-ink')}>{item.title}</span>
									)}
									{item.subtitle && (
										<span className={cx(CELL_META, 'text-muted')}>{item.subtitle}</span>
									)}
								</li>
							))}
						</ul>
					</div>
				);
			})}
		</>
	);
}

import { ExternalLink } from 'lucide-react';

import { buildCellBlocks } from '../lib/cellBlocks';
import { getCellCase, getCellTypeInfo, getToolDisplayName, type CellLike } from '../lib/cells';
import { cx } from '../lib/cx';
import { guessPreviewType, previewItemsFromCell, previewPanel } from '../lib/previewPanel';
import { toEmbeddablePreviewUrl } from '../lib/previewUrl';
import { Markdown } from './Markdown';
import { PierreCode } from './PierreCode';

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

const BLOCK_LABEL =
	'mt-0.5 mb-0 text-[11px] font-semibold tracking-[0.02em] text-muted uppercase';
const LINK =
	'inline-flex cursor-pointer items-center gap-[5px] self-start border-0 bg-transparent p-0 text-left text-[12.5px] font-medium text-[#2563eb] no-underline hover:underline hover:underline-offset-2';

export function CellDetail({ cell }: { cell: CellLike }) {
	const cellCase = getCellCase(cell);
	const info = getCellTypeInfo(cellCase);
	const execError = typeof cell.execError === 'string' ? cell.execError : '';
	// buildCellBlocks owns the Time row: it only appends one once the cell finishes.
	const blocks = buildCellBlocks(cell);
	const Icon = info.icon;
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
		<div
			className={cx(
				'flex flex-col gap-1.5 rounded-sm border bg-elevate/55 px-3 py-2.5',
				execError ? 'border-[color-mix(in_srgb,#dc2626_35%,var(--color-line))]' : 'border-line'
			)}
		>
			<div className="flex min-w-0 items-center gap-[7px] text-ink [&_svg]:shrink-0 [&_svg]:text-muted">
				<Icon size={14} />
				<span className="shrink-0 text-[12.5px] font-semibold">{getToolDisplayName(cell)}</span>
				{cell.toolSummary && (
					<span className="overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap text-muted">
						{cell.toolSummary}
					</span>
				)}
			</div>

			{execError && (
				<p className="m-0 text-[12px] whitespace-pre-wrap text-[#dc2626] wrap-anywhere">
					{execError}
				</p>
			)}

			{blocks.map((block, i) => {
				if (block.kind === 'kv') {
					return (
						<dl
							className="m-0 grid grid-cols-[max-content_1fr] gap-x-[14px] gap-y-0.5 [&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:text-[12px] [&_dd]:leading-[1.6] [&_dd]:text-ink [&_dd]:wrap-anywhere [&_dt]:text-[11.5px] [&_dt]:leading-[1.6] [&_dt]:font-medium [&_dt]:text-muted"
							key={i}
						>
							{block.rows.map((row) => (
								<div key={row.label} className="contents">
									<dt>{row.label}</dt>
									<dd>{row.value}</dd>
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
								<pre className="m-0 max-h-80 overflow-auto rounded-xs bg-ink/5 px-2.5 py-2 font-mono text-[11.5px] leading-normal whitespace-pre">
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
							<div className="text-[13px] [&_.md]:text-[13px]">
								<Markdown content={block.text} />
							</div>
						</div>
					);
				}

				if (block.kind === 'text') {
					return (
						<div key={i} className="contents">
							{block.label && <p className={BLOCK_LABEL}>{block.label}</p>}
							<p
								className={cx(
									'm-0 text-[13px] leading-[1.55] whitespace-pre-wrap wrap-anywhere',
									block.label === 'Error' ? 'text-[#dc2626]' : 'text-text-strong'
								)}
							>
								{block.text}
							</p>
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
						<ul className="m-0 flex list-none flex-col gap-1 p-0 [&_li]:flex [&_li]:min-w-0 [&_li]:flex-col [&_li]:gap-px">
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
										<span className="text-[12.5px] font-medium text-ink">{item.title}</span>
									)}
									{item.subtitle && (
										<span className="text-[11.5px] leading-[1.45] text-muted">{item.subtitle}</span>
									)}
								</li>
							))}
						</ul>
					</div>
				);
			})}
		</div>
	);
}

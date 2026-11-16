import { FileText, Table } from 'lucide-react';
import { useState } from 'react';

import { asRecords, asString, getCellCase, getCellPayload, type CellLike } from '../lib/cells';
import { previewItemsFromCell, previewPanel } from '../lib/previewPanel';
import { toEmbeddablePreviewUrl } from '../lib/previewUrl';

function mediaUrl(value: unknown): string | null {
	const url = asString(value);
	if (!/^https?:\/\//i.test(url) && !/^\/(?!\/)/.test(url)) return null;
	return toEmbeddablePreviewUrl(url);
}

/** Uploaded assets stay compact in the transcript; full content opens on demand. */
export function UploadedFilePreview({ cell }: { cell: CellLike }) {
	const payload = getCellPayload(cell);
	const kind = getCellCase(cell);
	const name = asString(payload.fileName) || asString(payload.name) || 'File';
	const thumbnail = mediaUrl(kind === 'imageCell' ? payload.url : payload.preview);
	const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);
	const collectedItem = previewItemsFromCell(cell)[0];
	const item =
		kind === 'documentCell' && !asString(payload.url) && thumbnail && collectedItem
			? { ...collectedItem, previewType: 'image', url: thumbnail, content: null }
			: collectedItem;
	const snippet =
		kind === 'textCell'
			? asString(payload.content).slice(0, 600)
			: kind === 'tabularFileCell'
				? asRecords(payload.dataframes)
						.map((frame) => asString(frame.name))
						.filter(Boolean)
						.join('\n')
				: kind === 'documentCell' && !thumbnail
					? asString(payload.preview).slice(0, 600)
					: '';
	const Icon = kind === 'tabularFileCell' ? Table : FileText;
	const content = (
		<>
			<span className="flex h-28 w-full items-center justify-center overflow-hidden bg-elevate sm:h-32">
				{thumbnail && failedThumbnail !== thumbnail ? (
					<img
						src={thumbnail}
						alt={`Preview of ${name}`}
						className="size-full object-contain"
						loading="lazy"
						referrerPolicy="no-referrer"
						onError={() => setFailedThumbnail(thumbnail)}
					/>
				) : snippet ? (
					<span className="block size-full overflow-hidden p-3 text-[10px] leading-relaxed whitespace-pre-wrap text-text-3">
						{snippet}
					</span>
				) : (
					<span className="flex flex-col items-center gap-2 text-muted">
						<Icon size={28} strokeWidth={1.25} aria-hidden="true" />
						<span className="text-[11px]">
							{failedThumbnail
								? 'Preview unavailable'
								: name.split('.').pop()?.toUpperCase() || 'File'}
						</span>
					</span>
				)}
			</span>
			<span
				className="block truncate border-t border-line px-2.5 py-2 text-[12px] font-medium text-ink"
				title={name}
			>
				{name}
				<span className="sr-only"> attached</span>
			</span>
		</>
	);
	const className =
		'block w-36 max-w-full overflow-hidden rounded-xl border border-line bg-elevate text-left shadow-sm sm:w-40';
	return item ? (
		<button
			type="button"
			className={`${className} cursor-pointer hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
			aria-label={`Open ${name}`}
			onClick={() => previewPanel.openItem(item)}
		>
			{content}
		</button>
	) : (
		<div className={className}>{content}</div>
	);
}

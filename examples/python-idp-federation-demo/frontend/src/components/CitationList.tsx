import { ArrowLeft, ChevronRight, Quote } from 'lucide-react';
import { Fragment, lazy, Suspense, useMemo, type ReactNode } from 'react';

import { cellsById, type CellLike } from '../lib/cells';
import { CELL_BODY, CELL_LABEL, CELL_META } from '../lib/cellText';
import { inspectableCellIds } from '../lib/citationCodeDetail';
import { citationLineageModal } from '../lib/citationLineageModal';
import { citationTitle, type CitationView } from '../lib/citations';
import { citationSource } from '../lib/citationSource';
import { useConnectorMap } from '../lib/connectorsCache';
import { cx } from '../lib/cx';
import { previewPanel } from '../lib/previewPanel';
import { stripMarkdown } from '../lib/utils';
import { SourceIcon } from './SourceIcon';

// React Flow loads with the first citation opened, not with the app.
const LineageMap = lazy(() =>
	import('./lineage/LineageMap').then((m) => ({ default: m.LineageMap }))
);

type Props = {
	citations: CitationView[];
	/** The chat's cells: lineage nodes resolve back to their code through these. */
	cells: CellLike[];
	/** The citation open in the tab; null shows the list. */
	selectedKey: string | null;
};

const MARKER_BADGE = cx(
	CELL_META,
	'mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-fill px-1 font-bold text-muted tabular-nums'
);

/** Marker, source and title: the same lead-in for a list row and the detail header. */
function CitationHeading({ citation, children }: { citation: CitationView; children?: ReactNode }) {
	const connectors = useConnectorMap();
	const source = citationSource(citation, connectors);
	return (
		<>
			<span className={MARKER_BADGE}>{citation.marker}</span>
			<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center overflow-hidden rounded">
				<SourceIcon source={source} size={16} className="text-muted" />
			</span>
			<span className="min-w-0 flex-1">
				<span className={cx(CELL_META, 'block truncate font-medium text-muted')}>{source.label}</span>
				<span className={cx(CELL_BODY, 'block truncate font-medium text-ink')}>
					{citationTitle(citation)}
				</span>
				{children}
			</span>
		</>
	);
}

function CitationDetail({ citation, cells }: { citation: CitationView; cells: CellLike[] }) {
	const byId = useMemo(() => cellsById(cells), [cells]);
	const inspectableIds = useMemo(() => inspectableCellIds(citation, byId), [citation, byId]);

	return (
		<div className="flex h-full min-h-0 flex-col gap-3">
			<button
				type="button"
				className={cx(
					CELL_META,
					'inline-flex cursor-pointer items-center gap-1.5 self-start border-0 bg-transparent p-0 font-medium text-muted transition-colors hover:text-ink'
				)}
				onClick={() => previewPanel.selectCitation(null)}
			>
				<ArrowLeft size={14} />
				All citations
			</button>

			<div className="flex items-start gap-3 rounded-sm bg-fill px-2 py-2">
				<CitationHeading citation={citation} />
			</div>

			{citation.rationale && (
				<p className={cx(CELL_META, 'm-0 leading-relaxed text-text-3')}>
					{stripMarkdown(citation.rationale)}
				</p>
			)}

			<div className="min-h-[280px] flex-1 overflow-hidden rounded-sm">
				<Suspense fallback={null}>
					<LineageMap
						citation={citation}
						inspectableIds={inspectableIds}
						onNodeClick={(id) => citationLineageModal.open(citation, byId, id)}
						onExpand={() => citationLineageModal.open(citation, byId)}
					/>
				</Suspense>
			</div>
		</div>
	);
}

/**
 * The panel's Citations tab: every citation in the chat, and for the one
 * picked, its lineage graph. An inline marker click lands on the graph directly.
 */
export function CitationList({ citations, cells, selectedKey }: Props) {
	if (citations.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-line py-12 text-center">
				<Quote size={24} className="text-muted/60" />
				<p className={cx(CELL_BODY, 'mt-2 mb-0 text-muted')}>No citations in this chat.</p>
				<p className={cx(CELL_META, 'mt-0.5 mb-0 text-muted/80')}>
					Answers cite their sources when tracing is enabled.
				</p>
			</div>
		);
	}

	// A marker can be clicked before its citation has streamed in; the list
	// shows until it arrives.
	const selected = citations.find((citation) => citation.key === selectedKey);
	if (selected) return <CitationDetail citation={selected} cells={cells} />;

	return (
		<div className="flex flex-col gap-1">
			{citations.map((citation, index) => {
				// Marker numbers restart per answer, so the list says where one ends.
				const newAnswer = index > 0 && citation.cellId !== citations[index - 1]!.cellId;
				return (
					<Fragment key={citation.key}>
						{newAnswer && (
							<div aria-hidden="true" className="my-2 flex items-center gap-2 px-2">
								<span className="h-px flex-1 bg-line" />
								<span className={cx(CELL_LABEL, 'text-[10px] text-muted/70')}>New message</span>
								<span className="h-px flex-1 bg-line" />
							</div>
						)}
						<button
							type="button"
							className="flex w-full cursor-pointer items-start gap-3 rounded-sm border-0 bg-transparent px-2 py-2 text-left transition-colors hover:bg-fill"
							onClick={() => previewPanel.selectCitation(citation.key)}
						>
							<CitationHeading citation={citation}>
								{/* The claim only repeats as a subtitle when a summary took the title. */}
								{citation.sourceSummary && (
									<span className={cx(CELL_META, 'mt-0.5 line-clamp-2 leading-relaxed text-muted')}>
										{stripMarkdown(citation.claim || citation.anchor)}
									</span>
								)}
							</CitationHeading>
							<ChevronRight size={16} className="mt-0.5 shrink-0 text-muted" />
						</button>
					</Fragment>
				);
			})}
		</div>
	);
}

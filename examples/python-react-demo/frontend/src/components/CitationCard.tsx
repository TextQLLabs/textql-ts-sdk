import { CELL_BODY, CELL_META } from '../lib/cellText';
import { citationTitle, type CitationView } from '../lib/citations';
import { citationSource } from '../lib/citationSource';
import { useConnectorMap } from '../lib/connectorsCache';
import { cx } from '../lib/cx';
import { stripMarkdown } from '../lib/utils';
import { SourceIcon } from './SourceIcon';

export const CITATION_CARD_WIDTH = 260;

export type CitationCardPlacement = {
	citation: CitationView;
	top: number;
	left: number;
	/** Marker near the top of the viewport: card hangs below it instead of above. */
	below: boolean;
};

type Props = CitationCardPlacement & {
	onPointerEnter: () => void;
	onPointerLeave: () => void;
};

/** Hover card for one inline marker: source, producing step, and the model's
 *  own reason for citing it. */
export function CitationCard({ citation, top, left, below, onPointerEnter, onPointerLeave }: Props) {
	const connectors = useConnectorMap();
	const source = citationSource(citation, connectors);

	return (
		<div
			className="fixed z-[900] animate-modal-fade overflow-hidden rounded-sm border border-line bg-elevate px-3 py-2.5 shadow-[0_8px_24px_rgba(15,15,20,0.12)]"
			role="tooltip"
			style={{
				top: `${top}px`,
				left: `${left}px`,
				width: `${CITATION_CARD_WIDTH}px`,
				transform: below ? undefined : 'translateY(-100%)'
			}}
			onPointerEnter={onPointerEnter}
			onPointerLeave={onPointerLeave}
		>
			<div className={cx(CELL_META, 'mb-1 flex items-center gap-1.5 text-muted')}>
				<SourceIcon source={source} size={14} className="rounded" />
				<span className="truncate">{source.label}</span>
			</div>
			<div className={cx(CELL_BODY, 'line-clamp-2 font-medium text-ink wrap-anywhere')}>
				{citationTitle(citation)}
			</div>
			{citation.rationale && (
				<div className={cx(CELL_BODY, 'mt-1.5 line-clamp-2 text-muted wrap-anywhere')}>
					{stripMarkdown(citation.rationale)}
				</div>
			)}
		</div>
	);
}

import { CELL_BODY, CELL_META } from '../lib/cellText';
import type { CitationView } from '../lib/citations';
import { citationSource } from '../lib/citationSource';
import { useConnectorMap } from '../lib/connectorsCache';
import { cx } from '../lib/cx';
import { stripMarkdown } from '../lib/utils';

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

/**
 * Hover card for one inline marker: where the figure came from, the step that
 * produced it, and the model's own one-line reason for citing it.
 */
export function CitationCard({ citation, top, left, below, onPointerEnter, onPointerLeave }: Props) {
	const connectors = useConnectorMap();
	const source = citationSource(citation, connectors);
	const Icon = source.icon;
	const title = stripMarkdown(citation.sourceSummary || citation.claim || citation.anchor);

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
				{source.logoUrl ? (
					<img className="size-3.5 shrink-0 rounded object-contain" src={source.logoUrl} alt="" />
				) : (
					Icon && <Icon size={14} className="shrink-0" />
				)}
				<span className="truncate">{source.label}</span>
			</div>
			{title && (
				<div className={cx(CELL_BODY, 'line-clamp-2 font-medium text-ink wrap-anywhere')}>
					{title}
				</div>
			)}
			{citation.rationale && (
				<div className={cx(CELL_BODY, 'mt-1.5 line-clamp-2 text-muted wrap-anywhere')}>
					{stripMarkdown(citation.rationale)}
				</div>
			)}
		</div>
	);
}

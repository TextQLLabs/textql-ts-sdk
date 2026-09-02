import { Fragment, useEffect, useRef } from 'react';

import { CELL_BODY, CELL_LABEL, CELL_META } from '../lib/cellText';
import { lineageTrail, type CitationView } from '../lib/citations';
import { citationSource } from '../lib/citationSource';
import { useConnectorMap } from '../lib/connectorsCache';
import { cx } from '../lib/cx';
import { stripMarkdown } from '../lib/utils';

type Props = {
	citations: CitationView[];
	/** The citation whose inline marker was clicked, if any. */
	selectedKey: string | null;
};

const MARKER_BADGE =
	'mt-px flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-fill px-1 text-[10.5px] font-bold text-muted tabular-nums';

/**
 * Every citation in the chat, as the preview panel's Citations tab. Clicking an
 * inline marker opens the panel here and selects that row.
 */
export function CitationList({ citations, selectedKey }: Props) {
	const connectors = useConnectorMap();
	const selectedRef = useRef<HTMLLIElement | null>(null);

	useEffect(() => {
		if (!selectedKey) return;
		selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, [selectedKey]);

	return (
		<ul className="m-0 flex list-none flex-col gap-1.5 p-0">
			{citations.map((citation, index) => {
				const source = citationSource(citation, connectors);
				const Icon = source.icon;
				const selected = citation.key === selectedKey;
				const claim = stripMarkdown(citation.claim || citation.anchor);
				const trail = lineageTrail(citation);
				// Marker numbers restart per answer, so the list says where one ends.
				const newAnswer = index > 0 && citation.cellId !== citations[index - 1]!.cellId;

				return (
					<Fragment key={citation.key}>
						{newAnswer && (
							<li aria-hidden="true" className="my-1 flex items-center gap-2 px-1">
								<span className="h-px flex-1 bg-line" />
								<span className={cx(CELL_LABEL, 'text-[#a1a1aa]')}>New message</span>
								<span className="h-px flex-1 bg-line" />
							</li>
						)}
						<li
							className={cx(
								'flex items-start gap-2.5 rounded-sm border bg-elevate px-2.5 py-2',
								selected
									? 'border-accent/45 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_35%,transparent)]'
									: 'border-line'
							)}
							ref={selected ? selectedRef : undefined}
						>
							<span className={MARKER_BADGE}>{citation.marker}</span>
							<span className="mt-px flex size-4 shrink-0 items-center justify-center">
								{source.logoUrl ? (
									<img className="size-3.5 object-contain" src={source.logoUrl} alt="" />
								) : (
									Icon && <Icon size={14} className="text-muted" />
								)}
							</span>
							<div className="flex min-w-0 flex-1 flex-col gap-0.5">
								<span className={cx(CELL_META, 'truncate text-muted')}>{source.label}</span>
								{claim && (
									<span className={cx(CELL_BODY, 'font-medium text-ink wrap-anywhere')}>
										{claim}
									</span>
								)}
								{citation.sourceSummary && (
									<span className={cx(CELL_META, 'text-text-3 wrap-anywhere')}>
										{stripMarkdown(citation.sourceSummary)}
									</span>
								)}
								{citation.rationale && (
									<span className={cx(CELL_META, 'text-muted wrap-anywhere')}>
										{stripMarkdown(citation.rationale)}
									</span>
								)}
								{trail.length > 0 && (
									<span className={cx(CELL_META, 'mt-0.5 flex flex-wrap gap-1')}>
										{trail.map((step) => (
											<span
												className="rounded-xs bg-fill px-1.5 py-px font-mono text-muted"
												key={step}
											>
												{step}
											</span>
										))}
									</span>
								)}
							</div>
						</li>
					</Fragment>
				);
			})}
		</ul>
	);
}

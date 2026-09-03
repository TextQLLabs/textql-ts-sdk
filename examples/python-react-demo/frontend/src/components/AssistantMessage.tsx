import { useMemo } from 'react';

import { asString, getCellContent, getCellPayload, type CellLike } from '../lib/cells';
import { buildCitationViews } from '../lib/citations';
import { previewPanel } from '../lib/previewPanel';
import { CitationSources } from './CitationSources';
import { Markdown } from './Markdown';

type Props = {
	cell: CellLike;
	/** The whole turn: a citation names its source cell by id. */
	turnCells: CellLike[];
	/** Still streaming — the server's rendered HTML is not final yet. */
	live: boolean;
};

export function AssistantMessage({ cell, turnCells, live }: Props) {
	const citations = useMemo(() => buildCitationViews(cell, turnCells), [cell, turnCells]);

	return (
		<div className="flex flex-col py-0.5">
			<Markdown
				renderedHtml={live ? '' : asString(getCellPayload(cell).renderedHtml)}
				content={getCellContent(cell)}
				citations={citations}
				// Both the marker and the chip open the panel's Citations tab, which
				// lists the whole chat; the marker just says which row to land on.
				onCitationClick={(key) => previewPanel.openCitations(key)}
			/>
			{citations.length > 0 && (
				<div className="mt-1 flex items-start">
					<CitationSources
						citations={citations}
						onOpen={() => previewPanel.openCitations(citations[0]?.key ?? null)}
					/>
				</div>
			)}
		</div>
	);
}

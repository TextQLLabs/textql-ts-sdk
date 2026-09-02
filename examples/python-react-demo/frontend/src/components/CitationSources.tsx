import { CELL_BODY } from '../lib/cellText';
import type { CitationView } from '../lib/citations';
import { distinctSources } from '../lib/citationSource';
import { useConnectorMap } from '../lib/connectorsCache';
import { cx } from '../lib/cx';

type Props = {
	citations: CitationView[];
	onOpen: () => void;
};

/** "N sources" footer under a cited answer: the stacked origins, then the count. */
export function CitationSources({ citations, onOpen }: Props) {
	const connectors = useConnectorMap();
	const sources = distinctSources(citations, connectors);

	return (
		<button
			type="button"
			className={cx(
				CELL_BODY,
				'inline-flex cursor-pointer items-center gap-1.5 rounded-xs border-0 bg-transparent px-1.5 py-1 text-muted hover:bg-ink/6 hover:text-text-3'
			)}
			aria-label="View sources"
			onClick={onOpen}
		>
			<span className="flex items-center -space-x-1.5">
				{sources.slice(0, 3).map((source) => {
					const Icon = source.icon;
					return (
						<span
							className="flex size-5 items-center justify-center rounded-full bg-fill ring-2 ring-paper"
							key={source.key}
						>
							{source.logoUrl ? (
								<img className="size-3 object-contain" src={source.logoUrl} alt="" />
							) : (
								Icon && <Icon size={12} />
							)}
						</span>
					);
				})}
			</span>
			<span>
				{citations.length} {citations.length === 1 ? 'source' : 'sources'}
			</span>
		</button>
	);
}

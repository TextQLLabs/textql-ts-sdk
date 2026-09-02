import { Database, FileCode2 } from 'lucide-react';

import { lineageKindLabel, type Citation, type CitationView } from './citations';
import { connectorIconSrc } from './connectorIcons';
import { type ConnectorItem } from './connectorsCache';
import type { IconComponent } from './icon';

/**
 * What a citation is attributed to. The source is where the data came from —
 * the connector behind the upstream SQL — not the cell type that last touched
 * it, so the connector wins over the "SQL"/"Python" kind whenever it resolves.
 */
export type CitationSource = {
	/** Dedupe key: one chip per distinct source, not per citation. */
	key: string;
	logoUrl?: string;
	icon?: IconComponent;
	label: string;
};

function connectorSource(
	connectorId: number | undefined,
	connectors: Map<number, ConnectorItem>
): CitationSource | null {
	if (connectorId === undefined) return null;
	const connector = connectors.get(connectorId);
	if (!connector) return null;
	return {
		key: `connector:${connector.type}`,
		logoUrl: connectorIconSrc(connector.type),
		label: connector.name || 'SQL'
	};
}

function kindSource(citation: Citation): CitationSource {
	const label = lineageKindLabel(citation);
	return {
		key: `kind:${label}`,
		icon: label === 'Python' ? FileCode2 : Database,
		label
	};
}

export function citationSource(
	citation: CitationView,
	connectors: Map<number, ConnectorItem>
): CitationSource {
	return connectorSource(citation.connectorId, connectors) ?? kindSource(citation);
}

/** The distinct sources behind a set of citations, for the stacked-icon chip. */
export function distinctSources(
	citations: CitationView[],
	connectors: Map<number, ConnectorItem>
): CitationSource[] {
	const byKey = new Map<string, CitationSource>();
	for (const citation of citations) {
		const source = citationSource(citation, connectors);
		if (!byKey.has(source.key)) byKey.set(source.key, source);
	}
	return [...byKey.values()];
}

import { useEffect, useMemo } from 'react';

import { listConnectors, type ConnectorSummary } from './api';
import { Store, useStore } from './store';

export type ConnectorItem = ConnectorSummary;

type CacheState = {
	connectors: ConnectorItem[];
	loading: boolean;
	error: boolean;
	loaded: boolean;
};

class ConnectorsCache extends Store<CacheState> {
	#inflight: Promise<void> | null = null;

	constructor() {
		super({ connectors: [], loading: false, error: false, loaded: false });
	}

	load = async (force = false): Promise<void> => {
		if (!force && this.state.loaded) return;
		if (this.#inflight) return this.#inflight;

		this.set({ loading: true, error: false });

		this.#inflight = (async () => {
			try {
				this.set({ connectors: await listConnectors(), loaded: true, error: false });
			} catch {
				this.set({ error: true });
			} finally {
				this.set({ loading: false });
				this.#inflight = null;
			}
		})();

		return this.#inflight;
	};
}

export const connectorsCache = new ConnectorsCache();

export function useConnectors(): CacheState {
	return useStore(connectorsCache);
}

/** Every connector by id, loading the cache on demand. */
export function useConnectorMap(): Map<number, ConnectorItem> {
	const state = useStore(connectorsCache);

	useEffect(() => {
		void connectorsCache.load();
	}, []);

	return useMemo(
		() => new Map(state.connectors.map((connector) => [connector.id, connector])),
		[state.connectors]
	);
}

/**
 * Resolve a cell's `connectorId` to the connector itself, loading the cache on
 * demand. Undefined until it lands (or if the id is unknown to this org), so
 * callers fall back to the bare id rather than blocking on the fetch.
 */
export function useConnector(id: unknown): ConnectorItem | undefined {
	const connectors = useConnectorMap();
	const numeric = typeof id === 'number' ? id : Number(id);
	if (!Number.isFinite(numeric)) return undefined;
	return connectors.get(numeric);
}

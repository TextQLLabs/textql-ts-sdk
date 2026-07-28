import { Store, useStore } from './store';
import { isRecord } from './utils';

export type ConnectorItem = {
	id: number;
	name: string;
	type: string;
};

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
				const response = await fetch('/api/connectors');
				const payload: unknown = await response.json();

				if (!response.ok || !isRecord(payload) || !Array.isArray(payload.connectors)) {
					throw new Error('Unable to load connectors.');
				}

				const next: ConnectorItem[] = [];

				for (const item of payload.connectors) {
					if (
						!isRecord(item) ||
						typeof item.id !== 'number' ||
						typeof item.name !== 'string' ||
						typeof item.type !== 'string'
					) {
						continue;
					}

					next.push({ id: item.id, name: item.name, type: item.type });
				}

				this.set({ connectors: next, loaded: true, error: false });
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

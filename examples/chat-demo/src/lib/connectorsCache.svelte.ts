import { isRecord } from '$lib/utils';

export type ConnectorItem = {
	id: number;
	name: string;
	type: string;
};

class ConnectorsCache {
	connectors = $state.raw<ConnectorItem[]>([]);
	loading = $state(false);
	error = $state(false);
	loaded = $state(false);

	#inflight: Promise<void> | null = null;

	async load(force = false) {
		if (!force && this.loaded) return;
		if (this.#inflight) return this.#inflight;

		this.loading = true;
		this.error = false;

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

				this.connectors = next;
				this.loaded = true;
				this.error = false;
			} catch {
				this.error = true;
			} finally {
				this.loading = false;
				this.#inflight = null;
			}
		})();

		return this.#inflight;
	}
}

export const connectorsCache = new ConnectorsCache();

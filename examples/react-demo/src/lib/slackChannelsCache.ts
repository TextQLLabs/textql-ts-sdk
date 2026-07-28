import { Store, useStore } from './store';
import { isRecord } from './utils';

export type SlackChannel = {
	channelId: string;
	name: string;
};

type CacheState = {
	channels: SlackChannel[];
	loading: boolean;
	error: boolean;
	loaded: boolean;
};

class SlackChannelsCache extends Store<CacheState> {
	#inflight: Promise<void> | null = null;

	constructor() {
		super({ channels: [], loading: false, error: false, loaded: false });
	}

	load = async (force = false): Promise<void> => {
		if (!force && this.state.loaded) return;
		if (this.#inflight) return this.#inflight;

		this.set({ loading: true, error: false });

		this.#inflight = (async () => {
			try {
				const response = await fetch('/api/slack/channels');
				const payload: unknown = await response.json();

				if (!response.ok || !isRecord(payload) || !Array.isArray(payload.channels)) {
					throw new Error('Unable to load Slack channels.');
				}

				const next: SlackChannel[] = [];

				for (const item of payload.channels) {
					if (
						!isRecord(item) ||
						typeof item.channelId !== 'string' ||
						typeof item.name !== 'string'
					) {
						continue;
					}

					next.push({ channelId: item.channelId, name: item.name });
				}

				next.sort((a, b) => a.name.localeCompare(b.name));

				this.set({ channels: next, loaded: true, error: false });
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

export const slackChannelsCache = new SlackChannelsCache();

export function useSlackChannels(): CacheState {
	return useStore(slackChannelsCache);
}

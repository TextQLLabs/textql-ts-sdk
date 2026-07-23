import { isRecord } from '$lib/utils';

export type SlackChannel = {
	channelId: string;
	name: string;
};

class SlackChannelsCache {
	channels = $state.raw<SlackChannel[]>([]);
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

				this.channels = next;
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

export const slackChannelsCache = new SlackChannelsCache();

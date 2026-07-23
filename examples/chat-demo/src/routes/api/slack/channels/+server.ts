import { isConnectError, proxyError, textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const { client } = textqlClients();

	try {
		const result = await client.slack.listChannels({ body: {} });

		if (isConnectError(result)) {
			return json({ error: result.message ?? 'Unable to load Slack channels.' }, { status: 502 });
		}

		const channels = Array.isArray(result.channels) ? result.channels : [];

		return json(
			{
				channels: channels
					.map((channel) => {
						const channelId =
							typeof channel.channelId === 'string' ? channel.channelId.trim() : '';
						if (!channelId) return null;
						const name = typeof channel.name === 'string' ? channel.name.trim() : '';
						return { channelId, name: name || channelId };
					})
					.filter((channel): channel is NonNullable<typeof channel> => channel !== null)
			},
			{
				headers: {
					'Cache-Control': 'private, max-age=60'
				}
			}
		);
	} catch (error) {
		return proxyError('Slack channels list request', error);
	}
};

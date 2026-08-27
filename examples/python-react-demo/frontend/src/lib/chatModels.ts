/**
 * The models the composer offers. IDs are the proto enum names the API expects,
 * so they go to `POST /v3/textql/chats` as-is.
 */
export const CHAT_MODELS = [
	{
		id: 'MODEL_HAIKU_4_5',
		label: 'Claude Haiku 4.5',
		hint: 'Fast responses for quick tasks',
		provider: 'ANTHROPIC'
	},
	{
		id: 'MODEL_SONNET_5',
		label: 'Claude Sonnet 5',
		hint: 'Balanced speed and quality',
		provider: 'ANTHROPIC'
	},
	{
		id: 'MODEL_OPUS_4_8',
		label: 'Claude Opus 4.8',
		hint: 'Highest capability for hard work',
		provider: 'ANTHROPIC'
	}
] as const;

export type ChatModelId = (typeof CHAT_MODELS)[number]['id'];

export const DEFAULT_CHAT_MODEL: ChatModelId = 'MODEL_SONNET_5';

export function isKnownChatModel(model: string): model is ChatModelId {
	return CHAT_MODELS.some((entry) => entry.id === model);
}

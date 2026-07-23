import { TextqlRpcPublicChatLlmModel } from '@textql/sdk/models';

export const CHAT_MODELS = [
	{
		id: TextqlRpcPublicChatLlmModel.ModelHaiku45,
		label: 'Claude Haiku 4.5',
		hint: 'Fast responses for quick tasks',
		provider: 'ANTHROPIC'
	},
	{
		id: TextqlRpcPublicChatLlmModel.ModelSonnet5,
		label: 'Claude Sonnet 5',
		hint: 'Balanced speed and quality',
		provider: 'ANTHROPIC'
	},
	{
		id: TextqlRpcPublicChatLlmModel.ModelOpus48,
		label: 'Claude Opus 4.8',
		hint: 'Highest capability for hard work',
		provider: 'ANTHROPIC'
	}
] as const;

export type ChatModelId = (typeof CHAT_MODELS)[number]['id'];

export const DEFAULT_CHAT_MODEL: ChatModelId = TextqlRpcPublicChatLlmModel.ModelSonnet5;

export const CHAT_MODEL_IDS = CHAT_MODELS.map((model) => model.id) as [
	ChatModelId,
	...ChatModelId[]
];

export function isKnownChatModel(model: string): model is ChatModelId {
	return (CHAT_MODEL_IDS as readonly string[]).includes(model);
}

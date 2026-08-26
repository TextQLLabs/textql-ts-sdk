/**
 * The selectable model catalog exposed by @textql/sdk 1.4.21.
 *
 * The public SDK writes enum names while organization reads still expose the
 * persisted numeric ids. Keeping both here gives the UI one lossless boundary
 * between the two representations.
 */

export type ProviderId = 'anthropic' | 'openai' | 'google' | 'fireworks' | 'meta';

export interface Provider {
	id: ProviderId;
	name: string;
	color: string;
	iconPath?: string;
}

export const PROVIDERS: Provider[] = [
	{ id: 'anthropic', name: 'Anthropic', color: '#D97757', iconPath: '/images/provider/claude-color.svg' },
	{ id: 'openai', name: 'OpenAI', color: '#10a37f', iconPath: '/images/provider/openai.svg' },
	{ id: 'google', name: 'Google', color: '#4285F4', iconPath: '/images/provider/gemini.svg' },
	{ id: 'fireworks', name: 'Hosted models', color: '#8B5CF6', iconPath: '/connectors/assets/api/fireworks-logo.png' },
	{ id: 'meta', name: 'Meta', color: '#0668E1', iconPath: '/images/provider/meta.svg' }
];

export interface CatalogModel {
	/** Persisted numeric textql.rpc.public.chat.LlmModel value. */
	id: number;
	/** Public SDK representation used by updateModels and updateRole. */
	enumName: string;
	name: string;
	providerId: ProviderId;
	iconPath?: string;
}

/** Current, non-deprecated models offered in the administration UI. */
export const CATALOG_MODELS: CatalogModel[] = [
	{ id: 18, enumName: 'MODEL_HAIKU_4_5', name: 'Haiku 4.5', providerId: 'anthropic' },
	{ id: 23, enumName: 'MODEL_OPUS_4_8', name: 'Opus 4.8', providerId: 'anthropic' },
	{ id: 24, enumName: 'MODEL_FABLE_5', name: 'Fable 5', providerId: 'anthropic' },
	{ id: 25, enumName: 'MODEL_SONNET_5', name: 'Sonnet 5', providerId: 'anthropic' },
	{ id: 26, enumName: 'MODEL_OPUS_5', name: 'Opus 5', providerId: 'anthropic' },
	{ id: 69, enumName: 'MODEL_GPT_5_6_SOL', name: 'GPT-5.6 Sol', providerId: 'openai' },
	{ id: 80, enumName: 'MODEL_GPT_5_6_TERRA', name: 'GPT-5.6 Terra', providerId: 'openai' },
	{ id: 81, enumName: 'MODEL_GPT_5_6_LUNA', name: 'GPT-5.6 Luna', providerId: 'openai' },
	{ id: 70, enumName: 'MODEL_GEMINI_3_FLASH', name: 'Gemini 3 Flash', providerId: 'google' },
	{ id: 71, enumName: 'MODEL_GEMINI_3_PRO', name: 'Gemini 3 Pro', providerId: 'google' },
	{ id: 72, enumName: 'MODEL_GEMINI_3_1_PRO', name: 'Gemini 3.1 Pro', providerId: 'google' },
	{ id: 73, enumName: 'MODEL_GEMINI_3_5_FLASH', name: 'Gemini 3.5 Flash', providerId: 'google' },
	{ id: 110, enumName: 'MODEL_DEEPSEEK_3_2', name: 'DeepSeek 3.2', providerId: 'fireworks', iconPath: '/images/provider/deepseek.svg' },
	{ id: 111, enumName: 'MODEL_GLM_5', name: 'GLM 5', providerId: 'fireworks', iconPath: '/images/provider/zai.svg' },
	{ id: 113, enumName: 'MODEL_KIMI_K2_6', name: 'Kimi K2.6', providerId: 'fireworks', iconPath: '/images/provider/moonshot.svg' },
	{ id: 114, enumName: 'MODEL_GLM_5_2', name: 'GLM 5.2', providerId: 'fireworks', iconPath: '/images/provider/zai.svg' },
	{ id: 115, enumName: 'MODEL_KIMI_K2_7_CODE', name: 'Kimi K2.7 Code', providerId: 'fireworks', iconPath: '/images/provider/moonshot.svg' },
	{ id: 116, enumName: 'MODEL_QWEN3_7_PLUS', name: 'Qwen3.7 Plus', providerId: 'fireworks', iconPath: '/images/provider/qwen-color.svg' },
	{ id: 117, enumName: 'MODEL_KIMI_K3', name: 'Kimi K3', providerId: 'fireworks', iconPath: '/images/provider/moonshot.svg' },
	{ id: 118, enumName: 'MODEL_DEEPSEEK_V4_FLASH_0731', name: 'DeepSeek V4 Flash', providerId: 'fireworks', iconPath: '/images/provider/deepseek.svg' },
	{ id: 256, enumName: 'MODEL_MUSE_SPARK_1_1', name: 'Muse Spark 1.1', providerId: 'meta' },
	{ id: 257, enumName: 'MODEL_MUSE_SPARK_1_2', name: 'Muse Spark 1.2', providerId: 'meta' }
];

export const DEFAULT_MODEL_CHOICES = [
	{ id: 0, enumName: 'MODEL_UNKNOWN', name: 'No override' },
	{ id: 2, enumName: 'MODEL_DEFAULT', name: 'Organization default' },
	{ id: 119, enumName: 'MODEL_DEFAULT_SYSTEM', name: 'System default' }
] as const;

const providerById = new Map(PROVIDERS.map((provider) => [provider.id, provider]));
const modelById = new Map(CATALOG_MODELS.map((model) => [model.id, model]));
const modelByEnum = new Map(CATALOG_MODELS.map((model) => [model.enumName, model]));

export function getProviderById(id: string): Provider | undefined {
	return providerById.get(id as ProviderId);
}

export function getCatalogModel(id: number): CatalogModel | undefined {
	return modelById.get(id);
}

export function getCatalogModelByEnum(enumName: string): CatalogModel | undefined {
	return modelByEnum.get(enumName);
}

export function getModelEnumName(id: number): string | undefined {
	return modelById.get(id)?.enumName ?? DEFAULT_MODEL_CHOICES.find((model) => model.id === id)?.enumName;
}

export function getModelId(enumName: string): number | undefined {
	return modelByEnum.get(enumName)?.id ?? DEFAULT_MODEL_CHOICES.find((model) => model.enumName === enumName)?.id;
}

export function getModelIconSrc(id: number): string | undefined {
	const model = modelById.get(id);
	if (!model) return undefined;
	return model.iconPath ?? providerById.get(model.providerId)?.iconPath;
}

export function getModelIconSrcByEnum(enumName: string): string | undefined {
	const id = getModelId(enumName);
	return id === undefined ? undefined : getModelIconSrc(id);
}

export function getModelName(id: number): string {
	return modelById.get(id)?.name ?? DEFAULT_MODEL_CHOICES.find((model) => model.id === id)?.name ?? `Model ${id}`;
}

export function getModelNameByEnum(enumName: string): string {
	return modelByEnum.get(enumName)?.name ?? DEFAULT_MODEL_CHOICES.find((model) => model.enumName === enumName)?.name ?? 'Unknown model';
}

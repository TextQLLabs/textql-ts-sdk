/**
 * LLM catalog: model id -> name + provider, and provider -> brand logo, so a
 * bare numeric model id from the API renders as a named model with its mark.
 *
 * Transcribed from fe/src/lib/stores/modelConfig/modelCatalog.ts. The app keys
 * models by the LlmModel enum member; the API returns the numeric value, so
 * both are carried here and `enumName` stays for cross-referencing the proto.
 *
 * Logos live in static/images/provider, copied from the app's static root.
 */

export type ProviderId =
	| 'anthropic'
	| 'openai'
	| 'google'
	| 'meta'
	| 'fireworks'
	| 'cortex'
	| 'deepseek'
	| 'qwen'
	| 'zhipu';

export interface Provider {
	id: ProviderId;
	name: string;
	color: string;
	/** Static-root-absolute path, used directly as an <img> src. */
	iconPath: string;
}

export const PROVIDERS: Provider[] = [
	{ id: 'anthropic', name: 'Anthropic', color: '#D97757', iconPath: '/images/provider/claude-color.svg' },
	{ id: 'openai', name: 'OpenAI', color: '#10a37f', iconPath: '/images/provider/openai.svg' },
	{ id: 'google', name: 'Google', color: '#4285F4', iconPath: '/images/provider/google.svg' },
	{ id: 'meta', name: 'Meta', color: '#0668E1', iconPath: '/images/provider/meta.svg' },
	{ id: 'fireworks', name: 'Fireworks', color: '#8B5CF6', iconPath: '/connectors/assets/api/fireworks-logo.png' },
	{ id: 'cortex', name: 'Cortex', color: '#29B5E8', iconPath: '/images/provider/claude-color.svg' },
	{ id: 'deepseek', name: 'DeepSeek', color: '#3C5DFF', iconPath: '/images/provider/deepseek.svg' },
	{ id: 'qwen', name: 'Qwen', color: '#6366F1', iconPath: '/images/provider/qwen-color.svg' },
	{ id: 'zhipu', name: 'Zhipu AI', color: '#6366F1', iconPath: '/images/provider/zai.svg' },
];

export interface CatalogModel {
	/** Numeric textql.rpc.public.llm_model.LlmModel value. */
	id: number;
	enumName: string;
	name: string;
	providerId: ProviderId;
	/** Set when the model ships its own mark; otherwise the provider's is used. */
	iconPath?: string;
}

export const CATALOG_MODELS: CatalogModel[] = [
	{ id: 26, enumName: 'MODEL_OPUS_5', name: 'Opus 5', providerId: 'anthropic' },
	{ id: 24, enumName: 'MODEL_FABLE_5', name: 'Fable 5', providerId: 'anthropic' },
	{ id: 23, enumName: 'MODEL_OPUS_4_8', name: 'Opus 4.8', providerId: 'anthropic' },
	{ id: 22, enumName: 'MODEL_OPUS_4_7', name: 'Opus 4.7', providerId: 'anthropic' },
	{ id: 20, enumName: 'MODEL_OPUS_4_6', name: 'Opus 4.6', providerId: 'anthropic' },
	{ id: 25, enumName: 'MODEL_SONNET_5', name: 'Sonnet 5', providerId: 'anthropic' },
	{ id: 21, enumName: 'MODEL_SONNET_4_6', name: 'Sonnet 4.6', providerId: 'anthropic' },
	{ id: 17, enumName: 'MODEL_SONNET_4_5', name: 'Sonnet 4.5', providerId: 'anthropic' },
	{ id: 18, enumName: 'MODEL_HAIKU_4_5', name: 'Haiku 4.5', providerId: 'anthropic' },
	{ id: 69, enumName: 'MODEL_GPT_5_6_SOL', name: 'GPT-5.6 Sol', providerId: 'openai' },
	{ id: 80, enumName: 'MODEL_GPT_5_6_TERRA', name: 'GPT-5.6 Terra', providerId: 'openai' },
	{ id: 81, enumName: 'MODEL_GPT_5_6_LUNA', name: 'GPT-5.6 Luna', providerId: 'openai' },
	{ id: 66, enumName: 'MODEL_GPT_5_5', name: 'GPT-5.5', providerId: 'openai' },
	{ id: 67, enumName: 'MODEL_GPT_5_4', name: 'GPT-5.4', providerId: 'openai' },
	{ id: 68, enumName: 'MODEL_GPT_5_4_MINI', name: 'GPT-5.4 Mini', providerId: 'openai' },
	{ id: 64, enumName: 'MODEL_GPT_5_2', name: 'GPT-5.2', providerId: 'openai' },
	{ id: 62, enumName: 'MODEL_GPT_5_MINI', name: 'GPT-5 Mini', providerId: 'openai' },
	{ id: 72, enumName: 'MODEL_GEMINI_3_1_PRO', name: 'Gemini 3.1 Pro', providerId: 'google', iconPath: '/images/provider/gemini.svg' },
	{ id: 73, enumName: 'MODEL_GEMINI_3_5_FLASH', name: 'Gemini 3.5 Flash', providerId: 'google', iconPath: '/images/provider/gemini.svg' },
	{ id: 257, enumName: 'MODEL_MUSE_SPARK_1_2', name: 'Muse Spark 1.2', providerId: 'meta' },
	{ id: 256, enumName: 'MODEL_MUSE_SPARK_1_1', name: 'Muse Spark 1.1', providerId: 'meta' },
	{ id: 109, enumName: 'MODEL_KIMI_K2_5', name: 'Kimi K2.5', providerId: 'fireworks', iconPath: '/images/provider/moonshot.svg' },
	{ id: 113, enumName: 'MODEL_KIMI_K2_6', name: 'Kimi K2.6', providerId: 'fireworks', iconPath: '/images/provider/moonshot.svg' },
	{ id: 115, enumName: 'MODEL_KIMI_K2_7_CODE', name: 'Kimi K2.7', providerId: 'fireworks', iconPath: '/images/provider/moonshot.svg' },
	{ id: 117, enumName: 'MODEL_KIMI_K3', name: 'Kimi K3', providerId: 'fireworks', iconPath: '/images/provider/moonshot.svg' },
	{ id: 114, enumName: 'MODEL_GLM_5_2', name: 'GLM 5.2', providerId: 'fireworks', iconPath: '/images/provider/zai.svg' },
	{ id: 116, enumName: 'MODEL_QWEN3_7_PLUS', name: 'Qwen3.7 Plus', providerId: 'fireworks', iconPath: '/images/provider/qwen-color.svg' },
	{ id: 118, enumName: 'MODEL_DEEPSEEK_V4_FLASH_0731', name: 'DeepSeek V4 Flash 0731', providerId: 'fireworks', iconPath: '/images/provider/deepseek.svg' },
];

/**
 * Ids that mean "resolve to something else at request time" rather than naming
 * a model. They show up in stored settings, so they need labels of their own.
 */
export const SENTINEL_MODEL_LABELS: Record<number, string> = {
	0: 'Unset',
	1: 'Default (small)',
	2: 'Default',
	3: 'Default (large)',
	4: 'Default (reasoning)',
	119: 'System default',
};

const providerById = new Map(PROVIDERS.map((provider) => [provider.id, provider]));
const modelById = new Map(CATALOG_MODELS.map((model) => [model.id, model]));

export function getProviderById(id: string): Provider | undefined {
	return providerById.get(id as ProviderId);
}

export function getCatalogModel(id: number): CatalogModel | undefined {
	return modelById.get(id);
}

/** Model's own brand logo when set, else the hosting provider's icon. */
export function getModelIconSrc(id: number): string | undefined {
	const model = modelById.get(id);
	if (!model) return undefined;
	return model.iconPath ?? providerById.get(model.providerId)?.iconPath;
}

/** Display name for a model id: catalog name, sentinel label, or `#<id>`. */
export function getModelName(id: number): string {
	return modelById.get(id)?.name ?? SENTINEL_MODEL_LABELS[id] ?? `#${id}`;
}

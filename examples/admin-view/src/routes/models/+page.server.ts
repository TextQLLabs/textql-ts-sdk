import { fail } from '@sveltejs/kit';
import type { TextqlRpcPublicChatLlmModel } from '@textql/sdk/models';

import { CATALOG_MODELS, DEFAULT_MODEL_CHOICES } from '$lib/modelCatalog';
import { textqlClient } from '$lib/server/admin';

import type { Actions } from './$types';

const concreteModels = new Set(CATALOG_MODELS.map((model) => model.enumName));
const defaultModels = new Set([
	...concreteModels,
	...DEFAULT_MODEL_CHOICES.map((model) => model.enumName)
]);

function field(data: FormData, key: string): string {
	return String(data.get(key) ?? '').trim();
}

function csv(value: string): string[] {
	return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export const actions: Actions = {
	savePolicy: async ({ request }) => {
		const client = textqlClient();
		if (!client) return fail(400, { message: 'Configure TEXTQL_API_KEY before changing model access.' });

		const data = await request.formData();
		const scope = field(data, 'scope');
		const enabledModels = csv(field(data, 'enabledModels'));
		const defaultModel = field(data, 'defaultModel') || 'MODEL_UNKNOWN';

		if (scope !== 'all' && scope !== 'selected') {
			return fail(400, { message: 'Choose an organization model policy.' });
		}
		if (scope === 'selected' && enabledModels.length === 0) {
			return fail(400, { message: 'Keep at least one model available to the organization.' });
		}
		if (enabledModels.some((model) => !concreteModels.has(model))) {
			return fail(400, { message: 'The model selection contains an unsupported model.' });
		}
		if (!defaultModels.has(defaultModel)) {
			return fail(400, { message: 'Choose a valid organization default.' });
		}
		if (scope === 'selected' && concreteModels.has(defaultModel) && !enabledModels.includes(defaultModel)) {
			return fail(400, { message: 'The organization default must be available to the organization.' });
		}

		try {
			await client.settings.updateModels({
				body: {
					defaultModel: defaultModel as TextqlRpcPublicChatLlmModel,
					...(scope === 'all'
						? { clearEnabledModels: true }
						: { enabledModels: enabledModels as TextqlRpcPublicChatLlmModel[] })
				}
			});
			return { message: 'Organization model policy updated.' };
		} catch (cause) {
			return fail(400, {
				message: cause instanceof Error ? cause.message : 'Model policy update failed.'
			});
		}
	}
};

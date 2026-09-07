import { fail } from '@sveltejs/kit';
import type { TextqlRpcPublicChatLlmModel } from '@textql/sdk/models';

import { validateModelPolicy } from '$lib/modelCatalog';
import { adminAction, csv, field } from '$lib/server/form';

import type { Actions } from './$types';

export const actions: Actions = {
	savePolicy: adminAction('changing model access', async (client, data) => {
		const scope = field(data, 'scope');
		const enabledModels = csv(field(data, 'enabledModels'));
		const defaultModel = field(data, 'defaultModel') || 'MODEL_UNKNOWN';

		const problem = validateModelPolicy({ scope, models: enabledModels, defaultModel });
		if (problem) return fail(400, { message: problem });

		await client.settings.updateModels({
			body: {
				defaultModel: defaultModel as TextqlRpcPublicChatLlmModel,
				...(scope === 'all'
					? { clearEnabledModels: true }
					: { enabledModels: enabledModels as TextqlRpcPublicChatLlmModel[] })
			}
		});
		return 'Organization model policy updated.';
	})
};

import { isConnectError, proxyError, textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

/** Fetch a single ontology file's contents for the code viewer. */
export const GET: RequestHandler = async ({ url }) => {
	const { client } = textqlClients();
	const path = url.searchParams.get('path');
	if (!path) return json({ error: 'A file path is required.' }, { status: 400 });

	try {
		const res =
			await client.ontologyManagementService.ontologyManagementServiceGetOntologyFile({
				body: { path }
			});
		if (isConnectError(res)) {
			return json({ error: res.message ?? 'Failed to read the file.' }, { status: 502 });
		}
		const file = res.file;
		return json({
			path: file?.path ?? path,
			name: file?.name?.trim() || path.split('/').pop() || path,
			content: file?.content ?? ''
		});
	} catch (error) {
		return proxyError('Ontology file', error);
	}
};

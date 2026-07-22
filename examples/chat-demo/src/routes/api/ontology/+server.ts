import { isConnectError, proxyError, textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

/** List the ontology's entries at a directory path (scoped by the API key's org). */
export const GET: RequestHandler = async ({ url }) => {
	const { client } = textqlClients();
	const path = url.searchParams.get('path') ?? '';
	const recursive = url.searchParams.get('recursive') === '1';

	try {
		const res =
			await client.ontologyManagementService.ontologyManagementServiceListOntologyEntries({
				body: { path, recursive }
			});
		if (isConnectError(res)) {
			return json({ error: res.message ?? 'Failed to list the ontology.' }, { status: 502 });
		}
		const entries = (res.entries ?? [])
			.filter((e) => typeof e.path === 'string')
			.map((e) => ({
				path: e.path as string,
				name: e.name?.trim() || (e.path as string).split('/').pop() || (e.path as string),
				isDir: e.isDir === true,
				sizeBytes: Number(e.sizeBytes ?? 0)
			}))
			.sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name));
		return json({ path, entries });
	} catch (error) {
		return proxyError('Ontology listing', error);
	}
};

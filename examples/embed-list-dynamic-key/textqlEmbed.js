/** Drop-in TextQL embed routes, read from a `name=value` file on every request.
 * Owns no port, no page, no process. Mounting snippets are in the README. */
import { readFile } from 'node:fs/promises';

import { parse } from 'dotenv';

import { Textql } from '@textql/sdk';
import { createEmbedHandler, EmbedError, toNodeHandler } from '@textql/sdk/embed';

const DEFAULTS = { file: 'secrets.txt', basePath: '/api/textql' };

/** A Web handler — `null` for paths that are not ours — with `.node` (connect),
 * `.GET`/`.POST` (Next.js) and `.required` (your own health check) attached. */
export function createTextqlEmbed({ file, basePath } = {}) {
	file ??= DEFAULTS.file;
	basePath ??= DEFAULTS.basePath;

	async function required(name) {
		let found;
		try {
			found = parse(await readFile(file, 'utf8'));
		} catch (cause) {
			throw new EmbedError(503, `No ${name}: ${cause.message}`);
		}

		const value = found[name]?.trim();
		if (!value) throw new EmbedError(503, `No ${name}: ${file} does not set it.`);
		return value;
	}

	// Both are functions, so the key and the allowlist rotate under a running server.
	const handler = createEmbedHandler({
		client: new Textql({ apiKey: () => required('TEXTQL_API_KEY') }),
		appIds: async () =>
			(await required('TEXTQL_APP_IDS')).split(',').map((id) => id.trim()).filter(Boolean),
		basePath: `${basePath.replace(/\/+$/, '')}/:appId`
	});

	return Object.assign(handler, { node: toNodeHandler(handler), required });
}

/** The same routes as a Vite plugin. Runs ahead of Vite's own middleware so the SPA
 * fallback cannot swallow the API; a plain object, so nothing here imports Vite. */
export function textqlEmbed(options) {
	const embed = createTextqlEmbed(options);

	// Connect style, which is what `server.middlewares` is. Errors go to `next`.
	const middleware = (req, res, next) => {
		embed.node(req, res).then((handled) => {
			if (!handled) next();
		}, next);
	};

	const use = (server) => {
		server.middlewares.use(middleware);
	};

	return { name: 'textql-embed', configureServer: use, configurePreviewServer: use, embed };
}

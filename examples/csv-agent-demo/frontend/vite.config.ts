import { createReadStream, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/** The file the workspace opens: a CSV, TSV, or Excel/ODS workbook. */
const DATA_FILE = join(homedir(), 'Downloads', 'financial_transactions_1mb.xlsx');
const DATA_ROUTE = `/local-data/${encodeURIComponent(basename(DATA_FILE))}`;

/** Serve DATA_FILE to the browser, so the workspace starts with it loaded. */
function localData(): Plugin {
	const serve = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
		if (req.url?.split('?')[0] !== DATA_ROUTE) return next();
		try {
			res.setHeader('content-length', statSync(DATA_FILE).size);
		} catch {
			res.statusCode = 404;
			res.end(`Data file not found: ${DATA_FILE}`);
			return;
		}
		res.setHeader('content-type', 'application/octet-stream');
		res.setHeader('cache-control', 'no-store');
		createReadStream(DATA_FILE).pipe(res);
	};
	return {
		name: 'local-data',
		configureServer: (server) => void server.middlewares.use(serve),
		configurePreviewServer: (server) => void server.middlewares.use(serve)
	};
}

// The shared UI package exports only its App; the alias reaches its components.
const SHARED_UI = fileURLToPath(
	new URL('./node_modules/python-react-demo-frontend/src', import.meta.url)
);

const proxy = { '/v3': { target: 'http://127.0.0.1:8789', changeOrigin: true } };

export default defineConfig({
	define: { __DATA_URL__: JSON.stringify(DATA_ROUTE), __DATA_NAME__: JSON.stringify(basename(DATA_FILE)) },
	publicDir: 'node_modules/python-react-demo-frontend/public',
	plugins: [tailwindcss(), react(), localData()],
	resolve: { alias: { '@ui': SHARED_UI }, dedupe: ['react', 'react-dom'] },
	optimizeDeps: {
		include: [
			'@pierre/diffs',
			'lucide-react',
			'marked',
			'papaparse',
			'react-router-dom',
			'sanitize-html',
			'sonner',
			'unicode-animations'
		]
	},
	css: { modules: { localsConvention: 'camelCaseOnly' } },
	server: { port: 5175, strictPort: true, proxy },
	preview: { proxy }
});

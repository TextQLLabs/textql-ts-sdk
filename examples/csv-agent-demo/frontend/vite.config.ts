import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The shared UI package exports only its App; the alias reaches its components.
const SHARED_UI = fileURLToPath(
	new URL('./node_modules/python-react-demo-frontend/src', import.meta.url)
);

const proxy = { '/v3': { target: 'http://127.0.0.1:8789', changeOrigin: true } };

export default defineConfig({
	publicDir: 'node_modules/python-react-demo-frontend/public',
	plugins: [tailwindcss(), react()],
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

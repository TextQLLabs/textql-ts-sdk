import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const DEMO_ROOT = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, DEMO_ROOT, '');
	const proxy = {
		'/v3': {
			target: env.BACKEND_URL || 'http://127.0.0.1:8787',
			changeOrigin: true
		}
	};
	return {
		envDir: DEMO_ROOT,
		publicDir: 'node_modules/python-react-demo-frontend/public',
		plugins: [tailwindcss(), react()],
		resolve: { dedupe: ['react', 'react-dom'] },
		optimizeDeps: {
			include: [
				'@pierre/diffs',
				'@xyflow/react',
				'lucide-react',
				'marked',
				'react-router-dom',
				'sanitize-html',
				'sonner',
				'unicode-animations'
			]
		},
		css: { modules: { localsConvention: 'camelCaseOnly' } },
		server: { proxy },
		preview: { proxy }
	};
});

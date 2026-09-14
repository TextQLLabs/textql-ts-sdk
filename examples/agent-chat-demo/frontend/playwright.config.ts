import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	use: { baseURL: 'http://127.0.0.1:5175', viewport: { width: 1440, height: 960 } },
	workers: 1,
	webServer: [
		{
			command: 'node tests/fixture-server.mjs',
			url: 'http://127.0.0.1:8790/health',
			reuseExistingServer: !process.env.CI
		},
		{
			command: 'BACKEND_URL=http://127.0.0.1:8790 npm run dev -- --host 127.0.0.1 --port 5175',
			url: 'http://127.0.0.1:5175',
			reuseExistingServer: false
		}
	]
});

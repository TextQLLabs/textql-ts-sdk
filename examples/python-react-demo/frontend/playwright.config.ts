import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	use: { baseURL: 'http://127.0.0.1:5176' },
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 5176',
		url: 'http://127.0.0.1:5176',
		reuseExistingServer: !process.env.CI
	}
});

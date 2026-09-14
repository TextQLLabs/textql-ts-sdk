import { expect, test } from '@playwright/test';

const csv = {
	name: 'revenue.csv',
	mimeType: 'text/csv',
	buffer: Buffer.from('month,revenue\nJanuary,12500\nFebruary,14800\n')
};

test.beforeEach(async ({ request }) => {
	await request.post('http://127.0.0.1:8790/test/reset');
});

test('full chat app uploads files, sends, reloads backend state, and creates a second chat', async ({
	page,
	request
}) => {
	await page.goto('/');
	await expect(
		page.getByRole('button', { name: 'Attach files or CSVs', exact: true })
	).toBeVisible();
	await expect(page.getByRole('button', { name: 'Composer settings' })).toHaveCount(0);
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page).toHaveURL(/\/chat\/chat-1$/);
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('attached');
	await page
		.getByRole('textbox', { name: 'Message', exact: true })
		.fill('Summarize revenue by month.');
	await page.getByRole('button', { name: 'Send message', exact: true }).click();
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText(
		'browser test fixture'
	);
	await page.reload();
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText(
		'Summarize revenue by month.'
	);
	await page.screenshot({ path: 'test-results/agent-chat-desktop.png', fullPage: true });
	await page.getByRole('button', { name: 'New chat', exact: true }).first().click();
	await page
		.getByLabel('Upload files or CSVs')
		.setInputFiles({
			name: 'notes.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from('Quarterly revenue notes.')
		});
	await expect(page).toHaveURL(/\/chat\/chat-2$/);
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('notes.txt');
	await expect(page.getByRole('list', { name: 'Attached files' })).not.toContainText('revenue.csv');
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(
		calls.filter(
			(call: { method: string; path: string }) =>
				call.method === 'POST' && call.path === '/v3/textql/chats'
		)
	).toHaveLength(2);
});

test('a failed agent attachment prevents uploads and leaves the draft available', async ({
	page
}) => {
	await page.route('**/v3/textql/chats', async (route) => {
		if (route.request().method() === 'POST')
			await route.fulfill({
				status: 502,
				json: { detail: 'Could not attach the configured agent.' }
			});
		else await route.continue();
	});
	await page.goto('/');
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Analyze this file.');
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page.getByRole('alert')).toContainText('Could not attach the configured agent.');
	await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue(
		'Analyze this file.'
	);
	await expect(page.getByRole('list', { name: 'Attached files' })).toHaveCount(0);
	await expect(page).toHaveURL('/');
});

test('upload failures are not shown as attached and can be retried', async ({ page }) => {
	let fail = true;
	await page.route('**/v3/textql/chats/*/files', async (route) => {
		if (fail && route.request().method() === 'POST') {
			fail = false;
			await route.fulfill({ status: 502, json: { detail: 'Dataset attachment failed.' } });
		} else await route.continue();
	});
	await page.goto('/');
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page.getByRole('alert')).toContainText('Dataset attachment failed.');
	await expect(page.getByRole('list', { name: 'Attached files' })).toHaveCount(0);
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
});

test('sending is blocked while an upload is in flight', async ({ page }) => {
	let release: () => void = () => {};
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route('**/v3/textql/chats/*/files', async (route) => {
		if (route.request().method() === 'POST') await pending;
		await route.continue();
	});
	await page.goto('/');
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Analyze revenue.');
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled();
	release();
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeEnabled();
});

test('missing backend configuration is visible and blocks new messages', async ({ page }) => {
	await page.route('**/v3/textql/config', (route) =>
		route.fulfill({ status: 503, json: { detail: 'Configure TEXTQL_AGENT_ID.' } })
	);
	await page.goto('/');
	await expect(page.getByRole('alert')).toContainText('Configure TEXTQL_AGENT_ID.');
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Hello');
	await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled();
});

test('multiple files retain the complete backend attachment list', async ({ page }) => {
	await page.goto('/');
	await page
		.getByLabel('Upload files or CSVs')
		.setInputFiles([
			csv,
			{
				name: 'context.txt',
				mimeType: 'text/plain',
				buffer: Buffer.from('Fiscal year starts in January.')
			}
		]);
	const files = page.getByRole('list', { name: 'Attached files' });
	await expect(files).toContainText('revenue.csv');
	await expect(files).toContainText('context.txt');
	await page.reload();
	await expect(files).toContainText('revenue.csv');
	await expect(files).toContainText('context.txt');
});

test('empty and oversized files are rejected before chat creation', async ({ page, request }) => {
	await page.goto('/');
	await page
		.getByLabel('Upload files or CSVs')
		.setInputFiles({ name: 'empty.csv', mimeType: 'text/csv', buffer: Buffer.alloc(0) });
	await expect(page.getByRole('alert')).toContainText('Choose non-empty files up to 20 MiB each.');
	await page
		.getByLabel('Upload files or CSVs')
		.setInputFiles({
			name: 'large.csv',
			mimeType: 'text/csv',
			buffer: Buffer.alloc(20 * 1024 * 1024 + 1)
		});
	await expect(page.getByRole('alert')).toContainText('Choose non-empty files up to 20 MiB each.');
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.some((call: { method: string }) => call.method === 'POST')).toBe(false);
});

test('text-only conversations also create a new backend chat each time', async ({
	page,
	request
}) => {
	await page.goto('/');
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('First conversation.');
	await page.getByRole('button', { name: 'Send message', exact: true }).click();
	await expect(page).toHaveURL(/\/chat\/chat-1$/);
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText(
		'browser test fixture'
	);
	await page.getByRole('button', { name: 'New chat', exact: true }).first().click();
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Second conversation.');
	await page.getByRole('button', { name: 'Send message', exact: true }).click();
	await expect(page).toHaveURL(/\/chat\/chat-2$/);
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(
		calls.filter(
			(call: { method: string; path: string }) =>
				call.method === 'POST' && call.path === '/v3/textql/chats'
		)
	).toHaveLength(2);
});

test('leaving an uploading chat does not put its files in the next chat', async ({ page }) => {
	let release: () => void = () => {};
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route('**/v3/textql/chats/chat-1/files', async (route) => {
		if (route.request().method() === 'POST') await pending;
		await route.continue().catch(() => {});
	});
	await page.goto('/');
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page).toHaveURL(/\/chat\/chat-1$/);
	await page.getByRole('button', { name: 'New chat', exact: true }).first().click();
	await expect(
		page.getByRole('button', { name: 'Attach files or CSVs', exact: true })
	).toBeEnabled();
	release();
	await page
		.getByLabel('Upload files or CSVs')
		.setInputFiles({
			name: 'next.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from('A different conversation.')
		});
	await expect(page).toHaveURL(/\/chat\/chat-2$/);
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('next.txt');
	await expect(page.getByRole('list', { name: 'Attached files' })).not.toContainText('revenue.csv');
});

test('mobile layout keeps the upload control accessible', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	await expect(
		page.getByRole('button', { name: 'Attach files or CSVs', exact: true })
	).toBeVisible();
	await page.screenshot({ path: 'test-results/agent-chat-mobile.png', fullPage: true });
});

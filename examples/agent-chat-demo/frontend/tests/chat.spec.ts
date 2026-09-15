import { expect, test, type Page } from '@playwright/test';

const csv = {
	name: 'revenue.csv',
	mimeType: 'text/csv',
	buffer: Buffer.from('month,revenue\nJanuary,12500\nFebruary,14800\n')
};

test.beforeEach(async ({ request }) => {
	await request.post('http://127.0.0.1:8790/test/reset');
});

for (const [model, label] of [
	['MODEL_OPUS_4_8', 'Claude Opus 4.8'],
	['MODEL_OPUS_5', 'Claude Opus 5'],
	['MODEL_SONNET_5', 'Claude Sonnet 5'],
	['MODEL_UNKNOWN', 'Agent default']
]) {
	test(`displays ${label} from agent config without sending a model override`, async ({ page }) => {
		await page.route('**/v3/textql/config', async (route) => {
			const response = await route.fetch();
			await route.fulfill({ json: { ...(await response.json()), model } });
		});
		await page.goto('/');
		await expect(page.getByLabel(`Model: ${label}`, { exact: true })).toBeVisible();
		await expect(page.getByRole('combobox')).toHaveCount(0);
		await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Hello');
		const created = page.waitForRequest((request) =>
			request.method() === 'POST' && new URL(request.url()).pathname === '/v3/textql/chats'
		);
		const sent = page.waitForRequest((request) =>
			request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/send')
		);
		await page.getByRole('button', { name: 'Send message', exact: true }).click();
		expect((await created).postDataJSON()).not.toHaveProperty('model');
		expect((await sent).postDataJSON()).not.toHaveProperty('model');
		await expect(page.getByLabel(`Model: ${label}`, { exact: true })).toBeVisible();
	});
}


async function send(page: Page, message = 'Summarize revenue.') {
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill(message);
	await page.getByRole('button', { name: 'Send message', exact: true }).click();
}

async function uploaded(page: Page) {
	await page.goto('/');
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toContainText('revenue.csv');
}

test('upload finishes without creating a chat, attaching, or sending', async ({ page, request }) => {
	await uploaded(page);
	await expect(page).toHaveURL('/');
	await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled();
	await expect(page.getByRole('list', { name: 'Attached files' })).toHaveCount(0);
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.filter((call: { method: string }) => call.method === 'POST').map((call: { path: string }) => call.path))
		.toEqual(['/v3/textql/files']);
	await page.getByRole('button', { name: 'Remove revenue.csv' }).click();
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toHaveCount(0);
});

test('Send waits for attachment to finish, then sends exactly the user message', async ({ page, request }) => {
	await uploaded(page);
	let release!: () => void;
	const pending = new Promise<void>((resolve) => { release = resolve; });
	await page.route('**/files/attach', async (route) => {
		await pending;
		await route.continue();
	});
	await send(page, 'Analyze my CSV.');
	await expect(page.getByText('Preparing files for your message…')).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('Analyze my CSV.');
	await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled();
	let calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.some((call: { path: string }) => call.path.endsWith('/send'))).toBe(false);
	release();
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText('browser test fixture');
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toHaveCount(0);
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	const posts = calls.filter((call: { method: string }) => call.method === 'POST');
	expect(posts.map((call: { path: string }) => call.path)).toEqual([
		'/v3/textql/files', '/v3/textql/chats', '/v3/textql/chats/chat-1/files/attach', '/v3/textql/chats/chat-1/send'
	]);
	expect(posts.at(-1).body.message).toBe('Analyze my CSV.');
	await page.reload();
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toHaveCount(0);
});

test('failed preparation retains the file and message without sending; retry succeeds', async ({ page, request }) => {
	await uploaded(page);
	let fail = true;
	await page.route('**/files/attach', async (route) => {
		if (fail) { fail = false; await route.fulfill({ status: 502, json: { detail: 'File preparation failed.' } }); }
		else await route.continue();
	});
	await send(page, 'Keep this message.');
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText('File preparation failed.');
	await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('Keep this message.');
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toContainText('revenue.csv');
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.some((call: { path: string }) => call.path.endsWith('/send'))).toBe(false);
	await page.getByRole('button', { name: 'Send message', exact: true }).click();
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText('browser test fixture');
});

test('partial preparation keeps completed attachments and retries only remaining files', async ({ page, request }) => {
	await page.goto('/');
	await page.getByLabel('Upload files or CSVs').setInputFiles([csv, { ...csv, name: 'second.csv' }]);
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toContainText('second.csv');
	let fail = true;
	await page.route('**/files/attach', async (route) => {
		if (fail && route.request().postDataJSON().dataset_id === 'file-2') {
			fail = false;
			await route.fulfill({ status: 502, json: { detail: 'Second file failed.' } });
		} else await route.continue();
	});
	await send(page);
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText('Second file failed.');
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	await expect(page.getByRole('list', { name: 'Uploaded files' })).not.toContainText('revenue.csv');
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toContainText('second.csv');
	await page.getByRole('button', { name: 'Send message', exact: true }).click();
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText('browser test fixture');
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.filter((call: { path: string; body?: { dataset_id: string } }) => call.path.endsWith('/attach') && call.body?.dataset_id === 'file-1')).toHaveLength(1);
});

test('failed chat creation preserves pending uploads and draft', async ({ page }) => {
	await uploaded(page);
	await page.route('**/v3/textql/chats', async (route) => {
		if (route.request().method() === 'POST') await route.fulfill({ status: 502, json: { detail: 'Agent attachment failed.' } });
		else await route.continue();
	});
	await send(page, 'Analyze this.');
	await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('Analyze this.');
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toContainText('revenue.csv');
});

test('upload failure is visible and earlier uploads remain pending', async ({ page }) => {
	let count = 0;
	await page.route('**/v3/textql/files', async (route) => {
		if (++count === 2) await route.fulfill({ status: 502, json: { detail: 'Storage unavailable.' } });
		else await route.continue();
	});
	await page.goto('/');
	await page.getByLabel('Upload files or CSVs').setInputFiles([csv, { ...csv, name: 'second.csv' }]);
	await expect(page.getByRole('alert')).toContainText('Storage unavailable.');
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toContainText('revenue.csv');
	await expect(page.getByRole('list', { name: 'Uploaded files' })).not.toContainText('second.csv');
	await page.getByLabel('Upload files or CSVs').setInputFiles({ ...csv, name: 'second.csv' });
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toContainText('second.csv');
});

test('send is blocked during upload and navigating away discards the pending draft', async ({ page, request }) => {
	let release!: () => void;
	const pending = new Promise<void>((resolve) => { release = resolve; });
	await page.route('**/v3/textql/files', async (route) => { await pending; await route.continue().catch(() => {}); });
	await page.goto('/');
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Wait for this file');
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled();
	await page.getByRole('button', { name: 'New chat', exact: true }).first().click();
	release();
	await expect(page.getByLabel('Upload files or CSVs')).toBeEnabled();
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toHaveCount(0);
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.some((call: { path: string }) => call.path.endsWith('/send'))).toBe(false);
});

test('canceling preparation by navigating away never sends the old message', async ({ page, request }) => {
	await uploaded(page);
	let release!: () => void;
	const pending = new Promise<void>((resolve) => { release = resolve; });
	await page.route('**/files/attach', async (route) => { await pending; await route.continue().catch(() => {}); });
	await send(page, 'Do not send after leaving');
	await expect(page.getByText('Preparing files for your message…')).toBeVisible();
	await page.getByRole('button', { name: 'New chat', exact: true }).first().click();
	release();
	await expect(page).toHaveURL('/');
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toHaveCount(0);
	await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('');
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.some((call: { path: string }) => call.path.endsWith('/send'))).toBe(false);
});

test('files in an existing chat are also staged until the next user message', async ({ page, request }) => {
	await page.goto('/');
	await send(page, 'First message');
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText('browser test fixture');
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toContainText('revenue.csv');
	let calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.some((call: { path: string }) => call.path.endsWith('/attach'))).toBe(false);
	await send(page, 'Analyze the new file');
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toHaveCount(0);
});

test('multiple file types render durable previews after sending on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByLabel('Upload files or CSVs').setInputFiles([
		csv,
		{ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('notes') },
		{ name: 'report.pdf', mimeType: 'application/pdf', buffer: Buffer.from('fixture') },
		{ name: 'chart.png', mimeType: 'image/png', buffer: Buffer.from('fixture') }
	]);
	await expect(page.getByRole('list', { name: 'Uploaded files' }).getByRole('listitem')).toHaveCount(4);
	await page.screenshot({ path: 'test-results/pending-files-mobile.png', fullPage: true });
	await send(page);
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText('browser test fixture');
	await page.reload();
	const files = page.getByRole('list', { name: 'Attached files' });
	await expect(files.getByRole('listitem')).toHaveCount(4);
	await expect(files.getByRole('img', { name: 'Preview of chart.png' })).toHaveJSProperty('naturalWidth', 240);
	await expect(files.getByRole('img', { name: 'Preview of report.pdf' })).toHaveJSProperty('naturalWidth', 240);
	await expect(page.getByLabel('Model: Claude Opus 4.8', { exact: true })).toBeVisible();
	await page.screenshot({ path: 'test-results/attached-files-mobile.png', fullPage: true });
});

test('empty and oversized files fail before any upload request', async ({ page, request }) => {
	await page.goto('/');
	for (const buffer of [Buffer.alloc(0), Buffer.alloc(20 * 1024 * 1024 + 1)]) {
		await page.getByLabel('Upload files or CSVs').setInputFiles({ ...csv, buffer });
		await expect(page.getByRole('alert')).toContainText('Choose non-empty files up to 20 MiB each.');
	}
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.some((call: { method: string }) => call.method === 'POST')).toBe(false);
});

test('drag and drop stages files without sending', async ({ page, request }) => {
	await page.goto('/');
	await expect(page.getByLabel('Upload files or CSVs')).toBeEnabled();
	const transfer = await page.evaluateHandle(() => {
		const data = new DataTransfer();
		data.items.add(new File(['a,b\n1,2'], 'dropped.csv', { type: 'text/csv' }));
		return data;
	});
	await page.locator('.composer-shell').dispatchEvent('dragenter', { dataTransfer: transfer });
	await expect(page.getByText('Drop files to attach', { exact: true })).toBeVisible();
	await page.locator('.composer-shell').dispatchEvent('drop', { dataTransfer: transfer });
	await expect(page.getByRole('list', { name: 'Uploaded files' })).toContainText('dropped.csv');
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.some((call: { path: string }) => call.path.endsWith('/send'))).toBe(false);
	await transfer.dispose();
});

test('missing agent configuration still blocks sending', async ({ page }) => {
	await page.route('**/v3/textql/config', (route) => route.fulfill({ status: 503, json: { detail: 'Configure TEXTQL_AGENT_ID.' } }));
	await page.goto('/');
	await expect(page.getByRole('alert')).toContainText('Configure TEXTQL_AGENT_ID.');
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Hello');
	await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled();
});

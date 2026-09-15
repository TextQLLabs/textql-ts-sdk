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

test('full chat app uploads files, sends, reloads backend state, and creates a second chat', async ({
	page,
	request
}) => {
	await page.goto('/');
	await expect(
		page.getByRole('button', { name: 'Attach files or CSVs', exact: true })
	).toBeVisible();
	await expect(page.getByRole('button', { name: 'Composer settings' })).toHaveCount(0);
	await expect(page.locator('.composer-shell')).not.toContainText('Drop files here');
	await expect(page.locator('.composer-shell')).not.toContainText('20 MiB per file');
	const avatar = page.getByRole('img', { name: 'Demo analyst (test fixture) profile picture' });
	await expect(avatar).toBeVisible();
	await expect(avatar).toHaveJSProperty('naturalWidth', 240);
	await expect(page.locator('.composer-shell')).toContainText('@Demo analyst (test fixture)');
	await page.screenshot({ path: 'test-results/agent-wrapper.png', fullPage: true });
	const picker = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'Attach files or CSVs', exact: true }).click();
	await (await picker).setFiles(csv);
	await expect(page).toHaveURL(/\/chat\/chat-1$/);
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('attached');
	await expect(page.locator('.composer-shell')).not.toContainText('revenue.csv');
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText('revenue.csv');
	await expect(
		page.getByRole('list', { name: 'Attached files' }).getByRole('listitem')
	).toHaveCount(1);
	await page
		.getByRole('textbox', { name: 'Message', exact: true })
		.fill('Summarize revenue by month.');
	await page.getByRole('button', { name: 'Send message', exact: true }).click();
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText(
		'browser test fixture'
	);
	await expect(
		page.getByRole('list', { name: 'Attached files' }).getByRole('listitem')
	).toHaveCount(1);
	await page.reload();
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	await expect(page.locator('.composer-shell')).not.toContainText('revenue.csv');
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText(
		'Summarize revenue by month.'
	);
	await page.screenshot({ path: 'test-results/agent-chat-desktop.png', fullPage: true });
	await page.getByRole('button', { name: 'New chat', exact: true }).first().click();
	await page.getByLabel('Upload files or CSVs').setInputFiles({
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
	await page.getByLabel('Upload files or CSVs').setInputFiles([
		csv,
		{
			name: 'context.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from('Fiscal year starts in January.')
		},
		{ name: 'report.pdf', mimeType: 'application/pdf', buffer: Buffer.from('test fixture') },
		{ name: 'chart.png', mimeType: 'image/png', buffer: Buffer.from('test fixture') }
	]);
	const files = page.getByRole('list', { name: 'Attached files' });
	await expect(files).toContainText('revenue.csv');
	await expect(files).toContainText('context.txt');
	await expect(files).toContainText('report.pdf');
	await expect(files).toContainText('chart.png');
	for (const name of ['report.pdf', 'chart.png']) {
		const thumbnail = files.getByRole('img', { name: `Preview of ${name}` });
		await expect(thumbnail).toBeVisible();
		await expect(thumbnail).toHaveJSProperty('naturalWidth', 240);
		const bounds = await files.getByRole('button', { name: `Open ${name}` }).boundingBox();
		expect(bounds?.width).toBeLessThanOrEqual(160);
		expect(bounds?.height).toBeLessThan(180);
	}
	await expect(files).not.toContainText('http://');
	await expect(files).not.toContainText('Pages');
	await expect(page.getByLabel('Preview panel', { exact: true })).toHaveCount(0);
	await page.screenshot({ path: 'test-results/inline-file-previews.png', fullPage: true });
	await page.reload();
	await expect(files).toContainText('revenue.csv');
	await expect(files).toContainText('context.txt');
	await expect(files).toContainText('report.pdf');
	await expect(files).toContainText('chart.png');
	for (const name of ['report.pdf', 'chart.png']) {
		const thumbnail = files.getByRole('img', { name: `Preview of ${name}` });
		await expect(thumbnail).toBeVisible();
		await expect(thumbnail).toHaveJSProperty('naturalWidth', 240);
		const bounds = await files.getByRole('button', { name: `Open ${name}` }).boundingBox();
		expect(bounds?.width).toBeLessThanOrEqual(160);
		expect(bounds?.height).toBeLessThan(180);
	}
	await expect(files).not.toContainText('http://');
	await expect(files).not.toContainText('Pages');
	await expect(page.getByLabel('Preview panel', { exact: true })).toHaveCount(0);
	await page.screenshot({ path: 'test-results/inline-file-previews.png', fullPage: true });
	await files.getByRole('button', { name: 'Open report.pdf' }).click();
	const pdfFrame = page.getByLabel('Preview panel', { exact: true }).locator('iframe');
	await expect(pdfFrame).toHaveAttribute('title', 'report.pdf');
	await expect(pdfFrame).not.toHaveAttribute('sandbox');
	await files.getByRole('button', { name: 'Open chart.png' }).click();
	await expect(page.getByLabel('Preview panel', { exact: true })).toBeVisible();
	await expect(page.getByLabel('Preview panel', { exact: true }).locator('img')).toHaveJSProperty(
		'naturalWidth',
		240
	);
});

test('empty and oversized files are rejected before chat creation', async ({ page, request }) => {
	await page.goto('/');
	await page
		.getByLabel('Upload files or CSVs')
		.setInputFiles({ name: 'empty.csv', mimeType: 'text/csv', buffer: Buffer.alloc(0) });
	await expect(page.getByRole('alert')).toContainText('Choose non-empty files up to 20 MiB each.');
	await page.getByLabel('Upload files or CSVs').setInputFiles({
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
	await page.getByLabel('Upload files or CSVs').setInputFiles({
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
	await expect(page.getByLabel('Model: Claude Opus 4.8', { exact: true })).toBeVisible();
	await page.screenshot({ path: 'test-results/agent-chat-mobile.png', fullPage: true });
});

async function dragFiles(page: Page, names: string[]) {
	return page.evaluateHandle((names) => {
		const transfer = new DataTransfer();
		for (const name of names)
			transfer.items.add(new File(['month,revenue\nJan,100\n'], name, { type: 'text/csv' }));
		return transfer;
	}, names);
}

test('drop multiple files onto the composer, keep nested highlight, and preserve attachments', async ({
	page,
	request
}) => {
	await page.goto('/');
	await expect(page.getByLabel('Upload files or CSVs')).toBeEnabled();
	const transfer = await dragFiles(page, ['dropped.csv', 'second.csv']);
	const composer = page.locator('.composer-shell');
	const message = page.getByRole('textbox', { name: 'Message', exact: true });
	await composer.dispatchEvent('dragenter', { dataTransfer: transfer });
	await expect(page.getByText('Drop files to attach', { exact: true })).toBeVisible();
	await message.dispatchEvent('dragenter', { dataTransfer: transfer });
	await composer.dispatchEvent('dragleave', { dataTransfer: transfer });
	await expect(page.getByText('Drop files to attach', { exact: true })).toBeVisible();
	await message.dispatchEvent('drop', { dataTransfer: transfer });
	await expect(page.getByText('Drop files to attach', { exact: true })).toHaveCount(0);
	const files = page.getByRole('list', { name: 'Attached files' });
	await expect(files).toContainText('dropped.csv');
	await expect(files).toContainText('second.csv');
	const uploadCalls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(
		uploadCalls.filter(
			(call: { method: string; path: string }) =>
				call.method === 'GET' && call.path.endsWith('/files')
		)
	).toHaveLength(0);
	await page.reload();
	await expect(files).toContainText('dropped.csv');
	await expect(files).toContainText('second.csv');
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(
		calls.filter(
			(call: { method: string; path: string }) =>
				call.method === 'POST' && call.path === '/v3/textql/chats'
		)
	).toHaveLength(1);
	expect(
		calls.filter(
			(call: { method: string; path: string }) =>
				call.method === 'POST' && call.path.endsWith('/files')
		)
	).toHaveLength(2);
	await transfer.dispose();
});

test('a second drop during upload is blocked and text dragging stays native', async ({
	page,
	request
}) => {
	let release: () => void = () => {};
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route('**/v3/textql/chats/*/files', async (route) => {
		if (route.request().method() === 'POST') await pending;
		await route.continue();
	});
	await page.goto('/');
	await expect(page.getByLabel('Upload files or CSVs')).toBeEnabled();
	const composer = page.locator('.composer-shell');
	const transfer = await dragFiles(page, ['first.csv']);
	await composer.dispatchEvent('drop', { dataTransfer: transfer });
	await expect(page.getByLabel('Upload files or CSVs')).toBeDisabled();
	const second = await dragFiles(page, ['should-not-upload.csv']);
	await composer.dispatchEvent('dragenter', { dataTransfer: second });
	await expect(page.getByText('Wait for the current operation to finish')).toBeVisible();
	await composer.dispatchEvent('drop', { dataTransfer: second });
	release();
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('first.csv');
	await expect(page.getByLabel('Upload files or CSVs')).toBeEnabled();
	const prevented = await composer.evaluate((element) => {
		const transfer = new DataTransfer();
		transfer.setData('text/plain', 'ordinary text');
		const event = new DragEvent('drop', {
			dataTransfer: transfer,
			bubbles: true,
			cancelable: true
		});
		element.dispatchEvent(event);
		return event.defaultPrevented;
	});
	expect(prevented).toBe(false);
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(
		calls.filter(
			(call: { method: string; path: string }) =>
				call.method === 'POST' && call.path.endsWith('/files')
		)
	).toHaveLength(1);
	await transfer.dispose();
	await second.dispose();
});

test('empty dropped files are rejected and leaving composer clears highlight', async ({
	page,
	request
}) => {
	await page.goto('/');
	await expect(page.getByLabel('Upload files or CSVs')).toBeEnabled();
	const composer = page.locator('.composer-shell');
	const transfer = await page.evaluateHandle(() => {
		const transfer = new DataTransfer();
		transfer.items.add(new File([], 'empty.csv', { type: 'text/csv' }));
		return transfer;
	});
	await composer.dispatchEvent('dragenter', { dataTransfer: transfer });
	await expect(page.getByText('Drop files to attach', { exact: true })).toBeVisible();
	await composer.dispatchEvent('dragleave', { dataTransfer: transfer });
	await expect(page.getByText('Drop files to attach', { exact: true })).toHaveCount(0);
	await composer.dispatchEvent('drop', { dataTransfer: transfer });
	await expect(page.getByRole('alert')).toContainText('Choose non-empty files up to 20 MiB each.');
	const calls = await (await request.get('http://127.0.0.1:8790/test/calls')).json();
	expect(calls.some((call: { method: string }) => call.method === 'POST')).toBe(false);
	await transfer.dispose();
});

test('a stale file-list response cannot overwrite a completed upload', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel('Upload files or CSVs').setInputFiles(csv);
	await expect(page.getByRole('list', { name: 'Attached files' })).toContainText('revenue.csv');
	let release: () => void = () => {};
	let started: () => void = () => {};
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	const loading = new Promise<void>((resolve) => {
		started = resolve;
	});
	await page.route('**/v3/textql/chats/*/files', async (route) => {
		if (route.request().method() === 'GET') {
			started();
			await pending;
			await route.fulfill({ json: { files: [] } });
		} else await route.continue();
	});
	await page.reload();
	await loading;
	const transfer = await dragFiles(page, ['new.csv']);
	await page.locator('.composer-shell').dispatchEvent('drop', { dataTransfer: transfer });
	const files = page.getByRole('list', { name: 'Attached files' });
	await expect(files).toContainText('new.csv');
	release();
	await expect(files).toContainText('revenue.csv');
	await expect(files).toContainText('new.csv');
	await transfer.dispose();
});

test('a completed upload appears in the conversation while a later file is still pending', async ({
	page
}) => {
	let release: () => void = () => {};
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	let uploads = 0;
	await page.route('**/v3/textql/chats/*/files', async (route) => {
		if (route.request().method() === 'POST' && ++uploads === 2) {
			await pending;
			await route.fulfill({ status: 502, json: { detail: 'Second file failed.' } });
		} else await route.continue();
	});
	await page.goto('/');
	await page
		.getByLabel('Upload files or CSVs')
		.setInputFiles([
			csv,
			{ name: 'second.csv', mimeType: 'text/csv', buffer: Buffer.from('value\n1') }
		]);
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText('revenue.csv');
	await expect(page.locator('.composer-shell')).not.toContainText('revenue.csv');
	await expect(page.getByLabel('Upload files or CSVs')).toBeDisabled();
	release();
	await expect(page.getByRole('alert')).toContainText('Second file failed.');
	await expect(
		page.getByRole('list', { name: 'Attached files' }).getByRole('listitem')
	).toHaveCount(1);
	await page.reload();
	await expect(page.getByRole('region', { name: 'Chat messages' })).toContainText('revenue.csv');
	await expect(page.locator('.composer-shell')).not.toContainText('revenue.csv');
});

test('broken thumbnails and avatar keep compact readable fallbacks', async ({ page }) => {
	await page.route('**/test/thumbnail.svg*', (route) => route.fulfill({ status: 404, body: '' }));
	await page.goto('/');
	await expect(
		page.getByRole('img', { name: 'Demo analyst (test fixture) profile picture' })
	).toHaveAttribute('viewBox', '0 0 100 100');
	await page.getByLabel('Upload files or CSVs').setInputFiles({
		name: 'report.pdf',
		mimeType: 'application/pdf',
		buffer: Buffer.from('fixture')
	});
	const files = page.getByRole('list', { name: 'Attached files' });
	await expect(files).toContainText('Preview unavailable');
	await expect(files).toContainText('report.pdf');
	await expect(files).not.toContainText('http://');
	await expect(files.getByRole('img')).toHaveCount(0);
});

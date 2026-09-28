import { expect, test, type Page } from '@playwright/test';

import { CHAT_METHODOLOGIES } from '../src/lib/chatMethodologies';

test.beforeEach(async ({ page }) => {
	await page.route('**/v3/textql/**', async (route) => {
		const request = route.request();
		const path = new URL(request.url()).pathname;
		if (path.endsWith('/send')) {
			await route.fulfill({
				contentType: 'text/event-stream',
				body: 'data: {"type":"runComplete","runComplete":{"finalCellId":"last-cell"}}\n\n'
			});
			return;
		}
		const payload = path.endsWith('/config')
			? { app_url: 'https://textql.example' }
			: path.endsWith('/connectors')
				? { connectors: [{ id: 123, name: 'Demo data', type: 'POSTGRES' }] }
				: path.endsWith('/history')
					? { cells: [] }
					: request.method() === 'POST'
						? { chat_id: 'test-chat' }
						: { chats: [] };
		await route.fulfill({ json: payload });
	});
});

async function openMethodology(page: Page) {
	await page.getByRole('button', { name: 'Composer settings', exact: true }).click();
	await page.getByRole('menuitem', { name: /^Methodology/ }).click();
}

async function createChat(page: Page) {
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Analyze the data.');
	const created = page.waitForRequest(
		(request) =>
			request.method() === 'POST' && new URL(request.url()).pathname === '/v3/textql/chats'
	);
	await page.getByRole('button', { name: 'Send message', exact: true }).click();
	return (await created).postDataJSON();
}

for (const { id, label } of CHAT_METHODOLOGIES) {
	test(`sends ${label} when creating a chat`, async ({ page }) => {
		await page.goto('/');
		await openMethodology(page);
		await page.getByRole('menuitemradio', { name: label, exact: true }).click();
		await page.reload();
		await openMethodology(page);
		await expect(page.getByRole('menuitemradio', { name: label, exact: true })).toHaveAttribute(
			'aria-checked',
			'true'
		);
		await page.keyboard.press('Escape');
		await page.keyboard.press('Escape');
		const request = await createChat(page);
		if (id === 'METHODOLOGY_UNKNOWN') {
			expect(request).not.toHaveProperty('methodology');
		} else {
			expect(request.methodology).toBe(id);
		}
		await expect(page.getByRole('button', { name: 'Composer settings', exact: true })).toHaveCount(
			0
		);
	});
}

for (const methodology of [undefined, null, 'INVALID_METHODOLOGY']) {
	test(`preserves legacy preferences with methodology ${methodology}`, async ({ page }) => {
		await page.addInitScript((methodology) => {
			localStorage.setItem(
				'textql-python-demo:last-config',
				JSON.stringify({
					model: 'MODEL_OPUS_4_8',
					connectorIds: [123],
					methodology
				})
			);
		}, methodology);
		await page.goto('/');
		const request = await createChat(page);
		expect(request).not.toHaveProperty('methodology');
		expect(request.model).toBe('MODEL_OPUS_4_8');
		expect(request.connector_ids).toEqual([123]);
	});
}

test('keeps methodology on the chat and can restore the server default', async ({ page }) => {
	const created: unknown[] = [];
	const sent: Record<string, unknown>[] = [];
	page.on('request', (request) => {
		if (request.method() !== 'POST') return;
		const path = new URL(request.url()).pathname;
		if (path === '/v3/textql/chats') created.push(request.postDataJSON());
		if (path.endsWith('/send')) sent.push(request.postDataJSON());
	});
	await page.goto('/');
	await openMethodology(page);
	await page.getByRole('menuitemradio', { name: 'Thorough', exact: true }).click();
	await createChat(page);
	await expect.poll(() => sent.length).toBe(1);
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Now explain the result.');
	await page.getByRole('button', { name: 'Send message', exact: true }).click();
	await expect.poll(() => sent.length).toBe(2);
	expect(created).toHaveLength(1);
	for (const request of sent) expect(request).not.toHaveProperty('methodology');
	await page.goto('/');
	await openMethodology(page);
	await expect(page.getByRole('menuitemradio', { name: 'Thorough', exact: true })).toHaveAttribute(
		'aria-checked',
		'true'
	);
	await page.getByRole('menuitemradio', { name: 'Server default', exact: true }).click();
	expect(await createChat(page)).not.toHaveProperty('methodology');
	expect(created).toHaveLength(2);
});

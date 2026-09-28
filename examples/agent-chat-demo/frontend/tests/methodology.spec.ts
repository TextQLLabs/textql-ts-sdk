import { expect, test } from '@playwright/test';

test('keeps saved methodology out of agent-controlled chats', async ({ page, request }) => {
	await request.post('http://127.0.0.1:8790/test/reset');
	await page.addInitScript(() => {
		localStorage.setItem(
			'textql-python-demo:last-config',
			JSON.stringify({
				model: 'MODEL_OPUS_4_8',
				connectorIds: [123],
				methodology: 'METHODOLOGY_THOROUGH'
			})
		);
	});
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Composer settings', exact: true })).toHaveCount(0);
	await expect(page.getByRole('menu', { name: 'Methodology', exact: true })).toHaveCount(0);
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Analyze the data.');
	const created = page.waitForRequest(
		(request) =>
			request.method() === 'POST' && new URL(request.url()).pathname === '/v3/textql/chats'
	);
	const sent = page.waitForRequest(
		(request) => request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/send')
	);
	await page.getByRole('button', { name: 'Send message', exact: true }).click();
	for (const request of [await created, await sent]) {
		expect(request.postDataJSON()).not.toHaveProperty('methodology');
		expect(request.postDataJSON()).not.toHaveProperty('model');
	}
});

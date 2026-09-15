import { createServer } from 'node:http';

let chats = [];
let files = {};
let histories = {};
let calls = [];
createServer(async (req, res) => {
	const url = new URL(req.url, 'http://127.0.0.1');
	const path = url.pathname;
	const chunks = [];
	for await (const chunk of req) chunks.push(chunk);
	const body = Buffer.concat(chunks).toString();
	const json = (value, status = 200) => {
		res.writeHead(status, { 'content-type': 'application/json' });
		res.end(JSON.stringify(value));
	};
	if (path === '/test/thumbnail.svg') {
		res.writeHead(200, { 'content-type': 'image/svg+xml' });
		return res.end(
			'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180"><rect width="240" height="180" fill="white"/><rect x="24" y="20" width="140" height="10" rx="3" fill="#00845d"/><path d="M24 50H210 M24 70H210 M24 90H150" stroke="#d1d5db" stroke-width="5"/><rect x="24" y="115" width="40" height="40" fill="#83b7a4"/><rect x="80" y="100" width="40" height="55" fill="#00845d"/></svg>'
		);
	}
	if (path === '/health') return json({ status: 'test fixture' });
	if (path === '/test/reset') {
		chats = [];
		files = {};
		histories = {};
		calls = [];
		return json({ ok: true });
	}
	if (path === '/test/calls') return json(calls);
	calls.push({ method: req.method, path });
	if (path.endsWith('/config'))
		return json({
			email: null,
			agent_id: 'test-agent',
			agent_name: 'Demo analyst (test fixture)',
			model: 'MODEL_OPUS_4_8',
			agent_profile_image_url: 'http://127.0.0.1:8790/test/thumbnail.svg',
			uploads_enabled: true
		});
	if (path.endsWith('/connectors')) return json({ connectors: [] });
	if (path.endsWith('/chats/members')) return json({ members: [] });
	if (path.endsWith('/chats')) {
		if (req.method === 'POST') {
			const id = `chat-${chats.length + 1}`;
			chats.unshift({
				id,
				summary: 'File analysis',
				is_running: false,
				updated_at: '2026-09-14T12:00:00Z'
			});
			return json({ chat_id: id });
		}
		return json({ chats, threads: chats, totalCount: chats.length, hasMore: false });
	}
	const match = path.match(/\/chats\/([^/]+)(?:\/(files|history|send))?$/);
	if (!match) return json({ detail: `Unhandled test route: ${path}` }, 404);
	const [, id, action] = match;
	if (req.method === 'DELETE') return json({ closed: true });
	if (action === 'history') return json({ cells: histories[id] ?? [] });
	if (action === 'files') {
		if (req.method === 'POST') {
			const name = body.match(/filename="([^"]+)"/)?.[1];
			if (!name) return json({ detail: 'Missing file' }, 400);
			files[id] ??= [];
			const datasetId = `file-${files[id].length + 1}`;
			const cell = {
				id: `${id}-${datasetId}`,
				complete: true,
				...(/\.(txt|md)$/i.test(name)
					? {
							textCell: {
								fileName: name,
								datasetSourceId: datasetId,
								content: 'Uploaded text content.'
							}
						}
					: /\.pdf$/i.test(name)
						? {
								documentCell: {
									name,
									datasetSourceId: datasetId,
									url: 'https://textqlusercontent.com/asset/proxy/report.pdf',
									preview: 'http://127.0.0.1:8790/test/thumbnail.svg?signature=test'
								}
							}
						: /\.png$/i.test(name)
							? {
									imageCell: {
										name,
										datasetSourceId: datasetId,
										url: 'http://127.0.0.1:8790/test/thumbnail.svg'
									}
								}
							: { tabularFileCell: { fileName: name, datasetSourceId: datasetId } })
			};
			files[id].push({ id: datasetId, name, status: 'attached', cell_id: cell.id, cell });
			histories[id] = [...(histories[id] ?? []), cell];
		}
		return json({ files: files[id] ?? [] });
	}
	if (action === 'send') {
		const message = JSON.parse(body).message;
		const user = { id: `${id}-user`, mdCell: { content: message }, complete: true };
		const answer = {
			id: `${id}-answer`,
			generated: true,
			mdCell: {
				content:
					'The uploaded CSV is attached to this conversation. This response is from the browser test fixture, not a live TextQL run.'
			},
			complete: true
		};
		histories[id] = [...(histories[id] ?? []), user, answer];
		res.writeHead(200, { 'content-type': 'text/event-stream' });
		for (const event of [
			{ type: 'runStarted', runStarted: {} },
			...(files[id] ?? []).map((file) => ({ type: 'cell', cell: file.cell })),
			{ type: 'cell', cell: answer },
			{ type: 'runComplete', runComplete: { finalCellId: answer.id } }
		]) {
			res.write(`data: ${JSON.stringify(event)}\n\n`);
		}
		return res.end();
	}
	return json({ detail: 'Unhandled test action' }, 404);
}).listen(8790, '127.0.0.1');

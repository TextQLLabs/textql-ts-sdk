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
			files[id].push({ id: `file-${files[id].length + 1}`, name, status: 'attached' });
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
			{ type: 'cell', cell: answer },
			{ type: 'runComplete', runComplete: { finalCellId: answer.id } }
		]) {
			res.write(`data: ${JSON.stringify(event)}\n\n`);
		}
		return res.end();
	}
	return json({ detail: 'Unhandled test action' }, 404);
}).listen(8790, '127.0.0.1');

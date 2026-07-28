import { isConnectError, proxyError, textqlClients } from '$lib/server/textql';
import { json } from '@sveltejs/kit';
import { z } from 'zod';

import type { RequestHandler } from './$types';

const AnswerSchema = z.object({
	selected: z.array(z.string()).default([]),
	custom: z.string().optional(),
	inputs: z.array(z.string()).default([]),
	provided: z.array(z.boolean()).default([])
});

const BodySchema = z.object({
	action: z.enum(['submit', 'dismiss']),
	cellId: z.string().trim().min(1, 'cellId is required.'),
	answers: z.array(AnswerSchema).default([])
});

export const POST: RequestHandler = async ({ request }) => {
	const { client } = textqlClients();

	const parsed = BodySchema.safeParse(await request.json().catch(() => undefined));
	if (!parsed.success) {
		return json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body.' }, { status: 400 });
	}
	const { action, cellId, answers } = parsed.data;

	try {
		const res =
			action === 'submit'
				? await client.chats.submitQuestions({ body: { cellId, answers } })
				: await client.chats.dismissQuestions({ body: { cellId, answers } });
		if (isConnectError(res)) {
			return json(
				{ error: res.message ?? 'The chat service rejected the answers.' },
				{ status: 502 }
			);
		}
		return json({ success: true });
	} catch (error) {
		return proxyError('Questions submission', error);
	}
};

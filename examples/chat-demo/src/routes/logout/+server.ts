import { endSession } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	endSession(cookies);
	redirect(303, '/login');
};

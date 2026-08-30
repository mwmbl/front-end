import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api';
import { API_ROOT, QUEUE_PAGE_SIZE, type ModerationQueue } from '$lib/moderation';

/**
 * There is no API field saying whether a user may moderate, and this app has no
 * server-side route guards at all. So the gate is the queue endpoint's own answer: it 403s
 * for anyone without `change_domain_submission_status`, which is the same check every
 * mutation on this screen goes through. Asking it is the only way to be sure, and we need
 * the first page of the queue anyway.
 */
export const load: PageServerLoad = async ({ cookies, locals }) => {
	if (locals.loginStatus !== 'assumeLoggedIn') {
		return { access: 'anonymous' as const };
	}

	const res = await fetch(`${API_BASE}${API_ROOT}/queue?limit=${QUEUE_PAGE_SIZE}&offset=0`, {
		headers: { Authorization: 'Bearer ' + cookies.get('accessToken') }
	});

	if (res.status === 403) {
		return { access: 'denied' as const };
	}
	if (!res.ok) {
		return { access: 'error' as const, message: `Could not load the queue (${res.status}).` };
	}

	const queue: ModerationQueue = await res.json();
	return { access: 'ok' as const, items: queue.items, count: queue.count };
};

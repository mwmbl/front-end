import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api';
import { API_ROOT, QUEUE_PAGE_SIZE, type ModerationQueue } from '$lib/moderation';

/**
 * There is no API field saying whether a user may moderate, and this app has no server-side
 * route guards at all. So the gate is the queue endpoint's own answer: it 403s for anyone
 * without `change_domain_submission_status`, which is the same check every mutation on this
 * screen goes through. Asking it is the only way to be sure, and the first page of the queue is
 * needed anyway — every card is drawn from it, so opening the screen costs exactly one request.
 */
export const load: PageServerLoad = async ({ cookies, locals }) => {
	if (locals.loginStatus !== 'assumeLoggedIn') {
		return { access: 'anonymous' as const };
	}

	const response = await fetch(`${API_BASE}${API_ROOT}/queue?limit=${QUEUE_PAGE_SIZE}&offset=0`, {
		headers: { Authorization: 'Bearer ' + cookies.get('accessToken') }
	});

	if (response.status === 403) {
		return { access: 'denied' as const };
	}
	if (!response.ok) {
		return {
			access: 'error' as const,
			message: `Could not load the queue (${response.status}).`
		};
	}

	const queue: ModerationQueue = await response.json();
	return { access: 'ok' as const, items: queue.items, count: queue.count };
};

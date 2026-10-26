import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api';
import type { CrawlerVersionSpread } from '$lib/crawler-versions';

// Gated like the moderation page: the endpoint 403s for anyone who isn't staff.
export const load: PageServerLoad = async ({ cookies, locals }) => {
	if (locals.loginStatus !== 'assumeLoggedIn') {
		return { access: 'anonymous' as const };
	}

	const res = await fetch(`${API_BASE}/api/v1/platform/crawler-versions`, {
		headers: { Authorization: 'Bearer ' + cookies.get('accessToken') }
	});

	if (res.status === 403) {
		return { access: 'denied' as const };
	}
	if (!res.ok) {
		return {
			access: 'error' as const,
			message: `Could not load the crawler versions (${res.status}).`
		};
	}

	const spread: CrawlerVersionSpread = await res.json();
	return { access: 'ok' as const, spread };
};

import type { PageServerLoad } from './$types';
import { API_BASE } from '$lib/api';
import { type CrawlerVersionSpread } from '$lib/crawler-versions';

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const res = await fetch(`${API_BASE}/api/v1/platform/crawler-versions`);

	if (res.ok) {
		const json = await res.json();
		const spread: CrawlerVersionSpread = json;
		return { access: 'ok' as const, spread };
	} else {
		console.log('Crawler Versions failed with status', res.status);
	}
};

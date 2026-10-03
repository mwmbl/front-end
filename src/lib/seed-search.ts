import type { Cookies } from '@sveltejs/kit';
import { API_BASE } from '$lib/api';

// Cookie name predates the rename from Combined Search, kept so existing opt-ins survive.
export const SEED_SEARCH_COOKIE = 'labs_combined';

async function fetchQuotaExhausted(cookies: Cookies) {
	try {
		const res = await fetch(`${API_BASE}/api/v1/platform/combined-search/usage`, {
			headers: { Authorization: `Bearer ${cookies.get('accessToken')}` }
		});
		if (!res.ok) return false;
		const json: { monthly_usage: number; monthly_limit: number } = await res.json();
		return json.monthly_usage >= json.monthly_limit;
	} catch (err) {
		console.log('Seed search usage failed: ', err);
		return false;
	}
}

export async function seedSearchState(cookies: Cookies, loggedIn: boolean) {
	return {
		seedSearchEnabled: cookies.get(SEED_SEARCH_COOKIE) === '1',
		seedSearchQuotaExhausted: loggedIn ? await fetchQuotaExhausted(cookies) : false
	};
}

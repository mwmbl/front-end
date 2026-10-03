import type { Cookies } from '@sveltejs/kit';

// Cookie name predates the rename from Combined Search, kept so existing opt-ins survive.
export const SEED_SEARCH_COOKIE = 'labs_combined';
// Month (YYYY-MM) in which the user last hit their Seed Search quota.
export const SEED_SEARCH_QUOTA_COOKIE = 'seed_search_quota';

export function currentMonth() {
	return new Date().toISOString().slice(0, 7);
}

export function seedSearchState(cookies: Cookies) {
	return {
		seedSearchEnabled: cookies.get(SEED_SEARCH_COOKIE) === '1',
		seedSearchQuotaExhausted: cookies.get(SEED_SEARCH_QUOTA_COOKIE) === currentMonth()
	};
}

import { seedSearchState } from '$lib/seed-search';

// Server load so the hero's Seed Search toggle shows the current setting and quota.
export async function load({ locals, cookies }) {
	return seedSearchState(cookies, locals.loginStatus === 'assumeLoggedIn');
}

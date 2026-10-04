import { redirect } from '@sveltejs/kit';
import { seedSearchState } from '$lib/seed-search';

// Server load so the Seed Search quota is re-fetched on every visit, including client-side navigations.
export async function load({ url, locals, cookies }) {
	const query = url.searchParams.get('q');
	if (url.searchParams.get('q') != null) {
		redirect(303, '/search?q=' + query);
	}
	return seedSearchState(cookies, locals.loginStatus === 'assumeLoggedIn');
}

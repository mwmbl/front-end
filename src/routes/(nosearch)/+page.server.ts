import { redirect } from '@sveltejs/kit';
import { seedSearchState } from '$lib/seed-search';

// Server load so the Seed Search quota is re-fetched on every visit, including client-side navigations.
export async function load({ url, locals, cookies }) {
	const query = url.searchParams.get('q');
	if (query != null) {
		// Encoded, or a query with any character past Latin-1 fails the redirect header and
		// the page with it, and one with & or # loses everything after it.
		redirect(303, '/search?q=' + encodeURIComponent(query));
	}
	return seedSearchState(cookies, locals.loginStatus === 'assumeLoggedIn');
}

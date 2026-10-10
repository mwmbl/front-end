import { error, json } from '@sveltejs/kit';
import { fetchSeedCrawl } from '$lib/seed-crawl';

// The search page's seed crawl panel polls this rather than the API, which needs the
// access token from the httpOnly cookie.

export async function GET({ url, cookies, locals }) {
	if (locals.loginStatus !== 'assumeLoggedIn') error(401, 'Log in to use Seed Search');
	const query = url.searchParams.get('q') ?? '';
	const all = url.searchParams.get('all') === '1';
	return json(await fetchSeedCrawl(cookies.get('accessToken'), query, all));
}

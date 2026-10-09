import { error, json } from '@sveltejs/kit';
import { API_BASE } from '$lib/api';
import { fetchSeedCrawl } from '$lib/seed-crawl';

// The search page's seed crawl panel talks to these rather than to the API, which needs the
// access token from the httpOnly cookie.

export async function GET({ url, cookies, locals }) {
	if (locals.loginStatus !== 'assumeLoggedIn') error(401, 'Log in to use Seed Search');
	const query = url.searchParams.get('q') ?? '';
	const all = url.searchParams.get('all') === '1';
	return json(await fetchSeedCrawl(cookies.get('accessToken'), query, all));
}

// Starts a crawl by running the Seed Search again with crawl=true, which the API counts
// against the monthly quota like any other.
export async function POST({ request, cookies, locals }) {
	if (locals.loginStatus !== 'assumeLoggedIn') error(401, 'Log in to use Seed Search');
	const { q } = await request.json();
	const accessToken = cookies.get('accessToken');

	const res = await fetch(
		`${API_BASE}/api/v2/combined-search/?q=${encodeURIComponent(q)}&crawl=true`,
		{ headers: { Authorization: `Bearer ${accessToken}` } }
	);
	if (!res.ok) {
		error(res.status === 429 ? 429 : 502, 'Could not start the crawl');
	}
	const body: { crawl_scheduled?: boolean } = await res.json();
	return json({
		scheduled: !!body.crawl_scheduled,
		crawl: await fetchSeedCrawl(accessToken, q)
	});
}

import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { SEED_SEARCH_COOKIE } from '$lib/seed-search';

export async function POST({ request, cookies, locals }) {
	if (locals.loginStatus !== 'assumeLoggedIn') {
		error(401, 'Log in to use Seed Search');
	}
	const { enabled } = await request.json();
	if (enabled) {
		cookies.set(SEED_SEARCH_COOKIE, '1', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 365 // 1 year
		});
	} else {
		cookies.delete(SEED_SEARCH_COOKIE, { path: '/' });
	}
	return json({ enabled: !!enabled });
}

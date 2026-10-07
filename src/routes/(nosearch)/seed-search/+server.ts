import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { SEED_SEARCH_COOKIE } from '$lib/seed-search';

export async function POST({ request, cookies, locals }) {
	if (locals.loginStatus !== 'assumeLoggedIn') {
		error(401, 'Log in to use Seed Search');
	}
	const { enabled } = await request.json();
	cookies.set(SEED_SEARCH_COOKIE, enabled ? '1' : '0', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 60 * 24 * 365 // 1 year
	});
	return json({ enabled: !!enabled });
}

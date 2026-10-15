import { error, json } from '@sveltejs/kit';
import { saveSeedSearchPreference } from '$lib/seed-search';

export async function POST({ request, cookies, locals }) {
	if (locals.loginStatus !== 'assumeLoggedIn') {
		error(401, 'Log in to use Seed Search');
	}
	const { enabled } = await request.json();
	const res = await saveSeedSearchPreference(cookies, !!enabled);
	if (!res.ok) {
		error(res.status, 'Saving the Seed Search setting failed');
	}
	return json(await res.json());
}

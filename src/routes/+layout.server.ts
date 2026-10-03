import { seedSearchState } from '$lib/seed-search';

export async function load({ locals, cookies }) {
	return {
		loginStatus: locals.loginStatus,
		...seedSearchState(cookies)
	};
}

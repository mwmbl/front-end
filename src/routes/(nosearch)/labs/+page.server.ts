import type { Actions, PageServerLoad } from './$types';
import { dev } from '$app/environment';
import { COMBINED_SEARCH_COOKIE } from '$lib/labs';

export const load: PageServerLoad = async ({ cookies }) => {
	return {
		combinedSearch: cookies.get(COMBINED_SEARCH_COOKIE) === '1'
	};
};

export const actions: Actions = {
	enable: async ({ cookies }) => {
		cookies.set(COMBINED_SEARCH_COOKIE, '1', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 365 // 1 year
		});
	},
	disable: async ({ cookies }) => {
		cookies.delete(COMBINED_SEARCH_COOKIE, { path: '/' });
	}
};

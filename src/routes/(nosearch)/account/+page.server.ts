import type { Actions } from './$types';
import { dev } from '$app/environment';

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		// TODO implement login
		const data = await request.formData();
		const res = await fetch('https://api.mwmbl.org/api/v1/platform/token/pair', {
			method: 'POST',
			body: JSON.stringify({
				username: data.get('username'),
				password: data.get('password')
			})
		});
		const json = await res.json();
		cookies.set('refreshToken', json.refresh, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});
		cookies.set('accessToken', json.access, {
			path: '/',
			httpOnly: false,
			sameSite: 'strict',
			secure: !dev,
			maxAge: 60 * 60 * 24 // 1 day
		});
		cookies.set('username', json.username, {
			path: '/',
			httpOnly: false,
			sameSite: 'strict',
			secure: !dev,
			maxAge: 60 * 60 * 24 // 30 days
		});
		cookies.set('assumeLoggedIn', 'true', {
			path: '/',
			httpOnly: false,
			sameSite: 'strict',
			secure: !dev,
			maxAge: 60 * 60 * 24 // 1 day
		});
	},
	logout: async ({ cookies }) => {
		cookies.delete('refreshToken', { path: '/' });
		cookies.delete('accessToken', { path: '/' });
		cookies.delete('username', { path: '/' });
		cookies.delete('assumeLoggedIn', { path: '/' });
	}
};

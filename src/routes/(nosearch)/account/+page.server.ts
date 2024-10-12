import type { Actions } from './$types';
import { dev } from '$app/environment';

export const actions: Actions = {
	login: async ({ request, cookies }) => {
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
		cookies.set('status', 'assumeLoggedIn', {
			path: '/',
			httpOnly: false,
			sameSite: 'strict',
			secure: !dev,
			maxAge: 60 * 60 * 24 // 1 day
		});
	},
	register: async ({ request, cookies }) => {
		const data = await request.formData();
		const res = await fetch('https://api.mwmbl.org/api/v1/platform/register', {
			method: 'POST',
			body: JSON.stringify({
				email: data.get('email'),
				username: data.get('username'),
				password: data.get('password')
			})
		});
		const json = await res.json();
		if (json.status === 'success') {
			cookies.set('status', 'accountCreated', {
				path: '/',
				httpOnly: false,
				sameSite: 'strict',
				secure: !dev,
				maxAge: 60 * 60 * 24 // 1 day
			});
			cookies.set('registrationMessage', json.message, {
				path: '/',
				httpOnly: false,
				sameSite: 'strict',
				secure: !dev,
				maxAge: 60 * 60 * 24 // 1 day
			});
		} else {
			cookies.set('status', 'accountCreationError', {
				path: '/',
				httpOnly: false,
				sameSite: 'strict',
				secure: !dev,
				maxAge: 60 * 60 * 24 // 1 day
			});
			cookies.set('registrationMessage', json.message, {
				path: '/',
				httpOnly: false,
				sameSite: 'strict',
				secure: !dev,
				maxAge: 60 * 60 * 24 // 1 day
			});
		}
	},
	logout: async ({ cookies }) => {
		cookies.delete('refreshToken', { path: '/' });
		cookies.delete('accessToken', { path: '/' });
		cookies.delete('username', { path: '/' });
		cookies.delete('status', { path: '/' });
	}
};

export async function load({ cookies }) {
	const res = await fetch('https://api.mwmbl.org/api/v1/platform/protected', {
		method: 'GET',
		headers: {
			Authorization: 'Bearer ' + cookies.get('accessToken')
		}
	});
	const json = await res.json();

	// the current API returns an error in JSON with the response code 200
	// so we have to resort to doing this...
	if (json.status === 'error') {
		return {
			awaitingEmailConfirmation: true
		};
	} else {
		return {
			awaitingEmailConfirmation: false
		};
	}
}

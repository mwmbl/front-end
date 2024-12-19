import type { Actions } from './$types';
import { dev } from '$app/environment';

export const actions: Actions = {
	login: async ({ request, cookies, locals }) => {
		const data = await request.formData();
		const res = await fetch('https://api.mwmbl.org/api/v1/platform/token/pair', {
			method: 'POST',
			body: JSON.stringify({
				username: data.get('username'),
				password: data.get('password')
			})
		});
		const json = await res.json();
		if (res.ok) {
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
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

			locals.loginStatus = 'assumeLoggedIn';
		} else {
			locals.loginStatus = 'accountError';
			locals.accountMessage = 'Error logging in.';
		}
	},
	register: async ({ request, locals }) => {
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
		if (res.ok) {
			locals.loginStatus = 'accountCreated';
			locals.accountMessage = json.message;
		} else {
			locals.loginStatus = 'accountError';
			locals.accountMessage = json.message;
		}
	},
	logout: async ({ cookies, locals }) => {
		cookies.delete('refreshToken', { path: '/' });
		cookies.delete('accessToken', { path: '/' });
		locals.loginStatus = 'assumeLoggedOut';
		locals.accountMessage = 'Logged out.';
	},
	deleteUser: async ({ cookies, locals }) => {
		const res = await fetch(
			`https://api.mwmbl.org/api/v1/platform/users/${cookies.get('username')}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: 'Bearer ' + cookies.get('accessToken')
				}
			}
		);
		if (res.ok) {
			cookies.delete('refreshToken', { path: '/' });
			cookies.delete('accessToken', { path: '/' });

			locals.loginStatus = 'accountDeleted';
			locals.accountMessage = 'Your account has been deleted.';
		} else {
			locals.loginStatus = 'accountError';
			locals.accountMessage = res.statusText;
		}
	}
};

export async function load({ cookies, locals }) {
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
			awaitingEmailConfirmation: true,
			accountMessage: locals.accountMessage,
			username: cookies.get('username')
		};
	} else {
		return {
			awaitingEmailConfirmation: false,
			accountMessage: locals.accountMessage,
			username: cookies.get('username')
		};
	}
}

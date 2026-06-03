import type { Actions, PageServerLoad } from './$types';
import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { API_BASE as API } from '$lib/api';

type Agreement = {
	agreement_type: string;
	version_id: string;
	accepted_at: string;
};

type ApiKey = {
	id: number;
	name: string;
	created_on: string;
	scopes: string[];
};

export const actions: Actions = {
	login: async ({ request, cookies, locals }) => {
		const data = await request.formData();
		const res = await fetch(`${API}/api/v1/platform/token/pair`, {
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
				httpOnly: true,
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
			const next = data.get('next') as string | null;
			if (next && next.startsWith('/') && !next.startsWith('//')) {
				redirect(302, next);
			}
		} else {
			locals.loginStatus = 'accountError';
			locals.accountMessage = 'Error logging in.';
		}
	},
	register: async ({ request, locals }) => {
		const data = await request.formData();
		const res = await fetch(`${API}/api/v1/platform/register`, {
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
		const res = await fetch(`${API}/api/v1/platform/users/${cookies.get('username')}`, {
			method: 'DELETE',
			headers: {
				Authorization: 'Bearer ' + cookies.get('accessToken')
			}
		});
		if (res.ok) {
			cookies.delete('refreshToken', { path: '/' });
			cookies.delete('accessToken', { path: '/' });

			locals.loginStatus = 'accountDeleted';
			locals.accountMessage = 'Your account has been deleted.';
		} else {
			locals.loginStatus = 'accountError';
			locals.accountMessage = res.statusText;
		}
	},
	agreeToTerms: async ({ cookies }) => {
		const res = await fetch(`${API}/api/v1/platform/agreements/`, {
			method: 'POST',
			headers: {
				Authorization: 'Bearer ' + cookies.get('accessToken'),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ agreement_type: 'TERMS_OF_SERVICE_GUI' })
		});
		if (!res.ok) {
			return { success: false, error: 'Failed to record agreement. Please try again.' };
		}
		return { success: true };
	},
	createApiKey: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = (data.get('keyName') as string | null)?.trim() || undefined;
		const res = await fetch(`${API}/api/v1/platform/api-keys/`, {
			method: 'POST',
			headers: {
				Authorization: 'Bearer ' + cookies.get('accessToken'),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name, scope: 'crawl' })
		});
		if (!res.ok) {
			return { success: false, error: 'Failed to create API key.' };
		}
		const json = await res.json();
		return {
			success: true,
			newKey: json.key as string,
			newKeyName: (json.name as string) || null
		};
	},
	revokeApiKey: async ({ request, cookies }) => {
		const data = await request.formData();
		const keyId = data.get('keyId') as string;
		const res = await fetch(`${API}/api/v1/platform/api-keys/${keyId}`, {
			method: 'DELETE',
			headers: {
				Authorization: 'Bearer ' + cookies.get('accessToken')
			}
		});
		if (!res.ok) {
			return { success: false, error: 'Failed to revoke key.' };
		}
		return { success: true };
	}
};

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const res = await fetch(`${API}/api/v1/platform/protected`, {
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
			username: cookies.get('username'),
			votes: undefined,
			hasAgreedToTerms: false,
			apiKeys: [] as ApiKey[]
		};
	} else {
		const [votesRes, agreementsRes, keysRes] = await Promise.all([
			fetch(`${API}/api/v1/platform/search-results/my-votes?limit=100&offset=0`, {
				method: 'GET',
				headers: { Authorization: 'Bearer ' + cookies.get('accessToken') }
			}),
			fetch(`${API}/api/v1/platform/agreements/`, {
				method: 'GET',
				headers: { Authorization: 'Bearer ' + cookies.get('accessToken') }
			}),
			fetch(`${API}/api/v1/platform/api-keys/`, {
				method: 'GET',
				headers: { Authorization: 'Bearer ' + cookies.get('accessToken') }
			})
		]);

		const votesJson: {
			count: number;
			items: Array<{
				url: string;
				query: string;
				vote_type: 'upvote' | 'downvote';
				timestamp: string;
			}>;
		} = await votesRes.json();

		const agreements: Agreement[] = agreementsRes.ok ? await agreementsRes.json() : [];
		const hasAgreedToTerms = agreements.some((a) => a.agreement_type === 'TERMS_OF_SERVICE_GUI');

		const apiKeys: ApiKey[] = keysRes.ok ? await keysRes.json() : [];

		return {
			awaitingEmailConfirmation: false,
			accountMessage: locals.accountMessage,
			username: cookies.get('username'),
			votes: votesJson,
			hasAgreedToTerms,
			apiKeys
		};
	}
};

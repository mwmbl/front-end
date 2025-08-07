import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

const MWMBL_API_BASE_URL = 'https://api.mwmbl.org';
const PROXY_PATH = '/api';

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('accessToken');

	if (accessToken) {
		// Parse access token to see if it's expired
		const parsedJWT = JSON.parse(
			atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
		);

		if (parsedJWT.exp < Date.now() / 1000) {
			// Access token is expired, let's do a refresh
			const refreshToken = event.cookies.get('refreshToken');
			if (refreshToken) {
				const res = await fetch('https://api.mwmbl.org/api/v1/platform/token/refresh', {
					method: 'POST',
					body: JSON.stringify({
						refresh: refreshToken
					})
				});
				if (res.ok) {
					const json = await res.json();
					event.cookies.set('accessToken', json.access, {
						path: '/',
						httpOnly: false,
						sameSite: 'strict',
						secure: !dev,
						maxAge: 60 * 60 * 24 // 1 day
					});
					event.cookies.set('refreshToken', json.refresh, {
						path: '/',
						httpOnly: true,
						sameSite: 'strict',
						secure: !dev,
						maxAge: 60 * 60 * 24 * 30 // 30 days
					});
					event.locals.loginStatus = 'assumeLoggedIn';
				} else {
					event.locals.loginStatus = 'assumeLoggedOut';
				}
			} else {
				event.locals.loginStatus = 'assumeLoggedOut';
			}
		} else {
			event.locals.loginStatus = 'assumeLoggedIn';
		}
	} else {
		event.locals.loginStatus = 'assumeLoggedOut';
	}

	// Delete cookies if logged out
	if (event.locals.loginStatus === 'assumeLoggedOut') {
		event.cookies.delete('refreshToken', { path: '/' });
		event.cookies.delete('accessToken', { path: '/' });
	}

	// intercept requests to `/api/` and handle them with `handleApiProxy`
	if (event.url.pathname.startsWith(PROXY_PATH)) {
		return await handleApiProxy({ event, resolve });
	}

	return await resolve(event);
};

// Proxies request through SvelteKit server to Mwmbl API, with authentication
// Adapted from https://sami.website/blog/sveltekit-api-reverse-proxy
const handleApiProxy: Handle = async ({ event }) => {
	// build the new URL path with your API base URL, the path, and the query string
	const urlPath = `${MWMBL_API_BASE_URL}${event.url.pathname}${event.url.search}`;
	const apiURL = new URL(urlPath);

	event.request.headers.set('Authorization', `Bearer ${event.cookies.get('accessToken')}`);

	return fetch(apiURL.toString(), {
		// propagate the request method and body
		body: event.request.body,
		method: event.request.method,
		headers: event.request.headers,
		// @ts-ignore this is a real property, and without it requests with bodies do not work
		duplex: 'half'
	}).catch((err) => {
		console.log('Could not proxy API request: ', err);
		throw err;
	});
};

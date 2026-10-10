import type { Handle } from '@sveltejs/kit';
import { API_BASE } from '$lib/api';
import { clearAuthCookies, isPersistentLogin, setAuthCookies } from '$lib/server/auth-cookies';
import { isExpired, refreshTokens } from '$lib/server/auth-tokens';

const MWMBL_API_BASE_URL = API_BASE;
const PROXY_PATH = '/api';

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('accessToken');
	const refreshToken = event.cookies.get('refreshToken');

	if (accessToken && !isExpired(accessToken)) {
		event.locals.loginStatus = 'assumeLoggedIn';
	} else if (refreshToken) {
		// Access token is missing or expired, let's do a refresh
		const result = await refreshTokens(refreshToken);
		if (result.status === 'ok') {
			setAuthCookies(event.cookies, result, isPersistentLogin(event.cookies));
			event.locals.loginStatus = 'assumeLoggedIn';
		} else {
			event.locals.loginStatus = 'assumeLoggedOut';
			// Only a rejected refresh token ends the login. After a temporary failure,
			// keep the cookies so the next request can try again.
			if (result.status === 'invalid') {
				clearAuthCookies(event.cookies);
			}
		}
	} else {
		event.locals.loginStatus = 'assumeLoggedOut';
		clearAuthCookies(event.cookies);
	}

	// intercept requests to `/api/` and handle them with `handleApiProxy`
	if (event.url.pathname.startsWith(PROXY_PATH)) {
		return await handleApiProxy({ event, resolve });
	}

	return await resolve(event);
};

// Proxies request through SvelteKit server to MWMBL API, with authentication
// Adapted from https://sami.website/blog/sveltekit-api-reverse-proxy
const handleApiProxy: Handle = async ({ event }) => {
	// build the new URL path with your API base URL, the path, and the query string
	const urlPath = `${MWMBL_API_BASE_URL}${event.url.pathname}${event.url.search}`;
	const apiURL = new URL(urlPath);

	event.request.headers.set('Authorization', `Bearer ${event.cookies.get('accessToken')}`);

	const apiResponse = await fetch(apiURL.toString(), {
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

	// fetch has already decompressed the body, so these headers no longer describe it.
	// Passing them on tells the client the plain body is gzipped.
	const headers = new Headers(apiResponse.headers);
	headers.delete('content-encoding');
	headers.delete('content-length');

	return new Response(apiResponse.body, {
		status: apiResponse.status,
		statusText: apiResponse.statusText,
		headers
	});
};

import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

// Matches REFRESH_TOKEN_LIFETIME on the API. Refresh tokens rotate, so this window
// restarts on every refresh and active users stay logged in indefinitely.
const PERSISTENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// Records whether the user ticked "Keep me logged in", so token refreshes keep the
// same cookie lifetime. If they didn't, it is '0' and auth cookies are session
// cookies that the browser drops when it closes (for shared machines). Logins from
// before this cookie existed don't have it and count as persistent.
const PERSISTENT_COOKIE = 'persistentLogin';

type CookieOptions = Parameters<Cookies['set']>[2];

function cookieOptions(persistent: boolean, httpOnly: boolean): CookieOptions {
	return {
		path: '/',
		httpOnly,
		sameSite: 'strict',
		secure: !dev,
		...(persistent ? { maxAge: PERSISTENT_MAX_AGE } : {})
	};
}

export function isPersistentLogin(cookies: Cookies): boolean {
	return cookies.get(PERSISTENT_COOKIE) !== '0';
}

export function setAuthCookies(
	cookies: Cookies,
	tokens: { access: string; refresh?: string; username?: string },
	persistent: boolean
) {
	// A token refresh returns no username, and no refresh token if rotation is off.
	// Keep the existing values so their cookies are renewed along with the access token.
	const refresh = tokens.refresh ?? cookies.get('refreshToken');
	const username = tokens.username ?? cookies.get('username');

	cookies.set('accessToken', tokens.access, cookieOptions(persistent, true));
	if (refresh) {
		cookies.set('refreshToken', refresh, cookieOptions(persistent, true));
	}
	if (username) {
		cookies.set('username', username, cookieOptions(persistent, false));
	}
	cookies.set(PERSISTENT_COOKIE, persistent ? '1' : '0', cookieOptions(persistent, true));
}

export function clearAuthCookies(cookies: Cookies) {
	for (const name of ['accessToken', 'refreshToken', 'username', PERSISTENT_COOKIE]) {
		cookies.delete(name, { path: '/' });
	}
}

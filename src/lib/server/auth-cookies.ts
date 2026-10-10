import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

// Matches REFRESH_TOKEN_LIFETIME on the API. Refresh tokens rotate, so this window
// restarts on every refresh and active users stay logged in indefinitely.
const PERSISTENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// Records whether the user ticked "Keep me logged in", so token refreshes keep the
// same cookie lifetime. Without it, auth cookies are session cookies that the
// browser drops when it closes (for shared machines).
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
	return cookies.get(PERSISTENT_COOKIE) === '1';
}

export function setAuthCookies(
	cookies: Cookies,
	tokens: { access: string; refresh: string; username?: string },
	persistent: boolean
) {
	cookies.set('accessToken', tokens.access, cookieOptions(persistent, true));
	cookies.set('refreshToken', tokens.refresh, cookieOptions(persistent, true));
	if (tokens.username) {
		cookies.set('username', tokens.username, cookieOptions(persistent, false));
	}
	if (persistent) {
		cookies.set(PERSISTENT_COOKIE, '1', cookieOptions(true, true));
	} else {
		cookies.delete(PERSISTENT_COOKIE, { path: '/' });
	}
}

export function clearAuthCookies(cookies: Cookies) {
	for (const name of ['accessToken', 'refreshToken', 'username', PERSISTENT_COOKIE]) {
		cookies.delete(name, { path: '/' });
	}
}

import { API_BASE } from '$lib/api';

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
	try {
		const payload = token.split('.')[1];
		return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
	} catch {
		return null;
	}
}

// Malformed tokens and tokens without an exp claim count as expired, so they get refreshed.
export function isExpired(token: string): boolean {
	const exp = decodeJwtPayload(token)?.exp;
	return typeof exp !== 'number' || exp < Date.now() / 1000;
}

export type RefreshResult =
	| { status: 'ok'; access: string; refresh?: string }
	// The API rejected the refresh token: the user is logged out.
	| { status: 'invalid' }
	// Network error, 5xx, rate limit etc. The refresh token may still be good.
	| { status: 'error' };

// Refresh tokens rotate, so the API accepts each one only once. A page load fires
// several requests carrying the same refresh token; they must share a single
// refresh or all but the first get a 401 and log the user out. Successful results
// are kept briefly for requests that were sent before the browser saw the new cookies.
// This is per process, which is fine while the front end runs as a single Node server.
const REUSE_MS = 60_000;
const refreshes = new Map<string, Promise<RefreshResult>>();

export function refreshTokens(refreshToken: string): Promise<RefreshResult> {
	let result = refreshes.get(refreshToken);
	if (!result) {
		result = requestRefresh(refreshToken);
		refreshes.set(refreshToken, result);
		result.then((r) => {
			if (r.status === 'ok') {
				setTimeout(() => refreshes.delete(refreshToken), REUSE_MS);
			} else {
				refreshes.delete(refreshToken);
			}
		});
	}
	return result;
}

async function requestRefresh(refreshToken: string): Promise<RefreshResult> {
	try {
		const res = await fetch(`${API_BASE}/api/v1/platform/token/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh: refreshToken })
		});
		if (res.status === 400 || res.status === 401) {
			return { status: 'invalid' };
		}
		if (!res.ok) {
			console.warn('Token refresh failed with status', res.status);
			return { status: 'error' };
		}
		const json = await res.json();
		if (typeof json.access !== 'string') {
			console.warn('Token refresh response has no access token');
			return { status: 'error' };
		}
		return { status: 'ok', access: json.access, refresh: json.refresh };
	} catch (err) {
		console.warn('Token refresh failed', err);
		return { status: 'error' };
	}
}

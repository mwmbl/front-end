import type { Cookies } from '@sveltejs/kit';
import { API_BASE } from '$lib/api';

// Before the preference was stored on the account, opting in set this cookie (named before the
// rename from Combined Search). It's copied to the account once, then deleted.
const LEGACY_OPT_IN_COOKIE = 'labs_combined';

const PREFERENCE_URL = `${API_BASE}/api/v1/platform/combined-search/preference`;

export async function saveSeedSearchPreference(cookies: Cookies, enabled: boolean) {
	return fetch(PREFERENCE_URL, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${cookies.get('accessToken')}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ enabled })
	});
}

export async function fetchSeedSearchEnabled(cookies: Cookies) {
	try {
		if (cookies.get(LEGACY_OPT_IN_COOKIE) === '1') {
			const res = await saveSeedSearchPreference(cookies, true);
			if (res.ok) cookies.delete(LEGACY_OPT_IN_COOKIE, { path: '/' });
			return true;
		}
		const res = await fetch(PREFERENCE_URL, {
			headers: { Authorization: `Bearer ${cookies.get('accessToken')}` }
		});
		if (!res.ok) return false;
		const json: { enabled: boolean } = await res.json();
		return json.enabled;
	} catch (err) {
		console.log('Seed search preference failed: ', err);
		return false;
	}
}

async function fetchQuotaExhausted(cookies: Cookies) {
	try {
		const res = await fetch(`${API_BASE}/api/v1/platform/combined-search/usage`, {
			headers: { Authorization: `Bearer ${cookies.get('accessToken')}` }
		});
		if (!res.ok) return false;
		const json: { monthly_usage: number; monthly_limit: number } = await res.json();
		return json.monthly_usage >= json.monthly_limit;
	} catch (err) {
		console.log('Seed search usage failed: ', err);
		return false;
	}
}

export async function seedSearchState(cookies: Cookies, loggedIn: boolean) {
	if (!loggedIn) return { seedSearchEnabled: false, seedSearchQuotaExhausted: false };
	const [seedSearchEnabled, seedSearchQuotaExhausted] = await Promise.all([
		fetchSeedSearchEnabled(cookies),
		fetchQuotaExhausted(cookies)
	]);
	return { seedSearchEnabled, seedSearchQuotaExhausted };
}

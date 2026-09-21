import { API_BASE } from '$lib/api';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, locals }) => {
	// Check if user is logged in
	if (locals.loginStatus !== 'assumeLoggedIn') {
		// Redirect to login page
		throw redirect(302, '/account');
	}

	const accessToken = cookies.get('accessToken');
	if (!accessToken) {
		throw new Error('No access token');
	}

	// The login flow stores the plaintext username in a cookie; prefer it over
	// decoding the JWT, which may not carry a username claim.
	let username = cookies.get('username') || 'User';
	if (username === 'User') {
		try {
			const payload = accessToken.split('.')[1];
			const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
			const parsed = JSON.parse(decoded);
			username = parsed.username || parsed.email || parsed.sub || 'User';
		} catch (e) {
			console.warn('Failed to decode token', e);
			username = 'User';
		}
	}

	// Fetch the logged-in user's per-user contribution stats.
	let userStats: {
		username: string;
		results_indexed_today: number;
		results_indexed_daily: Record<string, number>;
	} = {
		username,
		results_indexed_today: 0,
		results_indexed_daily: {}
	};
	try {
		const statsRes = await fetch(`${API_BASE}/api/v1/platform/user/stats`, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});
		if (statsRes.ok) {
			userStats = await statsRes.json();
		} else {
			console.error(`Failed to fetch user stats: ${statsRes.status}`);
		}
	} catch (err) {
		console.error('Error fetching user stats:', err);
	}

	// Fetch the user profile for date_joined
	let dateJoined: string = "";
	try {
		const profileRes = await fetch(`${API_BASE}/api/v1/platform/user`, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});
		if (profileRes.ok) {
			const profile = await profileRes.json();
			dateJoined = profile.date_joined || null;
		}
	} catch (err) {
		console.error('Error fetching user profile:', err);
	}

	const indexDaily = userStats.results_indexed_daily || {};
	const totalIndexed = Object.values(indexDaily).reduce((sum, v) => sum + v, 0);

	// Prepare data for the bar chart (last 30 days).
	const labels = [];
	const indexedData = [];
	const today = new Date();
	for (let i = 29; i >= 0; i--) {
		const date = new Date(today);
		date.setDate(today.getDate() - i);
		const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
		labels.push(dateStr);
		indexedData.push(indexDaily[dateStr] || 0);
	}

	return {
		username: userStats.username || username,
		myIndexedToday: userStats.results_indexed_today,
		totalIndexed,
		chartLabels: labels,
		chartData: {
			indexed: indexedData
		},
		dateJoined
	};
};
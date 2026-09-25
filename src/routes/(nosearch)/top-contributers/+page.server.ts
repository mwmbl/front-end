import { API_BASE } from '$lib/api';

export async function load() {
	// Fetch leaderboard data from the API
	const [yesterdayRes, allTimeRes] = await Promise.all([
		fetch(`${API_BASE}/api/v1/leaderboard/yesterday/`),
		fetch(`${API_BASE}/api/v1/leaderboard/all/`)
	]);

	const yesterday = await yesterdayRes.json();
	const allTime = await allTimeRes.json();

	// Transform the data to match the expected format
	// The API returns [[username, score], ...] but the UI expects [{username, score}, ...]
	const yesterdayData = yesterday.map(([username, score]: [string, number]) => ({ username, score }));
	const allTimeData = allTime.map(([username, score]: [string, number]) => ({ username, score }));

	return {
		yesterday: yesterdayData,
		allTime: allTimeData
	};
}
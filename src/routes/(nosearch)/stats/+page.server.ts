import { API_BASE } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	// Fetch comprehensive stats from the API
	let stats: {
		users_crawled_daily: Record<string, number>;
		results_indexed_daily: Record<string, number>;
		top_user_results: Array<[string, number]>;
		urls_in_index_daily: Record<string, number>;
		domains_in_index_daily: Record<string, number>;
		results_in_index_daily: Record<string, number>;
		dataset_queries_daily: Record<string, number>;
		dataset_results_daily: Record<string, number>;
		blacklisted_results_removed_daily: Record<string, number>;
	} = {
		users_crawled_daily: {},
		results_indexed_daily: {},
		top_user_results: [],
		urls_in_index_daily: {},
		domains_in_index_daily: {},
		results_in_index_daily: {},
		dataset_queries_daily: {},
		dataset_results_daily: {},
		blacklisted_results_removed_daily: {}
	};

	try {
		const statsRes = await fetch(`${API_BASE}/api/v1/crawler/stats`);
		if (statsRes.ok) {
			stats = await statsRes.json();
		} else {
			console.error(`Failed to fetch stats: ${statsRes.status}`);
		}
	} catch (err) {
		console.error('Error fetching stats:', err);
	}

	// Fetch leaderboard data for yesterday and all-time
	let yesterdayLeaderboard: Array<{ username: string; score: number }> = [];
	let allTimeLeaderboard: Array<{ username: string; score: number }> = [];

	try {
		const yesterdayRes = await fetch(`${API_BASE}/api/v1/leaderboard/yesterday/`);
		if (yesterdayRes.ok) {
			const data = await yesterdayRes.json();
			yesterdayLeaderboard = data.map(([username, score]: [string, number]) => ({ username, score }));
		}
	} catch (err) {
		console.error('Error fetching yesterday leaderboard:', err);
	}

	try {
		const allTimeRes = await fetch(`${API_BASE}/api/v1/leaderboard/all/`);
		if (allTimeRes.ok) {
			const data = await allTimeRes.json();
			allTimeLeaderboard = data.map(([username, score]: [string, number]) => ({ username, score }));
		}
	} catch (err) {
		console.error('Error fetching all-time leaderboard:', err);
	}

	// Prepare chart data for the last 30 days
	const labels = [];
	const usersCrawledData = [];
	const resultsIndexedData = [];
	const urlsInIndexData = [];
	const domainsInIndexData = [];
	const resultsInIndexData = [];
	const datasetQueriesData = [];
	const datasetResultsData = [];
	const blacklistedRemovedData = [];

	const today = new Date();
	for (let i = 29; i >= 0; i--) {
		const date = new Date(today);
		date.setDate(today.getDate() - i);
		const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
		labels.push(dateStr);
		usersCrawledData.push(stats.users_crawled_daily[dateStr] || 0);
		resultsIndexedData.push(stats.results_indexed_daily[dateStr] || 0);
		urlsInIndexData.push(stats.urls_in_index_daily[dateStr] || 0);
		domainsInIndexData.push(stats.domains_in_index_daily[dateStr] || 0);
		resultsInIndexData.push(stats.results_in_index_daily[dateStr] || 0);
		datasetQueriesData.push(stats.dataset_queries_daily[dateStr] || 0);
		datasetResultsData.push(stats.dataset_results_daily[dateStr] || 0);
		blacklistedRemovedData.push(stats.blacklisted_results_removed_daily[dateStr] || 0);
	}

	// Calculate totals
	const totalUsersCrawled = Object.values(stats.users_crawled_daily).reduce((sum, v) => sum + v, 0);
	const totalResultsIndexed = Object.values(stats.results_indexed_daily).reduce((sum, v) => sum + v, 0);
	const totalUrlsInIndex = Object.values(stats.urls_in_index_daily).reduce((sum, v) => sum + v, 0);
	const totalDomainsInIndex = Object.values(stats.domains_in_index_daily).reduce((sum, v) => sum + v, 0);
	const totalResultsInIndex = Object.values(stats.results_in_index_daily).reduce((sum, v) => sum + v, 0);
	const totalDatasetQueries = Object.values(stats.dataset_queries_daily).reduce((sum, v) => sum + v, 0);
	const totalDatasetResults = Object.values(stats.dataset_results_daily).reduce((sum, v) => sum + v, 0);
	const totalBlacklistedRemoved = Object.values(stats.blacklisted_results_removed_daily).reduce((sum, v) => sum + v, 0);

	// Get latest values
	const latestDate = labels[labels.length - 1];
	const latestUsersCrawled = stats.users_crawled_daily[latestDate] || 0;
	const latestResultsIndexed = stats.results_indexed_daily[latestDate] || 0;
	const latestUrlsInIndex = stats.urls_in_index_daily[latestDate] || 0;
	const latestDomainsInIndex = stats.domains_in_index_daily[latestDate] || 0;
	const latestResultsInIndex = stats.results_in_index_daily[latestDate] || 0;
	const latestDatasetQueries = stats.dataset_queries_daily[latestDate] || 0;
	const latestDatasetResults = stats.dataset_results_daily[latestDate] || 0;
	const latestBlacklistedRemoved = stats.blacklisted_results_removed_daily[latestDate] || 0;

	// Top users data for horizontal bar chart (from all-time leaderboard)
	const topUsersLabels = allTimeLeaderboard.map(u => u.username);
	const topUsersData = allTimeLeaderboard.map(u => u.score);

	return {
		topUsers: {
			labels: topUsersLabels,
			data: topUsersData
		},
		stats,
		yesterdayLeaderboard,
		allTimeLeaderboard,
		chartData: {
			labels,
			usersCrawled: usersCrawledData,
			resultsIndexed: resultsIndexedData,
			urlsInIndex: urlsInIndexData,
			domainsInIndex: domainsInIndexData,
			resultsInIndex: resultsInIndexData,
			datasetQueries: datasetQueriesData,
			datasetResults: datasetResultsData,
			blacklistedRemoved: blacklistedRemovedData
		},
		totals: {
			usersCrawled: totalUsersCrawled,
			resultsIndexed: totalResultsIndexed,
			urlsInIndex: totalUrlsInIndex,
			domainsInIndex: totalDomainsInIndex,
			resultsInIndex: totalResultsInIndex,
			datasetQueries: totalDatasetQueries,
			datasetResults: totalDatasetResults,
			blacklistedRemoved: totalBlacklistedRemoved
		},
		latest: {
			usersCrawled: latestUsersCrawled,
			resultsIndexed: latestResultsIndexed,
			urlsInIndex: latestUrlsInIndex,
			domainsInIndex: latestDomainsInIndex,
			resultsInIndex: latestResultsInIndex,
			datasetQueries: latestDatasetQueries,
			datasetResults: latestDatasetResults,
			blacklistedRemoved: latestBlacklistedRemoved
		}
	};
};
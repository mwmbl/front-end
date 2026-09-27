import { API_BASE } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	// Fetch crawler stats from the API
	let stats: {
		users_crawled_daily: Record<string, number>;
		results_indexed_daily: Record<string, number>;
		top_user_results: Array<[string, number]>;
		dataset_queries_daily: Record<string, number>;
		dataset_results_daily: Record<string, number>;
		blacklisted_results_removed_daily: Record<string, number>;
	} = {
		users_crawled_daily: {},
		results_indexed_daily: {},
		top_user_results: [],
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

	// Prepare chart data for the last 30 days
	const labels = [];
	const usersCrawledData = [];
	const resultsIndexedData = [];
	const datasetQueriesData = [];
	const datasetResultsData = [];

	const today = new Date();
	for (let i = 29; i >= 0; i--) {
		const date = new Date(today);
		date.setDate(today.getDate() - i);
		const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
		labels.push(dateStr);
		usersCrawledData.push(stats.users_crawled_daily[dateStr] || 0);
		resultsIndexedData.push(stats.results_indexed_daily[dateStr] || 0);
		datasetQueriesData.push(stats.dataset_queries_daily[dateStr] || 0);
		datasetResultsData.push(stats.dataset_results_daily[dateStr] || 0);
	}

	// Get latest values
	const latestDate = labels[labels.length - 1];
	const latestUsersCrawled = stats.users_crawled_daily[latestDate] || 0;
	const latestResultsIndexed = stats.results_indexed_daily[latestDate] || 0;
	const latestDatasetQueries = stats.dataset_queries_daily[latestDate] || 0;
	const latestDatasetResults = stats.dataset_results_daily[latestDate] || 0;

	// Top users data
	const topUsersLabels = stats.top_user_results.map(([username]) => username);
	const topUsersData = stats.top_user_results.map(([, score]) => score);

	return {
		stats,
		chartData: {
			labels,
			usersCrawled: usersCrawledData,
			resultsIndexed: resultsIndexedData,
			datasetQueries: datasetQueriesData,
			datasetResults: datasetResultsData
		},
		topUsers: {
			labels: topUsersLabels,
			data: topUsersData
		},
		latest: {
			usersCrawled: latestUsersCrawled,
			resultsIndexed: latestResultsIndexed,
			datasetQueries: latestDatasetQueries,
			datasetResults: latestDatasetResults
		}
	};
};
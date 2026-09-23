// add the ranker to dependencies to use wasm ranker ("ranker": "file:./pkg/" when testing)
import { API_BASE } from '$lib/api';
import { hitToResult, type SearchHit } from '$lib/highlight';
import { COMBINED_SEARCH_COOKIE } from '$lib/labs';

// uncomment to use wasm ranker
// export const ssr = false;

type Result = {
	title: Array<{ value: string; is_bold: boolean }>;
	extract: Array<{ value: string; is_bold: boolean }>;
	url: string;
	source: string;
	votes: undefined;
};

export async function load({ url, cookies, locals }) {
	// const useWasmRanker = url.searchParams.get('useWasmRanker') === 'true';

	// if (!useWasmRanker) {
	const query = url.searchParams.get('q') ?? '';

	let combinedResults: Result[] | null = null;
	let searchMode: 'standard' | 'combined' = 'standard';
	let combinedUsage: { usage: number; limit: number } | null = null;
	let combinedFallback: 'quota' | 'error' | null = null;

	// Opt-in via /labs. On any failure (quota, auth, outage) fall back to standard search.
	if (locals.loginStatus === 'assumeLoggedIn' && cookies.get(COMBINED_SEARCH_COOKIE) === '1') {
		try {
			const res = await fetch(
				`${API_BASE}/api/v2/combined-search/?q=${encodeURIComponent(query)}`,
				{ headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
			);
			if (res.ok) {
				const json: {
					results: SearchHit[];
					monthly_usage: number | null;
					monthly_limit: number | null;
				} = await res.json();
				combinedResults = json.results.map(hitToResult);
				searchMode = 'combined';
				if (json.monthly_usage != null && json.monthly_limit != null) {
					combinedUsage = { usage: json.monthly_usage, limit: json.monthly_limit };
				}
			} else {
				combinedFallback = res.status === 429 ? 'quota' : 'error';
			}
		} catch (err) {
			console.log('Combined search failed: ', err);
			combinedFallback = 'error';
		}
	}

	const results: Result[] =
		combinedResults ??
		(await (await fetch(`${API_BASE}/api/v1/search/?s=${encodeURIComponent(query)}`)).json());

	const superSearch = url.searchParams.get('superSearch') === '1';

	if (locals.loginStatus !== 'assumeLoggedIn') {
		return {
			query: url.searchParams.get('q') as string | undefined,
			results: results,
			superSearch,
			searchMode,
			combinedUsage,
			combinedFallback
		};
	}
	const votesRes = await fetch(`${API_BASE}/api/v1/platform/search-results/votes`, {
		headers: {
			Authorization: `Bearer ${cookies.get('accessToken')}`
		},
		method: 'POST',
		body: JSON.stringify({ query: url.searchParams.get('q'), urls: results.map((r) => r.url) })
	});
	const votes = await votesRes.json();

	const resultsWithVotes: Array<{
		title: Array<{ value: string; is_bold: boolean }>;
		extract: Array<{ value: string; is_bold: boolean }>;
		url: string;
		source: string;
		votes: { upvotes: number; downvotes: number; user_vote: null | 'upvote' | 'downvote' };
	}> = results.map((result) => ({
		...result,
		votes: votes.votes[result.url]
	}));

	return {
		query: url.searchParams.get('q') as string | undefined,
		results: resultsWithVotes,
		superSearch,
		searchMode,
		combinedUsage,
		combinedFallback
	};
	// }
	// else {
	// 	const wasm = await import('ranker');

	// 	const query = url.searchParams.get('q');
	// 	const ranker = wasm.Ranker.new(query ?? '');
	// 	const terms = ranker.get_query_terms();
	// 	for (const term of terms) {
	// 		const res = await fetch(`${API_BASE}/api/v1/search/raw?s=${term}`);
	// 		const json = await res.json();
	// 		for (const result of json.results) {
	// 			ranker.add_search_result(result.url, result.title, result.extract);
	// 		}
	// 	}
	// 	const rankedData = ranker.rank();

	// 	const results: Array<{
	// 		title: Array<{ value: string; is_bold: boolean }>;
	// 		extract: Array<{ value: string; is_bold: boolean }>;
	// 		url: string;
	// 		source: string;
	// 	}> = await rankedData.map((result: { url: string; title: string; extract: string }) => {
	// 		return {
	// 			title: result.title.split(' ').map((word: string) => {
	// 				return {
	// 					value: word + ' ',
	// 					is_bold: query?.split(' ').some((q) => q.toLowerCase() === word.toLowerCase())
	// 				};
	// 			}),
	// 			extract: result.extract.split(' ').map((word: string) => {
	// 				return {
	// 					value: word + ' ',
	// 					is_bold: query?.split(' ').some((q) => q.toLowerCase() === word.toLowerCase())
	// 				};
	// 			}),
	// 			url: result.url,
	// 			source: ''
	// 		};
	// 	});

	// 	return {
	// 		query: url.searchParams.get('q') as string | undefined,
	// 		results: results
	// 	};
	// }
}

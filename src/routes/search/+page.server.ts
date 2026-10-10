// add the ranker to dependencies to use wasm ranker ("ranker": "file:./pkg/" when testing)
import { API_BASE } from '$lib/api';
import { hitToResult, type SearchHit } from '$lib/highlight';
import { SEED_SEARCH_COOKIE, seedSearchState } from '$lib/seed-search';
import {
	fetchSeedCrawl,
	type SeedCrawl,
	type SeedCrawlAttempt,
	type SeedCrawlOutcome
} from '$lib/seed-crawl';

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
	const seedState = seedSearchState(cookies, locals.loginStatus === 'assumeLoggedIn');

	let seedResults: Result[] | null = null;
	let searchMode: 'standard' | 'seed' = 'standard';
	let seedUsage: { usage: number; limit: number } | null = null;
	let seedFallback: 'quota' | 'error' | null = null;
	let pagesIndexed: number | null = null;
	let seedCrawl: SeedCrawl | null = null;
	let seedCrawlAttempt: SeedCrawlAttempt | null = null;

	// Opt-in via the Seed Search toggle. On any failure (quota, auth, outage) fall back to standard search.
	// Every Seed Search also starts a background crawl of the EUSP results the index lacks.
	if (locals.loginStatus === 'assumeLoggedIn' && cookies.get(SEED_SEARCH_COOKIE) === '1') {
		try {
			const res = await fetch(
				`${API_BASE}/api/v2/combined-search/?q=${encodeURIComponent(query)}&crawl=true`,
				{ headers: { Authorization: `Bearer ${cookies.get('accessToken')}` } }
			);
			if (res.ok) {
				const json: {
					results: SearchHit[];
					monthly_usage: number | null;
					monthly_limit: number | null;
					pages_indexed?: number | null;
					crawl_outcome?: SeedCrawlOutcome | null;
					active_crawl_query?: string | null;
				} = await res.json();
				seedResults = json.results.map(hitToResult);
				searchMode = 'seed';
				if (json.monthly_usage != null && json.monthly_limit != null) {
					seedUsage = { usage: json.monthly_usage, limit: json.monthly_limit };
				}
				pagesIndexed = json.pages_indexed ?? null;
				seedCrawlAttempt = {
					outcome: json.crawl_outcome ?? null,
					activeQuery: json.active_crawl_query ?? null
				};
				seedCrawl = await fetchSeedCrawl(cookies.get('accessToken'), query);
			} else {
				seedFallback = res.status === 429 ? 'quota' : 'error';
			}
		} catch (err) {
			console.log('Seed search failed: ', err);
			seedFallback = 'error';
		}
	}

	// The usage figure can predate this search, so also check what this search reported.
	const seedQuotaHit =
		seedFallback === 'quota' || (seedUsage != null && seedUsage.usage >= seedUsage.limit);

	const results: Result[] =
		seedResults ??
		(await (await fetch(`${API_BASE}/api/v1/search/?s=${encodeURIComponent(query)}`)).json());

	if (locals.loginStatus !== 'assumeLoggedIn') {
		return {
			query: url.searchParams.get('q') as string | undefined,
			results: results,
			searchMode,
			seedUsage,
			seedFallback,
			seedQuotaHit,
			pagesIndexed,
			seedCrawl,
			seedCrawlAttempt,
			...(await seedState)
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
		searchMode,
		seedUsage,
		seedFallback,
		seedQuotaHit,
		pagesIndexed,
		seedCrawl,
		seedCrawlAttempt,
		...(await seedState)
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

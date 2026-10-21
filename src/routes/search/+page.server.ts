// add the ranker to dependencies to use wasm ranker ("ranker": "file:./pkg/" when testing)
import { API_BASE } from '$lib/api';
import { hitToResult, type SearchHit } from '$lib/highlight';
import { seedSearchState } from '$lib/seed-search';
import {
	fetchSeedCrawl,
	type SeedCrawl,
	type SeedCrawlAttempt,
	type SeedCrawlOutcome
} from '$lib/seed-crawl';

// uncomment to use wasm ranker
// export const ssr = false;

type Votes = { upvotes: number; downvotes: number; user_vote: null | 'upvote' | 'downvote' };

type Result = {
	title: Array<{ value: string; is_bold: boolean }>;
	extract: Array<{ value: string; is_bold: boolean }>;
	url: string;
	source: string;
	votes: undefined;
};

// The API's error pages are HTML, so a failed search is caught here rather than left to throw
// on parsing: thrown, it fails the whole page, which is what users see while the API restarts.
async function fetchStandardResults(query: string): Promise<Result[] | null> {
	try {
		const res = await fetch(`${API_BASE}/api/v1/search/?s=${encodeURIComponent(query)}`);
		if (res.ok) {
			const json = await res.json();
			if (Array.isArray(json)) return json;
			console.log('Search returned a non-array body');
		} else {
			console.log('Search failed with status', res.status);
		}
	} catch (err) {
		console.log('Search failed: ', err);
	}
	return null;
}

async function fetchVotes(
	accessToken: string | undefined,
	query: string,
	urls: string[]
): Promise<{ votes: Record<string, Votes> } | null> {
	try {
		const res = await fetch(`${API_BASE}/api/v1/platform/search-results/votes`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			method: 'POST',
			body: JSON.stringify({ query, urls })
		});
		if (res.ok) {
			const json = await res.json();
			if (json?.votes != null) return json;
			console.log('Votes response has no votes');
		} else {
			console.log('Fetching votes failed with status', res.status);
		}
	} catch (err) {
		console.log('Fetching votes failed: ', err);
	}
	return null;
}

export async function load({ url, cookies, locals, setHeaders }) {
	// const useWasmRanker = url.searchParams.get('useWasmRanker') === 'true';

	// if (!useWasmRanker) {
	const query = url.searchParams.get('q') ?? '';
	// Awaited before searching because the preference decides which search to run.
	const seedState = await seedSearchState(cookies, locals.loginStatus === 'assumeLoggedIn');

	let seedResults: Result[] | null = null;
	let searchMode: 'standard' | 'seed' = 'standard';
	let seedUsage: { usage: number; limit: number } | null = null;
	let seedFallback: 'quota' | 'error' | null = null;
	let pagesIndexed: number | null = null;
	let seedCrawl: SeedCrawl | null = null;
	let seedCrawlAttempt: SeedCrawlAttempt | null = null;

	// Set by the Seed Search toggle. On any failure (quota, auth, outage) fall back to standard search.
	// Every Seed Search also starts a background crawl of the EUSP results the index lacks.
	if (seedState.seedSearchEnabled) {
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

	const standardResults = seedResults == null ? await fetchStandardResults(query) : null;
	const searchFailed = seedResults == null && standardResults == null;
	const results: Result[] = seedResults ?? standardResults ?? [];
	// Don't let a cache keep serving the error page after the API recovers.
	if (searchFailed) setHeaders({ 'cache-control': 'no-store' });

	const votes =
		locals.loginStatus === 'assumeLoggedIn' && results.length > 0
			? await fetchVotes(
					cookies.get('accessToken'),
					query,
					results.map((r) => r.url)
				)
			: null;

	return {
		query: url.searchParams.get('q') as string | undefined,
		// Without votes, results go out as they do to a logged-out user.
		results: votes
			? results.map((result) => ({
					...result,
					votes: votes.votes[result.url] as Votes | undefined
				}))
			: results,
		searchFailed,
		searchMode,
		seedUsage,
		seedFallback,
		seedQuotaHit,
		pagesIndexed,
		seedCrawl,
		seedCrawlAttempt,
		...seedState
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

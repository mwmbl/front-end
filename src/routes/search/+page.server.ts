// add the ranker to dependencies to use wasm ranker ("ranker": "file:./pkg/" when testing)

// uncomment to use wasm ranker
// export const ssr = false;

export async function load({ url, cookies, locals }) {
	// const useWasmRanker = url.searchParams.get('useWasmRanker') === 'true';

	// if (!useWasmRanker) {
	const resultsRes = await fetch(
		'https://api.mwmbl.org/api/v1/search/?s=' + url.searchParams.get('q')
	);
	const results: Array<{
		title: Array<{ value: string; is_bold: boolean }>;
		extract: Array<{ value: string; is_bold: boolean }>;
		url: string;
		source: string;
		votes: undefined;
	}> = await resultsRes.json();

	if (locals.loginStatus !== 'assumeLoggedIn') {
		return {
			query: url.searchParams.get('q') as string | undefined,
			results: results
		};
	}
	const urls = results.map((r) => r.url.replaceAll(',', '%2C')).join(',');
	const votesRes = await fetch(
		`https://api.mwmbl.org/api/v1/platform/search-results/votes?query=${url.searchParams.get('q')}&urls=${urls}`,
		{
			headers: {
				Authorization: `Bearer ${cookies.get('accessToken')}`
			}
		}
	);
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
		results: resultsWithVotes
	};
	// }
	// else {
	// 	const wasm = await import('ranker');

	// 	const query = url.searchParams.get('q');
	// 	const ranker = wasm.Ranker.new(query ?? '');
	// 	const terms = ranker.get_query_terms();
	// 	for (const term of terms) {
	// 		const res = await fetch(`https://api.mwmbl.org/api/v1/search/raw?s=${term}`);
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

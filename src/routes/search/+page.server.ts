// add the ranker to dependencies to use wasm ranker ("ranker": "file:./pkg/" when testing)

// uncomment to use wasm ranker
// export const ssr = false;

export async function load({ url }) {
	// const useWasmRanker = url.searchParams.get('useWasmRanker') === 'true';

	// if (!useWasmRanker) {
	const response = await fetch(
		'https://api.mwmbl.org/api/v1/search/?s=' + url.searchParams.get('q')
	);
	const results: Array<{
		title: Array<{ value: string; is_bold: boolean }>;
		extract: Array<{ value: string; is_bold: boolean }>;
		url: string;
		source: string;
	}> = await response.json();

	return {
		query: url.searchParams.get('q') as string | undefined,
		results: results
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

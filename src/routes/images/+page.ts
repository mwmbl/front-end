import type { PageLoad } from './$types';

export type ImageResult = {
	title: string;
	page_url: string;
	source: string;
	thumbnail_url: string;
	image_url: string;
	width: number | null;
	height: number | null;
};

export const load: PageLoad = async ({ url, fetch }) => {
	const query = url.searchParams.get('q') ?? '';
	if (!query) return { query, results: [] as ImageResult[], error: null };

	const res = await fetch(`/api/v1/images/search?q=${encodeURIComponent(query)}`);
	if (res.status === 429) {
		return { query, results: [] as ImageResult[], error: 'Rate limited, try again in a moment.' };
	}
	if (!res.ok)
		return { query, results: [] as ImageResult[], error: `Image search failed (${res.status})` };

	const body: { results: ImageResult[] } = await res.json();
	return { query, results: body.results, error: null };
};

import { API_BASE } from '$lib/api';
import { fetchImages } from '$lib/image-search';

export async function load({ url, fetch, setHeaders }) {
	const query = url.searchParams.get('q') ?? '';
	// Not awaited: an uncached image search takes seconds, and the page streams in behind its header.
	// fetchImages never rejects.
	const outcome =
		query.trim() === ''
			? Promise.resolve({ status: 'ok' as const, images: [] })
			: fetchImages(API_BASE, query, fetch);
	// Results are judged per request; a cache must not keep serving an outage or a stale judgement.
	setHeaders({ 'cache-control': 'no-store' });
	return { query, outcome };
}

import { API_BASE } from '$lib/api';

// A seed crawl: Seed Search with crawl=true crawls the EUSP results the index lacked, and the
// pages they link to on the same sites, in the background. See mwmbl.indexer.seed_crawl.

export type SeedCrawlStatus = 'queued' | 'crawling' | 'done' | 'failed';

export type SeedCrawlPage = { url: string; title: string; extract: string };

export type SeedCrawl = {
	query: string;
	status: SeedCrawlStatus;
	started_at: string;
	finished_at: string | null;
	pages_crawled: number;
	pages_indexed: number;
	pages: SeedCrawlPage[];
};

// What a Seed Search's crawl=true did: started a crawl, or why it didn't.
export type SeedCrawlOutcome =
	| 'scheduled'
	| 'no_results'
	| 'already_indexed'
	| 'already_running'
	| 'already_crawled'
	| 'queue_full';

// activeQuery is the query of the user's crawl still queued or running, with already_running.
// outcome is null if the API predates crawl_outcome.
export type SeedCrawlAttempt = { outcome: SeedCrawlOutcome | null; activeQuery: string | null };

// How many of the newest pages to send to the page unless all of them are asked for, since a
// crawl can add hundreds.
export const LATEST_PAGES = 5;

/** This user's crawl for this query, or null if there is none (records last a week). */
export async function fetchSeedCrawl(
	accessToken: string | undefined,
	query: string,
	all = false
): Promise<SeedCrawl | null> {
	try {
		const res = await fetch(
			`${API_BASE}/api/v2/combined-search/new-pages?q=${encodeURIComponent(query)}`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);
		if (!res.ok) {
			if (res.status !== 404) console.log(`Seed crawl lookup failed: ${res.status}`);
			return null;
		}
		const crawl: SeedCrawl = await res.json();
		// Newest first.
		const pages = crawl.pages.slice().reverse();
		return { ...crawl, pages: all ? pages : pages.slice(0, LATEST_PAGES) };
	} catch (err) {
		console.log('Seed crawl lookup failed: ', err);
		return null;
	}
}

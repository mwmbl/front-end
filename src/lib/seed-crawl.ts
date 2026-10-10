import { API_BASE } from '$lib/api';

// A seed crawl: Seed Search with crawl=true crawls the EUSP results the index lacked, and the
// pages they link to on the same sites, in the background. See mwmbl.indexer.seed_crawl.

export type SeedCrawlStatus = 'queued' | 'crawling' | 'done' | 'failed';

export type SeedCrawlPage = { url: string; title: string; extract: string };

// A domain EUSP returned for the crawl's query, which the crawl stays within. See
// mwmbl.indexer.seed_domains.
export type SeedCrawlDomain = {
	domain: string;
	// Whether this crawl was the first to meet the domain.
	newly_discovered: boolean;
	pages_indexed: number;
	// pages_indexed as a share of the most a crawl takes from one domain, from 0 to 1.
	new_page_score: number;
	recent_new_page_score: number;
	staan_results: number;
	score: number;
};

// The most pages a crawl takes from one domain (SEED_CRAWL_MAX_PAGES_PER_DOMAIN).
export const MAX_PAGES_PER_DOMAIN = 100;

// A find: a domain this crawl discovered that turned out to be almost all new pages.
export const FIND_SCORE = 0.9;

export function isFind(domain: SeedCrawlDomain) {
	return domain.newly_discovered && domain.new_page_score > FIND_SCORE;
}

export type SeedCrawl = {
	query: string;
	status: SeedCrawlStatus;
	started_at: string;
	finished_at: string | null;
	pages_crawled: number;
	pages_indexed: number;
	// From 0 (queued) to 1 (done or failed).
	progress: number;
	// Most new pages first; empty until the crawl starts.
	domains: SeedCrawlDomain[];
	pages: SeedCrawlPage[];
};

// What a Seed Search's crawl=true did: started a crawl, or why it didn't.
export type SeedCrawlOutcome =
	| 'scheduled'
	| 'no_results'
	| 'already_indexed'
	| 'already_running'
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
		return {
			...crawl,
			// Absent from APIs that predate seed domains.
			progress:
				crawl.progress ?? (crawl.status === 'queued' || crawl.status === 'crawling' ? 0 : 1),
			domains: crawl.domains ?? [],
			pages: all ? pages : pages.slice(0, LATEST_PAGES)
		};
	} catch (err) {
		console.log('Seed crawl lookup failed: ', err);
		return null;
	}
}

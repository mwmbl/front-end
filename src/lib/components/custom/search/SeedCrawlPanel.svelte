<script lang="ts">
	import RiSeedlingLine from '~icons/ri/seedling-line';
	import type { SeedCrawl, SeedCrawlAttempt } from '$lib/seed-crawl';

	let {
		query,
		initialCrawl,
		attempt
	}: { query: string; initialCrawl: SeedCrawl | null; attempt: SeedCrawlAttempt | null } = $props();

	// Why this search started no crawl, when there's no earlier crawl of the query to show instead.
	const notCrawledOutcome = $derived(
		attempt?.outcome && attempt.outcome !== 'scheduled' ? attempt.outcome : null
	);

	const POLL_MS = 4000;

	// Writable deriveds rather than state set in an effect, so the server renders the crawl too
	// instead of it appearing only once the page hydrates. Both reset on a new search.
	let crawl = $derived<SeedCrawl | null>(initialCrawl);
	let showingAll = $derived.by(() => {
		void initialCrawl;
		return false;
	});

	const running = $derived(crawl?.status === 'queued' || crawl?.status === 'crawling');

	async function refresh(all = showingAll) {
		const res = await fetch(
			`/search/seed-crawl?q=${encodeURIComponent(query)}${all ? '&all=1' : ''}`
		);
		if (res.ok) crawl = await res.json();
	}

	$effect(() => {
		if (!running) return;
		const timer = setInterval(() => refresh().catch(() => {}), POLL_MS);
		return () => clearInterval(timer);
	});

	async function showAll() {
		showingAll = true;
		await refresh(true).catch(() => {});
	}

	function minutes(from: string, to: string) {
		const ms = new Date(to).getTime() - new Date(from).getTime();
		return Math.max(1, Math.round(ms / 60000));
	}

	const badge = $derived(
		crawl === null
			? { text: 'Not crawled', class: 'bg-muted text-foreground' }
			: {
					queued: { text: 'Queued', class: 'bg-muted text-foreground' },
					crawling: { text: 'Crawling', class: 'bg-accent text-accent-text' },
					done: {
						text: 'Done',
						class: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
					},
					failed: {
						text: 'Stopped',
						class: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
					}
				}[crawl.status]
	);
</script>

{#if crawl || notCrawledOutcome}
	<section
		aria-labelledby="seed-crawl-heading"
		class="bg-card text-card-foreground mb-6 flex flex-col gap-4 rounded-2xl p-5 shadow-sm"
	>
		<div class="flex flex-row items-center gap-3">
			<span
				class="bg-brand-gradient flex size-9 shrink-0 items-center justify-center rounded-lg text-black"
				aria-hidden="true"
			>
				<RiSeedlingLine class="size-5" />
			</span>
			<h2 id="seed-crawl-heading" class="font-display flex-1 text-xl font-extrabold">
				Grow the index
			</h2>
			<span class={['rounded-full px-2.5 py-0.5 text-xs font-bold', badge.class]}>{badge.text}</span
			>
		</div>

		{#if !crawl}
			<p>
				{#if notCrawledOutcome === 'already_running' && attempt?.activeQuery && attempt.activeQuery !== query}
					This search wasn't crawled because your crawl for
					<a
						href="/search?q={encodeURIComponent(attempt.activeQuery)}"
						class="text-accent-text font-semibold hover:underline">{attempt.activeQuery}</a
					>
					is still running. You can have one crawl at a time, so search again once it's done.
				{:else if notCrawledOutcome === 'already_running'}
					This search wasn't crawled because one of your crawls is still running. Search again once
					it's done.
				{:else if notCrawledOutcome === 'already_indexed'}
					Mwmbl already has every EUSP result for this search, so there was nothing new to crawl.
				{:else if notCrawledOutcome === 'no_results'}
					EUSP found nothing to crawl for this search.
				{:else if notCrawledOutcome === 'queue_full'}
					This search wasn't crawled because the crawl queue is full. Try again in a few minutes.
				{/if}
			</p>
		{:else if crawl.status === 'queued'}
			<p>
				Seed Search will crawl the sites in these results that Mwmbl doesn't have yet, so the next
				person searching finds them too. It runs on its own, so you can keep searching.
			</p>
			<div class="bg-muted h-2 overflow-hidden rounded-full">
				<div class="bg-unemphasized-1/40 h-full w-1/3 animate-pulse rounded-full"></div>
			</div>
		{:else}
			{#if crawl.status === 'failed'}
				<p>
					The crawl stopped early. {#if crawl.pages_indexed > 0}The {crawl.pages_indexed}
						{crawl.pages_indexed === 1 ? 'page' : 'pages'} it had already indexed are kept.{/if}
				</p>
			{/if}
			<div class="grid grid-cols-2 gap-3">
				<div class="bg-background rounded-xl px-3.5 py-3">
					<div class="font-display text-3xl leading-tight font-extrabold">
						{crawl.pages_indexed.toLocaleString()}
					</div>
					<div class="text-muted-foreground text-sm">new pages indexed</div>
				</div>
				<div class="bg-background rounded-xl px-3.5 py-3">
					<div class="font-display text-3xl leading-tight font-extrabold">
						{crawl.pages_crawled.toLocaleString()}
					</div>
					<div class="text-muted-foreground text-sm">pages fetched</div>
				</div>
			</div>
			{#if crawl.status !== 'failed'}
				<div class="flex flex-col gap-1.5">
					<div class="bg-muted h-2 overflow-hidden rounded-full">
						<div
							class={[
								'bg-brand-gradient h-full rounded-full',
								crawl.status === 'crawling' ? 'w-1/3 animate-pulse' : 'w-full'
							]}
						></div>
					</div>
					<p class="text-muted-foreground text-sm">
						{#if crawl.status === 'crawling'}
							Fetching one page per site per second. You can leave this page.
						{:else if crawl.finished_at}
							Finished in {minutes(crawl.started_at, crawl.finished_at)} min.
						{/if}
					</p>
				</div>
			{/if}
			{#if crawl.pages.length > 0}
				<div class="flex flex-col gap-2.5">
					<h3 class="text-sm font-bold">{showingAll ? 'All additions' : 'Latest additions'}</h3>
					<ul class="flex flex-col gap-2.5">
						{#each crawl.pages as page (page.url)}
							<li class="flex min-w-0 flex-col">
								<a href={page.url} class="text-accent-text truncate font-semibold hover:underline"
									>{page.title}</a
								>
								<span class="text-muted-foreground truncate text-sm"
									>{page.url.replace(/^https?:\/\//, '')}</span
								>
							</li>
						{/each}
					</ul>
					{#if !showingAll && crawl.pages_indexed > crawl.pages.length}
						<button
							type="button"
							class="text-accent-text self-start text-sm font-semibold hover:underline"
							onclick={showAll}
						>
							See all {crawl.pages_indexed.toLocaleString()} pages
						</button>
					{/if}
				</div>
			{/if}
		{/if}
	</section>
{/if}

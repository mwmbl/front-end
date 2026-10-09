<script lang="ts">
	import { Button } from '@/components/ui/button';
	import RiSeedlingLine from '~icons/ri/seedling-line';
	import type { SeedCrawl } from '$lib/seed-crawl';

	let {
		query,
		initialCrawl,
		canStart
	}: {
		query: string;
		initialCrawl: SeedCrawl | null;
		canStart: boolean;
	} = $props();

	const POLL_MS = 4000;

	let crawl = $state<SeedCrawl | null>(null);
	let starting = $state(false);
	let startError = $state<string | null>(null);
	let showingAll = $state(false);
	$effect.pre(() => {
		crawl = initialCrawl;
		startError = null;
		showingAll = false;
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

	async function start() {
		starting = true;
		startError = null;
		try {
			const res = await fetch('/search/seed-crawl', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ q: query })
			});
			if (res.status === 429) {
				startError = "You've used your Seed Searches for this month.";
				return;
			}
			if (!res.ok) {
				startError = "The crawl couldn't be started. Try again in a few minutes.";
				return;
			}
			const body: { scheduled: boolean; crawl: SeedCrawl | null } = await res.json();
			crawl = body.crawl;
			showingAll = false;
			if (!body.scheduled) {
				// The API doesn't say which of these it was.
				startError =
					'No crawl was started: every result may already be in Mwmbl, you may have a crawl running for another search, or the queue is full. Try again in a few minutes.';
			}
		} catch (err) {
			console.log('Starting seed crawl failed: ', err);
			startError = "The crawl couldn't be started. Try again in a few minutes.";
		} finally {
			starting = false;
		}
	}

	async function showAll() {
		showingAll = true;
		await refresh(true).catch(() => {});
	}

	function minutes(from: string, to: string) {
		const ms = new Date(to).getTime() - new Date(from).getTime();
		return Math.max(1, Math.round(ms / 60000));
	}

	const badge = $derived(
		crawl &&
			{
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

{#if crawl || canStart}
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
			{#if badge}
				<span class={['rounded-full px-2.5 py-0.5 text-xs font-bold', badge.class]}
					>{badge.text}</span
				>
			{/if}
		</div>

		{#if crawl?.status === 'queued'}
			<p>Your crawl is waiting to start. It runs on its own, so you can keep searching.</p>
			<div class="bg-muted h-2 overflow-hidden rounded-full">
				<div class="bg-unemphasized-1/40 h-full w-1/3 animate-pulse rounded-full"></div>
			</div>
		{:else if crawl}
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
			{#if crawl.status === 'failed' && canStart}
				<Button variant="secondary" class="rounded-full" disabled={starting} onclick={start}>
					Try again
				</Button>
			{/if}
		{:else}
			<p>
				Crawl the EUSP results Mwmbl doesn't have yet, and the pages they link to on the same sites,
				so the next person searching finds them too.
			</p>
			<Button class="rounded-full" disabled={starting} onclick={start}>
				{starting ? 'Starting…' : 'Crawl these sites'}
			</Button>
			<p class="text-muted-foreground text-sm">
				Uses one Seed Search. Up to 100 pages per site, usually a few minutes. One crawl at a time.
			</p>
		{/if}

		{#if startError}
			<p class="text-sm" role="status">{startError}</p>
		{/if}
	</section>
{/if}

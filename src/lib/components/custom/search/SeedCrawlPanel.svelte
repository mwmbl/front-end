<script lang="ts">
	import RiSeedlingLine from '~icons/ri/seedling-line';
	import RiCloseLine from '~icons/ri/close-line';
	import {
		isFind,
		MAX_PAGES_PER_DOMAIN,
		type SeedCrawl,
		type SeedCrawlAttempt,
		type SeedCrawlDomain
	} from '$lib/seed-crawl';

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
	// How many sites to list before "Show all".
	const SITES_SHOWN = 10;
	const TOAST_MS = 8000;

	// Writable deriveds rather than state set in an effect, so the server renders the crawl too
	// instead of it appearing only once the page hydrates. They reset on a new search.
	let crawl = $derived<SeedCrawl | null>(initialCrawl);
	let showingPages = $derived.by(() => {
		void initialCrawl;
		return false;
	});
	let showingAllSites = $derived.by(() => {
		void initialCrawl;
		return false;
	});
	// The finds the page already had, so only finds made while watching get the toast.
	let knownFinds = $derived(
		new Set((initialCrawl?.domains ?? []).filter(isFind).map((d) => d.domain))
	);
	let toast = $derived.by<SeedCrawlDomain | null>(() => {
		void initialCrawl;
		return null;
	});

	const running = $derived(crawl?.status === 'queued' || crawl?.status === 'crawling');
	const domains = $derived(crawl?.domains ?? []);
	const finds = $derived(domains.filter(isFind));
	const newCount = $derived(domains.filter((d) => d.newly_discovered).length);
	const shownDomains = $derived(showingAllSites ? domains : domains.slice(0, SITES_SHOWN));

	let panel: HTMLElement | undefined = $state();
	let panelVisible = $state(true);

	$effect(() => {
		if (!panel) return;
		const observer = new IntersectionObserver(([entry]) => (panelVisible = entry.isIntersecting));
		observer.observe(panel);
		return () => observer.disconnect();
	});

	async function refresh(all = showingPages) {
		const res = await fetch(
			`/search/seed-crawl?q=${encodeURIComponent(query)}${all ? '&all=1' : ''}`
		);
		if (!res.ok) return;
		const next: SeedCrawl | null = await res.json();
		const fresh = (next?.domains ?? []).filter((d) => isFind(d) && !knownFinds.has(d.domain));
		if (fresh.length > 0) {
			knownFinds = new Set([...knownFinds, ...fresh.map((d) => d.domain)]);
			// The panel's banner celebrates it when it's in view; the toast is for when it isn't.
			if (!panelVisible) toast = fresh[0];
		}
		crawl = next;
	}

	$effect(() => {
		if (!running) return;
		const timer = setInterval(() => refresh().catch(() => {}), POLL_MS);
		return () => clearInterval(timer);
	});

	$effect(() => {
		if (!toast) return;
		const timer = setTimeout(() => (toast = null), TOAST_MS);
		return () => clearTimeout(timer);
	});

	async function showPages() {
		showingPages = true;
		await refresh(true).catch(() => {});
	}

	function seeFind() {
		toast = null;
		panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function minutes(from: string, to: string) {
		const ms = new Date(to).getTime() - new Date(from).getTime();
		return Math.max(1, Math.round(ms / 60000));
	}

	function plural(n: number, one: string, many = `${one}s`) {
		return `${n.toLocaleString()} ${n === 1 ? one : many}`;
	}

	function barClass(domain: SeedCrawlDomain) {
		if (isFind(domain)) return 'bg-brand-gradient';
		return domain.newly_discovered ? 'bg-accent-text' : 'bg-unemphasized-1';
	}

	const badge = $derived(
		crawl === null
			? { text: 'Not crawled', class: 'bg-muted text-foreground' }
			: {
					queued: { text: 'Queued', class: 'bg-muted text-foreground' },
					crawling: { text: 'Crawling', class: 'bg-accent text-accent-text animate-pulse' },
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

{#snippet sprout(size: string)}
	<svg
		class={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d="M12 22v-8" />
		<path d="M12 14c0-4-3-7-8-7 0 4 3 7 8 7z" />
		<path d="M12 16c0-5 3.5-8 9-8 0 5-3.5 8-9 8z" />
	</svg>
{/snippet}

{#snippet findBadge()}
	<span
		class="bg-brand-gradient font-display shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black tracking-wider text-black"
		>FIND</span
	>
{/snippet}

{#snippet newBadge()}
	<span
		class="bg-accent text-accent-text shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide"
		>NEW TO MWMBL</span
	>
{/snippet}

{#if crawl || notCrawledOutcome}
	<section
		bind:this={panel}
		aria-labelledby="seed-crawl-heading"
		class="bg-card text-card-foreground @container mb-6 flex scroll-mt-4 flex-col gap-5 rounded-2xl p-5 shadow-sm"
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
				Seed Search will explore the sites in these results, looking for ones Mwmbl doesn't have
				yet, so the next person searching finds them too. It runs on its own, so you can keep
				searching.
			</p>
			<div class="bg-muted h-2 overflow-hidden rounded-full">
				<div class="bg-unemphasized-1/40 h-full w-1/3 animate-pulse rounded-full"></div>
			</div>
		{:else}
			{#if crawl.status === 'done' && finds.length > 0}
				<div class="flex flex-col gap-3">
					<p class="font-display text-xl leading-tight font-extrabold">
						Your crawl for <span class="text-accent-text">{crawl.query}</span> found {finds.length ===
						1
							? 'a site'
							: `${finds.length} sites`} Mwmbl was missing
					</p>
					<ul class="grid grid-cols-1 gap-3 @lg:grid-cols-2">
						{#each finds as find (find.domain)}
							<li class="bg-brand-gradient rounded-2xl p-0.5">
								<div class="bg-card flex h-full flex-col gap-1 rounded-[14px] px-4 py-3">
									<div class="flex min-w-0 items-center gap-2">
										{@render sprout('size-4.5 shrink-0')}
										<a
											href="https://{find.domain}"
											class="font-display text-accent-text truncate text-lg font-extrabold hover:underline"
											>{find.domain}</a
										>
									</div>
									<p class="text-muted-foreground text-sm">
										<strong class="text-foreground">{plural(find.pages_indexed, 'new page')}</strong
										>
										of {MAX_PAGES_PER_DOMAIN} · first found by you
									</p>
								</div>
							</li>
						{/each}
					</ul>
					<p class="text-muted-foreground text-sm">
						Finds are sites that were new to Mwmbl and gave more than {MAX_PAGES_PER_DOMAIN * 0.9} new
						pages. Crawlers will keep coming back to them.
					</p>
				</div>
			{:else if crawl.status === 'done'}
				<p>
					Your crawl for <strong>{crawl.query}</strong> explored {plural(domains.length, 'site')}.
					{#if newCount > 0}None of the new ones gave enough new pages to be a find this time.{/if}
				</p>
			{:else if crawl.status === 'crawling'}
				<p>
					{#if domains.length > 0}
						Exploring the <strong>{plural(domains.length, 'site')}</strong> EUSP found for
						<strong>{crawl.query}</strong>. Sites Mwmbl has never seen are the ones to watch.
					{:else}
						Starting to explore the sites EUSP found for <strong>{crawl.query}</strong>.
					{/if}
				</p>
			{:else if crawl.status === 'failed'}
				<p>
					The crawl stopped early. {#if crawl.pages_indexed > 0}The {plural(
							crawl.pages_indexed,
							'page'
						)} it had already indexed are kept.{/if}
				</p>
			{/if}

			{#if crawl.status === 'crawling' && finds.length > 0}
				<div aria-live="polite">
					{#key finds[0].domain}
						<div class="find-in bg-brand-gradient rounded-2xl p-0.5">
							<div class="bg-card flex items-center gap-4 rounded-[14px] p-4 @lg:gap-5 @lg:p-5">
								<div class="relative size-16 shrink-0 @lg:size-19" aria-hidden="true">
									<div class="find-ring absolute inset-0 rounded-full"></div>
									<div class="bg-card absolute inset-1 rounded-full"></div>
									<div
										class="find-sprout text-foreground absolute inset-0 flex items-center justify-center"
									>
										{@render sprout('size-8 @lg:size-9')}
									</div>
									<span class="find-spark" style="--dx: -26px; --dy: -24px; background: #ffc700"
									></span>
									<span
										class="find-spark"
										style="--dx: 30px; --dy: -20px; animation-delay: .3s; background: #c45bf0"
									></span>
									<span
										class="find-spark"
										style="--dx: 28px; --dy: 26px; animation-delay: .6s; background: #3fa7f5"
									></span>
									<span
										class="find-spark"
										style="--dx: -30px; --dy: 22px; animation-delay: .9s; background: #ffc700"
									></span>
								</div>
								<div class="flex min-w-0 flex-col gap-1">
									<span
										class="find-sheen font-display self-start rounded-full px-2.5 py-0.5 text-xs font-black tracking-widest text-black"
										>NEW FIND</span
									>
									<p class="font-display text-xl leading-tight font-extrabold">
										You found <a
											href="https://{finds[0].domain}"
											class="text-accent-text break-words hover:underline">{finds[0].domain}</a
										>{#if finds.length > 1}<span class="text-muted-foreground">
												and {plural(finds.length - 1, 'other')}</span
											>{/if}
									</p>
									<p class="text-muted-foreground">
										Mwmbl had never seen this site, and {finds[0].pages_indexed} of the {MAX_PAGES_PER_DOMAIN}
										pages we took from it were new. Crawlers will keep coming back to it, thanks to you.
									</p>
								</div>
							</div>
						</div>
					{/key}
				</div>
			{/if}

			<div class="grid grid-cols-3 gap-3">
				<div class="bg-background rounded-xl px-3.5 py-3">
					<div class="font-display text-3xl leading-tight font-extrabold">
						{domains.length.toLocaleString()}
					</div>
					<div class="text-muted-foreground text-sm">
						{domains.length === 1 ? 'site' : 'sites'} explored
					</div>
				</div>
				<div class="bg-background rounded-xl px-3.5 py-3">
					<div class="font-display text-accent-text text-3xl leading-tight font-extrabold">
						{newCount.toLocaleString()}
					</div>
					<div class="text-muted-foreground text-sm">new to Mwmbl</div>
				</div>
				<div class="bg-background rounded-xl px-3.5 py-3">
					<div class="font-display text-3xl leading-tight font-extrabold">
						{crawl.pages_indexed.toLocaleString()}
					</div>
					<div class="text-muted-foreground text-sm">pages added</div>
				</div>
			</div>

			{#if crawl.status === 'crawling'}
				<div class="-mt-1 flex flex-col gap-1.5">
					<div
						class="bg-muted h-2 overflow-hidden rounded-full"
						role="progressbar"
						aria-label="Crawl progress"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={Math.round(crawl.progress * 100)}
					>
						<div
							class="bg-brand-gradient h-full rounded-full transition-[width] duration-700"
							style="width: {Math.max(4, crawl.progress * 100)}%"
						></div>
					</div>
					<p class="text-muted-foreground text-sm">
						{Math.round(crawl.progress * 100)}% through · one page per site per second · you can
						leave this page
					</p>
				</div>
			{:else if crawl.status === 'done' && crawl.finished_at}
				<p class="text-muted-foreground -mt-2 text-sm">
					Finished in {minutes(crawl.started_at, crawl.finished_at)} min · {plural(
						crawl.pages_crawled,
						'page'
					)} fetched
				</p>
			{/if}

			{#if domains.length > 0}
				<div class="flex flex-col gap-1">
					<div class="flex flex-row flex-wrap items-baseline justify-between gap-x-3">
						<h3 class="font-display font-extrabold">
							{crawl.status === 'crawling' ? 'Sites in this crawl' : 'All sites'}
						</h3>
						<span class="text-muted-foreground text-sm"
							>new pages, of the {MAX_PAGES_PER_DOMAIN} a crawl takes per site</span
						>
					</div>
					<ul class="flex flex-col">
						{#each shownDomains as domain (domain.domain)}
							<li
								class="border-muted grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-x-3 gap-y-1.5 border-b py-2.5"
							>
								<div class="flex min-w-0 items-center gap-2">
									<a
										href="https://{domain.domain}"
										class="text-accent-text min-w-16 truncate font-semibold hover:underline"
										>{domain.domain}</a
									>
									{#if isFind(domain)}
										{@render findBadge()}
									{:else if domain.newly_discovered}
										{@render newBadge()}
									{/if}
								</div>
								<span
									class="font-display text-right font-extrabold"
									aria-label={plural(domain.pages_indexed, 'new page')}>{domain.pages_indexed}</span
								>
								<div
									class="bg-muted col-span-2 row-start-2 h-1.5 overflow-hidden rounded-full"
									aria-hidden="true"
								>
									<div
										class={[
											'h-full rounded-full transition-[width] duration-700',
											barClass(domain)
										]}
										style="width: {Math.min(100, domain.new_page_score * 100)}%"
									></div>
								</div>
							</li>
						{/each}
					</ul>
					{#if domains.length > SITES_SHOWN}
						<button
							type="button"
							class="text-accent-text min-h-11 self-start text-sm font-semibold hover:underline"
							onclick={() => (showingAllSites = !showingAllSites)}
						>
							{showingAllSites ? 'Show fewer sites' : `Show all ${domains.length} sites`}
						</button>
					{/if}
				</div>
			{/if}

			{#if crawl.status === 'crawling' && finds.length === 0 && domains.length > 0}
				<p class="text-muted-foreground text-sm">
					A site that is new to Mwmbl and gives more than {MAX_PAGES_PER_DOMAIN * 0.9} new pages is a
					<strong class="text-foreground">find</strong>: crawlers will keep coming back to it.
				</p>
			{/if}

			{#if crawl.pages_indexed > 0}
				{#if showingPages}
					<div class="flex flex-col gap-2.5">
						<h3 class="font-display font-extrabold">Pages added</h3>
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
					</div>
				{:else}
					<button
						type="button"
						class="text-accent-text min-h-11 self-start text-sm font-semibold hover:underline"
						onclick={showPages}
					>
						See the {plural(crawl.pages_indexed, 'page')} added
					</button>
				{/if}
			{/if}
		{/if}
	</section>
{/if}

{#if toast}
	<div
		role="status"
		class="find-up bg-brand-gradient fixed inset-x-3 bottom-4 z-50 mx-auto max-w-md rounded-[18px] p-0.5 shadow-xl"
	>
		<div class="bg-card flex items-center gap-3 rounded-2xl py-3 pr-2 pl-3">
			<div class="relative size-11 shrink-0" aria-hidden="true">
				<div class="find-ring absolute inset-0 rounded-full"></div>
				<div
					class="bg-card text-foreground absolute inset-[3px] flex items-center justify-center rounded-full"
				>
					{@render sprout('size-5.5')}
				</div>
			</div>
			<div class="flex min-w-0 flex-1 flex-col">
				<span class="font-display text-accent-text text-[11px] font-black tracking-widest"
					>NEW FIND</span
				>
				<span class="font-display truncate leading-tight font-extrabold"
					>You found {toast.domain}</span
				>
				<span class="text-muted-foreground text-sm"
					>{plural(toast.pages_indexed, 'new page')} · new to Mwmbl</span
				>
			</div>
			<button
				type="button"
				class="text-accent-text min-h-11 shrink-0 px-2.5 text-sm font-semibold hover:underline"
				onclick={seeFind}>See</button
			>
			<button
				type="button"
				aria-label="Dismiss"
				class="text-muted-foreground hover:bg-muted flex size-11 shrink-0 items-center justify-center rounded-full"
				onclick={() => (toast = null)}
			>
				<RiCloseLine class="size-5" />
			</button>
		</div>
	</div>
{/if}

<style>
	.find-ring {
		background-image: conic-gradient(
			hsl(48, 100%, 61%),
			hsl(283, 100%, 77%),
			hsl(206, 100%, 73%),
			hsl(48, 100%, 61%)
		);
		animation: find-spin 6s linear infinite;
	}
	.find-sheen {
		background-image: linear-gradient(
			90deg,
			hsl(48, 100%, 61%),
			hsl(283, 100%, 77%),
			hsl(206, 100%, 73%),
			hsl(48, 100%, 61%)
		);
		background-size: 200% 100%;
		animation: find-sheen 3s linear infinite;
	}
	.find-in {
		animation: find-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	.find-up {
		animation: find-up 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	.find-sprout {
		animation: find-sprout 0.7s 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	.find-spark {
		position: absolute;
		left: calc(50% - 4px);
		top: calc(50% - 4px);
		width: 8px;
		height: 8px;
		border-radius: 50%;
		opacity: 0;
		animation: find-spark 1.4s ease-out infinite;
	}

	@keyframes find-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes find-sheen {
		to {
			background-position: 200% 50%;
		}
	}
	@keyframes find-in {
		0% {
			opacity: 0;
			transform: translateY(-10px) scale(0.97);
		}
		60% {
			opacity: 1;
			transform: translateY(2px) scale(1.01);
		}
		100% {
			transform: none;
		}
	}
	@keyframes find-up {
		0% {
			opacity: 0;
			transform: translateY(24px);
		}
		60% {
			opacity: 1;
			transform: translateY(-3px);
		}
		100% {
			transform: none;
		}
	}
	@keyframes find-sprout {
		0% {
			transform: scale(0.3) rotate(-20deg);
		}
		70% {
			transform: scale(1.15) rotate(4deg);
		}
		100% {
			transform: none;
		}
	}
	@keyframes find-spark {
		0% {
			opacity: 0;
			transform: translate(0, 0) scale(0.4);
		}
		25% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), var(--dy)) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.find-ring,
		.find-sheen,
		.find-in,
		.find-up,
		.find-sprout {
			animation: none;
		}
		.find-spark {
			display: none;
		}
	}
</style>

<script lang="ts">
	import BottomLinks from '@/components/custom/brand/BottomLinks.svelte';
	import SeedSearchToggle from '@/components/custom/search/SeedSearchToggle.svelte';
	import RiArrowRightLine from '~icons/ri/arrow-right-line';
	import RiArrowRightSLine from '~icons/ri/arrow-right-s-line';
	import RiCalendarLine from '~icons/ri/calendar-line';
	import RiSearchLine from '~icons/ri/search-line';
	import RiSeedlingLine from '~icons/ri/seedling-line';
	import RiShieldCheckLine from '~icons/ri/shield-check-line';
	import RiToggleLine from '~icons/ri/toggle-line';

	let { data } = $props();

	const loggedIn = $derived(data.loginStatus === 'assumeLoggedIn');
	const loginHref = '/account?next=%2Fseed-search';

	const exampleResults = [
		{
			host: 'tokio.rs',
			source: 'EUSP',
			title: 'Tokio - An asynchronous Rust runtime',
			extract:
				'Tokio is an event-driven, non-blocking I/O platform for writing asynchronous applications with Rust.'
		},
		{
			host: 'rust-lang.github.io',
			source: 'Mwmbl',
			title: 'Asynchronous Programming in Rust',
			extract: 'The async book: futures, executors and how async/await works under the hood.'
		},
		{
			host: 'github.com/smol-rs',
			source: 'EUSP',
			title: 'smol - A small and fast async runtime',
			extract: 'A small and fast async runtime for Rust.'
		}
	];

	const reasons = [
		{
			title: 'Independent, and small',
			body: 'Mwmbl is non-profit and open source, with no ads and no tracking, and volunteers run our crawlers. Being independent means our index is much smaller than those of commercial engines, so it misses pages people are looking for.'
		},
		{
			title: 'Crawlers follow links, not needs',
			body: "A crawler finds new pages by following links from pages it already knows. It can't tell which of those pages anyone is searching for."
		},
		{
			title: 'Seed Search follows searches',
			body: "Each Seed Search fetches the pages that matter for a real query and writes them into the index under that query's words. The index grows where searchers need it."
		}
	];

	const loop = [
		'You search with Seed Search on',
		"EUSP finds pages Mwmbl hasn't crawled",
		"They're added to Mwmbl's open index"
	];

	const features = [
		{
			icon: RiToggleLine,
			title: 'On when you log in',
			body: "Seed Search is on by default for logged-in users. Turn off the switch next to the search bar if you'd rather not use it."
		},
		{
			icon: RiCalendarLine,
			title: '30 free a month',
			body: "Every logged-in user gets 30 Seed Searches a month. The results bar shows how many you've used."
		},
		{
			icon: RiSeedlingLine,
			title: 'See what you planted',
			body: 'After each search, we show how many new pages it added to the Mwmbl index.'
		},
		{
			icon: RiShieldCheckLine,
			title: 'Never an empty page',
			body: "If you've used your searches for the month, or a provider is down, you get standard Mwmbl results and a short note saying so."
		}
	];

	const steps = [
		{
			title: 'Retrieve in parallel',
			body: "Your query goes to the Mwmbl index and to EUSP's web search API at the same time. We keep EUSP's top ten and cache them."
		},
		{
			title: 'Pool and filter',
			body: 'Both sets go into one pool of candidates, and anything from a blocked domain is removed before ranking or indexing.'
		},
		{
			title: 'First-pass ranking',
			body: "Mwmbl's learning-to-rank model (XGBoost, with its feature pipeline written in Rust) scores every candidate. We retrained it on this mixed pool, and it knows where EUSP ranked each of its results."
		},
		{
			title: 'Final ordering with Jev',
			body: "EUSP's ten results and our model's top 30 go to Jev, TypeSafe AI's structured-judgment model, in one request. It rates each result for relevance and quality. The rest follow in our model's order."
		},
		{
			title: 'Grow the index',
			body: "At the same time, EUSP's results are indexed under the query's single words and word pairs. A page found for one person's search can then show up in anyone's search."
		},
		{
			title: 'Fail soft',
			body: "If EUSP is down, you get index results. If Jev is down, you get our model's ordering. An outage can lower quality but never leaves you without results."
		}
	];

	const pipeline = [
		{ title: 'Pool & filter', detail: 'drop blocked domains' },
		{ title: 'Mwmbl ranker', detail: 'XGBoost, Rust features' },
		{ title: 'Jev', detail: 'TypeSafe AI, final order' }
	];

	const relevanceLevels = [
		['Irrelevant', 'off-topic, wrong entity, spam or broken'],
		['Marginal', 'thin or tangential, the wrong sense, an SEO page'],
		['Good', 'relevant and useful, but partial or less authoritative'],
		['Excellent', 'directly satisfies what the searcher most likely wants']
	];

	const qualityLevels = [
		['Junk', 'spam, content farm, scraped, broken or login page'],
		['Thin', "a stub, bare listing, tag page, or just the query's words"],
		['Substantive', 'a real page with real content, or the real site it names']
	];

	const method = [
		{
			title: '295 held-out queries',
			body: 'Real UK English search queries. None of them appear in the 849 queries we used to train the ranking model and tune its weights.'
		},
		{
			title: 'Whole lists, side by side',
			body: 'Claude Haiku 4.5 sees two top tens (title, URL and snippet). It picks A, B or a tie, says how strongly, and gives the main reason: top result, relevance, junk, redundancy, coverage or snippets.'
		},
		{
			title: 'Judged both ways round',
			body: 'Separate judges see each pair twice, with the order swapped. We average the two verdicts on a −3 to +3 scale and report 95% confidence intervals.'
		},
		{
			title: 'A judge we checked',
			body: 'Where per-page relevance scores (NDCG) show a real gap between two lists, the judge agrees with them 82–85% of the time, rising to 98% for the largest gaps.'
		}
	];

	// Judge preference on the −3..3 scale with 95% confidence intervals,
	// from mwmbl/rankeval/combined-holistic-eval.md in the mwmbl repo.
	const results = [
		{
			arm: 'Jev + EUSP rank',
			against: 'vs EUSP first, our model filling the rest',
			mean: 0.49,
			low: 0.37,
			high: 0.61
		},
		{
			arm: 'Shipped: adds quality and index penalty',
			against: 'vs Jev + EUSP rank',
			mean: 0.16,
			low: 0.07,
			high: 0.25
		},
		{ arm: 'Shipped Seed Search', against: 'vs Brave Search', mean: -0.12, low: -0.26, high: 0.02 }
	];
	const axisMin = -0.4;
	const axisMax = 0.7;
	const ticks = [-0.4, -0.2, 0, 0.2, 0.4, 0.6];
	const position = (value: number) => ((value - axisMin) / (axisMax - axisMin)) * 100;
	const signed = (value: number) =>
		(value > 0 ? '+' : value < 0 ? '−' : '') + Math.abs(value).toFixed(2);

	const notHelped = [
		"Letting a learned model override EUSP's top results. The judge preferred EUSP's own order.",
		'Re-ranking for diversity (MMR).',
		'Asking Jev whether a result is about the right entity.',
		'Capping results per site, which lost by 0.65. Often the repeats were what the searcher wanted.'
	];

	const shortfalls = [
		"Judges flag off-topic results about 1.7× as often as in Brave's lists.",
		"Pages from Mwmbl's own index are about six times as likely as EUSP's to be flagged. That's the gap Seed Search exists to close.",
		'Things with the same name get mixed up: other hotels for "bankside hotel", baking pages for "slaters" the menswear shop.'
	];

	const caveats = [
		'These are judgments by an AI model, not user studies.',
		'All test queries are UK English.',
		'The judge sees snippets, not the full pages.'
	];
</script>

<svelte:head>
	<title>Seed Search - Mwmbl</title>
	<meta
		name="description"
		content="Seed Search combines Mwmbl's open index with results from EUSP, ranked by TypeSafe AI, and adds every new page it finds to Mwmbl's index."
	/>
</svelte:head>

<main class="flex flex-col">
	<!-- Hero -->
	<section class="py-16 md:py-24">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center gap-14 px-6">
			<div class="flex min-w-0 flex-[1_1_480px] flex-col gap-7">
				<p
					class="font-display text-unemphasized-2 text-sm font-extrabold tracking-widest uppercase"
				>
					Seed Search
				</p>
				<h1 class="font-display text-[clamp(2.6rem,6vw,4.25rem)] leading-[1.1] font-extrabold">
					Better search results —<br />for
					<span class="bg-brand-gradient inline-block rounded-2xl px-4 text-black">everyone</span>.
				</h1>
				<p class="max-w-3xl text-xl leading-relaxed">
					Seed Search adds results from EUSP (European Search Perspective) to Mwmbl's own index and
					ranks them with Jev, a model from TypeSafe AI. Every new page it finds goes into Mwmbl's
					open index, so the next search is better for everyone.
				</p>
				<div class="flex flex-wrap items-center gap-x-6 gap-y-3">
					{#if loggedIn}
						<div class="bg-card rounded-full border px-5 py-3">
							<SeedSearchToggle
								loginStatus={data.loginStatus}
								enabled={data.seedSearchEnabled}
								quotaExhausted={data.seedSearchQuotaExhausted}
							/>
						</div>
					{:else}
						<a
							href={loginHref}
							class="bg-primary text-primary-foreground font-display inline-flex min-h-13 items-center rounded-full px-7 text-lg font-bold hover:opacity-85"
							>Log in to try Seed Search</a
						>
					{/if}
					<a
						href="#how"
						class="font-display inline-flex min-h-11 items-center gap-1.5 text-lg font-bold hover:underline"
						>See how it works<RiArrowRightLine /></a
					>
				</div>
				<p class="text-unemphasized-2">
					30 free Seed Searches a month · Only your query text leaves Mwmbl
				</p>
			</div>

			<!-- An illustrative Seed Search results page -->
			<div
				class="bg-card flex min-w-0 flex-[1_1_440px] flex-col gap-4 rounded-2xl border p-6 shadow-[0_24px_60px_-30px_rgba(20,24,40,0.35)]"
				aria-label="Example of Seed Search results"
				role="img"
			>
				<div class="flex h-13 items-center gap-3 rounded-full border px-5">
					<RiSearchLine class="text-unemphasized-2" />
					<span class="text-lg">rust async runtimes</span>
				</div>
				<div class="flex flex-wrap items-center justify-between gap-3 text-sm">
					<span class="text-unemphasized-2"
						>Using Seed Search (Mwmbl + EUSP) · 4 of 30 this month</span
					>
					<span class="flex items-center gap-2 font-semibold">
						<span
							class="bg-brand-gradient flex h-5 w-9 items-center justify-end rounded-full p-0.5"
						>
							<span class="block h-4 w-4 rounded-full bg-black"></span>
						</span>
						Seed Search
					</span>
				</div>
				<div class="flex flex-col gap-4 pt-1">
					{#each exampleResults as result (result.title)}
						<div class="flex flex-col gap-1">
							<div class="text-unemphasized-2 flex items-center gap-2 text-sm">
								{result.host}
								<span
									class="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs font-medium"
									>{result.source}</span
								>
							</div>
							<div class="text-accent-text text-lg font-medium">{result.title}</div>
							<div class="text-unemphasized-2 text-sm leading-normal">{result.extract}</div>
						</div>
					{/each}
				</div>
				<div class="bg-background flex items-center gap-3 rounded-xl px-4 py-3">
					<RiSeedlingLine class="h-6 w-6 shrink-0" />
					<span class="leading-snug">
						Seed Search added <b>3 new pages</b> to the Mwmbl index, improving results for everyone.
					</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Why -->
	<section id="why" class="bg-card border-y py-16 md:py-24">
		<div class="mx-auto flex max-w-6xl flex-col gap-12 px-6">
			<div class="flex flex-col gap-4">
				<p
					class="font-display text-unemphasized-2 text-sm font-extrabold tracking-widest uppercase"
				>
					Why we built it
				</p>
				<h2 class="font-display text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold">
					Our index is small.<br />Seed Search grows it where it counts.
				</h2>
			</div>
			<div class="grid gap-8 md:grid-cols-3">
				{#each reasons as reason (reason.title)}
					<div class="flex flex-col gap-3">
						<h3 class="font-display text-xl leading-snug font-bold">{reason.title}</h3>
						<p class="text-lg leading-relaxed">{reason.body}</p>
					</div>
				{/each}
			</div>
			<div class="bg-background flex flex-col gap-4 rounded-3xl p-6 md:p-8">
				<ol class="flex flex-wrap items-center gap-3">
					{#each loop as step, index (step)}
						<li class="bg-card flex-[1_1_180px] rounded-2xl border px-5 py-4 leading-snug">
							<b>{index + 1}</b> · {step}
						</li>
						<RiArrowRightSLine class="text-unemphasized-2 h-6 w-6" aria-hidden="true" />
					{/each}
					<li
						class="bg-brand-gradient flex-[1_1_180px] rounded-2xl px-5 py-4 leading-snug text-black"
					>
						<b>4</b> · Everyone's next search is better, even with Seed Search off
					</li>
				</ol>
				<p class="text-unemphasized-2">
					<b class="text-foreground">A bridge, not a dependency.</b> Seed Search gives you good results
					while Mwmbl's index catches up. The pages it plants stay in the open index whatever happens
					to the providers.
				</p>
			</div>
		</div>
	</section>

	<!-- What you get -->
	<section class="py-16 md:py-24">
		<div class="mx-auto flex max-w-6xl flex-col gap-12 px-6">
			<div class="flex flex-col gap-4">
				<p
					class="font-display text-unemphasized-2 text-sm font-extrabold tracking-widest uppercase"
				>
					What you get
				</p>
				<h2 class="font-display text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold">
					One switch, next to the search bar.
				</h2>
			</div>
			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{#each features as feature (feature.title)}
					<div class="bg-card flex flex-col gap-3 rounded-2xl border p-7">
						<feature.icon class="h-7 w-7" aria-hidden="true" />
						<h3 class="font-display text-xl leading-snug font-bold">{feature.title}</h3>
						<p class="leading-relaxed">{feature.body}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Privacy -->
	<section class="bg-stone-900 py-16 text-white md:py-24 dark:bg-black/40">
		<div class="mx-auto flex max-w-6xl flex-wrap gap-12 px-6">
			<div class="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
				<p class="font-display text-sm font-extrabold tracking-widest text-stone-300 uppercase">
					Privacy
				</p>
				<h2 class="font-display text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold">
					Your query goes out.<br />You don't.
				</h2>
				<p class="text-lg leading-relaxed text-stone-200">
					You need to log in so we can count your monthly searches. That's the only thing we use
					your account for. Mwmbl keeps no log of your queries linked to you, and what goes into the
					public index is the pages that were found, never who searched for them.
				</p>
				<a href="/privacy" class="text-lg text-sky-300 underline">Read the privacy policy</a>
			</div>
			<div class="grid min-w-0 flex-[1_1_460px] gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-3 rounded-2xl bg-white/10 p-7">
					<h3 class="font-display text-xl leading-snug font-bold">Sent to EUSP and TypeSafe AI</h3>
					<p class="rounded-lg bg-black/40 px-4 py-3 font-mono">"rust async runtimes"</p>
					<p class="text-stone-200">The text of your query, and nothing else.</p>
				</div>
				<div class="flex flex-col gap-3 rounded-2xl bg-white/10 p-7">
					<h3 class="font-display text-xl leading-snug font-bold">Never sent</h3>
					<ul class="list-disc pl-5 leading-loose text-stone-200">
						<li>Your name or email address</li>
						<li>Your username or account ID</li>
						<li>Anything else that identifies you</li>
					</ul>
				</div>
				<p class="text-sm text-stone-300 sm:col-span-2">
					Providers handle queries under their own privacy policies and may process them outside the
					EEA or UK.
				</p>
			</div>
		</div>
	</section>

	<!-- How it works -->
	<section id="how" class="scroll-mt-8 py-16 md:py-24">
		<div class="mx-auto flex max-w-6xl flex-col gap-12 px-6">
			<div class="flex flex-col gap-4">
				<p
					class="font-display text-unemphasized-2 text-sm font-extrabold tracking-widest uppercase"
				>
					How it works
				</p>
				<h2 class="font-display text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold">
					Two sources, one ranking,<br />and a write back to the index.
				</h2>
				<p class="max-w-3xl text-xl leading-relaxed">
					Seed Search is a single request to Mwmbl. Here's what happens between your query and your
					results.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<div class="flex flex-wrap items-stretch gap-2.5">
					<div
						class="bg-card flex flex-[1_1_130px] flex-col justify-center gap-1 rounded-2xl border p-4"
					>
						<span
							class="font-display text-unemphasized-2 text-xs font-extrabold tracking-widest uppercase"
							>Input</span
						>
						<b class="text-lg">Your query</b>
					</div>
					<RiArrowRightSLine class="text-unemphasized-2 h-6 w-6 self-center" aria-hidden="true" />
					<div class="flex flex-[1_1_170px] flex-col gap-2">
						<div class="bg-card flex flex-1 flex-col rounded-2xl border px-4 py-3">
							<b>Mwmbl index</b><span class="text-unemphasized-2 text-sm">our own crawl</span>
						</div>
						<div class="bg-card flex flex-1 flex-col rounded-2xl border px-4 py-3">
							<b>EUSP</b><span class="text-unemphasized-2 text-sm">top 10, cached</span>
						</div>
					</div>
					{#each pipeline as stage (stage.title)}
						<RiArrowRightSLine class="text-unemphasized-2 h-6 w-6 self-center" aria-hidden="true" />
						<div
							class="bg-card flex flex-[1_1_150px] flex-col justify-center gap-1 rounded-2xl border p-4"
						>
							<b class="text-lg">{stage.title}</b>
							<span class="text-unemphasized-2 text-sm">{stage.detail}</span>
						</div>
					{/each}
					<RiArrowRightSLine class="text-unemphasized-2 h-6 w-6 self-center" aria-hidden="true" />
					<div
						class="bg-primary text-primary-foreground flex flex-[1_1_130px] flex-col justify-center gap-1 rounded-2xl p-4"
					>
						<span class="font-display text-xs font-extrabold tracking-widest uppercase opacity-70"
							>Output</span
						>
						<b class="text-lg">Your results</b>
					</div>
				</div>
				<div class="bg-brand-gradient flex items-center gap-3 rounded-2xl px-5 py-4 text-black">
					<RiSeedlingLine class="h-6 w-6 shrink-0" aria-hidden="true" />
					<span>
						<b>While ranking runs,</b> EUSP's results are written into the Mwmbl index under the query's
						words and word pairs, so they show up as candidates in future searches.
					</span>
				</div>
			</div>

			<ol class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
				{#each steps as step, index (step.title)}
					<li class="bg-card flex flex-col gap-3 rounded-2xl border p-7">
						<span class="text-unemphasized-2 font-mono text-sm">0{index + 1}</span>
						<h3 class="font-display text-xl leading-snug font-bold">{step.title}</h3>
						<p class="leading-relaxed">{step.body}</p>
					</li>
				{/each}
			</ol>

			<div class="bg-card flex flex-col gap-7 rounded-2xl border p-6 md:p-9">
				<div class="flex flex-col gap-2">
					<h3 class="font-display text-2xl text-xl leading-snug font-bold">The scoring rule</h3>
					<p class="text-lg leading-relaxed">
						Jev answers two questions about every candidate. We combine its answers with EUSP's own
						ranking, which our tests showed is worth trusting near the top.
					</p>
				</div>
				<div class="flex flex-col gap-2">
					<div
						class="overflow-x-auto rounded-xl bg-stone-900 px-6 py-5 text-white dark:bg-black/40"
					>
						<code class="text-lg whitespace-nowrap">
							score = relevance + 0.5 × quality − 0.1 × EUSP position − 0.5 if not from EUSP
						</code>
					</div>
					<p class="text-unemphasized-2 text-sm">
						A result EUSP didn't return gets position 10, one past its last result. The weights were
						tuned on training queries only.
					</p>
				</div>
				<div class="grid gap-7 md:grid-cols-2">
					{#each [{ name: 'Relevance', scale: '0–3, for a web searcher in the UK', levels: relevanceLevels }, { name: 'Quality', scale: '0–2, from title, URL and snippet', levels: qualityLevels }] as question (question.name)}
						<div class="flex flex-col gap-3">
							<p class="text-lg font-semibold">
								{question.name}
								<span class="text-unemphasized-2 font-normal">· {question.scale}</span>
							</p>
							<ol class="divide-y overflow-hidden rounded-xl border">
								{#each question.levels as [label, description], score (label)}
									<li class="flex gap-4 px-4 py-3">
										<span class="w-4 shrink-0 font-mono">{score}</span>
										<span><b>{label}</b>: {description}</span>
									</li>
								{/each}
							</ol>
						</div>
					{/each}
				</div>
				<dl class="flex flex-wrap gap-10">
					<div class="flex flex-col-reverse">
						<dt class="text-unemphasized-2">typical Jev response for ~34 candidates</dt>
						<dd class="font-display text-4xl font-extrabold">~0.6 s</dd>
					</div>
					<div class="flex flex-col-reverse">
						<dt class="text-unemphasized-2">Jev request per search</dt>
						<dd class="font-display text-4xl font-extrabold">1</dd>
					</div>
					<div class="flex flex-col-reverse">
						<dt class="text-unemphasized-2">Jev cost per search</dt>
						<dd class="font-display text-4xl font-extrabold">~$0.0003</dd>
					</div>
				</dl>
			</div>
		</div>
	</section>

	<!-- How we measured it -->
	<section id="measured" class="bg-card border-y py-16 md:py-24">
		<div class="mx-auto flex max-w-6xl flex-col gap-12 px-6">
			<div class="flex flex-col gap-4">
				<p
					class="font-display text-unemphasized-2 text-sm font-extrabold tracking-widest uppercase"
				>
					How we measured it
				</p>
				<h2 class="font-display text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold">
					We judge whole result lists,<br />not single pages.
				</h2>
				<p class="max-w-3xl text-xl leading-relaxed">
					Grading pages one at a time misses what makes a results page good: whether the top result
					answers the query, and whether the list is full of duplicates or junk. So we show a judge
					two complete top tens and ask which is better.
				</p>
			</div>

			<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
				{#each method as point (point.title)}
					<div class="border-foreground flex flex-col gap-2 border-t-2 pt-4">
						<h3 class="font-display text-xl leading-snug font-bold">{point.title}</h3>
						<p class="leading-relaxed">{point.body}</p>
					</div>
				{/each}
			</div>

			<figure class="bg-background flex flex-col gap-6 rounded-2xl border p-6 md:p-9">
				<figcaption class="flex flex-col gap-2">
					<h3 class="font-display text-2xl text-xl leading-snug font-bold">Results</h3>
					<p class="text-unemphasized-2">
						Judge preference on the −3 to +3 scale, with 95% confidence intervals. Right of zero
						means the judge preferred the first list.
					</p>
				</figcaption>
				<div class="overflow-x-auto">
					<table class="w-full min-w-[720px] border-collapse">
						<thead class="sr-only">
							<tr><th>Comparison</th><th>Interval</th><th>Preference and 95% interval</th></tr>
						</thead>
						<tbody>
							{#each results as result (result.arm)}
								<tr class="border-b">
									<th scope="row" class="w-[32%] py-4 pr-6 text-left leading-snug font-normal">
										<b>{result.arm}</b><br /><span class="text-unemphasized-2"
											>{result.against}</span
										>
									</th>
									<td class="relative h-16" aria-hidden="true">
										<span
											class="border-unemphasized-1 absolute inset-y-0 border-l border-dashed"
											style:left="{position(0)}%"
										></span>
										<span
											class="bg-accent-text absolute top-1/2 h-0.5 -translate-y-1/2"
											style:left="{position(result.low)}%"
											style:width="{position(result.high) - position(result.low)}%"
										></span>
										<span
											class="bg-accent-text ring-background absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
											style:left="{position(result.mean)}%"
										></span>
									</td>
									<td class="w-44 py-4 pl-6 text-right font-mono text-sm whitespace-nowrap">
										<b>{signed(result.mean)}</b><br />
										<span class="text-unemphasized-2"
											>[{signed(result.low)}, {signed(result.high)}]</span
										>
									</td>
								</tr>
							{/each}
							<tr aria-hidden="true">
								<td></td>
								<td class="text-unemphasized-2 relative h-8 font-mono text-sm">
									{#each ticks as tick (tick)}
										<span class="absolute top-2 -translate-x-1/2" style:left="{position(tick)}%"
											>{tick === 0 ? '0' : signed(tick).replace(/0$/, '')}</span
										>
									{/each}
								</td>
								<td></td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="grid gap-6 md:grid-cols-2">
					<p class="leading-relaxed">
						<b>Each step was a clear win.</b> Both intervals sit well right of zero, and the judge preferred
						the shipped ordering in 44% of comparisons against 29% for the one before it.
					</p>
					<p class="leading-relaxed">
						<b>Brave's remaining lead is within the margin of error.</b> In a separate, earlier run,
						Brave beat our previous ordering by +0.78.
					</p>
				</div>
			</figure>

			<div class="grid gap-5 lg:grid-cols-3">
				{#each [{ title: "What didn't help", items: notHelped }, { title: 'Where we still fall short', items: shortfalls }, { title: 'Caveats', items: caveats }] as group (group.title)}
					<div class="bg-background flex flex-col gap-3 rounded-2xl border p-7">
						<h3 class="font-display text-xl leading-snug font-bold">{group.title}</h3>
						<ul class="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed">
							{#each group.items as item (item)}
								<li>{item}</li>
							{/each}
						</ul>
						{#if group.title === 'Caveats'}
							<a
								href="https://github.com/mwmbl/mwmbl/tree/main/mwmbl/rankeval"
								class="text-accent-text underline">Read the full evaluation write-ups</a
							>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Closing call to action -->
	<section class="py-20 md:py-28">
		<div class="mx-auto flex max-w-6xl flex-col items-center gap-7 px-6 text-center">
			<h2
				class="font-display max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] leading-tight font-extrabold"
			>
				Every search you make can make Mwmbl
				<span class="bg-brand-gradient inline-block rounded-xl px-3 text-black">better</span>.
			</h2>
			<p class="max-w-3xl text-xl leading-relaxed">
				{#if loggedIn}
					Turn on Seed Search and your 30 free searches a month also grow the open index.
				{:else}
					Log in, turn on Seed Search, and get 30 free searches a month that also grow the open
					index.
				{/if}
			</p>
			<div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
				{#if loggedIn}
					<a
						href="/"
						class="bg-primary text-primary-foreground font-display inline-flex min-h-13 items-center rounded-full px-7 text-lg font-bold hover:opacity-85"
						>Start searching</a
					>
				{:else}
					<a
						href={loginHref}
						class="bg-primary text-primary-foreground font-display inline-flex min-h-13 items-center rounded-full px-7 text-lg font-bold hover:opacity-85"
						>Log in to try Seed Search</a
					>
				{/if}
				<a
					href="https://github.com/mwmbl/mwmbl"
					class="font-display inline-flex min-h-11 items-center gap-1.5 text-lg font-bold hover:underline"
					>Read the code<RiArrowRightLine /></a
				>
			</div>
		</div>
	</section>
</main>

<footer class="mt-auto flex justify-center px-8 pb-8">
	<BottomLinks />
</footer>

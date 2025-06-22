<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Popover from '@/components/ui/popover';

	import RiEqualizer2Line from '~icons/ri/equalizer-2-line';
	import RiLinksLine from '~icons/ri/links-line';

	import Search from '@/components/custom/search/SearchBar.svelte';
	import SearchResult from '@/components/custom/search/SearchResult.svelte';
	import Options from '@/components/custom/menu/Options.svelte';
	import MobileMenu from '@/components/custom/menu/MobileMenu.svelte';
	import SignInButton from '@/components/custom/menu/SignInButton.svelte';
	import Cta from '@/components/custom/brand/CTA.svelte';
	import BottomLinks from '@/components/custom/brand/BottomLinks.svelte';
	import WikipediaCard from '@/components/custom/search/WikipediaCard.svelte';

	let { data } = $props();

	const wikipediaCard = $derived(
		data.results.length > 0 && data.results[0].url.startsWith('https://en.wikipedia.org/wiki/')
	);

	const results = $derived(!wikipediaCard ? data.results : data.results.slice(1));
</script>

<svelte:head>
	<title>{data.query} - MWMBL</title>
</svelte:head>

<div class="header-grid mx-auto w-full max-w-(--breakpoint-xl) justify-center gap-4 p-5">
	<header class="contents">
		<a
			href="/"
			class="col-start-1 flex flex-row items-center gap-4 max-lg:row-start-1 lg:justify-self-end"
		>
			<h1 class="contents">
				<img src="/logo.svg" alt="mwmbl" class="h-12" />
				<img src="/mwmbl-text.svg" alt="" class="h-6 lg:hidden dark:invert" />
			</h1>
		</a>
		<div class="max-lg:row-start-2">
			<Search query={data.query} />
		</div>
		<div class="flex flex-row gap-6 justify-self-end max-lg:col-start-1 max-lg:row-start-1">
			<div class="hidden lg:contents">
				<SignInButton loginStatus={data.loginStatus} />
			</div>
			<MobileMenu loginStatus={data.loginStatus} />
		</div>
		<div class="mb-0 flex flex-row gap-4 max-lg:row-start-3 lg:col-start-2 lg:col-end-2">
			<!-- <Button href="/" variant="secondary" class="flex flex-row items-center gap-2 dark:bg-muted">
				<RiLinksLine class="min-h-5 min-w-5 text-black dark:text-white" />
				Submit URL
			</Button> -->
			<Button
				href="/domain-submissions"
				variant="secondary"
				class="dark:bg-muted flex flex-row items-center gap-2"
			>
				<RiLinksLine class="min-h-5 min-w-5 text-black dark:text-white" />
				Submit Domain
			</Button>
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="secondary"
							class="max-lg:hidde dark:bg-muted ml-auto flex flex-row items-center gap-2"
						>
							<RiEqualizer2Line class="min-h-5 min-w-5 text-black dark:text-white" />
							Options
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="mt-2"><Options /></Popover.Content>
			</Popover.Root>
		</div>
	</header>

	<hr class="absolute top-52 left-0 w-screen lg:top-36" />

	<main class="mt-4 flex w-full flex-col gap-4 lg:col-start-2 lg:col-end-2">
		{#if wikipediaCard}
			<WikipediaCard result={data.results[0]} />
		{/if}
		{#each results as result}
			<SearchResult {result} />
		{/each}
		{#if results.length == 0}
			<div class="flex flex-col justify-center gap-4 p-4">
				<h2 class="text-2xl font-semibold">No results found</h2>
				<p class="text-muted-foreground text-sm">
					Try searching for something else or use <a
						href="https://mwmbl.org/?q={data.query}"
						class="underline transition-[text-underline-offset] hover:underline-offset-4"
					>
						the old frontend
					</a>
					to add a result. <br />
					(feature coming to the new site soon)
				</p>
			</div>
		{/if}
	</main>

	<section class="lg:col-start-3 lg:col-end-3 lg:mt-4">
		<hr class="mt-3 mb-6 lg:hidden" />
		<Cta />
		<BottomLinks class="lg:justify-end" />
	</section>
</div>

<style>
	.header-grid {
		display: grid;
		grid-template-columns: minmax(16rem, 46rem);
		grid-template-rows: repeat(3, 1fr);
	}
	@media (min-width: 1024px) {
		.header-grid {
			display: grid;
			grid-template-columns: minmax(3rem, 8rem) minmax(32rem, 46rem) 1fr;
			grid-template-rows: repeat(2, 1fr);
		}
	}
</style>

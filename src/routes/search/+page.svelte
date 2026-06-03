<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import * as Popover from '@/components/ui/popover';

	import RiEqualizer2Line from '~icons/ri/equalizer-2-line';
	import RiLinksLine from '~icons/ri/links-line';
	import Search from '@/components/custom/search/SearchBar.svelte';
	import SearchResult from '@/components/custom/search/SearchResult.svelte';
	import SuperSearch from '@/components/custom/search/SuperSearch.svelte';
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

	let superSearchActive = $state(data.loginStatus === 'assumeLoggedIn' && !!data.superSearch);

	let prevQuery = data.query;
	$effect(() => {
		const q = data.query;
		if (q !== prevQuery) {
			prevQuery = q;
			superSearchActive = false;
		}
	});

	onMount(() => {
		if (data.superSearch) {
			const cleanUrl = new URL(window.location.href);
			cleanUrl.searchParams.delete('superSearch');
			history.replaceState({}, '', cleanUrl);
		}
	});
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
		{#if superSearchActive}
			{#key data.query}
				<SuperSearch query={data.query ?? ''} />
			{/key}
		{:else}
			{#if wikipediaCard}
				<WikipediaCard result={data.results[0]} query={data.query} />
			{/if}
			{#each results as result}
				<SearchResult {result} query={data.query} />
			{/each}
			{#if results.length === 0}
				<div class="flex justify-center p-4">
					<h2 class="text-2xl font-semibold">No results found</h2>
				</div>
			{/if}
			<div class="flex justify-center py-4">
				<div class="flex max-w-xs flex-col items-center gap-4 text-center">
					<p class="text-muted-foreground text-sm">
						{#if results.length > 0}Need more results?
						{:else}Try Super Search!
						{/if} Super Search sends your query to external APIs, gathers the results and crawls the
						web just for you, in ten seconds.
					</p>
					{#if data.loginStatus !== 'assumeLoggedIn'}
						<p class="text-muted-foreground text-sm">Sign up/log in to use Super Search.</p>
					{/if}
					<!-- padding reserves space so the 1.2× scale doesn't shift surrounding content -->
					<div class="p-5">
						<Button
							onclick={() => {
								if (data.loginStatus === 'assumeLoggedIn') {
									superSearchActive = true;
								} else {
									goto(
										`/account?next=${encodeURIComponent(`/search?q=${encodeURIComponent(data.query ?? '')}&superSearch=1`)}`
									);
								}
							}}
							class="group bg-brand-gradient text-foreground relative h-12 overflow-visible px-8 text-base font-semibold transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.2]"
						>
							<span
								class="pointer-events-none absolute inset-0 rounded-[inherit] bg-black/20 transition-opacity duration-300 group-hover:opacity-0"
							></span>
							<span class="relative">Super Search</span>
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</main>

	<section class="max-w-sm lg:col-start-3 lg:col-end-3 lg:mt-4">
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

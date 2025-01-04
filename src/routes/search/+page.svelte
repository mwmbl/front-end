<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Popover from '@/components/ui/popover';

	import RiEqualizer2Line from '~icons/ri/equalizer-2-line';
	import RiLinksLine from '~icons/ri/links-line';

	import Search from '@/components/custom/Search.svelte';
	import SearchResult from '@/components/custom/SearchResult.svelte';
	import Options from '@/components/custom/Options.svelte';
	import MobileMenu from '@/components/custom/MobileMenu.svelte';
	import SignInButton from '@/components/custom/SignInButton.svelte';
	import Cta from '@/components/custom/CTA.svelte';
	import BottomLinks from '@/components/custom/BottomLinks.svelte';
	import WikipediaCard from '@/components/custom/WikipediaCard.svelte';

	let { data } = $props();

	const wikipediaCard = $derived(data.results[0].url.startsWith('https://en.wikipedia.org/wiki/'));

	const results = $derived(!wikipediaCard ? data.results : data.results.slice(1));
</script>

<svelte:head>
	<title>{data.query} - MWMBL</title>
</svelte:head>

<div class="header-grid mx-auto w-full max-w-screen-xl justify-center gap-4 p-5">
	<header class="contents">
		<a
			href="/"
			class="col-start-1 flex flex-row items-center gap-4 max-lg:row-start-1 lg:justify-self-end"
		>
			<h1 class="contents">
				<img src="/logo.svg" alt="mwmbl" class="h-12" />
				<img src="/mwmbl-text.svg" alt="" class="h-6 dark:invert lg:hidden" />
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
				class="flex flex-row items-center gap-2 dark:bg-muted"
			>
				<RiLinksLine class="min-h-5 min-w-5 text-black dark:text-white" />
				Submit Domain
			</Button>
			<Popover.Root>
				<Popover.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						variant="secondary"
						class="max-lg:hidde ml-auto flex flex-row items-center gap-2 dark:bg-muted"
					>
						<RiEqualizer2Line class="min-h-5 min-w-5 text-black dark:text-white" />
						Options
					</Button>
				</Popover.Trigger>
				<Popover.Content class="mt-2"><Options /></Popover.Content>
			</Popover.Root>
		</div>
	</header>

	<hr class="absolute left-0 top-52 w-screen lg:top-36" />

	<main class="mt-4 flex w-full flex-col gap-4 lg:col-start-2 lg:col-end-2">
		{#if wikipediaCard}
			<WikipediaCard result={data.results[0]} />
		{/if}
		{#each results as result}
			<SearchResult {result} />
		{/each}
	</main>

	<section class="lg:col-start-3 lg:col-end-3 lg:mt-4">
		<hr class="mb-6 mt-3 lg:hidden" />
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

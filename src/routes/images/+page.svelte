<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	import RiImageLine from '~icons/ri/image-line';
	import RiSearchLine from '~icons/ri/search-line';
	import Search from '@/components/custom/search/SearchBar.svelte';
	import MobileMenu from '@/components/custom/menu/MobileMenu.svelte';
	import SignInButton from '@/components/custom/menu/SignInButton.svelte';
	import BottomLinks from '@/components/custom/brand/BottomLinks.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.query ? `${data.query} - Images - MWMBL` : 'Images - MWMBL'}</title>
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
			<Search query={data.query} action="/images" />
		</div>
		<div class="flex flex-row gap-6 justify-self-end max-lg:col-start-1 max-lg:row-start-1">
			<div class="hidden lg:contents">
				<SignInButton loginStatus={data.loginStatus} />
			</div>
			<MobileMenu loginStatus={data.loginStatus} />
		</div>
		<div class="mb-0 flex flex-row gap-4 max-lg:row-start-3 lg:col-start-2 lg:col-end-2">
			<Button
				href={data.query ? `/search?q=${encodeURIComponent(data.query)}` : '/'}
				variant="secondary"
				class="dark:bg-muted flex flex-row items-center gap-2"
			>
				<RiSearchLine class="min-h-5 min-w-5 text-black dark:text-white" />
				Web
			</Button>
			<Button
				href="/images"
				variant="secondary"
				aria-current="page"
				class="dark:bg-muted flex flex-row items-center gap-2 underline"
			>
				<RiImageLine class="min-h-5 min-w-5 text-black dark:text-white" />
				Images
			</Button>
		</div>
	</header>

	<hr class="absolute top-52 left-0 w-screen lg:top-36" />

	<main class="mt-4 flex w-full flex-col gap-4 lg:col-span-3">
		<Card.Root class="flex flex-col gap-1 p-4">
			<p class="text-sm font-semibold">
				<span class="bg-brand-gradient rounded-md px-2 py-0.5 text-black">Beta</span>
				Image search is an early experiment
			</p>
			<p class="text-unemphasized-2 text-sm">
				Please note that queries are sent to Brave. Results may
				be limited, and things may change or break at any time.
			</p>
		</Card.Root>

		{#if data.error}
			<div class="flex justify-center p-4">
				<h2 class="text-2xl font-semibold">{data.error}</h2>
			</div>
		{:else if !data.query}
			<div class="flex justify-center p-4">
				<h2 class="text-2xl font-semibold">Search for images above</h2>
			</div>
		{:else if data.results.length === 0}
			<div class="flex justify-center p-4">
				<h2 class="text-2xl font-semibold">No images found</h2>
			</div>
		{/if}

		<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
			{#each data.results as image (image.image_url)}
				<a href={image.page_url} target="_blank" rel="noopener noreferrer" class="group max-w-full">
					<Card.Root class="flex h-full w-full flex-col gap-0 overflow-hidden p-0">
						<img
							src={image.thumbnail_url}
							alt={image.title}
							loading="lazy"
							class="bg-secondary aspect-square w-full object-cover"
						/>
						<div class="flex flex-col gap-1 p-3">
							<span
								class="text-unemphasized-2 line-clamp-2 text-sm leading-snug font-medium group-hover:underline"
							>
								{image.title}
							</span>
							<span class="text-muted-foreground truncate text-xs">{image.source}</span>
						</div>
					</Card.Root>
				</a>
			{/each}
		</div>

		<footer class="mt-4 flex justify-center">
			<BottomLinks />
		</footer>
	</main>
</div>

<style>
	.header-grid {
		display: grid;
		grid-template-columns: minmax(16rem, 46rem);
		grid-template-rows: repeat(3, auto);
	}
	@media (min-width: 1024px) {
		.header-grid {
			display: grid;
			grid-template-columns: minmax(3rem, 8rem) minmax(32rem, 46rem) 1fr;
			grid-template-rows: repeat(2, auto);
		}
	}
</style>

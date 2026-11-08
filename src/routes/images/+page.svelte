<script lang="ts">
	import Search from '@/components/custom/search/SearchBar.svelte';
	import SearchTabs from '@/components/custom/search/SearchTabs.svelte';
	import ImageTile from '@/components/custom/search/ImageTile.svelte';
	import MobileMenu from '@/components/custom/menu/MobileMenu.svelte';
	import SignInButton from '@/components/custom/menu/SignInButton.svelte';
	import BottomLinks from '@/components/custom/brand/BottomLinks.svelte';

	let { data } = $props();

	const placeholders = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
</script>

<svelte:head>
	<title>{data.query} - Images - Mwmbl</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-(--breakpoint-xl) flex-col gap-4 p-5">
	<header class="flex flex-row flex-wrap items-center gap-4">
		<a href="/" class="flex flex-row items-center gap-4">
			<h1 class="contents">
				<img src="/logo.svg" alt="mwmbl" class="h-12" />
				<img src="/mwmbl-text.svg" alt="" class="h-6 lg:hidden dark:invert" />
			</h1>
		</a>
		<div class="min-w-64 flex-1 basis-96">
			<Search query={data.query} action="/images" />
		</div>
		<div class="ml-auto flex flex-row gap-6">
			<div class="hidden lg:contents">
				<SignInButton loginStatus={data.loginStatus} />
			</div>
			<MobileMenu loginStatus={data.loginStatus} />
		</div>
	</header>

	<SearchTabs query={data.query} active="images" />

	<main class="flex flex-col gap-4">
		{#await data.outcome}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-busy="true">
				{#each placeholders as placeholder (placeholder)}
					<div class="bg-muted h-56 animate-pulse rounded-xl"></div>
				{/each}
			</div>
		{:then outcome}
			{#if outcome.status === 'unavailable'}
				<div class="flex justify-center p-4">
					<h2 class="text-2xl font-semibold">
						Image search is unavailable right now. Try again in a minute.
					</h2>
				</div>
			{:else if outcome.images.length === 0}
				<div class="flex justify-center p-4">
					<h2 class="text-2xl font-semibold">
						{data.query ? 'No images found' : 'Search for images'}
					</h2>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					{#each outcome.images as image (image.page_url)}
						<ImageTile {image} />
					{/each}
				</div>
			{/if}
		{/await}
		<p class="text-muted-foreground text-center text-xs">
			Images come live from Wikimedia Commons and are checked for safety before they are shown. The
			checks are strict, so some suitable images are left out. Mwmbl does not store or proxy images.
		</p>
	</main>

	<BottomLinks />
</div>

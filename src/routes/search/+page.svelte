<script lang="ts">
	import { Button } from '@/components/ui/button';

	import RiMenu3Fill from '~icons/ri/menu-3-fill';
	import RiEqualizer2Line from '~icons/ri/equalizer-2-line';
	import RiUserLine from '~icons/ri/user-line';
	import RiSearchLine from '~icons/ri/search-line';
	import RiImage2Line from '~icons/ri/image-2-line';
	import RiLinksLine from '~icons/ri/links-line';

	import Search from '@/components/custom/Search.svelte';
	import SearchResult from '@/components/custom/SearchResult.svelte';

	let { data } = $props();
</script>

<div class="header-grid mx-auto w-full max-w-screen-xl justify-center gap-4 p-5">
	<header class="contents">
		<a
			href="/"
			class="col-start-1 flex flex-row items-center gap-4 max-lg:row-start-1 lg:justify-self-end"
		>
			<img src="/logo.svg" alt="mwmbl" class="h-12" />
			<img src="/mwmbl-text.svg" alt="" class="h-6 lg:hidden" />
		</a>
		<div class="max-lg:row-start-2">
			<Search query={data.query} />
		</div>
		<div class="justify-self-end max-lg:col-start-1 max-lg:row-start-1">
			<Button href="/account" class="max-lg:hidden">
				<RiUserLine class="mr-2 min-h-5 min-w-5 text-white dark:text-black" /> Sign In
			</Button>
			<Button class="lg:hidden" size="icon" variant="secondary" title="Menu" aria-label="Menu">
				<RiMenu3Fill class="min-h-6 min-w-6 text-black dark:text-white" />
			</Button>
		</div>
		<div class="mb-0 flex flex-row gap-4 max-lg:row-start-3 lg:col-start-2 lg:col-end-2">
			<Button href="/" class="flex flex-row items-center gap-2">
				<RiSearchLine class="min-h-5 min-w-5 text-white dark:text-black" />
				Text
			</Button>
			<Button href="/" variant="secondary" class="mr-auto flex flex-row items-center gap-2">
				<RiImage2Line class="min-h-5 min-w-5 text-black dark:text-white" />
				Images
			</Button>
			<Button href="/" variant="secondary" class="flex flex-row items-center gap-2">
				<RiLinksLine class="min-h-5 min-w-5 text-black dark:text-white" />
				Submit URL
			</Button>
			<Button
				href="/preferences"
				variant="secondary"
				class="flex flex-row items-center gap-2 max-lg:hidden"
			>
				<RiEqualizer2Line class="min-h-5 min-w-5 text-black dark:text-white" />
				Options
			</Button>
		</div>

		<!-- <div class="contents md:hidden">
			<Sheet.Root>
				<Sheet.Trigger asChild let:builder>
					<Button builders={[builder]} variant="outline" size="icon">
						<CiHamburgerMd class="h-7 w-7" />
					</Button>
				</Sheet.Trigger>
				<Sheet.Content side="right">
					<Sheet.Header>
						<Sheet.Title>Mwmbl Menu</Sheet.Title>
					</Sheet.Header>
					<ol class="flex flex-col items-start">
						<Button variant="link" href="/" class="px-2">Home</Button>
						<Button variant="link" href="https://opencollective.com/mwmbl" class="px-2">
							Donate
						</Button>
						<Button variant="outline" href="/preferences" class="mb-3 px-2">
							<RiSettings4Fill class="mr-2 min-h-6 min-w-6 text-black dark:text-white" />
							Preferences
						</Button>
						<Button variant="outline" href="/account" class="px-2">
							<RiUserLine class="mr-2 min-h-6 min-w-6 text-black dark:text-white" />
							Account
						</Button>
					</ol>
				</Sheet.Content>
			</Sheet.Root>
		</div> -->
	</header>
	<hr class="lg:col-span-3 lg:row-start-3" />

	<main class="contents">
		<div class="flex w-full flex-col gap-4 lg:col-start-2 lg:col-end-2">
			{#each data.results as result}
				<SearchResult {result} />
			{/each}
		</div>
	</main>
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

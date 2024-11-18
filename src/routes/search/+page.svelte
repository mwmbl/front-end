<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Popover from '@/components/ui/popover';
	import * as Sheet from '@/components/ui/sheet';

	import RiEqualizer2Line from '~icons/ri/equalizer-2-line';
	import RiUserLine from '~icons/ri/user-line';
	import RiSearchLine from '~icons/ri/search-line';
	import RiImage2Line from '~icons/ri/image-2-line';
	import RiLinksLine from '~icons/ri/links-line';

	import Search from '@/components/custom/Search.svelte';
	import SearchResult from '@/components/custom/SearchResult.svelte';
	import Options from '@/components/custom/Options.svelte';
	import MobileMenu from '@/components/custom/MobileMenu.svelte';
	import SignInButton from '@/components/custom/SignInButton.svelte';

	let { data } = $props();
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
			<img src="/logo.svg" alt="mwmbl" class="h-12" />
			<img src="/mwmbl-text.svg" alt="" class="h-6 dark:invert lg:hidden" />
		</a>
		<div class="max-lg:row-start-2">
			<Search query={data.query} />
		</div>
		<div class="justify-self-end max-lg:col-start-1 max-lg:row-start-1">
			<div class="hidden lg:contents">
				<SignInButton status={data.status} />
			</div>
			<MobileMenu status={data.status} />
		</div>
		<div class="mb-0 flex flex-row gap-4 max-lg:row-start-3 lg:col-start-2 lg:col-end-2">
			<Button href="/" variant="secondary" class="flex flex-row items-center gap-2 dark:bg-muted">
				<RiLinksLine class="min-h-5 min-w-5 text-black dark:text-white" />
				Submit URL
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

		<div class="contents md:hidden"></div>
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

<script>
	import Search from '@/components/custom/search/SearchBar.svelte';
	import EmojioneMagnifyingGlassTiltedRight from '~icons/emojione/magnifying-glass-tilted-right';
</script>

<main class="flex min-h-[75svh] flex-col items-center justify-center gap-9 px-8">
	<h2
		class="justify-self-center px-8 text-center text-4xl font-semibold leading-snug! md:text-5xl lg:text-6xl"
	>
		The
		<strong class="rounded-2xl bg-brand-gradient px-5 py-0 text-black">truly</strong>
		open&nbsp;source<br />
		search
		<span class="whitespace-nowrap"
			>engine<EmojioneMagnifyingGlassTiltedRight class="ml-4 inline" /></span
		>
	</h2>
	<p class="mb-8 max-w-full px-6 text-center text-sm sm:text-base md:max-w-184">
		Mwmbl (pronounced "mumble") is the first search engine that's completely independent, open
		source, and non-profit.
	</p>
	<Search />
</main>

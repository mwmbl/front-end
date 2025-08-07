<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	import RiSearchLine from '~icons/ri/search-line';
	import PhArrowSquareOutFill from '~icons/ph/arrow-square-out-fill';
	import RiCloseFill from '~icons/ri/close-fill';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	let { query }: { query?: string } = $props();

	let input: HTMLInputElement | null = $state(null);
	let searchBarRef: HTMLFormElement;

	let searchCompletions: string[] = $state([]);
	let completionsVisible = $state(false);
	let completionsLoading = $state(true);

	// AbortControllers are used to cancel fetches when the user searchers for something
	// This is to prevent the page being stuck loading completions after the user has already searched
	let abortControllers: AbortController[] = [];

	function fetchSearchCompletions(query: string | undefined) {
		completionsLoading = searchCompletions.length === 0;
		completionsVisible = !!(query && query.trim().length > 0);

		if (!query || query.length === 0) {
			resetCompletions();
			return;
		}

		if (query != undefined) {
			const controller = new AbortController();
			const signal = controller.signal;
			abortControllers.push(controller);
			fetch('https://api.mwmbl.org/api/v1/search/complete?q=' + query, { signal })
				.then((res) => {
					res.json().then((json) => {
						searchCompletions = json[1];
						completionsLoading = false;
					});
				})
				.catch((e: Error) => {
					if (e.name === 'AbortError') {
						return; // Don't litter the console with abort errors, aborting is intentional
					}
					throw e;
				});
		}
	}

	function resetCompletions() {
		completionsVisible = false;
		abortControllers.forEach((controller) => controller.abort());
		abortControllers = [];
		searchCompletions = [];
		input?.focus();
	}
</script>

<svelte:window
	onclick={(e) => {
		// If user clicks outside of search bar, reset (hide) completions
		if (!completionsVisible || !e.target || !(e.target instanceof Node)) return;
		if (e.target !== searchBarRef && !searchBarRef.contains(e.target)) resetCompletions();
	}}
/>

<form
	class="relative flex w-full max-w-184 flex-row items-center"
	action="/search"
	method="get"
	onsubmit={resetCompletions}
	bind:this={searchBarRef}
>
	<Input
		type="search"
		name="q"
		placeholder="Search with Mwmbl..."
		aria-label="Search with Mwmbl"
		class={'bg-card z-20 h-12 rounded-2xl border-none pr-12 pl-4 text-lg ' +
			(completionsVisible ? ' rounded-b-none ' : '')}
		autocomplete="off"
		bind:ref={input}
		bind:value={query}
		oninput={() => fetchSearchCompletions(query)}
		onclick={(e) => {
			if (e.currentTarget.value.trim() !== '') fetchSearchCompletions(e.currentTarget.value);
		}}
	/>
	{#if query == undefined || completionsVisible}
		<Button
			tabindex={-1}
			type="submit"
			class="bg-brand-gradient absolute right-2 z-30 h-8 w-8 rounded-full p-0 disabled:pointer-events-auto disabled:cursor-default disabled:opacity-100"
			disabled={query == undefined}
			title="Search Mwmbl"
			aria-label="Search Mwmbl"
		>
			<RiSearchLine class="min-h-5 min-w-5 text-black" />
		</Button>
	{:else}
		<Button
			onclick={() => {
				query = undefined;
				input?.focus();
			}}
			class="bg-brand-gradient absolute right-2 z-30 h-8 w-8 rounded-full p-0"
			title="Clear query and search again"
			aria-label="Clear query and search again"
		>
			<RiCloseFill class="min-h-6 min-w-6 text-black" />
		</Button>
	{/if}

	<Card.Root
		class={'absolute top-12 z-10 flex w-[calc(100%)] rounded-t-none rounded-b-2xl border-none shadow-sm' +
			(completionsVisible ? ' min-h-16 p-3 pt-4' : ' p-0')}
	>
		<ol>
			{#if completionsVisible}
				{#if completionsLoading}
					<div class="flex h-10 w-full items-center justify-center text-xl">
						<Spinner />
					</div>
				{:else}
					{#each searchCompletions as completion}
						{#if !completion.match(/^.*: /)}
							<Button variant="link" onclick={resetCompletions} href="/search?q={completion}"
								>{completion}</Button
							>
						{:else if completion.startsWith('search: google.com ')}
							<Button
								target="_blank"
								href="https://google.com/search?q={completion.replace(/^search: google\.com/, '')}"
							>
								<span>Search on Google: {completion.replace(/^search: google\.com/, '')}</span>
								<RiSearchLine class="ml-1 min-h-5 min-w-5 text-black" />
							</Button>
						{:else if completion.startsWith('go: ')}
							<Button
								variant="secondary"
								target="_blank"
								href={'https://' + completion.replace(/^go: /, '')}
							>
								<span>Open website: {completion.replace(/^go: /, '')}</span>
								<PhArrowSquareOutFill class="ml-1 min-h-5 min-w-5 text-black dark:text-white" />
							</Button>
						{/if}
					{/each}
				{/if}
			{/if}
		</ol>
		{#if completionsVisible}
			<Button
				size="icon"
				class="absolute right-3 bottom-3 ml-auto h-8 w-8 rounded-full"
				variant="secondary"
				onclick={resetCompletions}
				title="Close search completions"
				aria-label="Close search completions"
			>
				<RiCloseFill class="min-h-5 min-w-5 text-black dark:text-white" />
			</Button>
		{/if}
	</Card.Root>
</form>

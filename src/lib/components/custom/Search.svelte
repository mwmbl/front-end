<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	import RiSearchLine from '~icons/ri/search-line';
	import PhArrowSquareOutFill from '~icons/ph/arrow-square-out-fill';
	import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';

	let { query }: { query?: string } = $props();

	// svelte-ignore non_reactive_update
	let input: HTMLInputElement;

	let searchCompletions: string[] = $state([]);
	async function fetchSearchCompletions(query: string | undefined) {
		if (query != undefined) {
			const res = await fetch('https://mwmbl.org/api/v1/search/complete?q=' + query);
			searchCompletions = (await res.json())[1];
		}
	}
	let completionsExist = $derived(
		searchCompletions.length > 0 && searchCompletions[0] !== 'search: google.com '
	);
</script>

<form
	class="relative flex w-full max-w-[46rem] flex-row items-center"
	action="/search"
	method="get"
	onsubmit={() => (searchCompletions = [])}
>
	<Input
		type="search"
		name="q"
		placeholder="Search with Mwmbl..."
		class={'text-l2 h-12 rounded-2xl border-none bg-card p-6 text-lg ' +
			(completionsExist ? ' rounded-b-none ' : '')}
		bind:inputEl={input}
		bind:value={query}
		on:input={() => fetchSearchCompletions(query)}
	/>
	{#if query == undefined || completionsExist}
		<Button
			tabindex={-1}
			type="submit"
			class="bg-brand-gradient absolute right-3 h-8 w-8 rounded-full disabled:pointer-events-auto disabled:cursor-default disabled:opacity-100"
			disabled={query == undefined}
			title="Search Mwmbl"
			aria-label="Search Mwmbl"
		>
			<RiSearchLine class="min-h-5 min-w-5 text-black" />
		</Button>
	{:else}
		<Button
			on:click={() => {
				query = undefined;
				input.focus();
			}}
			class="bg-brand-gradient absolute right-3 h-8 w-8 rounded-full"
			title="Clear query and search again"
			aria-label="Clear query and search again"
		>
			<MaterialSymbolsCloseRounded class="min-h-5 min-w-5 text-black" />
		</Button>
	{/if}

	<Card.Root
		class={'absolute top-12 flex w-[calc(100%)] rounded-b-2xl rounded-t-none border-none' +
			(completionsExist ? ' px-4 pb-4 pt-2' : '')}
	>
		<ol>
			{#if completionsExist}
				{#each searchCompletions as completion}
					{#if !completion.match(/^.*: /)}
						<Button
							variant="link"
							on:click={() => (searchCompletions = [])}
							href="/search?q={completion}">{completion}</Button
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
		</ol>
		{#if completionsExist}
			<Button
				size="icon"
				class="absolute bottom-3 right-3 ml-auto h-8 w-8 rounded-full"
				variant="secondary"
				on:click={() => (searchCompletions = [])}
				title="Close search completions"
				aria-label="Close search completions"
			>
				<MaterialSymbolsCloseRounded class="min-h-5 min-w-5 text-black dark:text-white" />
			</Button>
		{/if}
	</Card.Root>
</form>

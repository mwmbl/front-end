<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	import PhMagnifyingGlass from '~icons/ph/magnifying-glass';
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
	class="relative flex w-full max-w-[46rem] flex-row items-center px-4"
	action="/search"
	method="get"
	onsubmit={() => (searchCompletions = [])}
>
	<Input
		type="search"
		name="q"
		placeholder="Search with Mwmbl..."
		class={'rounded-lg p-6 text-lg' + (completionsExist ? ' rounded-b-none border-b-0' : '')}
		bind:inputEl={input}
		bind:value={query}
		on:input={() => fetchSearchCompletions(query)}
	/>
	{#if query == undefined || completionsExist}
		<Button
			tabindex={-1}
			type="submit"
			class="absolute right-6 h-8 w-8 rounded-full bg-pink-300 disabled:pointer-events-auto disabled:cursor-default disabled:opacity-100"
			disabled={query == undefined}
		>
			<PhMagnifyingGlass class="min-h-5 min-w-5 text-black" />
		</Button>
	{:else}
		<Button
			on:click={() => {
				query = undefined;
				input.focus();
			}}
			class="absolute right-6 h-8 w-8 rounded-full bg-pink-300"
		>
			<MaterialSymbolsCloseRounded class="min-h-5 min-w-5 text-black" />
		</Button>
	{/if}

	<Card.Root
		class={'absolute top-12 flex w-[calc(100%-2rem)] rounded-t-none border-t-0' +
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
							variant="outline"
							target="_blank"
							href="https://google.com/search?q={completion.replace(/^search: google\.com/, '')}"
						>
							<span>Search on Google: {completion.replace(/^search: google\.com/, '')}</span>
							<PhMagnifyingGlass class="ml-1 min-h-5 min-w-5 text-black" />
						</Button>
					{:else if completion.startsWith('go: ')}
						<Button variant="outline" href={'https://' + completion.replace(/^go: /, '')}>
							<span>Open website: {completion.replace(/^go: /, '')}</span>
							<PhArrowSquareOutFill class="ml-1 min-h-5 min-w-5 text-black" />
						</Button>
					{/if}
				{/each}
			{/if}
		</ol>
		{#if completionsExist}
			<Button
				variant="outline"
				size="icon"
				class="ml-auto"
				on:click={() => (searchCompletions = [])}
			>
				<MaterialSymbolsCloseRounded class="min-h-5 min-w-5 text-black" />
			</Button>
		{/if}
	</Card.Root>
</form>

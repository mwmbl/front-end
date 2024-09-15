<script lang="ts">
	import Search from '@/components/custom/Search.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Skeleton } from '@/components/ui/skeleton';
	import { localStoragePreferences } from '@/localStoragePreferences.svelte';

	let { data } = $props();

	let preferences = localStoragePreferences();
</script>

<main class="flex flex-col items-center gap-8">
	<Search query={data.query} />
	<div class="flex w-full max-w-2xl flex-col gap-4 px-4">
		{#each data.results as result}
			<a
				href={result.url}
				class="group max-w-full"
				target={preferences.openInNewTab ? '_blank' : '_self'}
			>
				<Card.Root class="flex flex-col gap-2 p-4">
					<div class="leading-snug group-hover:underline">
						{#each result.url
							.split('/')
							// add slashes, but not at the end
							.map((s, i, a) => (i < a.length - 1 ? s + '/' : s)) as urlSegment}
							{urlSegment}<wbr />
						{/each}
						<span class="italic">—found via {result.source}</span>
					</div>
					<Card.Title class="font-medium leading-normal">
						{#each result.title as titleSegment}
							{#if titleSegment.is_bold}
								<strong>{titleSegment.value}</strong>
							{:else}
								{titleSegment.value}
							{/if}
						{/each}
					</Card.Title>
					<Card.Description>
						{#each result.extract as extractSegment}
							{#if extractSegment.is_bold}
								<strong>{extractSegment.value}</strong>
							{:else}
								{extractSegment.value}
							{/if}
						{/each}
					</Card.Description>
				</Card.Root>
			</a>
		{/each}
	</div>
</main>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	let {
		result
	}: {
		result: {
			title: Array<{ value: string; is_bold: boolean }>;
			extract: Array<{ value: string; is_bold: boolean }>;
			url: string;
			source: string;
		};
	} = $props();

	import { localStoragePreferences } from '@/localStoragePreferences.svelte';
	let preferences = localStoragePreferences();
</script>

<a
	href={result.url}
	class="group max-w-full"
	target={preferences.openInNewTab ? '_blank' : '_self'}
>
	<Card.Root class="flex w-full flex-col gap-2 p-4">
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

<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	import RiLockFill from '~icons/ri/lock-fill';
	import RiLockUnlockFill from '~icons/ri/lock-unlock-fill';
	import RiArrowDropRightLine from '~icons/ri/arrow-drop-right-line';

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

	import { localStorageOptions } from '@/localStorageOptions.svelte';
	let options = localStorageOptions();

	let urlSegments = $derived(result.url.replace(/.*:\/\//, '').split('/'));

	// Favicons are fetched from DDG to preserve privacy.
	// Making our own Favicon API would be possible too if we want that in the future.
	let faviconUrl = $derived(`https://icons.duckduckgo.com/ip2/${new URL(result.url).hostname}.ico`);
</script>

<a href={result.url} class="group max-w-full" target={options.openInNewTab ? '_blank' : '_self'}>
	<Card.Root class="flex w-full flex-col gap-2 p-4">
		<div
			class="text-unemphasized-1 flex flex-row items-center font-medium leading-snug group-hover:underline"
		>
			<div class="mr-3 rounded-xl bg-secondary p-2">
				<img src={faviconUrl} alt="" class="h-4 w-4" />
			</div>
			{#if result.url.startsWith('https')}
				<RiLockFill class="mr-2 h-4" />
			{:else if result.url.startsWith('http')}
				<RiLockUnlockFill class="mr-2 h-4" />
			{/if}
			{#each urlSegments as urlSegment, index}
				<span>{urlSegment}</span>
				{#if index < urlSegments.length - 1}
					<RiArrowDropRightLine class="relative top-0.5" />
				{/if}
			{/each}
		</div>
		<Card.Title class="text-accent-text font-medium leading-normal">
			{#each result.title as titleSegment}
				{#if titleSegment.is_bold}
					<strong>{titleSegment.value}</strong>
				{:else}
					{titleSegment.value}
				{/if}
			{/each}
		</Card.Title>
		<Card.Description class="text-unemphasized-2">
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

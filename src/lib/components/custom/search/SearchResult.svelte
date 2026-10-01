<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	import RiLockFill from '~icons/ri/lock-fill';
	import RiLockUnlockFill from '~icons/ri/lock-unlock-fill';
	import RiArrowDropRightLine from '~icons/ri/arrow-drop-right-line';

	import VoteButtons from './VoteButtons.svelte';

	let {
		result,
		query
	}: {
		result: {
			title: Array<{ value: string; is_bold: boolean }>;
			extract: Array<{ value: string; is_bold: boolean }>;
			url: string;
			source: string;
			votes:
				| { upvotes: number; downvotes: number; user_vote: null | 'upvote' | 'downvote' }
				| undefined;
		};
		query?: string;
	} = $props();

	import { localStorageOptions } from '@/localStorageOptions.svelte';
	let { options } = localStorageOptions;

	// `google` and `user` mark how a page first entered the Mwmbl index, not where the result came from.
	const SOURCE_LABELS: Record<string, string> = {
		mwmbl: 'Mwmbl',
		google: 'Mwmbl',
		user: 'Mwmbl',
		wikipedia: 'Wikipedia',
		eusp: 'EUSP'
	};
	let sourceLabel = $derived(result.source ? (SOURCE_LABELS[result.source] ?? result.source) : '');

	let urlSegments = $derived(result.url.replace(/.*:\/\//, '').split('/'));

	// Favicons are fetched from DDG to preserve privacy.
	// Making our own Favicon API would be possible too if we want that in the future.
	let faviconUrl = $derived.by(() => {
		try {
			return `https://icons.duckduckgo.com/ip2/${new URL(result.url).hostname}.ico`;
		} catch {
			return '';
		}
	});
</script>

<a href={result.url} class="group max-w-full" target={options.openInNewTab ? '_blank' : '_self'}>
	<Card.Root class="grid w-full grid-cols-[1fr_4rem] flex-col gap-2 p-0">
		<div class="flex flex-col gap-2 p-4">
			<div
				class="text-unemphasized-2 grid grid-cols-[2rem_1fr_auto] items-center gap-2 leading-snug font-medium group-hover:underline"
			>
				<div class="bg-secondary mr-3 min-h-8 min-w-8 rounded-xl p-2">
					{#if faviconUrl}
						<img src={faviconUrl} alt="" class="h-4 w-4" />
					{/if}
				</div>
				<div class="flex flex-row flex-wrap items-center">
					{#if result.url.startsWith('https')}
						<RiLockFill class="mr-1 h-4" />
					{:else if result.url.startsWith('http')}
						<RiLockUnlockFill class="mr-1 h-4" />
					{/if}
					{#each urlSegments as urlSegment, index}
						<span>{urlSegment}</span>
						{#if index < urlSegments.length - 1}
							<RiArrowDropRightLine class="relative top-0.5 min-w-4" />
						{/if}
					{/each}
				</div>
				{#if sourceLabel}
					<!-- inline-block stops the card's hover underline reaching the badge text -->
					<div class="self-start">
						<span
							class="bg-secondary text-secondary-foreground inline-block rounded-full px-2 py-0.5 text-xs font-medium"
							title="Result source"
						>
							{sourceLabel}
						</span>
					</div>
				{/if}
			</div>
			<Card.Title class="text-accent-text leading-normal font-medium">
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
		</div>
		{#if result.votes !== undefined}
			<VoteButtons url={result.url} {query} votes={result.votes} />
		{/if}
	</Card.Root>
</a>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import MdiWikipedia from '~icons/mdi/wikipedia';
	import RiArrowDownWideFill from '~icons/ri/arrow-down-wide-fill';

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

	const wikipediaPage = $derived(result.url.replace('https://en.wikipedia.org/wiki/', ''));

	const wikipediaSummaryRes = $derived(
		fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikipediaPage}`).then((res) =>
			res.json()
		)
	);
</script>

{#await wikipediaSummaryRes}
	<Card.Root class="flex min-h-40 w-full animate-pulse flex-col gap-2 p-4">
		<Card.Content class="mb-4 grid grid-cols-1 gap-6 p-2 sm:grid-cols-2">
			<div>
				<a href={result.url} class="hover:underline" target="_blank">
					<Card.Title class="font-large text-accent-text text-2xl leading-normal">
						{#each result.title as titleSegment}
							{#if titleSegment.is_bold}
								<strong>{titleSegment.value}</strong>
							{:else}
								{titleSegment.value}
							{/if}
						{/each}
					</Card.Title>
				</a>
				<p>Loading Wikipedia Summary...</p>
			</div>
		</Card.Content>
	</Card.Root>
{:then wikipediaSummary}
	<Card.Root class="grid w-full grid-cols-[1fr_4rem] p-0 sm:gap-2">
		<div class="flex flex-col">
			<Card.Content class="mb-4 grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
				<div>
					<a href={result.url} class="hover:underline" target="_blank">
						<Card.Title class="font-large text-accent-text text-2xl leading-normal">
							{#each result.title as titleSegment}
								{#if titleSegment.is_bold}
									<strong>{titleSegment.value}</strong>
								{:else}
									{titleSegment.value}
								{/if}
							{/each}
						</Card.Title>
					</a>
					<p>
						{wikipediaSummary.description}
					</p>
					<Card.Description class="text-unemphasized-2 mt-4">
						{@html wikipediaSummary.extract_html}
					</Card.Description>
				</div>
				<div class="flex flex-col gap-2 pt-0 sm:p-4">
					<div class="mb-8 ml-auto flex flex-row items-center gap-1 max-sm:hidden">
						<MdiWikipedia class="h-5 w-5" />
						Wikipedia Summary
					</div>
					{#if wikipediaSummary.originalimage}
						<a
							href={result.url +
								'#/media/File:' +
								wikipediaSummary.originalimage.source.split('/').at(-1)}
							target="_blank"
							aria-label="Open image in new tab"
						>
							<img
								src={wikipediaSummary.thumbnail.source}
								width={wikipediaSummary.thumbnail.width}
								height={wikipediaSummary.thumbnail.height}
								alt=""
								class="max-h-60 rounded-xl object-contain"
							/>
						</a>
					{/if}
				</div>
			</Card.Content>
			<a
				href={result.url}
				target="_blank"
				class="group flex flex-col items-center p-4 hover:underline"
			>
				Read more on Wikipedia
				<RiArrowDownWideFill class="transition-transform group-hover:translate-y-1" />
			</a>
		</div>

		{#if result.votes !== undefined}
			<VoteButtons url={result.url} {query} votes={result.votes} />
		{/if}
	</Card.Root>
{/await}

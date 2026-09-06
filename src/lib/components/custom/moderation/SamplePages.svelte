<script lang="ts">
	import RiArrowDropRightLine from '~icons/ri/arrow-drop-right-line';

	import { pathSegments, type QueueItem } from '$lib/moderation';

	let { item }: { item: QueueItem } = $props();
</script>

<div class="flex min-h-0 flex-col gap-2.5 overflow-auto">
	{#each item.pages as page (page.url)}
		<article class="bg-card rounded-2xl px-4 py-3.5">
			<div class="text-unemphasized-1 flex flex-wrap items-center text-xs">
				{#each pathSegments(page.url) as segment, index (index)}
					{#if index > 0}<RiArrowDropRightLine class="size-4 shrink-0" />{/if}
					<span>{segment}</span>
				{/each}
			</div>
			<h3 class="text-lg font-medium">
				<!-- Opens in a new tab: judging a domain means looking at it, and losing the queue
				     to do that would cost the moderator every decision they had not yet made. -->
				<a
					href={page.url}
					target="_blank"
					rel="noopener noreferrer nofollow"
					class="text-accent-text hover:underline">{page.title || page.url}</a
				>
			</h3>
			{#if page.error}
				<p class="text-unemphasized-1 text-sm">Could not be fetched — {page.error}</p>
			{:else}
				<p class="text-unemphasized-2 text-sm leading-snug">{page.extract}</p>
			{/if}
		</article>
	{/each}

	{#if item.pages.length === 0}
		<p class="text-unemphasized-1 text-sm">
			{#if item.evidence_state === 'PENDING'}
				This domain is still being crawled, so there are no sample pages yet. Set it aside and come
				back to it.
			{:else if item.evidence_state === 'FAILED'}
				The crawl failed, so there are no sample pages to show.
			{:else}
				No pages were crawled from this domain.
			{/if}
		</p>
	{/if}
</div>

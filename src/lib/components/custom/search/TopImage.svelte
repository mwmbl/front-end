<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { imageCaption, type ImageResult } from '$lib/image-search';

	let { image, query }: { image: ImageResult; query: string | undefined } = $props();

	const caption = $derived(imageCaption(image));
</script>

<Card.Root class="flex w-full flex-row items-center gap-4 p-3">
	<a href={image.page_url} target="_blank" rel="noopener noreferrer" class="shrink-0">
		<!-- Loaded straight from Wikimedia; Mwmbl never proxies or stores images. -->
		<img
			src={image.thumbnail_url}
			alt={caption}
			width={image.thumbnail_width}
			height={image.thumbnail_height}
			referrerpolicy="no-referrer"
			class="bg-muted h-28 w-auto rounded-lg object-cover"
		/>
	</a>
	<div class="flex min-w-0 flex-col gap-1 text-sm">
		<a
			href={image.page_url}
			target="_blank"
			rel="noopener noreferrer"
			class="text-accent-text line-clamp-2 font-medium hover:underline">{caption}</a
		>
		<span class="text-muted-foreground text-xs">
			{image.license_name} · Wikimedia Commons
		</span>
		<a href="/images?q={encodeURIComponent(query ?? '')}" class="text-xs hover:underline">
			More images
		</a>
	</div>
</Card.Root>

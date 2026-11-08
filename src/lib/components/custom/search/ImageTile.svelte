<script lang="ts">
	import { imageCaption, type ImageResult } from '$lib/image-search';

	let { image }: { image: ImageResult } = $props();

	const caption = $derived(imageCaption(image));
</script>

<figure class="bg-card flex flex-col overflow-hidden rounded-xl">
	<a href={image.page_url} target="_blank" rel="noopener noreferrer" class="block">
		<!-- Loaded straight from Wikimedia; Mwmbl never proxies or stores images. -->
		<img
			src={image.thumbnail_url}
			alt={caption}
			width={image.thumbnail_width}
			height={image.thumbnail_height}
			loading="lazy"
			referrerpolicy="no-referrer"
			class="bg-muted h-44 w-full object-cover"
		/>
	</a>
	<figcaption class="flex flex-col gap-0.5 p-2 text-xs">
		<a
			href={image.page_url}
			target="_blank"
			rel="noopener noreferrer"
			class="line-clamp-2 font-medium hover:underline">{caption}</a
		>
		<span class="text-muted-foreground line-clamp-1">
			{#if image.license_url}
				<a
					href={image.license_url}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:underline">{image.license_name}</a
				>
			{:else}
				{image.license_name}
			{/if}
			{#if image.attribution}· {image.attribution}{/if}
		</span>
	</figcaption>
</figure>

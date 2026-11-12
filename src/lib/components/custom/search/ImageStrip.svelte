<script lang="ts">
	import RiGalleryLine from '~icons/ri/gallery-line';
	import RiArrowUpSLine from '~icons/ri/arrow-up-s-line';

	import { stripRows, type StripImage } from '$lib/image-strip';

	let {
		images,
		displayCount,
		seed = false
	}: { images: StripImage[]; displayCount: number; seed?: boolean } = $props();

	// The API gives no sizes, so tiles start at a typical photo's shape and take their real one
	// as each thumbnail loads.
	const DEFAULT_RATIO = 4 / 3;
	const GAP = 3;
	const NARROW = 640;

	let ratios: Record<string, number> = $state({});
	// Thumbnails that failed to load are left out: a file narrower than the thumbnail may have none.
	let failed: Record<string, boolean> = $state({});
	let expanded = $state(false);
	let width = $state(0);

	const visible = $derived(images.filter((image) => !failed[image.thumbnailUrl]));
	const narrow = $derived(width > 0 && width < NARROW);
	const rowHeight = $derived(narrow ? 112 : 144);
	const hiddenCount = $derived(Math.max(0, visible.length - displayCount));
	const rows = $derived(
		stripRows(
			visible.map((image) => ratios[image.thumbnailUrl] ?? DEFAULT_RATIO),
			{
				// Before it is measured, lay out for the results column on a desktop.
				width: width || 736,
				rowHeight,
				gap: GAP,
				displayCount,
				expanded,
				maxPerRow: narrow ? 2 : undefined
			}
		)
	);

	function onLoad(image: StripImage, event: Event) {
		const img = event.currentTarget as HTMLImageElement;
		if (img.naturalWidth > 0 && img.naturalHeight > 0) {
			ratios[image.thumbnailUrl] = img.naturalWidth / img.naturalHeight;
		}
	}

	// A thumbnail that fails before hydration fires no error event, so check on mount too.
	function checkLoaded(img: HTMLImageElement, image: StripImage) {
		if (img.complete) {
			if (img.naturalWidth === 0) failed[image.thumbnailUrl] = true;
			else ratios[image.thumbnailUrl] = img.naturalWidth / img.naturalHeight;
		}
	}
</script>

{#if visible.length > 0}
	<section aria-labelledby="image-strip-heading" class="flex flex-col gap-2">
		<h2 id="image-strip-heading" class="text-unemphasized-2 text-sm font-semibold">
			Images
			<span class="text-muted-foreground font-normal">
				· {seed ? 'found by Seed Search on' : 'from'}
				<a href="https://commons.wikimedia.org" class="underline-offset-2 hover:underline"
					>Wikimedia Commons</a
				>
			</span>
		</h2>
		<div class="flex flex-col gap-[3px] overflow-hidden rounded-2xl" bind:clientWidth={width}>
			{#each rows as row, rowIndex (rowIndex)}
				<div class="flex gap-[3px]" style:height="{rowHeight}px">
					{#each row as tile (tile.kind === 'image' ? visible[tile.index].thumbnailUrl : 'more')}
						{#if tile.kind === 'image'}
							{@const image = visible[tile.index]}
							<figure
								class="tile bg-secondary relative m-0 min-w-0 overflow-hidden"
								style:flex={tile.flex}
							>
								<img
									src={image.thumbnailUrl}
									alt={image.title}
									referrerpolicy="no-referrer"
									loading="lazy"
									class="block h-full w-full object-cover"
									onload={(e) => onLoad(image, e)}
									onerror={() => (failed[image.thumbnailUrl] = true)}
									use:checkLoaded={image}
								/>
								<a
									class="hit absolute inset-0 z-10"
									href={image.pageUrl}
									aria-label="{image.title} — view on Wikimedia Commons"
								></a>
								<figcaption
									class="cap pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-start gap-1.5 p-2"
								>
									<span class="cap-title text-[13px] leading-tight font-medium text-white">
										{image.title}
									</span>
									<a
										class="licence pointer-events-auto max-w-full overflow-hidden rounded-full px-2 pt-[5px] pb-1 text-[11px] leading-none font-semibold tracking-wide text-ellipsis whitespace-nowrap text-white no-underline"
										href={image.licenseUrl}
										rel="noopener noreferrer nofollow"
									>
										{image.licenseName}
									</a>
								</figcaption>
							</figure>
						{:else}
							<button
								type="button"
								class="more bg-secondary text-foreground flex cursor-pointer flex-col items-center justify-center gap-1.5 text-sm font-semibold"
								style:flex={tile.flex}
								aria-expanded="false"
								aria-label="Show {hiddenCount} more images"
								onclick={() => (expanded = true)}
							>
								<RiGalleryLine class="more-icon size-6" aria-hidden="true" />
								<span>{hiddenCount} more</span>
							</button>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
		{#if expanded && hiddenCount > 0}
			<button
				type="button"
				class="text-unemphasized-2 hover:bg-secondary hover:text-foreground focus-visible:outline-accent-text inline-flex min-h-11 cursor-pointer items-center gap-1.5 self-center rounded-full px-3.5 text-sm font-semibold focus-visible:outline-3"
				aria-expanded="true"
				onclick={() => (expanded = false)}
			>
				<RiArrowUpSLine class="size-5" aria-hidden="true" />
				Fewer images
			</button>
		{/if}
	</section>
{/if}

<style>
	.tile img {
		transition: transform 450ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.tile:hover img,
	.tile:focus-within img {
		transform: scale(1.08);
	}
	.hit:focus-visible,
	.more:focus-visible {
		outline: 3px solid var(--accent-text);
		outline-offset: -3px;
	}

	/* The title shows on hover or focus, on a solid plate so it reads over any photo. */
	.cap {
		transition: background-color 250ms;
	}
	.cap-title {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		max-height: 0;
		opacity: 0;
		transition:
			opacity 200ms,
			max-height 250ms;
	}
	.tile:hover .cap,
	.tile:focus-within .cap {
		background: rgb(18 19 22 / 0.8);
	}
	.tile:hover .cap-title,
	.tile:focus-within .cap-title {
		max-height: 2.2rem;
		opacity: 1;
	}

	/* The licence always shows. */
	.licence {
		background: rgb(18 19 22 / 0.74);
	}
	.tile:hover .licence,
	.tile:focus-within .licence {
		background: rgb(255 255 255 / 0.16);
	}
	.licence:hover,
	.licence:focus-visible {
		background: white;
		color: #111;
		text-decoration: underline;
		outline: none;
	}

	.more {
		transition: background-color 200ms;
	}
	.more:hover {
		background: color-mix(in oklab, var(--secondary), var(--foreground) 8%);
	}
	.more :global(.more-icon) {
		transition: transform 300ms;
	}
	.more:hover :global(.more-icon) {
		transform: scale(1.12);
	}

	@media (prefers-reduced-motion: reduce) {
		.tile img,
		.cap,
		.cap-title,
		.more,
		.more :global(.more-icon) {
			transition: none;
		}
	}
</style>

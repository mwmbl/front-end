<script lang="ts">
	import type { Snippet } from 'svelte';
	import RiExternalLinkLine from '~icons/ri/external-link-line';

	import { localStorageOptions } from '@/localStorageOptions.svelte';

	let {
		label,
		sourceName,
		shareUrl,
		licence = '',
		children
	}: {
		label: string;
		sourceName: string;
		shareUrl: string;
		licence?: string;
		children?: Snippet;
	} = $props();

	let { options } = localStorageOptions;
</script>

<!-- Credits the provider: the values are theirs, not Mwmbl's. -->
<div
	class="text-muted-foreground mt-auto flex min-h-13 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t py-2 text-sm"
>
	<span>
		{label}
		{#if shareUrl}
			<a
				href={shareUrl}
				rel="noopener nofollow"
				target={options.openInNewTab ? '_blank' : '_self'}
				class="text-accent-text inline-flex items-center gap-1 hover:underline"
			>
				{sourceName}<RiExternalLinkLine class="h-3 w-3" aria-hidden="true" />
			</a>
		{:else}
			{sourceName}
		{/if}
		{#if licence}({licence}){/if}
	</span>
	{@render children?.()}
</div>

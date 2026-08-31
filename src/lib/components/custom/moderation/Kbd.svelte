<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let { class: className, children }: { class?: string; children?: Snippet } = $props();
</script>

<span
	class={cn(
		'bg-secondary text-unemphasized-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-[5px] font-mono text-[11px] font-semibold',
		className
	)}
>
	{@render children?.()}
</span>

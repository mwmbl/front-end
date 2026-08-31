<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { PillStatus } from '$lib/moderation';

	// Muted throughout, as in the design: the dot carries the meaning, not a whole coloured
	// pill. Approved and rejected have to be distinguishable without relying on the colour.
	const DOTS: Record<PillStatus, string> = {
		PENDING: 'bg-[hsl(220_8%_62%)]',
		APPROVED: 'bg-[hsl(142_20%_45%)]',
		REJECTED: 'bg-[hsl(2_30%_50%)]',
		// Not an API status — a domain left for later, which is still PENDING on the server.
		SKIPPED: 'bg-[hsl(38_35%_50%)]'
	};

	let { status, class: className }: { status: PillStatus; class?: string } = $props();
</script>

<span
	class={cn(
		'bg-secondary text-unemphasized-2 inline-flex items-center gap-1.5 rounded-2xl px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.05em]',
		className
	)}
>
	<span class={cn('size-1.5 rounded-full', DOTS[status])}></span>{status}
</span>

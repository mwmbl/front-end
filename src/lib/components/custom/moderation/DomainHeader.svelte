<script lang="ts">
	import RiGlobalLine from '~icons/ri/global-line';
	import RiLockFill from '~icons/ri/lock-fill';
	import RiLockUnlockFill from '~icons/ri/lock-unlock-fill';
	import RiArrowUpSLine from '~icons/ri/arrow-up-s-line';
	import RiArrowDownSLine from '~icons/ri/arrow-down-s-line';

	import {
		submissionCount,
		submissionMeta,
		type PanelStatus,
		type QueueItem
	} from '$lib/moderation';
	import StatusChip from './StatusChip.svelte';

	let { item, status }: { item: QueueItem; status: PanelStatus } = $props();

	/**
	 * `https` is `null` until the domain has been crawled, and an uncrawled domain must not draw
	 * an open padlock — that would accuse it of something the crawler has not checked yet.
	 */
	let padlock = $derived(item.https === null ? null : item.https ? RiLockFill : RiLockUnlockFill);
</script>

<div class="flex items-start gap-3">
	<span
		class="bg-secondary flex size-10 shrink-0 items-center justify-center rounded-2xl"
		aria-hidden="true"
	>
		<RiGlobalLine class="size-[18px]" />
	</span>
	<div class="min-w-0">
		<div class="flex flex-wrap items-center gap-2 text-3xl leading-tight font-medium">
			{#if padlock}
				{@const Padlock = padlock}
				<Padlock
					class="text-unemphasized-1 size-[17px] shrink-0"
					aria-label={item.https ? 'Serves over HTTPS' : 'Does not serve over HTTPS'}
				/>
			{/if}
			<span class="break-all">{item.name}</span>
			<StatusChip {status} />
		</div>
		<div class="text-unemphasized-1 mt-[3px] flex flex-wrap items-center gap-x-3.5 text-sm">
			<span class="text-unemphasized-2 font-medium">{submissionCount(item.submission_count)}</span>
			<span class="inline-flex items-center gap-0.5"
				><RiArrowUpSLine class="size-4" />{item.upvotes}</span
			>
			<span class="inline-flex items-center gap-0.5"
				><RiArrowDownSLine class="size-4" />{item.downvotes}</span
			>
			<span class="truncate">{submissionMeta(item)}</span>
		</div>
	</div>
</div>

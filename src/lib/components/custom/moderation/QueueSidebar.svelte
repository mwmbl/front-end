<script lang="ts">
	import RiArrowUpSLine from '~icons/ri/arrow-up-s-line';
	import RiArrowDownSLine from '~icons/ri/arrow-down-s-line';

	import { reasonLabel, STATUS_DOT, submissionCount, type QueueItem } from '$lib/moderation';
	import {
		doneEntry,
		emptyNote,
		rowsFor,
		type SessionState,
		type Tab
	} from '$lib/moderation-session';
	import { TAB_TICK_DURATION } from '$lib/moderation-motion';

	let {
		state,
		items,
		catching = null,
		remaining = 0,
		onselect,
		ontab,
		onundo
	}: {
		state: SessionState;
		items: Map<string, QueueItem>;
		/** The tab that should tick because a card just landed in it. */
		catching?: Exclude<Tab, 'pending'> | null;
		/** Pending domains the server has that this page has not loaded yet. */
		remaining?: number;
		onselect: (name: string) => void;
		ontab: (tab: Tab) => void;
		onundo: (name: string) => void;
	} = $props();

	const tabs: Array<{ key: Tab; label: string }> = [
		{ key: 'pending', label: 'Pending' },
		{ key: 'aside', label: 'Set aside' },
		{ key: 'done', label: 'Done' }
	];

	let rows = $derived(rowsFor(state));

	function count(tab: Tab): number {
		if (tab === 'aside') return state.aside.length;
		if (tab === 'done') return state.done.length;
		return state.pending.length;
	}

	/** The second line of a row: what happened to it, or what is being asked of you. */
	function note(name: string): string {
		const decided = doneEntry(state, name);
		if (decided) {
			return decided.status === 'APPROVED'
				? 'approved by you'
				: `rejected — ${reasonLabel(decided.reason)}`;
		}
		if (state.aside.includes(name)) return 'set aside — come back to it';
		return '';
	}

	function dotFor(name: string): string {
		const decided = doneEntry(state, name);
		if (!decided) return STATUS_DOT.PENDING;
		return decided.status === 'APPROVED' ? STATUS_DOT.APPROVED : STATUS_DOT.REJECTED;
	}
</script>

<aside
	class="border-border flex min-h-0 flex-col border-r py-5"
	style="--tab-tick-duration: {TAB_TICK_DURATION}ms"
>
	<div class="flex gap-1.5 px-3.5 pb-3">
		{#each tabs as tab (tab.key)}
			<button
				type="button"
				onclick={() => ontab(tab.key)}
				class="cursor-pointer rounded-2xl px-2.5 py-[5px] text-xs font-semibold transition-colors
					{state.tab === tab.key ? 'bg-foreground text-background' : 'bg-secondary text-unemphasized-2'}
					{catching === tab.key ? 'tab-tick ring-foreground ring-1 ring-inset' : ''}"
				aria-pressed={state.tab === tab.key}
			>
				{tab.label}
				{count(tab.key)}
			</button>
		{/each}
	</div>

	<div class="min-h-0 flex-1 overflow-auto">
		{#each rows as name (name)}
			{@const item = items.get(name)}
			<!-- The whole row is the button, second line and padding included: a row that looks
			     clickable everywhere but only answers on its name reads as dropped clicks. Undo sits
			     on top of it rather than inside it, since a button cannot contain another. -->
			<div
				class="hover:bg-card/60 relative border-l-2
					{name === state.selected ? 'border-foreground bg-card' : 'border-transparent'}"
			>
				<button
					type="button"
					onclick={() => onselect(name)}
					class="block w-full cursor-pointer py-2.5 pl-[18px] text-left
						{state.tab === 'pending' ? 'pr-3.5' : 'pr-14'}"
				>
					<span class="flex items-center gap-2 text-sm font-medium">
						<span class="size-[5px] shrink-0 rounded-full" style="background: {dotFor(name)}"
						></span>
						<span class="truncate">{name}</span>
					</span>
					<span class="text-unemphasized-1 block pl-[13px] text-xs">
						{#if state.tab === 'pending' && item}
							<span class="inline-flex items-center gap-2">
								<span>{submissionCount(item.submission_count)}</span>
								<span class="inline-flex items-center gap-px"
									><RiArrowUpSLine class="size-4" />{item.upvotes}</span
								>
								<span class="inline-flex items-center gap-px"
									><RiArrowDownSLine class="size-4" />{item.downvotes}</span
								>
							</span>
						{:else}
							{note(name)}
						{/if}
					</span>
				</button>
				{#if state.tab !== 'pending'}
					<button
						type="button"
						onclick={() => onundo(name)}
						class="text-accent-text absolute top-2.5 right-3.5 cursor-pointer text-xs font-medium hover:underline"
					>
						undo
					</button>
				{/if}
			</div>
		{/each}

		{#if rows.length === 0}
			<p class="text-unemphasized-1 px-[18px] py-2.5 text-sm">{emptyNote(state.tab)}</p>
		{/if}
	</div>

	<div class="text-unemphasized-1 mt-auto flex flex-col gap-2 px-[18px] pt-3.5 text-xs">
		{#if remaining > 0}
			<span>{remaining} more waiting in the queue.</span>
		{/if}
		<span>Selecting a domain only changes what you're looking at — nothing is skipped for you.</span
		>
	</div>
</aside>

<style>
	/* 6a's "catch": the destination tab ticks once as the decided card finishes leaving. */
	@keyframes tab-tick {
		0% {
			transform: scale(1);
		}
		40% {
			transform: scale(1.07);
		}
		100% {
			transform: scale(1);
		}
	}

	.tab-tick {
		animation: tab-tick var(--tab-tick-duration) ease-out;
	}

	@media (prefers-reduced-motion: reduce) {
		.tab-tick {
			animation: none;
		}
	}
</style>

<script lang="ts">
	import RiEqualizer2Line from '~icons/ri/equalizer-2-line';
	import RiCheckLine from '~icons/ri/check-line';
	import RiCloseLine from '~icons/ri/close-line';

	import Button from '@/components/ui/button/button.svelte';
	import Input from '@/components/ui/input/input.svelte';

	import {
		actionLayout,
		reasonLabel,
		REJECTION_REASONS,
		STATUS_DOT,
		whyFallback,
		type QueueItem,
		type RejectionReason
	} from '$lib/moderation';
	import { lastActionNote, type LastAction } from '$lib/moderation-session';

	let {
		item,
		last,
		busy = false,
		onapprove,
		onreject,
		onsetaside,
		onundo
	}: {
		item: QueueItem | undefined;
		last: LastAction | null;
		busy?: boolean;
		onapprove: () => void;
		onreject: (reason: RejectionReason, detail: string) => void;
		onsetaside: () => void;
		onundo: () => void;
	} = $props();

	let layout = $derived(actionLayout(item));

	let reasonOpen = $state(false);
	let reason = $state<RejectionReason>('SPAM');
	let detail = $state('');

	/**
	 * An OTHER with no detail is refused by the API, so the confirm button refuses it here
	 * instead — the moderator writes the sentence the submitter will be shown.
	 */
	let canConfirm = $derived(reason !== 'OTHER' || detail.trim().length > 0);

	// Closing the drawer whenever the domain changes stops a reason picked for one domain being
	// sent against the next one.
	let domainName = $derived(item?.name ?? '');
	let drawerDomain = '';
	$effect(() => {
		if (domainName === drawerDomain) return;
		drawerDomain = domainName;
		reasonOpen = false;
		detail = '';
	});

	function openReject() {
		const suggested = item?.suggestion;
		reason =
			suggested?.action === 'REJECT' && suggested.reason
				? (suggested.reason as RejectionReason)
				: 'SPAM';
		detail = '';
		reasonOpen = true;
	}

	function primary() {
		if (layout.primary.act === 'approve') onapprove();
		else if (layout.primary.act === 'openReject') openReject();
		else onreject((item?.suggestion?.reason ?? 'SPAM') as RejectionReason, '');
	}

	function secondary() {
		if (layout.secondary.act === 'approve') onapprove();
		else openReject();
	}

	function confirm() {
		if (!canConfirm) return;
		onreject(reason, detail.trim());
		reasonOpen = false;
	}

	let lastDot = $derived(
		last === null
			? ''
			: last.kind === 'APPROVED'
				? STATUS_DOT.APPROVED
				: last.kind === 'REJECTED'
					? STATUS_DOT.REJECTED
					: STATUS_DOT.PENDING
	);
</script>

<div class="relative grid content-end gap-2">
	<p class="text-unemphasized-1 flex items-center gap-2 truncate text-xs">
		<RiEqualizer2Line class="size-4 shrink-0" />
		suggested by the index — {whyFallback(item)}
	</p>

	<div class="flex items-center gap-2.5">
		<Button
			class="h-13 flex-1 text-lg {layout.primary.brand
				? 'bg-brand-gradient border-none text-black'
				: 'bg-secondary text-foreground border-none shadow-[inset_0_0_0_1px_hsl(220_8%_78%)]'}"
			disabled={busy || !item}
			onclick={primary}
		>
			{#if layout.kind === 'approve'}
				<RiCheckLine class="size-[18px]" />
			{:else if layout.kind === 'reject'}
				<RiCloseLine class="size-[18px]" />
			{/if}
			{layout.primary.label}
		</Button>

		<Button
			variant="outline"
			class="bg-secondary h-13 border-none font-medium shadow-[inset_0_0_0_1px_hsl(220_8%_78%)]"
			disabled={busy || !item}
			onclick={secondary}
		>
			{layout.secondary.label}
		</Button>

		<Button
			variant="ghost"
			class="text-unemphasized-1 h-13"
			disabled={busy || !item}
			onclick={onsetaside}
		>
			Set aside
		</Button>
	</div>

	{#if reasonOpen}
		<div
			class="bg-secondary absolute right-0 bottom-full left-0 z-10 mb-2.5 flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2.5 shadow-sm"
		>
			<span class="text-unemphasized-2 text-sm font-medium">Reject as</span>
			{#each REJECTION_REASONS as choice (choice.value)}
				<button
					type="button"
					onclick={() => (reason = choice.value)}
					aria-pressed={reason === choice.value}
					class="cursor-pointer rounded-2xl px-3 py-1 text-sm {reason === choice.value
						? 'bg-foreground text-background'
						: 'bg-background text-unemphasized-2 ring-border ring-1 ring-inset'}"
				>
					{choice.label}
				</button>
			{/each}
			<Input
				bind:value={detail}
				placeholder={reason === 'OTHER'
					? 'Required — what’s wrong with it?'
					: 'Optional detail for the submitter…'}
				class="h-9 min-w-48 flex-1"
				onkeydown={(event: KeyboardEvent) => {
					if (event.key === 'Enter') confirm();
					if (event.key === 'Escape') reasonOpen = false;
				}}
			/>
			<Button
				variant="outline"
				class="bg-secondary border-none font-medium shadow-[inset_0_0_0_1px_hsl(220_8%_78%)]"
				disabled={!canConfirm || busy}
				onclick={confirm}
			>
				Reject
			</Button>
		</div>
	{/if}

	<div class="border-border text-unemphasized-1 flex items-center gap-2.5 border-t pt-2.5 text-sm">
		{#if last}
			<span class="size-1.5 shrink-0 rounded-full" style="background: {lastDot}"></span>
			<span class="truncate">{lastActionNote(last, reasonLabel)}</span>
			<button
				type="button"
				onclick={onundo}
				disabled={busy}
				class="text-accent-text shrink-0 cursor-pointer font-medium hover:underline disabled:opacity-50"
			>
				undo
			</button>
			<span class="text-unemphasized-1 hidden shrink-0 text-[11px] sm:inline">
				· or undo anything from the Done and Set aside tabs
			</span>
		{:else}
			<span>Every decision stays undoable — from here or the Done tab.</span>
		{/if}
	</div>
</div>

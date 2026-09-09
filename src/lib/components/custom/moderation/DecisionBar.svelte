<script lang="ts">
	import RiEqualizer2Line from '~icons/ri/equalizer-2-line';
	import RiCheckLine from '~icons/ri/check-line';
	import RiCloseLine from '~icons/ri/close-line';

	import Button from '@/components/ui/button/button.svelte';
	import Input from '@/components/ui/input/input.svelte';

	import {
		reasonLabel,
		rejectionDraft,
		REJECTION_REASONS,
		STATUS_DOT,
		suggestedCall,
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

	/** What the index would do, if it has a view worth offering. Never moves the buttons. */
	let call = $derived(suggestedCall(item));
	let why = $derived(whyFallback(item));

	let reasonOpen = $state(false);
	let reason = $state<RejectionReason>('SPAM');
	let detail = $state('');
	let detailInput = $state<HTMLInputElement | null>(null);

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

	/**
	 * Open the reason drawer on the suggested reason, which is a starting point and nothing more:
	 * every reason is one click away from here, whatever the index thinks.
	 */
	function openReject() {
		const draft = rejectionDraft(item?.suggestion);
		reason = draft.reason;
		detail = draft.detail;
		reasonOpen = true;
	}

	function toggleReject() {
		if (reasonOpen) reasonOpen = false;
		else openReject();
	}

	/**
	 * Take the index's call.
	 *
	 * A rejection it cannot send on its own — an OTHER, which the API refuses without a detail —
	 * opens the drawer on that reason instead of sending a request that comes back 422.
	 */
	function apply() {
		if (!call) return;
		if (call.act === 'approve') onapprove();
		else if (call.act === 'reject') onreject(call.reason as RejectionReason, call.detail);
		else openReject();
	}

	function confirm() {
		if (!canConfirm) return;
		onreject(reason, detail.trim());
		reasonOpen = false;
	}

	// The detail is the only thing left to supply when the reason is OTHER, so the cursor goes there.
	$effect(() => {
		if (reasonOpen && reason === 'OTHER') detailInput?.focus();
	});

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
	<div class="flex items-center gap-2 text-xs">
		<RiEqualizer2Line class="text-unemphasized-1 size-4 shrink-0" />
		<p class="text-unemphasized-1 min-w-0 flex-1 truncate">
			suggested by the index —
			{#if call}<span class="text-foreground font-medium">{call.label}</span>{/if}
			{call && why ? `· ${why}` : why}
		</p>
		{#if call}
			<Button
				class="bg-brand-gradient h-7 shrink-0 rounded-xl border-none px-3 text-xs font-semibold text-black"
				disabled={busy || !item}
				onclick={apply}
			>
				Apply{call.act === 'openReject' ? '…' : ''}
			</Button>
		{/if}
	</div>

	<div class="flex items-center gap-2.5">
		<Button
			class="bg-secondary text-foreground h-13 flex-1 border-none text-lg shadow-[inset_0_0_0_1px_hsl(220_8%_78%)]"
			disabled={busy || !item}
			onclick={onapprove}
		>
			<RiCheckLine class="size-[18px]" />
			Approve
		</Button>

		<Button
			class="bg-secondary text-foreground h-13 flex-1 border-none text-lg shadow-[inset_0_0_0_1px_hsl(220_8%_78%)]"
			disabled={busy || !item}
			aria-expanded={reasonOpen}
			onclick={toggleReject}
		>
			<RiCloseLine class="size-[18px]" />
			Reject…
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
				bind:ref={detailInput}
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
				Reject as {reasonLabel(reason)}
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

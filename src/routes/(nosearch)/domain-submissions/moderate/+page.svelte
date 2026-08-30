<script lang="ts">
	import { onDestroy } from 'svelte';

	import Button from '@/components/ui/button/button.svelte';
	import * as Card from '@/components/ui/card';
	import * as AlertDialog from '@/components/ui/alert-dialog';
	import { Textarea } from '@/components/ui/textarea';
	import Kbd from '@/components/custom/moderation/Kbd.svelte';
	import StatusPill from '@/components/custom/moderation/StatusPill.svelte';

	import RiGlobalLine from '~icons/ri/global-line';
	import RiLockFill from '~icons/ri/lock-fill';
	import RiLockUnlockFill from '~icons/ri/lock-unlock-fill';
	import RiArrowUpSLine from '~icons/ri/arrow-up-s-line';
	import RiArrowDownSLine from '~icons/ri/arrow-down-s-line';
	import RiArrowDownWideFill from '~icons/ri/arrow-down-wide-fill';
	import RiCheckLine from '~icons/ri/check-line';
	import RiCloseLine from '~icons/ri/close-line';
	import RiEqualizer2Line from '~icons/ri/equalizer-2-line';
	import RiArrowDropRightLine from '~icons/ri/arrow-drop-right-line';

	import {
		API_ROOT,
		QUEUE_PAGE_SIZE,
		REJECTION_REASONS,
		auditFields,
		isActionable,
		pathSegments,
		reasonLabel,
		relativeTime,
		whyLine,
		type DecisionStatus,
		type ModerationQueue,
		type QueueItem,
		type RejectionReason
	} from '$lib/moderation';

	let { data } = $props();

	// Cleared on unmount: a decision made just before navigating away leaves a landing timer
	// behind, and its callback would run against a component that no longer exists.
	let timers: ReturnType<typeof setTimeout>[] = [];
	onDestroy(() => timers.forEach(clearTimeout));

	/** One decision, as it sits in the reviewed tray: still undoable, and still reversible
	 *  locally if the request behind it turns out to have failed. */
	type Reviewed = {
		item: QueueItem;
		/**
		 * Where the domain sits in `queue`. It tells an undo whether to rewind the cursor, and
		 * it is also how entries are identified: `$state` deep-proxies objects, so an entry read
		 * back out of state is a proxy and never `===` the one that was put in.
		 */
		index: number;
		status: DecisionStatus;
		reason: string;
	};

	let queue: QueueItem[] = $state(data.access === 'ok' ? data.items : []);
	let pendingCount = $state(data.access === 'ok' ? data.count : 0);
	let cursor = $state(0);
	let reviewed: Reviewed[] = $state([]);
	let reviewedOpen = $state(false);
	let error = $state('');
	let loadingMore = false;
	// Decision and undo requests that have not come back yet. Paging waits for these so it
	// re-reads as little of the queue as possible; see loadMore.
	let inFlight = new Set<Promise<unknown>>();

	// The card that flew out of the slot, mid-flight. Held separately from `queue` so the
	// decided domain stays on screen for the length of the animation.
	let exiting: { entry: Reviewed; away: boolean } | null = $state(null);

	let rejectOpen = $state(false);
	let reason = $state<RejectionReason>('SPAM');
	let detail = $state('');

	let current = $derived(queue[cursor]);
	let upcoming = $derived(queue.slice(cursor + 1));
	let remaining = $derived(Math.max(0, pendingCount - reviewed.length));
	let why = $derived(whyLine(current?.suggestion ?? null));
	// OTHER is the only reason the submitter learns nothing from on its own, so the API
	// requires the detail and 422s without it.
	let confirmDisabled = $derived(reason === 'OTHER' && detail.trim().length === 0);

	const FLIGHT_MS = 460;

	function prefersReducedMotion(): boolean {
		return (
			typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	/** The suggested-action button. The API never sends a placeholder suggestion, so neither
	 *  does the screen: everything short of an actionable suggestion says why there isn't one
	 *  and leaves the decision to the override rail. */
	let suggested = $derived.by(() => {
		if (!current) return null;
		if (current.evidence_state === 'PENDING') {
			return { enabled: false, label: 'Still being crawled — no suggestion yet' };
		}
		if (current.evidence_state === 'FAILED') {
			return { enabled: false, label: "Couldn't fetch this domain" };
		}
		const suggestion = current.suggestion;
		if (!suggestion || suggestion.action === 'UNSURE') {
			return { enabled: false, label: 'No suggestion — decide on the right' };
		}
		if (suggestion.action === 'APPROVE') {
			return { enabled: true, approve: true, label: 'Approve' };
		}
		return {
			enabled: true,
			approve: false,
			label: `Reject — ${reasonLabel(suggestion.reason)}`
		};
	});

	async function postDecision(
		item: QueueItem,
		status: DecisionStatus,
		rejectionReason: string,
		rejectionDetail: string
	): Promise<string> {
		// Through the /api proxy in hooks.server.ts, which attaches the bearer token.
		const res = await fetch(`${API_ROOT}/decisions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				decisions: [
					{
						domain: item.name,
						status,
						rejection_reason: rejectionReason,
						rejection_detail: rejectionDetail,
						// Exactly what was on screen, which is not the same as what was decided:
						// an override has to record the suggestion it overrode.
						...auditFields(item.suggestion)
					}
				]
			})
		});
		if (!res.ok) return await failureMessage(res, `Could not record the decision on ${item.name}`);
		const json = await res.json();
		if (json.not_found?.length) return `${item.name} has no submissions to decide.`;
		return '';
	}

	async function failureMessage(res: Response, fallback: string): Promise<string> {
		try {
			const json = await res.json();
			// InvalidRequest sends {status, message}; ninja's validation sends {detail: [...]}.
			if (typeof json.message === 'string') return json.message;
			if (Array.isArray(json.detail)) {
				return json.detail.map((d: { msg?: string }) => d.msg ?? '').join('; ') || fallback;
			}
		} catch {
			/* not JSON — fall through to the generic message */
		}
		return `${fallback} (${res.status}).`;
	}

	async function decide(status: DecisionStatus, rejectionReason = '', rejectionDetail = '') {
		const item = current;
		if (!item || exiting) return;
		error = '';

		const entry: Reviewed = { item, index: cursor, status, reason: rejectionReason };
		// Fired before the animation, not after it: the moderator's decision should not be
		// waiting on a transition, and a failure rolls the card back.
		const request = track(postDecision(item, status, rejectionReason, rejectionDetail));

		flyOut(entry);
		const failure = await request;
		if (failure) rollBack(entry, failure);
	}

	function flyOut(entry: Reviewed) {
		const land = () => {
			exiting = null;
			reviewed = [entry, ...reviewed];
			cursor = entry.index + 1;
			void loadMore();
		};

		if (prefersReducedMotion()) {
			land();
			return;
		}

		exiting = { entry, away: false };
		requestAnimationFrame(() => {
			// A second frame, so the browser has painted the starting transform before the
			// transition to the end one begins.
			requestAnimationFrame(() => {
				if (exiting?.entry.index === entry.index) exiting = { entry, away: true };
			});
		});
		timers.push(setTimeout(land, FLIGHT_MS));
	}

	/** Register a mutation so `loadMore` can wait for it before trusting its offset. */
	function track<T>(request: Promise<T>): Promise<T> {
		inFlight.add(request);
		void request.catch(() => {}).finally(() => inFlight.delete(request));
		return request;
	}

	function rollBack(entry: Reviewed, message: string) {
		if (exiting?.entry.index === entry.index) exiting = null;
		reviewed = reviewed.filter((r) => r.index !== entry.index);
		cursor = Math.min(cursor, entry.index);
		error = message;
	}

	async function undo(entry: Reviewed) {
		error = '';
		const res = await track(
			fetch(`${API_ROOT}/domains/${encodeURIComponent(entry.item.name)}/undo`, { method: 'POST' })
		);
		if (!res.ok) {
			error = await failureMessage(res, `Could not undo the decision on ${entry.item.name}`);
			return;
		}
		reviewed = reviewed.filter((r) => r.index !== entry.index);
		// Rewinding only for the most recent decision. An older one is pending again on the
		// server, but stepping the cursor back to it would re-present every card decided
		// since; it returns to the queue on the next load instead.
		if (entry.index === cursor - 1) cursor = entry.index;
	}

	/**
	 * Keep at least a screenful ahead of the cursor.
	 *
	 * Deliberately always reads the head of the queue rather than paging by offset. Deciding
	 * a domain removes it from the server's pending list, so an offset computed from what
	 * this screen has decided is only right while the two agree exactly — and they cannot be
	 * made to, because a decision is in flight for as long as the request takes. Being one
	 * out silently skips a domain, which is then never reviewed in this session.
	 *
	 * So: ask for the rows still ahead of the cursor plus a page more, from offset zero, and
	 * keep the names not already held. Whether the server is ahead of this screen or behind
	 * it, the rows we have not seen are in the response. Paging only ever starts within ten
	 * rows of the end, so the overlap re-read is bounded at ten rows.
	 */
	async function loadMore() {
		if (loadingMore || queue.length >= pendingCount) return;

		const ahead = queue.length - cursor;
		if (ahead > 10) return;

		loadingMore = true;
		try {
			// The decisions already sent still shorten the list under us; letting them land
			// first keeps the overlap small rather than making the result correct.
			while (inFlight.size > 0) await Promise.allSettled([...inFlight]);

			const limit = ahead + QUEUE_PAGE_SIZE;
			const res = await fetch(`${API_ROOT}/queue?limit=${limit}&offset=0`);
			if (!res.ok) return;
			const page: ModerationQueue = await res.json();
			// `count` is the server's own pending total, so the header reads the truth rather
			// than this screen's arithmetic.
			pendingCount = page.count + reviewed.length;
			const held = new Set(queue.map((item) => item.name));
			queue = [...queue, ...page.items.filter((item) => !held.has(item.name))];
		} finally {
			loadingMore = false;
		}
	}

	function openReject() {
		if (!current || exiting) return;
		const suggestion = current.suggestion;
		reason =
			suggestion?.action === 'REJECT' && suggestion.reason
				? (suggestion.reason as RejectionReason)
				: 'SPAM';
		detail = '';
		rejectOpen = true;
	}

	function confirmReject() {
		if (confirmDisabled) return;
		rejectOpen = false;
		void decide('REJECTED', reason, detail.trim());
	}

	function takeSuggestion() {
		if (!current || !isActionable(current)) return;
		const suggestion = current.suggestion!;
		if (suggestion.action === 'APPROVE') {
			void decide('APPROVED');
		} else {
			void decide('REJECTED', suggestion.reason, '');
		}
	}

	function onkeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		const typing =
			target?.tagName === 'INPUT' ||
			target?.tagName === 'TEXTAREA' ||
			target?.isContentEditable === true;

		if (rejectOpen) {
			// Escape and the focus trap belong to the dialog; only the reason shortcuts are ours.
			if (typing) return;
			const index = ['1', '2', '3', '4'].indexOf(event.key);
			if (index >= 0) {
				event.preventDefault();
				reason = REJECTION_REASONS[index].value;
			} else if (event.key === 'Enter') {
				event.preventDefault();
				confirmReject();
			}
			return;
		}

		if (typing || exiting || !current) return;

		switch (event.key) {
			case 'Enter':
				event.preventDefault();
				takeSuggestion();
				break;
			case 'a':
			case 'A':
				event.preventDefault();
				void decide('APPROVED');
				break;
			case 'r':
			case 'R':
				event.preventDefault();
				openReject();
				break;
			case 'u':
			case 'U':
				event.preventDefault();
				if (reviewed.length > 0) void undo(reviewed[0]);
				break;
		}
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>Moderate domain submissions - Mwmbl</title>
</svelte:head>

{#snippet padlock(https: boolean | null, size: string)}
	{#if https === true}
		<RiLockFill class="text-unemphasized-1 {size}" />
	{:else if https === false}
		<RiLockUnlockFill class="text-unemphasized-1 {size}" />
	{/if}
{/snippet}

{#snippet votes(item: QueueItem)}
	<span class="inline-flex items-center gap-0.5" title="{item.upvotes} upvotes">
		<RiArrowUpSLine class="size-4" />{item.upvotes}
	</span>
	<span class="inline-flex items-center gap-0.5" title="{item.downvotes} downvotes">
		<RiArrowDownSLine class="size-4" />{item.downvotes}
	</span>
{/snippet}

<main class="flex w-full max-w-5xl flex-col self-center px-6">
	{#if data.access === 'anonymous'}
		<h2 class="-mx-2 text-3xl">Moderate domain submissions</h2>
		<hr class="my-2" />
		<Card.Root class="flex flex-col items-start gap-4 p-4">
			<p>Sign in to moderate domain submissions.</p>
			<Button href="/account?next={encodeURIComponent('/domain-submissions/moderate')}">
				Sign in
			</Button>
		</Card.Root>
	{:else if data.access === 'denied'}
		<h2 class="-mx-2 text-3xl">Moderate domain submissions</h2>
		<hr class="my-2" />
		<Card.Root class="flex flex-col items-start gap-4 p-4">
			<p>
				Your account doesn't have permission to moderate domain submissions. If you think it should,
				ask on <a class="text-accent-text" href="https://matrix.to/#/#mwmbl:matrix.org"> Matrix</a>.
			</p>
			<Button href="/domain-submissions" variant="secondary">Back to domain submissions</Button>
		</Card.Root>
	{:else if data.access === 'error'}
		<h2 class="-mx-2 text-3xl">Moderate domain submissions</h2>
		<hr class="my-2" />
		<Card.Root class="p-4 outline-red-100 outline-solid dark:outline-red-900">
			{data.message}
		</Card.Root>
	{:else}
		<div class="flex items-baseline gap-3">
			<h2 class="-mx-2 text-3xl">Domain submissions</h2>
			<span class="text-unemphasized-1 text-sm">you're moderating — {remaining} pending</span>
			<div class="flex-1"></div>
			<Button
				variant="secondary"
				class="h-9 gap-2 px-4 text-sm"
				aria-expanded={reviewedOpen}
				onclick={() => (reviewedOpen = !reviewedOpen)}
			>
				<RiCheckLine class="size-4" /> Reviewed ({reviewed.length})
			</Button>
		</div>
		<hr class="my-4" />

		{#if error}
			<Card.Root class="mb-4 p-4 outline-red-100 outline-solid dark:outline-red-900">
				{error}
			</Card.Root>
		{/if}

		{#if reviewedOpen}
			<div class="bg-card mb-4 flex flex-col gap-2.5 rounded-2xl px-4 py-3.5">
				<div class="text-unemphasized-1 text-xs font-semibold tracking-[0.05em]">
					REVIEWED THIS SESSION
				</div>
				{#each reviewed as entry (entry.item.name)}
					<div class="text-unemphasized-2 flex flex-wrap items-center gap-3 text-sm">
						<StatusPill status={entry.status} />
						<span class="font-medium">{entry.item.name}</span>
						<span class="text-unemphasized-1">
							{entry.status === 'APPROVED'
								? 'approved by you'
								: `reason: ${reasonLabel(entry.reason)}`}
						</span>
						<div class="flex-1"></div>
						<button
							type="button"
							class="text-accent-text font-medium hover:underline"
							onclick={() => undo(entry)}
						>
							undo
						</button>
					</div>
				{:else}
					<div class="text-unemphasized-1 text-sm">
						Nothing yet — decisions you make land here, and stay undoable.
					</div>
				{/each}
			</div>
		{/if}

		{#if current}
			<div class="text-unemphasized-1 mb-2.5 flex flex-wrap items-center gap-2.5 text-xs">
				<RiArrowDownWideFill class="size-4" /> sorted by submissions, then upvotes
				<div class="flex-1"></div>
				<span class="flex items-center gap-1.5">
					<Kbd>⏎</Kbd> take the suggestion · <Kbd>A</Kbd> approve · <Kbd>R</Kbd> reject ·
					<Kbd>U</Kbd> undo
				</span>
			</div>

			<!-- Fixed height, so the suggested-action button sits at the same place on every
			     card and never moves under the cursor between decisions. -->
			<div class="relative h-[376px]">
				<div
					class="ring-accent-text/25 bg-card absolute inset-0 grid grid-cols-[1fr_4rem] overflow-hidden rounded-2xl ring-2"
				>
					<div class="flex min-w-0 flex-col gap-2.5 px-5 py-4.5">
						<div class="flex items-center gap-2.5">
							<span
								class="bg-secondary flex min-h-10 min-w-10 items-center justify-center rounded-2xl"
							>
								<RiGlobalLine class="size-[18px]" />
							</span>
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2 text-2xl leading-tight font-medium">
									{@render padlock(current.https, 'size-4')}
									{current.name}
									<StatusPill status="PENDING" />
								</div>
								<div class="text-unemphasized-1 mt-0.5 flex flex-wrap items-center gap-3.5 text-sm">
									<span class="text-unemphasized-2 font-medium">
										{current.submission_count}
										{current.submission_count === 1 ? 'submission' : 'submissions'}
									</span>
									{@render votes(current)}
									<span>
										· first submitted {relativeTime(current.first_submitted_on)} by
										{current.first_submitted_by_username}
									</span>
								</div>
							</div>
						</div>

						<div class="flex h-[142px] flex-col gap-1.5 overflow-hidden pl-0.5">
							{#each current.pages.slice(0, 3) as page (page.url)}
								<div class="text-sm leading-snug">
									<span class="text-unemphasized-1 flex flex-wrap items-center text-xs">
										{#each pathSegments(page.url) as segment, index}
											<span>{segment}</span>
											{#if index < pathSegments(page.url).length - 1}
												<RiArrowDropRightLine class="relative top-0.5 min-w-4" />
											{/if}
										{/each}
									</span>
									<a
										href={page.url}
										target="_blank"
										rel="noreferrer"
										class="text-accent-text font-medium hover:underline"
									>
										{page.title || page.url}
									</a>
									{#if page.extract}
										<span class="text-unemphasized-1">— {page.extract}</span>
									{:else if page.error}
										<span class="text-unemphasized-1">— ({page.error})</span>
									{/if}
								</div>
							{:else}
								<div class="text-unemphasized-1 text-sm">
									{current.evidence_state === 'PENDING'
										? 'No pages yet — this domain is still being crawled.'
										: 'No pages could be fetched from this domain.'}
								</div>
							{/each}
						</div>

						<div class="mt-auto flex flex-col gap-1.5">
							<div class="text-unemphasized-1 flex items-center gap-2 text-xs">
								<RiEqualizer2Line class="size-4 shrink-0" />
								<span class="truncate">
									{#if why}
										suggested by the index — {why}
									{:else}
										no evidence gathered for this domain yet
									{/if}
								</span>
							</div>
							<button
								type="button"
								disabled={!suggested?.enabled}
								onclick={takeSuggestion}
								class="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-lg font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60
									{suggested?.enabled
									? suggested.approve
										? 'bg-brand-gradient text-black hover:opacity-90'
										: 'bg-secondary text-secondary-foreground shadow-[inset_0_0_0_1px] shadow-black/15 hover:opacity-90 dark:shadow-white/15'
									: 'bg-secondary/60 text-unemphasized-1'}"
							>
								{#if suggested?.enabled}
									{#if suggested.approve}
										<RiCheckLine class="size-[18px]" />
									{:else}
										<RiCloseLine class="size-[18px]" />
									{/if}
								{/if}
								{suggested?.label}
								{#if suggested?.enabled}
									<Kbd class="ml-2 bg-black/10 text-inherit dark:bg-white/20">⏎</Kbd>
								{/if}
							</button>
						</div>
					</div>

					<div class="flex flex-col items-center justify-center gap-2 border-l">
						<Button
							variant="ghost"
							size="icon"
							title="Approve — A"
							aria-label="Approve {current.name}"
							onclick={() => decide('APPROVED')}
						>
							<RiCheckLine class="size-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							title="Reject with a reason — R"
							aria-label="Reject {current.name}"
							onclick={openReject}
						>
							<RiCloseLine class="size-5" />
						</Button>
						<span class="text-unemphasized-1 px-1 text-center text-[10px] leading-tight">
							override
						</span>
					</div>
				</div>

				{#if exiting}
					<div
						aria-hidden="true"
						class="bg-card absolute top-0 right-16 left-0 origin-top-right rounded-2xl px-5 py-4.5 shadow-lg transition-[translate,scale,opacity] duration-[420ms] ease-[cubic-bezier(.34,1.1,.64,1)]
							{exiting.away ? 'translate-x-[300px] -translate-y-[232px] scale-[.42] opacity-0' : ''}"
					>
						<div class="flex flex-wrap items-center gap-2.5 text-lg font-medium">
							<StatusPill status={exiting.entry.status} />
							{exiting.entry.item.name}
						</div>
						<div class="text-unemphasized-1 mt-1 text-sm">
							{exiting.entry.status === 'APPROVED'
								? 'approved — crawling starts within the hour'
								: `rejected — reason: ${reasonLabel(exiting.entry.reason)}`}
						</div>
					</div>
				{/if}
			</div>

			<div class="text-unemphasized-1 mt-4.5 mb-2 text-xs font-semibold tracking-[0.05em]">
				UP NEXT
			</div>
			<div class="flex flex-col">
				{#each upcoming as item (item.name)}
					<div
						class="text-unemphasized-2 hover:bg-card grid grid-cols-[1fr_8rem_6rem] items-center gap-3 rounded-[10px] px-2.5 py-2 text-sm"
					>
						<span class="flex min-w-0 items-center gap-2">
							<span class="size-1.5 shrink-0 rounded-full bg-[hsl(220_8%_62%)]"></span>
							<span class="truncate">{item.name}</span>
						</span>
						<span class="text-unemphasized-1">
							{item.submission_count}
							{item.submission_count === 1 ? 'submission' : 'submissions'}
						</span>
						<span class="text-unemphasized-1 flex items-center gap-2.5">
							{@render votes(item)}
						</span>
					</div>
				{:else}
					<div class="text-unemphasized-1 px-2.5 text-sm">
						Nothing else waiting — this is the last one.
					</div>
				{/each}
			</div>
		{:else}
			<Card.Root class="flex flex-col items-start gap-4 p-8">
				<p class="text-lg">Nothing left to review. The queue is empty.</p>
				<Button href="/domain-submissions" variant="secondary">Back to domain submissions</Button>
			</Card.Root>
		{/if}
	{/if}
</main>

<AlertDialog.Root bind:open={rejectOpen}>
	<AlertDialog.Content class="rounded-2xl">
		<AlertDialog.Header>
			<AlertDialog.Title>Reject {current?.name}</AlertDialog.Title>
			<AlertDialog.Description>
				Recorded against the domain, and shown wherever this submission appears.
			</AlertDialog.Description>
		</AlertDialog.Header>

		<fieldset class="flex flex-col gap-0.5">
			<legend class="sr-only">Rejection reason</legend>
			{#each REJECTION_REASONS as choice, index (choice.value)}
				<label
					class="flex cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-sm {reason ===
					choice.value
						? 'bg-secondary'
						: 'hover:bg-secondary/50'}"
				>
					<input
						type="radio"
						name="rejection-reason"
						class="accent-foreground size-3.5"
						value={choice.value}
						checked={reason === choice.value}
						onchange={() => (reason = choice.value)}
					/>
					<span>{choice.label}{choice.hint ? ` — ${choice.hint}` : ''}</span>
					<div class="flex-1"></div>
					<Kbd>{index + 1}</Kbd>
				</label>
			{/each}
		</fieldset>

		<Textarea
			rows={2}
			bind:value={detail}
			aria-label="Rejection detail"
			placeholder={reason === 'OTHER' ? "Required — say what's wrong." : 'Optional detail…'}
		/>

		<AlertDialog.Footer class="sm:justify-start">
			<Button variant="outline" class="gap-2" disabled={confirmDisabled} onclick={confirmReject}>
				<RiCloseLine class="size-4" /> Reject as {reasonLabel(reason)}
			</Button>
			<Button variant="ghost" onclick={() => (rejectOpen = false)}>Cancel</Button>
			<div class="hidden flex-1 sm:block"></div>
			<span class="text-unemphasized-1 hidden items-center gap-1 text-[11px] sm:flex">
				<Kbd>1</Kbd>–<Kbd>4</Kbd> · <Kbd>⏎</Kbd>
			</span>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

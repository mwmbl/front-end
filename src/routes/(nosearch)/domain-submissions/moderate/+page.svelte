<script lang="ts">
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { MediaQuery } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

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
	import RiSkipForwardLine from '~icons/ri/skip-forward-line';

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
	import {
		NEW_SESSION,
		current as sessionCurrent,
		decisions,
		isDecision,
		reduce,
		remaining as sessionRemaining,
		skips,
		upcoming as sessionUpcoming,
		type DecisionAction,
		type Session
	} from '$lib/moderation-session';
	import {
		ARRIVING,
		flightCss,
		flightFor,
		motion,
		outcomeLine,
		riseFlight,
		type MoveKind,
		type Rect
	} from '$lib/moderation-motion';

	let { data } = $props();

	let queue: QueueItem[] = $state(data.access === 'ok' ? data.items : []);
	let pendingCount = $state(data.access === 'ok' ? data.count : 0);
	// Where the cursor is and what can be taken back. Skips and decisions share one stack, so
	// `U` reaches whichever the moderator actually did last; see $lib/moderation-session.
	let session = $state<Session>(NEW_SESSION);
	let trayOpen = $state(false);
	let error = $state('');
	let loadingMore = false;
	// Decision and undo requests that have not come back yet. Paging waits for these so it
	// re-reads as little of the queue as possible; see loadMore.
	let inFlight = new Set<Promise<unknown>>();

	const reduced = new MediaQuery('prefers-reduced-motion: reduce');

	/**
	 * Which interaction moved the cursor, and so how the cards should move.
	 *
	 * Set immediately before the `reduce` that moves the cursor. Svelte evaluates a transition's
	 * parameters during the flush that same assignment schedules, so the transitions read it.
	 */
	let lastMove = $state<MoveKind>('decide');
	let trayButton = $state<HTMLElement | null>(null);
	/**
	 * Where the arriving card starts: the UP NEXT row its domain is sitting on.
	 *
	 * Measured in the handler rather than in the transition, because by the time an intro's
	 * parameters are evaluated the vacating row has already been taken out of flow and the rows
	 * below it have moved up — measuring then reads the layout that the animation is meant to
	 * be coming *from*.
	 */
	let arriveFrom = $state<Rect | null>(null);
	let rowNodes: Record<string, HTMLElement> = {};

	let rejectOpen = $state(false);
	let reason = $state<RejectionReason>('SPAM');
	let detail = $state('');

	let current = $derived(sessionCurrent(queue, session));
	let upcoming = $derived(sessionUpcoming(queue, session));
	let decided = $derived(decisions(session));
	let skipped = $derived(skips(session));
	let remaining = $derived(sessionRemaining(pendingCount, session));
	let why = $derived(whyLine(current?.suggestion ?? null));
	// OTHER is the only reason the submitter learns nothing from on its own, so the API
	// requires the detail and 422s without it.
	let confirmDisabled = $derived(reason === 'OTHER' && detail.trim().length === 0);

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
			label: suggestion.reason ? `Reject — ${reasonLabel(suggestion.reason)}` : 'Reject'
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
		if (!item) return;
		error = '';

		// Fired before the card moves, not after it: the moderator's decision should not be
		// waiting on a transition, and a failure rolls the card back.
		const request = track(postDecision(item, status, rejectionReason, rejectionDetail));

		// The cursor moves in the same flush the card leaves in, so nothing waits on the animation
		// and nothing gates the next keystroke. Svelte keeps each departing card alive for its own
		// outro, so a moderator working fast simply has several of them in the air at once.
		moveWith('decide');
		session = reduce(session, { type: 'decide', queue, status, reason: rejectionReason });
		const entry = session.actions[0];
		// Always true given `current` above; the check is what tells the compiler so.
		if (!isDecision(entry)) return;
		void loadMore();

		const failure = await request;
		if (failure) rollBack(entry, failure);
	}

	/**
	 * Set up the motion for a cursor move, then let the caller make it.
	 *
	 * The row measurement has to happen here, before the state changes: an intro's parameters are
	 * evaluated after the leaving row has been pulled out of flow and its neighbours have slid up,
	 * so by then the position the card should be growing out of is gone.
	 */
	function moveWith(kind: MoveKind, target = upcoming[0]?.item.name) {
		lastMove = kind;
		// An undo comes back out of the tray, not up out of the queue, so there is no row to read —
		// and reading one would force a layout for nothing.
		const row = kind === 'undo' || !target ? undefined : rowNodes[target];
		arriveFrom = row ? row.getBoundingClientRect() : null;
	}

	/** The card being decided, skipped, or stepped over on the way somewhere else. */
	function depart(node: HTMLElement, { kind }: { kind: MoveKind }) {
		const timing = motion(reduced.current);
		const duration = kind === 'decide' ? timing.depart : timing.aside;
		// An undo puts a card back; the one it replaces was never going anywhere.
		if (!duration || kind === 'undo') return { duration: 0 };

		const flight = flightFor(kind, node.getBoundingClientRect(), rectOf(trayButton));
		// Svelte runs an outro's `t` from 1 down to 0; `flightCss` takes progress *away* from rest.
		return { duration, easing: cubicOut, css: (t: number) => flightCss(1 - t, flight) };
	}

	/** The card taking its place, rising out of the row it was waiting on. */
	function arrive(node: HTMLElement, { kind }: { kind: MoveKind }) {
		const timing = motion(reduced.current);
		if (!timing.arrive) return { duration: 0 };

		const here = node.getBoundingClientRect();
		// An undo is the decision's flight run backwards, so the card grows back out of the tray
		// it was filed into rather than up out of a queue it was never in.
		if (kind === 'undo') {
			const tray = rectOf(trayButton);
			if (!tray) return { duration: timing.arrive, css: (t: number) => `opacity: ${t};` };
			return {
				duration: timing.depart,
				easing: cubicOut,
				css: (t: number) => flightCss(1 - t, flightFor('decide', here, tray), ARRIVING)
			};
		}

		// No row to come from — the first card of the session, or a jump from the tray to a domain
		// that was never on screen. Fading in is the honest answer: it came from nowhere visible.
		if (!arriveFrom) return { duration: timing.arrive, css: (t: number) => `opacity: ${t};` };

		const flight = riseFlight(here, arriveFrom);
		return {
			duration: timing.arrive,
			easing: cubicOut,
			css: (t: number) => flightCss(1 - t, flight, ARRIVING)
		};
	}

	function rectOf(node: HTMLElement | null): Rect | null {
		return node ? node.getBoundingClientRect() : null;
	}

	/** Register a mutation so `loadMore` can wait for it before trusting its offset. */
	function track<T>(request: Promise<T>): Promise<T> {
		inFlight.add(request);
		void request.catch(() => {}).finally(() => inFlight.delete(request));
		return request;
	}

	function rollBack(entry: DecisionAction, message: string) {
		// The card comes back, which is the same thing an undo does, so it arrives the same way.
		moveWith('undo');
		session = reduce(session, { type: 'rollBack', id: entry.id });
		error = message;
	}

	/** Leave this domain for later. Sends nothing: it stays PENDING for whoever looks next. */
	function skipCurrent() {
		if (!current) return;
		error = '';
		moveWith('skip');
		session = reduce(session, { type: 'skip', queue });
		void loadMore();
	}

	/** Move to a specific domain — an UP NEXT row, or one waiting in the tray. */
	function goTo(index: number) {
		error = '';
		// Backwards is a return, and reads like an undo. Forwards is an advance that happens to
		// step over some rows, so it reads like one.
		moveWith(index > session.cursor ? 'jump' : 'undo', queue[index]?.name);
		session = reduce(session, { type: 'goTo', queue, index });
		void loadMore();
	}

	/**
	 * Take back the last thing done, whatever it was.
	 *
	 * A skip is local and cannot fail; a decision has to be undone at the server first. Reading
	 * both off one stack is what stops `U` after a skip reversing an earlier approval.
	 */
	function undoLast() {
		const entry = session.actions[0];
		if (!entry) return;
		if (entry.kind === 'skip') {
			error = '';
			moveWith('undo');
			session = reduce(session, { type: 'undoEntry', id: entry.id });
			return;
		}
		void undo(entry);
	}

	async function undo(entry: DecisionAction) {
		error = '';
		const res = await track(
			fetch(`${API_ROOT}/domains/${encodeURIComponent(entry.item.name)}/undo`, { method: 'POST' })
		);
		if (!res.ok) {
			error = await failureMessage(res, `Could not undo the decision on ${entry.item.name}`);
			return;
		}
		moveWith('undo');
		session = reduce(session, { type: 'undoEntry', id: entry.id });
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

		const ahead = queue.length - session.cursor;
		// Half a page of slack. Ten rows was tuned against a 460ms-per-card ceiling that the
		// animation used to impose and no longer does.
		if (ahead > QUEUE_PAGE_SIZE / 2) return;

		loadingMore = true;
		try {
			// The decisions already sent still shorten the list under us; letting them land
			// first keeps the overlap small rather than making the result correct. One round, not
			// a loop: with nothing gating input a moderator can keep adding requests faster than
			// they settle, and a loop over a set that keeps growing may never finish — leaving
			// `loadingMore` true, every later call a no-op, and the cursor running off the end of
			// a queue the screen then claims is empty.
			await Promise.allSettled([...inFlight]);

			const limit = ahead + QUEUE_PAGE_SIZE;
			const res = await fetch(`${API_ROOT}/queue?limit=${limit}&offset=0`);
			if (!res.ok) return;
			const page: ModerationQueue = await res.json();
			// `count` is the server's own pending total, so the header reads the truth rather
			// than this screen's arithmetic. Only decisions are added back: a skipped domain was
			// never sent anywhere and is still inside that count.
			pendingCount = page.count + decided.length;
			const held = new Set(queue.map((item) => item.name));
			queue = [...queue, ...page.items.filter((item) => !held.has(item.name))];
		} finally {
			loadingMore = false;
		}
	}

	function openReject() {
		if (!current) return;
		const suggestion = current.suggestion;
		const suggested = suggestion?.action === 'REJECT' && suggestion.reason;
		reason = suggested ? (suggestion!.reason as RejectionReason) : 'SPAM';
		// The suggestion's own words, which for an OTHER are the check that found the problem
		// ("Homepage returns HTTP 404") — better than anything typed here, and still editable.
		detail = suggested ? suggestion!.reason_detail : '';
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
			return;
		}
		// The detail travels with the suggestion, because a rejection carrying OTHER is refused
		// without one. The API never suggests a rejection it cannot say the reason for, so this
		// only bites against an older one — and there the honest answer is to ask the moderator
		// for the sentence, not to send a decision that is refused or recorded with no reason.
		if (!suggestion.reason || (suggestion.reason === 'OTHER' && !suggestion.reason_detail.trim())) {
			openReject();
			return;
		}
		void decide('REJECTED', suggestion.reason, suggestion.reason_detail);
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

		if (typing) return;

		// Nothing gates a decision on the animation any more, so a held-down key is no longer
		// throttled by anything: auto-repeat would fire around thirty times a second and empty the
		// queue unattended. Pressing the key repeatedly is unaffected — those are discrete events.
		if (event.repeat) return;

		// Undo is deliberately outside the `current` guard below: skipping the last of the loaded
		// rows leaves no card in the slot, and that is exactly when walking back is needed.
		if (event.key === 'u' || event.key === 'U') {
			event.preventDefault();
			undoLast();
			return;
		}

		if (!current) return;

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
			case 's':
			case 'S':
				event.preventDefault();
				skipCurrent();
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
				bind:ref={trayButton}
				variant="secondary"
				class="h-9 gap-2 px-4 text-sm"
				aria-expanded={trayOpen}
				onclick={() => (trayOpen = !trayOpen)}
			>
				<RiCheckLine class="size-4" /> This session ({session.actions.length})
			</Button>
		</div>
		<hr class="my-4" />

		{#if error}
			<Card.Root class="mb-4 p-4 outline-red-100 outline-solid dark:outline-red-900">
				{error}
			</Card.Root>
		{/if}

		{#if trayOpen}
			<div class="bg-card mb-4 flex flex-col gap-2.5 rounded-2xl px-4 py-3.5">
				<div class="text-unemphasized-1 text-xs font-semibold tracking-[0.05em]">THIS SESSION</div>
				{#each session.actions as entry (entry.id)}
					<div
						class="text-unemphasized-2 flex flex-wrap items-center gap-3 text-sm"
						animate:flip={{ duration: motion(reduced.current).flip, easing: cubicOut }}
						out:fade={{ duration: motion(reduced.current).rowOut }}
					>
						<StatusPill status={entry.kind === 'skip' ? 'SKIPPED' : entry.status} />
						<span class="font-medium">{entry.item.name}</span>
						<span class="text-unemphasized-1">{outcomeLine(entry)}</span>
						<div class="flex-1"></div>
						{#if entry.kind === 'skip'}
							<button
								type="button"
								class="text-accent-text font-medium hover:underline"
								onclick={() => goTo(entry.index)}
							>
								review →
							</button>
						{:else}
							<button
								type="button"
								class="text-accent-text font-medium hover:underline"
								onclick={() => undo(entry)}
							>
								undo
							</button>
						{/if}
					</div>
				{:else}
					<div class="text-unemphasized-1 text-sm">
						Nothing yet — decisions land here and stay undoable, and anything you skip waits here
						too.
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
					<Kbd>S</Kbd> skip · <Kbd>U</Kbd> undo
				</span>
			</div>

			<!-- Fixed height, so the suggested-action button sits at the same place on every
			     card and never moves under the cursor between decisions. -->
			<div class="relative h-[376px]">
				<!-- Keyed on the domain, so a card leaving and the card taking its place are two
				     elements and can be on screen at once. Both are `absolute inset-0`, so they
				     overlap in the slot with no layout jump, and the slot keeps its height for the
				     whole flight. `|global` is load-bearing rather than decorative: an outro local
				     to this block would silently not run when the last card is decided and the
				     enclosing `{#if current}` goes with it. -->
				{#key current.name}
					<div
						class="ring-accent-text/25 bg-card absolute inset-0 grid grid-cols-[1fr_4rem] overflow-hidden rounded-2xl ring-2"
						in:arrive={{ kind: lastMove }}
						out:depart|global={{ kind: lastMove }}
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
									<div
										class="text-unemphasized-1 mt-0.5 flex flex-wrap items-center gap-3.5 text-sm"
									>
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

							<!-- Set apart from the override pair on purpose: skipping is not a quieter way
							     of deciding. It decides nothing and sends nothing. -->
							<hr class="my-1.5 w-6" />

							<Button
								variant="ghost"
								size="icon"
								title="Skip for now — S"
								aria-label="Skip {current.name} for now"
								onclick={skipCurrent}
							>
								<RiSkipForwardLine class="size-5" />
							</Button>
							<span class="text-unemphasized-1 px-1 text-center text-[10px] leading-tight">
								later
							</span>
						</div>
					</div>
				{/key}
			</div>

			<div class="text-unemphasized-1 mt-4.5 mb-2 text-xs font-semibold tracking-[0.05em]">
				UP NEXT
			</div>
			<div class="flex flex-col">
				{#each upcoming as row (row.item.name)}
					<!-- The row already looked clickable; now it is. Everything stepped over on the way
					     there is recorded as skipped, so nothing is lost by jumping.
					     `animate:flip` has to be here rather than only on the rows that stay: it is
					     what makes Svelte pull the leaving row out of flow at once, and that is what
					     lets the rows below start closing the gap instead of waiting for its outro.
					     `flip`'s duration has to be given: it defaults to `sqrt(distance) * 120`,
					     which is 720ms over a row's height — three times anything else here. -->
					<button
						bind:this={rowNodes[row.item.name]}
						type="button"
						title="Review {row.item.name} now"
						onclick={() => goTo(row.index)}
						animate:flip={{ duration: motion(reduced.current).flip, easing: cubicOut }}
						out:fade={{ duration: motion(reduced.current).rowOut }}
						class="text-unemphasized-2 hover:bg-card grid w-full cursor-pointer grid-cols-[1fr_8rem_6rem] items-center gap-3 rounded-[10px] px-2.5 py-2 text-left text-sm"
					>
						<span class="flex min-w-0 items-center gap-2">
							<span class="size-1.5 shrink-0 rounded-full bg-[hsl(220_8%_62%)]"></span>
							<span class="truncate">{row.item.name}</span>
						</span>
						<span class="text-unemphasized-1">
							{row.item.submission_count}
							{row.item.submission_count === 1 ? 'submission' : 'submissions'}
						</span>
						<span class="text-unemphasized-1 flex items-center gap-2.5">
							{@render votes(row.item)}
						</span>
					</button>
				{:else}
					<div class="text-unemphasized-1 px-2.5 text-sm">
						Nothing else waiting — this is the last one.
					</div>
				{/each}
			</div>
		{:else if skipped.length > 0}
			<!-- Not "the queue is empty": these were never sent anywhere and are still pending. -->
			<Card.Root class="flex flex-col items-start gap-4 p-8">
				<p class="text-lg">
					That's the end of the queue, but you skipped {skipped.length}
					{skipped.length === 1 ? 'domain' : 'domains'}.
				</p>
				<p class="text-unemphasized-1 text-sm">
					Nothing was recorded for {skipped.length === 1 ? 'it' : 'them'} — still waiting for a decision,
					from you or whoever moderates next.
				</p>
				<div class="flex flex-wrap items-center gap-3">
					<Button onclick={() => goTo(skipped[0].index)}>
						Review the {skipped.length === 1 ? 'one you skipped' : `${skipped.length} you skipped`}
					</Button>
					<Button href="/domain-submissions" variant="secondary">Back to domain submissions</Button>
				</div>
			</Card.Root>
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

<script lang="ts">
	import RiErrorWarningLine from '~icons/ri/error-warning-line';

	import Button from '@/components/ui/button/button.svelte';
	import SignInButton from '@/components/custom/menu/SignInButton.svelte';

	import DecisionBar from '@/components/custom/moderation/DecisionBar.svelte';
	import DomainHeader from '@/components/custom/moderation/DomainHeader.svelte';
	import QueueSidebar from '@/components/custom/moderation/QueueSidebar.svelte';
	import SamplePages from '@/components/custom/moderation/SamplePages.svelte';

	import { QUEUE_PAGE_SIZE, type QueueItem, type RejectionReason } from '$lib/moderation';
	import {
		createSession,
		decide,
		doneEntry,
		select,
		setAside,
		setTab,
		statusOf,
		undo,
		type SessionState,
		type Tab
	} from '$lib/moderation-session';
	import { rise, sink, STAGGER, TAB_TICK_DELAY, TAB_TICK_DURATION } from '$lib/moderation-motion';
	import { buildDecision, fetchQueuePage, postDecision, postUndo } from '$lib/moderation-api';

	let { data } = $props();

	/**
	 * The queue rows, by name.
	 *
	 * Rows are kept even after their domain has been decided, because the Done tab still draws
	 * them and an undo puts them straight back on screen — refetching a card the browser already
	 * has would put a network round trip in the middle of changing your mind.
	 */
	let items = $state(new Map<string, QueueItem>());
	let session = $state<SessionState>(createSession([]));
	/** How many pending domains the server said there were when the page loaded. */
	let serverCount = $state(0);

	let busy = $state(false);
	let error = $state('');
	let catching = $state<Exclude<Tab, 'pending'> | null>(null);
	let refilling = false;

	if (data.access === 'ok') {
		items = new Map(data.items.map((item) => [item.name, item]));
		session = createSession(data.items);
		serverCount = data.count;
	}

	let current = $derived(session.selected ? items.get(session.selected) : undefined);
	let status = $derived(statusOf(session, session.selected));
	/** Loaded rows are a page of a possibly longer queue; say so rather than implying otherwise. */
	let remaining = $derived(Math.max(0, serverCount - items.size));

	/**
	 * The panel is as tall as the space left below the header, never taller.
	 *
	 * The queue is longer than the design's fixtures suggested, and a panel that grows with it
	 * pushes the decision buttons off the bottom of the window — the moderator then scrolls to
	 * every decision. Bounding the panel puts the scrolling inside the queue instead, where it
	 * belongs, and leaves the buttons where they were.
	 *
	 * Measured rather than hard-coded because the header above it is not a fixed height: the
	 * Palestine banner wraps on narrow windows.
	 */
	const PANEL_BOTTOM_GAP = 24;
	/** Below this the panel is too cramped to be worth fitting, and the page may as well scroll. */
	const MIN_PANEL_HEIGHT = 420;

	let panel = $state<HTMLElement | null>(null);
	let panelHeight = $state(660);

	function measurePanel() {
		if (!panel) return;
		const top = panel.getBoundingClientRect().top;
		panelHeight = Math.max(MIN_PANEL_HEIGHT, window.innerHeight - top - PANEL_BOTTOM_GAP);
	}

	$effect(() => {
		if (!panel) return;
		// The error alert sits above the panel, so showing or dismissing it moves the panel's top.
		void error;
		measurePanel();
		// The header's height answers to the window's width, so a resize can move the panel's top
		// as well as the bottom it is being fitted against.
		window.addEventListener('resize', measurePanel);
		return () => window.removeEventListener('resize', measurePanel);
	});

	let tickTimers: ReturnType<typeof setTimeout>[] = [];

	/**
	 * The destination tab ticks as the decided card finishes leaving, so the movement reads as
	 * the tab catching what was dropped rather than as two unrelated animations.
	 */
	function tick(tab: Exclude<Tab, 'pending'>) {
		tickTimers.forEach(clearTimeout);
		tickTimers = [
			setTimeout(() => (catching = tab), TAB_TICK_DELAY),
			setTimeout(() => (catching = null), TAB_TICK_DELAY + TAB_TICK_DURATION + 300)
		];
	}

	$effect(() => () => tickTimers.forEach(clearTimeout));

	/**
	 * Apply a decision locally, then send it.
	 *
	 * Local first because the queue has to keep moving at the speed the moderator works, and the
	 * card is already sinking by the time the request goes out. If the request fails the state
	 * goes back exactly as it was and the error says so — a decision that was not recorded must
	 * never look recorded.
	 */
	async function commit(next: SessionState, send: () => Promise<void>) {
		const previous = session;
		session = next;
		error = '';
		busy = true;
		try {
			await send();
		} catch (failure) {
			session = previous;
			error = failure instanceof Error ? failure.message : 'Something went wrong.';
		} finally {
			busy = false;
		}
		void refill();
	}

	function approve() {
		const item = current;
		if (!item) return;
		tick('done');
		commit(decide(session, item.name, 'APPROVED'), () =>
			postDecision(fetch, buildDecision(item.name, 'APPROVED', item.suggestion))
		);
	}

	function reject(reason: RejectionReason, detail: string) {
		const item = current;
		if (!item) return;
		tick('done');
		commit(decide(session, item.name, 'REJECTED', reason, detail), () =>
			postDecision(fetch, buildDecision(item.name, 'REJECTED', item.suggestion, reason, detail))
		);
	}

	/**
	 * Setting aside is the screen's own state and sends nothing: the domain stays PENDING
	 * server-side, which is what makes it safe to leave one here and come back to it.
	 */
	function aside() {
		if (!session.selected) return;
		tick('aside');
		session = setAside(session, session.selected);
	}

	function undoDomain(name: string) {
		// Only a recorded decision needs unrecording; a set-aside never left the browser.
		const wasDecided = doneEntry(session, name) !== undefined;
		const next = undo(session, name);
		if (!wasDecided) {
			session = next;
			return;
		}
		commit(next, () => postUndo(fetch, name));
	}

	/**
	 * Top the queue up when it runs low.
	 *
	 * Refetches from offset 0 rather than paging forward: every decision removes a domain from
	 * the server's pending queue, so offsets computed against an earlier page would skip rows.
	 * Names already loaded are ignored, which makes a repeat call harmless.
	 */
	async function refill() {
		if (refilling || session.pending.length > 5 || remaining === 0) return;
		refilling = true;
		try {
			const page = await fetchQueuePage(fetch, QUEUE_PAGE_SIZE, 0);
			serverCount = page.count;
			const fresh = page.items.filter((item) => !items.has(item.name));
			if (fresh.length > 0) {
				const merged = new Map(items);
				fresh.forEach((item) => merged.set(item.name, item));
				items = merged;
				session = {
					...session,
					order: [...session.order, ...fresh.map((item) => item.name)],
					pending: [...session.pending, ...fresh.map((item) => item.name)],
					selected: session.selected ?? fresh[0].name
				};
			}
		} catch {
			// A failed top-up is not worth interrupting the moderator for: the rows already on
			// screen still work, and the next decision tries again.
		} finally {
			refilling = false;
		}
	}
</script>

<svelte:head>
	<title>Moderate domain submissions - Mwmbl</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto w-full max-w-7xl px-5 pb-12 lg:px-8">
	{#if data.access === 'anonymous'}
		<div class="bg-card mx-auto mt-8 max-w-xl rounded-2xl p-8 text-center">
			<h1 class="text-2xl font-medium">Moderating domain submissions</h1>
			<p class="text-unemphasized-2 mt-2">Sign in to review the queue.</p>
			<div class="mt-6 flex justify-center">
				<SignInButton loginStatus={data.loginStatus} />
			</div>
		</div>
	{:else if data.access === 'denied'}
		<div class="bg-card mx-auto mt-8 max-w-xl rounded-2xl p-8 text-center">
			<h1 class="text-2xl font-medium">Moderating domain submissions</h1>
			<p class="text-unemphasized-2 mt-2">
				Your account can't review domain submissions. If you think it should, ask on
				<a class="text-accent-text hover:underline" href="https://matrix.to/#/#mwmbl:matrix.org"
					>Matrix</a
				>.
			</p>
			<div class="mt-6 flex justify-center">
				<Button variant="outline" href="/domain-submissions">Back to submissions</Button>
			</div>
		</div>
	{:else if data.access === 'error'}
		<div class="bg-card mx-auto mt-8 max-w-xl rounded-2xl p-8 text-center">
			<h1 class="text-2xl font-medium">Moderating domain submissions</h1>
			<p class="text-unemphasized-2 mt-2">{data.message}</p>
		</div>
	{:else}
		<h1 class="sr-only">Moderate domain submissions</h1>

		{#if error}
			<div
				class="mt-4 flex items-center gap-2 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-900"
				role="alert"
			>
				<RiErrorWarningLine class="size-5 shrink-0" />
				<span class="flex-1">{error}</span>
				<button
					type="button"
					class="cursor-pointer font-medium hover:underline"
					onclick={() => (error = '')}>dismiss</button
				>
			</div>
		{/if}

		<div
			bind:this={panel}
			class="panel bg-background mt-4 grid overflow-hidden rounded-2xl md:grid-cols-[20rem_1fr] md:grid-rows-[minmax(0,1fr)]"
			style="--panel-height: {panelHeight}px"
		>
			<QueueSidebar
				state={session}
				{items}
				{catching}
				{remaining}
				onselect={(name) => (session = select(session, name))}
				ontab={(tab) => (session = setTab(session, tab))}
				onundo={undoDomain}
			/>

			<div class="grid min-h-0 grid-rows-[1fr_auto] gap-4 px-7 py-6">
				<div class="grid min-h-0">
					{#if current}
						{#key session.selected}
							<div class="grid min-h-0 grid-rows-[auto_1fr] gap-4 [grid-area:1/1]" out:sink>
								<div in:rise>
									<DomainHeader item={current} {status} />
								</div>
								<div class="min-h-0" in:rise={{ delay: STAGGER }}>
									<SamplePages item={current} />
								</div>
							</div>
						{/key}
					{:else}
						<p class="text-unemphasized-1 self-center text-center">Nothing left to review. Nice.</p>
					{/if}
				</div>

				<DecisionBar
					item={current}
					last={session.last}
					{busy}
					onapprove={approve}
					onreject={reject}
					onsetaside={aside}
					onundo={() => session.last && undoDomain(session.last.name)}
				/>
			</div>
		</div>
	{/if}
</main>

<style>
	.panel {
		min-height: 660px;
	}

	/*
	 * Fitted to the window only once the panes sit side by side. Stacked — the queue above the
	 * domain — the page's own scroll is the right one, and a window-height box would squeeze both.
	 */
	@media (min-width: 768px) {
		.panel {
			height: var(--panel-height);
			min-height: 0;
		}
	}
</style>

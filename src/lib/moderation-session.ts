/**
 * The review screen's own bookkeeping: which domains are still to judge, which were set
 * aside, what has been decided, and what is on screen.
 *
 * Kept as plain data and pure functions so the queue walk can be tested without a browser.
 * Every function returns a new state; nothing here talks to the network.
 *
 * Domains are tracked by `name`, not by index or submission id, because that is what a
 * decision is addressed to (see `DomainDecision`): a domain submitted nine times is one row
 * and one decision.
 */

import type { DecisionStatus, QueueItem } from './moderation';

export type Tab = 'pending' | 'aside' | 'done';

/** A decision made in this session. Newest first in `done`. */
export type DoneEntry = {
	name: string;
	status: Extract<DecisionStatus, 'APPROVED' | 'REJECTED'>;
	reason: string;
	detail: string;
};

/**
 * The single most recent thing the moderator did, for the undo line above the buttons.
 *
 * `aside` is in here alongside the two real decisions because the undo line offers to take
 * back whatever just happened, and setting aside is one of those things.
 */
export type LastAction =
	| { kind: 'APPROVED'; name: string }
	| { kind: 'REJECTED'; name: string; reason: string }
	| { kind: 'SET_ASIDE'; name: string };

export type SessionState = {
	/**
	 * The queue's own order, kept whole so an undone domain goes back where it was rather
	 * than to the end of the list.
	 */
	order: string[];
	pending: string[];
	aside: string[];
	done: DoneEntry[];
	selected: string | null;
	tab: Tab;
	last: LastAction | null;
};

export function createSession(items: QueueItem[]): SessionState {
	const order = items.map((item) => item.name);
	return {
		order,
		pending: [...order],
		aside: [],
		done: [],
		selected: order[0] ?? null,
		tab: 'pending',
		last: null
	};
}

/** The names shown in the sidebar for the current tab. */
export function rowsFor(state: SessionState): string[] {
	if (state.tab === 'aside') return state.aside;
	if (state.tab === 'done') return state.done.map((entry) => entry.name);
	return state.pending;
}

export function doneEntry(state: SessionState, name: string): DoneEntry | undefined {
	return state.done.find((entry) => entry.name === name);
}

/**
 * Where the eye goes after `name` leaves the pending list.
 *
 * The row that slid up into the vacated slot, so the queue keeps moving in one direction.
 * Falls back to the new last row when the end of the list was consumed, and to `null` only
 * when nothing is left to judge.
 */
export function nextAfter(pending: string[], name: string): string | null {
	const at = pending.indexOf(name);
	const rest = pending.filter((other) => other !== name);
	if (rest.length === 0) return null;
	if (at < 0) return rest[0];
	return rest[Math.min(at, rest.length - 1)];
}

/**
 * Selecting a row changes what is on screen and nothing else.
 *
 * Deliberately not a "skip": the domain stays exactly where it was in the queue, which is what
 * the sidebar note promises.
 */
export function select(state: SessionState, name: string): SessionState {
	return { ...state, selected: name };
}

export function setTab(state: SessionState, tab: Tab): SessionState {
	return { ...state, tab };
}

/**
 * Record a decision locally and move on.
 *
 * Also clears the domain from `aside`, so deciding something you had set aside resolves it
 * rather than leaving it in both places. Re-deciding a domain already in `done` replaces its
 * entry instead of adding a second one.
 */
export function decide(
	state: SessionState,
	name: string,
	status: DoneEntry['status'],
	reason = '',
	detail = ''
): SessionState {
	const entry: DoneEntry = { name, status, reason, detail };
	const next = nextAfter(state.pending, name);
	return {
		...state,
		pending: state.pending.filter((other) => other !== name),
		aside: state.aside.filter((other) => other !== name),
		done: [entry, ...state.done.filter((other) => other.name !== name)],
		selected: next ?? state.selected,
		last: status === 'APPROVED' ? { kind: 'APPROVED', name } : { kind: 'REJECTED', name, reason },
		tab: state.tab
	};
}

/** Park a domain the moderator could not judge. Sends nothing; it stays PENDING server-side. */
export function setAside(state: SessionState, name: string): SessionState {
	const next = nextAfter(state.pending, name);
	return {
		...state,
		pending: state.pending.filter((other) => other !== name),
		aside: state.aside.includes(name) ? state.aside : [...state.aside, name],
		done: state.done.filter((other) => other.name !== name),
		selected: next ?? state.selected,
		last: { kind: 'SET_ASIDE', name }
	};
}

/**
 * Put a domain back in the queue, in its original position.
 *
 * Used by the undo line and by the undo link on every row of the Done and Set aside tabs. The
 * screen jumps to the restored domain on the Pending tab, because undoing is nearly always the
 * prelude to deciding it differently.
 */
export function undo(state: SessionState, name: string): SessionState {
	const rank = new Map(state.order.map((other, index) => [other, index]));
	const pending = state.pending.includes(name)
		? state.pending
		: [...state.pending, name].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));

	return {
		...state,
		pending,
		aside: state.aside.filter((other) => other !== name),
		done: state.done.filter((entry) => entry.name !== name),
		selected: name,
		tab: 'pending',
		last: state.last?.name === name ? null : state.last
	};
}

/** The chip beside the domain name, and the dot colour that goes with it. */
export function statusOf(
	state: SessionState,
	name: string | null
): 'PENDING' | 'SET_ASIDE' | 'APPROVED' | 'REJECTED' {
	if (!name) return 'PENDING';
	const entry = doneEntry(state, name);
	if (entry) return entry.status;
	if (state.aside.includes(name)) return 'SET_ASIDE';
	return 'PENDING';
}

/** The sentence in the undo line, e.g. "Rejected cheap-rolex-outlet.biz — spam". */
export function lastActionNote(
	last: LastAction | null,
	reasonLabel: (r: string) => string
): string {
	if (!last) return '';
	if (last.kind === 'SET_ASIDE') return `Set aside ${last.name}`;
	if (last.kind === 'APPROVED') return `Approved ${last.name}`;
	return `Rejected ${last.name} — ${reasonLabel(last.reason)}`;
}

/** What the sidebar says when the tab you are on has nothing in it. */
export function emptyNote(tab: Tab): string {
	if (tab === 'aside') return 'Nothing set aside — anything you can’t judge lands here.';
	if (tab === 'done') return 'No decisions yet.';
	return 'Queue clear. Nice.';
}

/**
 * Walking the moderation queue: where the cursor is, and what can be taken back.
 *
 * Kept apart from the screen — no runes, no `fetch`, no DOM — because this is the part that is
 * easy to get subtly wrong and impossible to eyeball. The component owns the network request,
 * the fly-out animation and paging; everything here is pure.
 *
 * The one idea worth holding on to: **skipping and deciding share a single stack.** A skip sends
 * nothing to the server, a decision sends a POST, but the moderator undoes them with the same
 * keystroke, so they have to be undone in the order they were made. Two separate lists cannot do
 * that — "undo" would reach past whichever thing you actually did last.
 */

import type { DecisionStatus, QueueItem } from './moderation';

/**
 * One thing the moderator did, in a stack that is newest-first.
 *
 * `index` is where the domain sits in `queue`, which never has entries removed from it — a
 * decided card stays put and the cursor simply moves past. So an index stays valid for the life
 * of the session and is what a cursor rewind aims at.
 */
export type Action =
	| {
			id: number;
			kind: 'decision';
			item: QueueItem;
			index: number;
			status: DecisionStatus;
			reason: string;
	  }
	| { id: number; kind: 'skip'; item: QueueItem; index: number };

/** The half of `Action` that reached the server, and so is the half an undo has to ask about. */
export type DecisionAction = Extract<Action, { kind: 'decision' }>;

export function isDecision(action: Action | undefined): action is DecisionAction {
	return action?.kind === 'decision';
}

export type Session = {
	cursor: number;
	/** Newest first, so `actions[0]` is what `U` takes back. */
	actions: Action[];
	/**
	 * Ids are handed out here rather than derived from `index`, because an index is not unique
	 * over a session: a domain can be skipped, returned to, and then decided. Identifying entries
	 * by index made a later lookup match the earlier, stale entry as well.
	 */
	nextId: number;
};

export const NEW_SESSION: Session = { cursor: 0, actions: [], nextId: 0 };

export type SessionEvent =
	/** Leave the current domain for later and move on. */
	| { type: 'skip'; queue: QueueItem[] }
	/** Jump to a domain further down the list, skipping whatever is stepped over. */
	| { type: 'goTo'; queue: QueueItem[]; index: number }
	/** Record a decision. The cursor does not move until `land`. */
	| { type: 'decide'; queue: QueueItem[]; status: DecisionStatus; reason: string }
	/** The decided card has finished flying out: move past it. */
	| { type: 'land'; id: number }
	/** A skip taken back, or `/undo` accepted for a decision. */
	| { type: 'undoEntry'; id: number }
	/** The decision's POST failed: pretend it never happened. */
	| { type: 'rollBack'; id: number };

export function reduce(session: Session, event: SessionEvent): Session {
	switch (event.type) {
		case 'skip':
			return moveTo(pushSkips(session, event.queue, session.cursor + 1), session.cursor + 1);

		case 'goTo': {
			// Backwards is a return, not a skip: nothing is stepped over, so nothing is recorded.
			const stepped =
				event.index > session.cursor ? pushSkips(session, event.queue, event.index) : session;
			return moveTo(stepped, event.index);
		}

		case 'decide': {
			const item = event.queue[session.cursor];
			if (!item) return session;
			const action: Action = {
				id: session.nextId,
				kind: 'decision',
				item,
				index: session.cursor,
				status: event.status,
				reason: event.reason
			};
			// Any skip on this domain is settled by the decision, and would otherwise sit in the
			// tray claiming the domain is still waiting for one.
			return {
				cursor: session.cursor,
				actions: [action, ...withoutSkipAt(session.actions, session.cursor)],
				nextId: session.nextId + 1
			};
		}

		case 'land': {
			const action = session.actions.find((entry) => entry.id === event.id);
			// Only ever forwards. A rolled-back decision can land after its request has failed,
			// and moving the cursor on then would step over the card the failure just restored.
			if (!action || session.cursor > action.index) return session;
			return { ...session, cursor: action.index + 1 };
		}

		case 'undoEntry': {
			const action = session.actions.find((entry) => entry.id === event.id);
			if (!action) return session;
			const actions = session.actions.filter((entry) => entry.id !== event.id);
			// Rewind only for the entry on top of the stack. Everything after an older one is still
			// done, so stepping back to it would re-present every card decided since; an older
			// domain is pending again on the server and returns to the queue on the next load.
			const top = session.actions[0]?.id === event.id;
			return { ...session, actions, cursor: top ? action.index : session.cursor };
		}

		case 'rollBack': {
			const action = session.actions.find((entry) => entry.id === event.id);
			if (!action) return session;
			return {
				...session,
				actions: session.actions.filter((entry) => entry.id !== event.id),
				cursor: Math.min(session.cursor, action.index)
			};
		}
	}
}

/**
 * Record a skip for every undecided card between the cursor and `target`, oldest first.
 *
 * A jump over three rows is three skips rather than one movement, so `U` walks back a card at a
 * time and each one stays individually recoverable. Getting back to a domain a long way behind is
 * what the session tray's own link is for.
 */
function pushSkips(session: Session, queue: QueueItem[], target: number): Session {
	let { actions, nextId } = session;
	for (let index = session.cursor; index < target; index++) {
		const item = queue[index];
		// A decided card is not waiting for anything, and a card already recorded as skipped does
		// not need saying twice.
		if (!item || decidedAt(actions, index) || skippedAt(actions, index)) continue;
		actions = [{ id: nextId, kind: 'skip', item, index }, ...actions];
		nextId++;
	}
	return { ...session, actions, nextId };
}

/**
 * Land the cursor, and drop any skip on the card it lands on.
 *
 * Every cursor move goes through here, which is what keeps that promise true: you are looking at
 * the domain, so it is no longer one you left for later.
 */
function moveTo(session: Session, index: number): Session {
	return { ...session, cursor: index, actions: withoutSkipAt(session.actions, index) };
}

function withoutSkipAt(actions: Action[], index: number): Action[] {
	return actions.filter((entry) => !(entry.kind === 'skip' && entry.index === index));
}

function decidedAt(actions: Action[], index: number): boolean {
	return actions.some((entry) => entry.kind === 'decision' && entry.index === index);
}

function skippedAt(actions: Action[], index: number): boolean {
	return actions.some((entry) => entry.kind === 'skip' && entry.index === index);
}

export function current(queue: QueueItem[], session: Session): QueueItem | undefined {
	return queue[session.cursor];
}

export function upcoming(queue: QueueItem[], session: Session): QueueItem[] {
	return queue.slice(session.cursor + 1);
}

export function decisions(session: Session): Action[] {
	return session.actions.filter((entry) => entry.kind === 'decision');
}

/** Oldest first, which is the order to work back through them. */
export function skips(session: Session): Action[] {
	return session.actions.filter((entry) => entry.kind === 'skip').reverse();
}

/**
 * How many domains are still waiting, for the header.
 *
 * Skips are deliberately not subtracted: a skipped domain was never sent anywhere, is still
 * `PENDING` on the server, and is still inside the server's own `count`. Counting it as done
 * would quietly under-report the work left every time someone skipped.
 */
export function remaining(pendingCount: number, session: Session): number {
	return Math.max(0, pendingCount - decisions(session).length);
}

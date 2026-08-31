import { describe, expect, it } from 'vitest';

import type { QueueItem } from './moderation';
import {
	NEW_SESSION,
	current,
	decisions,
	reduce,
	remaining,
	skips,
	type Session,
	type SessionEvent
} from './moderation-session';

function queueItem(name: string): QueueItem {
	return {
		name,
		submission_count: 1,
		first_submitted_on: '2026-08-01T00:00:00Z',
		first_submitted_by: 1,
		first_submitted_by_username: 'someone',
		upvotes: 0,
		downvotes: 0,
		https: true,
		evidence_state: 'READY',
		pages: [],
		suggestion: null
	};
}

const queue = ['a.example', 'b.example', 'c.example', 'd.example', 'e.example'].map(queueItem);

/** Replays events onto a fresh session, the way the screen does one interaction at a time. */
function run(...events: SessionEvent[]): Session {
	return events.reduce(reduce, NEW_SESSION);
}

const skip = { type: 'skip', queue } as const;
const approve = { type: 'decide', queue, status: 'APPROVED', reason: '' } as const;
const goTo = (index: number) => ({ type: 'goTo', queue, index }) as const;

/** Decide and let the card finish flying out, which is what the screen does either side of the POST. */
function approved(session: Session): Session {
	const decided = reduce(session, approve);
	return reduce(decided, { type: 'land', id: decided.actions[0].id });
}

describe('skipping', () => {
	it('moves on, recording a skip and no decision', () => {
		const session = run(skip);

		expect(current(queue, session)?.name).toBe('b.example');
		expect(skips(session).map((entry) => entry.item.name)).toEqual(['a.example']);
		expect(decisions(session)).toHaveLength(0);
	});

	it('leaves the pending count alone, because nothing was sent', () => {
		const session = run(skip, skip, skip);

		expect(remaining(24, session)).toBe(24);
		expect(remaining(24, approved(session))).toBe(23);
	});

	it('comes back on undo, with the cursor where it was', () => {
		const skipped = run(skip);
		const session = reduce(skipped, { type: 'undoEntry', id: skipped.actions[0].id });

		expect(current(queue, session)?.name).toBe('a.example');
		expect(session.actions).toHaveLength(0);
	});

	it('runs off the end with skips still outstanding', () => {
		const session = run(skip, skip, skip, skip, skip);

		// The end-of-queue state has to say this rather than claim the queue is empty.
		expect(current(queue, session)).toBeUndefined();
		expect(skips(session)).toHaveLength(5);
	});
});

describe('one undo stack', () => {
	it('takes back the skip before the decision that came first', () => {
		// The regression the shared stack exists for: undoing after a skip must not reverse an
		// approval further back, which is a real POST against a domain the moderator did decide.
		const skipped = reduce(approved(NEW_SESSION), skip);
		expect(skipped.actions[0].kind).toBe('skip');

		const once = reduce(skipped, { type: 'undoEntry', id: skipped.actions[0].id });
		expect(current(queue, once)?.name).toBe('b.example');
		expect(decisions(once)).toHaveLength(1);

		const twice = reduce(once, { type: 'undoEntry', id: once.actions[0].id });
		expect(current(queue, twice)?.name).toBe('a.example');
		expect(twice.actions).toHaveLength(0);
	});

	it('rewinds to a decision on top of the stack', () => {
		const session = approved(NEW_SESSION);
		const undone = reduce(session, { type: 'undoEntry', id: session.actions[0].id });

		expect(current(queue, undone)?.name).toBe('a.example');
	});

	it('leaves the cursor alone when an older decision is undone from the tray', () => {
		// Stepping back to it would re-present every card decided since; it returns to the queue on
		// the next load instead.
		const session = approved(approved(approved(NEW_SESSION)));
		const oldest = decisions(session).at(-1)!;
		const undone = reduce(session, { type: 'undoEntry', id: oldest.id });

		expect(current(queue, undone)?.name).toBe('d.example');
		expect(decisions(undone)).toHaveLength(2);
	});
});

describe('jumping to a domain further down', () => {
	it('skips what it steps over, and undoes them one card at a time', () => {
		let session = run(goTo(3));

		expect(current(queue, session)?.name).toBe('d.example');
		expect(skips(session).map((entry) => entry.item.name)).toEqual([
			'a.example',
			'b.example',
			'c.example'
		]);

		for (const name of ['c.example', 'b.example', 'a.example']) {
			session = reduce(session, { type: 'undoEntry', id: session.actions[0].id });
			expect(current(queue, session)?.name).toBe(name);
		}
		expect(session.actions).toHaveLength(0);
	});

	it('does not skip a domain that was already decided', () => {
		const session = reduce(approved(NEW_SESSION), goTo(3));

		expect(skips(session).map((entry) => entry.item.name)).toEqual(['b.example', 'c.example']);
		expect(decisions(session)).toHaveLength(1);
	});

	it('clears the skip on the domain it lands on', () => {
		// Going back to a skipped domain from the tray: you are looking at it, so it is no longer
		// one you left for later.
		const session = reduce(run(goTo(3)), goTo(1));

		expect(current(queue, session)?.name).toBe('b.example');
		expect(skips(session).map((entry) => entry.item.name)).toEqual(['a.example', 'c.example']);
	});
});

describe('returning to a skipped domain', () => {
	it('leaves one entry behind when it is finally decided, not two', () => {
		// b.example is skipped, returned to, and then approved. Deciding it has to settle the skip
		// as well, or the tray shows the same domain both waiting and approved.
		const decided = approved(reduce(run(skip, skip), goTo(1)));
		const approval = decisions(decided)[0];

		expect(approval.item.name).toBe('b.example');
		expect(skips(decided).map((entry) => entry.item.name)).toEqual(['a.example']);

		const undone = reduce(decided, { type: 'undoEntry', id: approval.id });
		expect(decisions(undone)).toHaveLength(0);
		expect(skips(undone).map((entry) => entry.item.name)).toEqual(['a.example']);
	});
});

describe('a decision whose request fails', () => {
	it('rolls back to the card, keeping the decisions around it', () => {
		const session = reduce(approved(NEW_SESSION), approve);
		const failed = session.actions[0];
		const rolled = reduce(session, { type: 'rollBack', id: failed.id });

		expect(current(queue, rolled)?.name).toBe('b.example');
		expect(decisions(rolled).map((entry) => entry.item.name)).toEqual(['a.example']);
	});

	it('is not stepped over by its own fly-out landing late', () => {
		const session = reduce(approved(NEW_SESSION), approve);
		const failed = session.actions[0];
		const rolled = reduce(session, { type: 'rollBack', id: failed.id });

		expect(current(queue, reduce(rolled, { type: 'land', id: failed.id }))?.name).toBe('b.example');
	});
});

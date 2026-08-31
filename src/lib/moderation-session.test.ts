import { describe, expect, it } from 'vitest';

import type { QueueItem } from './moderation';
import {
	NEW_SESSION,
	current,
	decisions,
	reduce,
	remaining,
	skips,
	upcoming,
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

function approved(session: Session): Session {
	return reduce(session, approve);
}

describe('deciding', () => {
	it('moves on by itself, without waiting for the card to finish animating', () => {
		const session = reduce(NEW_SESSION, approve);

		expect(current(queue, session)?.name).toBe('b.example');
		expect(decisions(session).map((entry) => entry.item.name)).toEqual(['a.example']);
	});
});

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

describe('what UP NEXT offers', () => {
	it('addresses domains by index, not by counting from the cursor', () => {
		// The rows carry their own index because the list is not contiguous once a rollback has
		// left decided cards ahead of the cursor; counting offsets would then pick the wrong domain.
		const session = reduce(approved(approved(approved(NEW_SESSION))), approve);
		const failed = session.actions.find((entry) => entry.item.name === 'a.example')!;
		const rolled = reduce(session, { type: 'rollBack', id: failed.id });
		const row = upcoming(queue, rolled)[0];

		expect(current(queue, reduce(rolled, goTo(row.index)))?.name).toBe(row.item.name);
	});

	it('steps over a decided domain rather than landing on it', () => {
		const session = reduce(approved(approved(approved(NEW_SESSION))), approve);
		const failed = session.actions.find((entry) => entry.item.name === 'a.example')!;
		const rolled = reduce(session, { type: 'rollBack', id: failed.id });

		expect(current(queue, reduce(rolled, goTo(2)))?.name).toBe('e.example');
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

	it('rewinds past decisions that landed while its request was still in flight', () => {
		// Only reachable now that nothing gates input: a.example's POST can fail while c and d have
		// already been decided. The cursor goes back to the card the failure restored.
		const session = reduce(approved(approved(approved(NEW_SESSION))), approve);
		const failed = session.actions.find((entry) => entry.item.name === 'a.example')!;
		const rolled = reduce(session, { type: 'rollBack', id: failed.id });

		expect(current(queue, rolled)?.name).toBe('a.example');
		expect(decisions(rolled)).toHaveLength(3);
	});

	it('does not offer the domains decided while it was in flight', () => {
		// The bug the old 460ms input lock was hiding: `queue.slice(cursor + 1)` after a rewind
		// lists cards that are already decided, and both UP NEXT and `skip` would walk onto them.
		const session = reduce(approved(approved(approved(NEW_SESSION))), approve);
		const failed = session.actions.find((entry) => entry.item.name === 'a.example')!;
		const rolled = reduce(session, { type: 'rollBack', id: failed.id });

		expect(upcoming(queue, rolled).map((row) => row.item.name)).toEqual(['e.example']);
		expect(current(queue, reduce(rolled, skip))?.name).toBe('e.example');
	});
});

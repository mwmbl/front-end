import { describe, expect, it } from 'vitest';

import type { QueueItem, Suggestion } from './moderation';
import {
	createSession,
	decide,
	doneEntry,
	emptyNote,
	lastActionNote,
	nextAfter,
	rowsFor,
	select,
	setAside,
	setTab,
	statusOf,
	undo
} from './moderation-session';

function suggestion(overrides: Partial<Suggestion> = {}): Suggestion {
	return {
		action: 'APPROVE',
		confidence: 0.9,
		reason: '',
		reason_confidence: 0,
		reason_source: 'model',
		model_version: 'v1',
		evidence: [],
		...overrides
	};
}

function item(name: string, overrides: Partial<QueueItem> = {}): QueueItem {
	return {
		name,
		submission_count: 1,
		first_submitted_on: '2026-09-01T00:00:00Z',
		first_submitted_by: 1,
		first_submitted_by_username: 'someone',
		upvotes: 0,
		downvotes: 0,
		https: true,
		evidence_state: 'READY',
		pages: [],
		suggestion: suggestion(),
		...overrides
	};
}

const QUEUE = ['a.example', 'b.example', 'c.example', 'd.example'].map((name) => item(name));

describe('createSession', () => {
	it('starts on the first domain with everything pending', () => {
		const state = createSession(QUEUE);
		expect(state.pending).toEqual(['a.example', 'b.example', 'c.example', 'd.example']);
		expect(state.selected).toBe('a.example');
		expect(state.tab).toBe('pending');
		expect(state.aside).toEqual([]);
		expect(state.done).toEqual([]);
		expect(state.last).toBeNull();
	});

	it('copes with an empty queue', () => {
		const state = createSession([]);
		expect(state.selected).toBeNull();
		expect(rowsFor(state)).toEqual([]);
	});
});

describe('nextAfter', () => {
	it('takes the row that moved up into the vacated slot', () => {
		expect(nextAfter(['a', 'b', 'c'], 'b')).toBe('c');
	});

	it('falls back to the new last row at the end of the list', () => {
		expect(nextAfter(['a', 'b', 'c'], 'c')).toBe('b');
	});

	it('is null when nothing is left', () => {
		expect(nextAfter(['a'], 'a')).toBeNull();
	});

	it('does not fall over on a name that is not pending', () => {
		expect(nextAfter(['a', 'b'], 'zzz')).toBe('a');
	});
});

describe('select', () => {
	it('changes what is on screen without consuming the domain', () => {
		const state = select(createSession(QUEUE), 'c.example');
		expect(state.selected).toBe('c.example');
		// The promise the sidebar makes: nothing is skipped for you.
		expect(state.pending).toEqual(['a.example', 'b.example', 'c.example', 'd.example']);
		expect(state.aside).toEqual([]);
		expect(state.done).toEqual([]);
	});
});

describe('decide', () => {
	it('moves the domain to done and advances', () => {
		const state = decide(createSession(QUEUE), 'a.example', 'APPROVED');
		expect(state.pending).toEqual(['b.example', 'c.example', 'd.example']);
		expect(state.done).toEqual([{ name: 'a.example', status: 'APPROVED', reason: '', detail: '' }]);
		expect(state.selected).toBe('b.example');
		expect(state.last).toEqual({ kind: 'APPROVED', name: 'a.example' });
	});

	it('keeps the rejection reason and detail', () => {
		const state = decide(createSession(QUEUE), 'a.example', 'REJECTED', 'SPAM', 'link farm');
		expect(doneEntry(state, 'a.example')).toEqual({
			name: 'a.example',
			status: 'REJECTED',
			reason: 'SPAM',
			detail: 'link farm'
		});
		expect(state.last).toEqual({ kind: 'REJECTED', name: 'a.example', reason: 'SPAM' });
	});

	it('puts the newest decision at the top of the done list', () => {
		let state = decide(createSession(QUEUE), 'a.example', 'APPROVED');
		state = decide(state, 'b.example', 'REJECTED', 'SPAM');
		expect(state.done.map((entry) => entry.name)).toEqual(['b.example', 'a.example']);
	});

	it('resolves a domain that had been set aside rather than leaving it in both lists', () => {
		let state = setAside(createSession(QUEUE), 'a.example');
		expect(state.aside).toEqual(['a.example']);
		state = decide(state, 'a.example', 'APPROVED');
		expect(state.aside).toEqual([]);
		expect(state.done.map((entry) => entry.name)).toEqual(['a.example']);
	});

	it('replaces an earlier decision instead of recording it twice', () => {
		let state = decide(createSession(QUEUE), 'a.example', 'APPROVED');
		state = decide(state, 'a.example', 'REJECTED', 'SPAM');
		expect(state.done).toHaveLength(1);
		expect(doneEntry(state, 'a.example')?.status).toBe('REJECTED');
	});

	it('holds the selection when the last pending domain is decided', () => {
		let state = createSession([item('only.example')]);
		state = decide(state, 'only.example', 'APPROVED');
		expect(state.pending).toEqual([]);
		// Nothing left to move to, so the decided domain stays on screen rather than blanking.
		expect(state.selected).toBe('only.example');
	});
});

describe('setAside', () => {
	it('parks the domain and advances', () => {
		const state = setAside(createSession(QUEUE), 'b.example');
		expect(state.pending).toEqual(['a.example', 'c.example', 'd.example']);
		expect(state.aside).toEqual(['b.example']);
		expect(state.selected).toBe('c.example');
		expect(state.last).toEqual({ kind: 'SET_ASIDE', name: 'b.example' });
	});

	it('does not park the same domain twice', () => {
		let state = setAside(createSession(QUEUE), 'b.example');
		state = undo(state, 'b.example');
		state = setAside(state, 'b.example');
		expect(state.aside).toEqual(['b.example']);
	});
});

describe('undo', () => {
	it('returns a decided domain to its original place in the queue', () => {
		let state = decide(createSession(QUEUE), 'b.example', 'APPROVED');
		expect(state.pending).toEqual(['a.example', 'c.example', 'd.example']);
		state = undo(state, 'b.example');
		// Back in position, not appended to the end.
		expect(state.pending).toEqual(['a.example', 'b.example', 'c.example', 'd.example']);
		expect(state.done).toEqual([]);
	});

	it('selects the restored domain on the pending tab', () => {
		let state = decide(createSession(QUEUE), 'a.example', 'APPROVED');
		state = setTab(state, 'done');
		state = undo(state, 'a.example');
		expect(state.selected).toBe('a.example');
		expect(state.tab).toBe('pending');
	});

	it('clears the undo line when it was the last action', () => {
		let state = decide(createSession(QUEUE), 'a.example', 'APPROVED');
		state = undo(state, 'a.example');
		expect(state.last).toBeNull();
	});

	it('leaves the undo line alone when undoing something else', () => {
		let state = decide(createSession(QUEUE), 'a.example', 'APPROVED');
		state = decide(state, 'b.example', 'REJECTED', 'SPAM');
		state = undo(state, 'a.example');
		expect(state.last).toEqual({ kind: 'REJECTED', name: 'b.example', reason: 'SPAM' });
	});

	it('brings a set-aside domain back too', () => {
		let state = setAside(createSession(QUEUE), 'c.example');
		state = undo(state, 'c.example');
		expect(state.aside).toEqual([]);
		expect(state.pending).toContain('c.example');
	});

	it('is harmless on a domain that is already pending', () => {
		const state = undo(createSession(QUEUE), 'a.example');
		expect(state.pending).toEqual(['a.example', 'b.example', 'c.example', 'd.example']);
	});
});

describe('rowsFor and statusOf', () => {
	it('shows each tab its own list', () => {
		let state = decide(createSession(QUEUE), 'a.example', 'APPROVED');
		state = setAside(state, 'b.example');

		expect(rowsFor(setTab(state, 'pending'))).toEqual(['c.example', 'd.example']);
		expect(rowsFor(setTab(state, 'aside'))).toEqual(['b.example']);
		expect(rowsFor(setTab(state, 'done'))).toEqual(['a.example']);
	});

	it('reports the chip each domain should carry', () => {
		let state = decide(createSession(QUEUE), 'a.example', 'REJECTED', 'SPAM');
		state = setAside(state, 'b.example');

		expect(statusOf(state, 'a.example')).toBe('REJECTED');
		expect(statusOf(state, 'b.example')).toBe('SET_ASIDE');
		expect(statusOf(state, 'c.example')).toBe('PENDING');
		expect(statusOf(state, null)).toBe('PENDING');
	});
});

describe('lastActionNote', () => {
	const label = (reason: string) => reason.toLowerCase();

	it('says nothing when nothing has happened', () => {
		expect(lastActionNote(null, label)).toBe('');
	});

	it('names the domain and the reason', () => {
		expect(lastActionNote({ kind: 'REJECTED', name: 'x.example', reason: 'SPAM' }, label)).toBe(
			'Rejected x.example — spam'
		);
		expect(lastActionNote({ kind: 'APPROVED', name: 'x.example' }, label)).toBe(
			'Approved x.example'
		);
		expect(lastActionNote({ kind: 'SET_ASIDE', name: 'x.example' }, label)).toBe(
			'Set aside x.example'
		);
	});
});

describe('emptyNote', () => {
	it('differs per tab', () => {
		expect(emptyNote('pending')).toContain('Queue clear');
		expect(emptyNote('aside')).toContain('set aside');
		expect(emptyNote('done')).toContain('No decisions');
	});
});

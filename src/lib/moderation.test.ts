import { describe, expect, it } from 'vitest';

import {
	auditFields,
	isTakeableRejection,
	pathSegments,
	rejectionDraft,
	submissionCount,
	submissionMeta,
	suggestedCall,
	whyFallback,
	whyLine,
	type QueueItem,
	type Suggestion
} from './moderation';

/**
 * A suggestion as the API actually sends one.
 *
 * Deliberately built by spreading overrides onto a base that has **no `reason_detail`**, because
 * that is the shape `SuggestionSchema` describes and the shape that took the review screen down:
 * the field was read as a `string`, `undefined.trim()` threw inside the reject dialog's own
 * render, and the moderator was left with the overlay up, no dialog on it, and Escape dead.
 * A fixture that helpfully filled the field in would test a payload that never arrives.
 */
function suggestion(overrides: Partial<Suggestion> = {}): Suggestion {
	return {
		action: 'REJECT',
		confidence: 0.9,
		reason: 'SPAM',
		reason_confidence: 0.8,
		reason_source: 'rule',
		model_version: 'v1',
		evidence: [],
		...overrides
	};
}

describe('rejectionDraft', () => {
	it('gives an empty detail when the suggestion has no reason_detail field', () => {
		expect(rejectionDraft(suggestion({ reason: 'OTHER' }))).toEqual({
			reason: 'OTHER',
			detail: ''
		});
	});

	it('puts the suggested reason under the cursor', () => {
		expect(rejectionDraft(suggestion({ reason: 'LANGUAGE' }))).toEqual({
			reason: 'LANGUAGE',
			detail: ''
		});
	});

	it('uses a detail the suggestion does carry', () => {
		const carried = suggestion({ reason: 'OTHER', reason_detail: 'Homepage returns HTTP 404' });
		expect(rejectionDraft(carried).detail).toBe('Homepage returns HTTP 404');
	});

	it('opens on SPAM for anything that is not a suggested rejection', () => {
		expect(rejectionDraft(null)).toEqual({ reason: 'SPAM', detail: '' });
		expect(rejectionDraft(undefined)).toEqual({ reason: 'SPAM', detail: '' });
		expect(rejectionDraft(suggestion({ action: 'APPROVE', reason: '' }))).toEqual({
			reason: 'SPAM',
			detail: ''
		});
		expect(rejectionDraft(suggestion({ action: 'UNSURE', reason: '' }))).toEqual({
			reason: 'SPAM',
			detail: ''
		});
		// A REJECT the API could not name a reason class for still opens on a usable one.
		expect(rejectionDraft(suggestion({ reason: '' }))).toEqual({ reason: 'SPAM', detail: '' });
	});
});

describe('isTakeableRejection', () => {
	it('refuses an OTHER with no detail, which is every OTHER the API sends', () => {
		expect(isTakeableRejection(suggestion({ reason: 'OTHER' }))).toBe(false);
	});

	it('refuses an OTHER whose detail is only whitespace', () => {
		expect(isTakeableRejection(suggestion({ reason: 'OTHER', reason_detail: '  ' }))).toBe(false);
	});

	it('takes an OTHER that does carry a detail', () => {
		expect(isTakeableRejection(suggestion({ reason: 'OTHER', reason_detail: 'Parked' }))).toBe(
			true
		);
	});

	it('takes any other reason, which needs no detail', () => {
		expect(isTakeableRejection(suggestion({ reason: 'SPAM' }))).toBe(true);
		expect(isTakeableRejection(suggestion({ reason: 'OFFENSIVE' }))).toBe(true);
	});

	it('refuses a rejection with no reason class at all', () => {
		expect(isTakeableRejection(suggestion({ reason: '' }))).toBe(false);
	});
});

describe('whyLine', () => {
	const evidence = (direction: string, label: string) => ({ kind: 'k', direction, label });

	it('is empty without a suggestion', () => {
		expect(whyLine(null)).toBe('');
	});

	it('leads with the facts that point the same way as the verdict', () => {
		const line = whyLine(
			suggestion({
				action: 'REJECT',
				evidence: [
					evidence('approve', 'Has an about page'),
					evidence('reject', 'Homepage returns HTTP 404'),
					evidence('reject', 'Keyword stuffing detected')
				]
			})
		);
		expect(line).toBe('Homepage returns HTTP 404 · Keyword stuffing detected');
	});

	it('falls back to whatever evidence there is when none of it agrees', () => {
		const line = whyLine(
			suggestion({ action: 'REJECT', evidence: [evidence('approve', 'Has an about page')] })
		);
		expect(line).toBe('Has an about page');
	});

	it('shows at most three facts', () => {
		const line = whyLine(
			suggestion({
				action: 'REJECT',
				evidence: [1, 2, 3, 4, 5].map((n) => evidence('reject', `fact ${n}`))
			})
		);
		expect(line).toBe('fact 1 · fact 2 · fact 3');
	});
});

describe('auditFields', () => {
	it('is all nulls when nothing was suggested', () => {
		expect(auditFields(null)).toEqual({
			suggested_status: null,
			suggested_reason: null,
			suggestion_confidence: null,
			suggestion_model_version: null
		});
	});

	it('records what the moderator was actually shown', () => {
		expect(auditFields(suggestion({ action: 'REJECT', reason: 'SPAM', confidence: 0.77 }))).toEqual(
			{
				suggested_status: 'REJECT',
				suggested_reason: 'SPAM',
				suggestion_confidence: 0.77,
				suggestion_model_version: 'v1'
			}
		);
	});

	it('nulls an empty reason rather than sending a blank string', () => {
		const fields = auditFields(suggestion({ action: 'APPROVE', reason: '', model_version: '' }));
		expect(fields.suggested_reason).toBeNull();
		expect(fields.suggestion_model_version).toBeNull();
	});
});

function queueItem(overrides: Partial<QueueItem> = {}): QueueItem {
	return {
		name: 'x.example',
		submission_count: 3,
		first_submitted_on: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		first_submitted_by: 7,
		first_submitted_by_username: 'mathilde',
		upvotes: 12,
		downvotes: 0,
		https: true,
		evidence_state: 'READY',
		pages: [],
		suggestion: null,
		...overrides
	};
}

describe('suggestedCall', () => {
	it('offers a suggested approval as one click', () => {
		expect(
			suggestedCall(queueItem({ suggestion: suggestion({ action: 'APPROVE', reason: '' }) }))
		).toEqual({ label: 'approve', act: 'approve', reason: '', detail: '' });
	});

	it('names the reason on a suggested rejection', () => {
		expect(
			suggestedCall(queueItem({ suggestion: suggestion({ action: 'REJECT', reason: 'LANGUAGE' }) }))
		).toEqual({
			label: 'reject as unsupported language',
			act: 'reject',
			reason: 'LANGUAGE',
			detail: ''
		});
	});

	it('sends the detail the suggestion carries, rather than an empty one the API refuses', () => {
		const call = suggestedCall(
			queueItem({ suggestion: suggestion({ reason: 'OTHER', reason_detail: 'Parked domain' }) })
		);
		expect(call).toEqual({
			label: 'reject as other',
			act: 'reject',
			reason: 'OTHER',
			detail: 'Parked domain'
		});
	});

	it('opens the drawer for an OTHER with no detail instead of sending a doomed decision', () => {
		// The bug this replaces: the button sent OTHER with no detail and the API answered 422.
		const call = suggestedCall(queueItem({ suggestion: suggestion({ reason: 'OTHER' }) }));
		expect(call?.act).toBe('openReject');
		expect(call?.reason).toBe('OTHER');
	});

	it('offers nothing when the index is unsure', () => {
		expect(
			suggestedCall(queueItem({ suggestion: suggestion({ action: 'UNSURE', reason: '' }) }))
		).toBe(null);
	});

	it('offers nothing without a suggestion, or without an item', () => {
		expect(suggestedCall(queueItem({ suggestion: null }))).toBe(null);
		expect(suggestedCall(undefined)).toBe(null);
	});

	it('offers nothing for a rejection with no reason class', () => {
		expect(suggestedCall(queueItem({ suggestion: suggestion({ reason: '' }) }))).toBe(null);
	});
});

describe('whyFallback', () => {
	it('says the domain is still being crawled', () => {
		expect(whyFallback(queueItem({ evidence_state: 'PENDING' }))).toContain('still being crawled');
	});

	it('says the crawl failed', () => {
		expect(whyFallback(queueItem({ evidence_state: 'FAILED' }))).toContain('crawl failed');
	});

	it('admits when the index is unsure, and still shows the facts', () => {
		const note = whyFallback(
			queueItem({
				suggestion: suggestion({
					action: 'UNSURE',
					evidence: [{ kind: 'k', direction: 'neutral', label: '118 pages' }]
				})
			})
		);
		expect(note).toBe('not sure — 118 pages');
	});

	it('is the plain why line for a real suggestion', () => {
		const note = whyFallback(
			queueItem({
				suggestion: suggestion({
					action: 'REJECT',
					evidence: [{ kind: 'k', direction: 'reject', label: 'Keyword stuffing' }]
				})
			})
		);
		expect(note).toBe('Keyword stuffing');
	});
});

describe('submissionCount', () => {
	it('drops the plural for a single submission', () => {
		expect(submissionCount(1)).toBe('1 submission');
	});

	it('keeps it for none or many', () => {
		expect(submissionCount(0)).toBe('0 submissions');
		expect(submissionCount(9)).toBe('9 submissions');
	});
});

describe('submissionMeta', () => {
	it('names who asked first and how long ago', () => {
		expect(submissionMeta(queueItem())).toBe('· first submitted 3 days ago by mathilde');
	});

	it('is empty without an item', () => {
		expect(submissionMeta(undefined)).toBe('');
	});
});

describe('pathSegments', () => {
	it('drops the scheme and the trailing slash', () => {
		expect(pathSegments('https://solarpunk.zone/notes/co-op-year-one')).toEqual([
			'solarpunk.zone',
			'notes',
			'co-op-year-one'
		]);
	});

	it('is just the host for a homepage', () => {
		expect(pathSegments('https://solarpunk.zone/')).toEqual(['solarpunk.zone']);
	});
});

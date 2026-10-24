import { describe, expect, it } from 'vitest';

import { isTakeableRejection, rejectionDraft, type Suggestion } from './moderation';

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

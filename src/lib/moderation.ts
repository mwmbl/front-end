/**
 * Types and helpers for the domain moderation queue.
 *
 * These mirror the schemas in mwmbl/platform/schemas.py. Two traps are worth keeping in
 * mind while reading the rest of this file:
 *
 *  - a suggestion's `action` is imperative (APPROVE) while a decision's `status` is past
 *    tense (APPROVED). Sending the wrong one back is a deliberate 422 from the API.
 *  - `direction` on an evidence item is lower case, `action` is upper case.
 */

export type EvidenceItem = {
	/** Machine-readable check name, e.g. `http_status`. */
	kind: string;
	/** `reject`, `approve` or `neutral` — lower case, unlike `action`. */
	direction: string;
	/** Moderator-facing text, e.g. "Homepage returns HTTP 404". */
	label: string;
};

export type Suggestion = {
	action: 'APPROVE' | 'REJECT' | 'UNSURE';
	confidence: number;
	/** Empty unless the action is REJECT. */
	reason: string;
	/**
	 * What the submitter would be told, sent straight back as `rejection_detail`.
	 *
	 * Optional, and in practice absent: `SuggestionSchema` has no such field. A suggestion names
	 * the reason class and stops there, so an OTHER never arrives with the sentence the API
	 * refuses the decision without — the moderator writes it. Declared here anyway, because the
	 * decision side does carry a `rejection_detail` and a suggestion that grows one should be
	 * used rather than ignored.
	 *
	 * Reading it as a plain `string` is what took the review screen down: `undefined.trim()`
	 * inside the reject dialog's own render, so the overlay went up and the dialog never did.
	 */
	reason_detail?: string;
	reason_confidence: number;
	/** `rule`, `model` or `derived` — `derived` is the weakest hint. */
	reason_source: string;
	model_version: string;
	evidence: EvidenceItem[];
};

export type CrawledPage = {
	url: string;
	status: number | null;
	title: string;
	extract: string;
	num_links: number;
	error: string;
};

export type QueueItem = {
	name: string;
	/** Pending submissions of this domain — one decision settles all of them. */
	submission_count: number;
	first_submitted_on: string;
	first_submitted_by: number;
	first_submitted_by_username: string;
	upvotes: number;
	downvotes: number;
	/** `null` until the domain has been crawled — an uncrawled domain draws no padlock. */
	https: boolean | null;
	evidence_state: 'PENDING' | 'READY' | 'FAILED';
	pages: CrawledPage[];
	/** Absent until the domain has been crawled. Never a placeholder. */
	suggestion: Suggestion | null;
};

export type ModerationQueue = {
	items: QueueItem[];
	/** Distinct pending *domains*, not submissions. */
	count: number;
};

export type DecisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * What a pill on this screen can say.
 *
 * `SKIPPED` is the screen's own state and nothing else: the API has no such status, a skip sends
 * no request, and a skipped domain stays `PENDING` server-side. It must never be sent back.
 */
export type PillStatus = DecisionStatus | 'SKIPPED';
export type RejectionReason = 'SPAM' | 'OFFENSIVE' | 'LANGUAGE' | 'OTHER';

/** What the moderator was shown, echoed back so the decision's audit trail is honest. */
export type SuggestionAudit = {
	suggested_status: string | null;
	suggested_reason: string | null;
	suggestion_confidence: number | null;
	suggestion_model_version: string | null;
};

export type Decision = SuggestionAudit & {
	domain: string;
	status: DecisionStatus;
	rejection_reason: string;
	rejection_detail: string;
};

/**
 * In shortcut order: 1 Spam, 2 Offensive, 3 Unsupported language, 4 Other.
 *
 * `label` is the reason's name and nothing else, because it is read back in sentences
 * ("Reject as other", "reason: other"). `hint` is only for the picker row.
 */
export const REJECTION_REASONS: Array<{
	value: RejectionReason;
	label: string;
	hint?: string;
}> = [
	{ value: 'SPAM', label: 'Spam' },
	{ value: 'OFFENSIVE', label: 'Offensive' },
	{ value: 'LANGUAGE', label: 'Unsupported language' },
	{ value: 'OTHER', label: 'Other', hint: 'needs detail' }
];

const REASON_LABELS = new Map(REJECTION_REASONS.map((r) => [r.value as string, r.label]));

/** "SPAM" as a moderator says it, for the button and the reviewed tray. */
export function reasonLabel(reason: string): string {
	return REASON_LABELS.get(reason)?.toLowerCase() ?? reason.toLowerCase();
}

export const API_ROOT = '/api/v1/platform/domain-submissions';

/** Rows per request. The queue carries whole cards, so a page is big but not huge. */
export const QUEUE_PAGE_SIZE = 50;

/**
 * The "suggested by the index — …" line.
 *
 * The API deliberately ships no natural-language explanation: it sends the checkable facts
 * and leaves the sentence to whoever is drawing the screen. Facts that point the same way
 * as the suggestion come first, since those are the ones that explain it.
 */
export function whyLine(suggestion: Suggestion | null): string {
	if (!suggestion) return '';
	const direction = suggestion.action.toLowerCase();
	const agreeing = suggestion.evidence.filter((item) => item.direction === direction);
	const items = agreeing.length > 0 ? agreeing : suggestion.evidence;
	return items
		.slice(0, 3)
		.map((item) => item.label)
		.join(' · ');
}

/**
 * The four audit fields for a decision.
 *
 * All null when nothing was suggested — recording an empty suggestion would claim the
 * moderator was shown one, and the whole point of these columns is measuring how much the
 * suggestions actually move decisions.
 */
export function auditFields(suggestion: Suggestion | null): SuggestionAudit {
	if (!suggestion) {
		return {
			suggested_status: null,
			suggested_reason: null,
			suggestion_confidence: null,
			suggestion_model_version: null
		};
	}
	return {
		suggested_status: suggestion.action,
		suggested_reason: suggestion.reason || null,
		suggestion_confidence: suggestion.confidence,
		suggestion_model_version: suggestion.model_version || null
	};
}

/**
 * What the reject dialog opens on for a domain.
 *
 * A suggested rejection puts its own reason under the cursor, so taking it is one more keystroke
 * rather than a hunt through the list. Anything else — an approval, an UNSURE, a rejection with
 * no reason class, no suggestion at all — opens on SPAM, which is what most rejections are.
 *
 * The detail is `?? ''` rather than `!` because the API does not send one; see `reason_detail`.
 */
export function rejectionDraft(suggestion: Suggestion | null | undefined): {
	reason: RejectionReason;
	detail: string;
} {
	if (suggestion?.action !== 'REJECT' || !suggestion.reason) {
		return { reason: 'SPAM', detail: '' };
	}
	return { reason: suggestion.reason as RejectionReason, detail: suggestion.reason_detail ?? '' };
}

/**
 * Whether a suggested rejection can be sent exactly as it stands.
 *
 * The API refuses a rejection carrying OTHER with no detail, and a suggestion has no detail to
 * give, so an OTHER always goes to the moderator for the sentence rather than being sent as a
 * decision that is refused — or worse, recorded with no reason at all.
 */
export function isTakeableRejection(suggestion: Suggestion): boolean {
	if (!suggestion.reason) return false;
	return suggestion.reason !== 'OTHER' || (suggestion.reason_detail ?? '').trim().length > 0;
}

/** A suggestion the moderator can take with one keystroke. UNSURE is not one. */
export function isActionable(item: QueueItem | undefined): boolean {
	const action = item?.suggestion?.action;
	return action === 'APPROVE' || action === 'REJECT';
}

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
	['year', 365 * 24 * 60 * 60 * 1000],
	['month', 30 * 24 * 60 * 60 * 1000],
	['day', 24 * 60 * 60 * 1000],
	['hour', 60 * 60 * 1000],
	['minute', 60 * 1000]
];

/** "3 days ago" — the card says when a domain was first asked for, not the timestamp. */
export function relativeTime(timestamp: string): string {
	const elapsed = new Date(timestamp).getTime() - Date.now();
	if (Number.isNaN(elapsed)) return '';
	for (const [unit, ms] of UNITS) {
		if (Math.abs(elapsed) >= ms) return RELATIVE.format(Math.round(elapsed / ms), unit);
	}
	return 'just now';
}

/** The path shown above a sample page's title, as breadcrumb segments. */
export function pathSegments(url: string): string[] {
	return url
		.replace(/.*:\/\//, '')
		.replace(/\/$/, '')
		.split('/')
		.filter((segment) => segment.length > 0);
}

/**
 * The three requests this screen makes.
 *
 * All of them go to the app's own `/api/...` path rather than to `API_BASE`: `hooks.server.ts`
 * proxies that prefix and attaches the moderator's access token on the way through, so the
 * browser never handles the token and a refresh mid-session is somebody else's problem.
 */

import {
	API_ROOT,
	auditFields,
	type Decision,
	type QueueItem,
	type Suggestion
} from './moderation';

export class ModerationError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'ModerationError';
	}
}

async function failure(response: Response, verb: string): Promise<ModerationError> {
	// The API answers 4xx with a JSON body naming the offending field; anything else (a proxy
	// error, an HTML error page) has nothing worth showing, so the status carries the message.
	let detail = '';
	try {
		const body = await response.json();
		detail = typeof body?.detail === 'string' ? body.detail : '';
	} catch {
		detail = '';
	}
	return new ModerationError(detail || `Could not ${verb} (${response.status}).`, response.status);
}

/**
 * Build the decision for one domain, with the audit columns filled from what was on screen.
 *
 * `suggestion` is the suggestion the moderator was actually shown, not a fresh one: the whole
 * point of those columns is measuring how far the suggestions move decisions.
 */
export function buildDecision(
	domain: string,
	status: 'APPROVED' | 'REJECTED',
	suggestion: Suggestion | null,
	rejection_reason = '',
	rejection_detail = ''
): Decision {
	return {
		domain,
		status,
		rejection_reason: status === 'REJECTED' ? rejection_reason : '',
		rejection_detail: status === 'REJECTED' ? rejection_detail : '',
		...auditFields(suggestion)
	};
}

/**
 * Send one decision.
 *
 * The endpoint takes a list because it exists to absorb a screenful at once, but this screen
 * commits each call as the moderator makes it — that is what makes the undo line honest, and
 * what stops a dropped connection losing an afternoon's work.
 */
export async function postDecision(fetcher: typeof fetch, decision: Decision): Promise<void> {
	const response = await fetcher(`${API_ROOT}/decisions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ decisions: [decision] })
	});
	if (!response.ok) throw await failure(response, 'record that decision');
}

/** Put every submission of a domain back to PENDING and clear the rejection fields. */
export async function postUndo(fetcher: typeof fetch, domain: string): Promise<void> {
	const response = await fetcher(`${API_ROOT}/domains/${encodeURIComponent(domain)}/undo`, {
		method: 'POST'
	});
	if (!response.ok) throw await failure(response, 'undo that decision');
}

/** Fetch a further page of the queue, for when the first screenful runs out. */
export async function fetchQueuePage(
	fetcher: typeof fetch,
	limit: number,
	offset: number
): Promise<{ items: QueueItem[]; count: number }> {
	const response = await fetcher(`${API_ROOT}/queue?limit=${limit}&offset=${offset}`);
	if (!response.ok) throw await failure(response, 'load more of the queue');
	return await response.json();
}

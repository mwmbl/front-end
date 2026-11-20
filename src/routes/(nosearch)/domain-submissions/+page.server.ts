
import type { Actions, Cookies } from '@sveltejs/kit';
import { API_BASE } from '$lib/api';
import { API_ROOT } from '$lib/moderation';

const pageSize = 500;

export type SubmissionsResult = {
	items: Array<{
		id: number;
		name: string;
		submitted_by: number;
		submitted_on: string;
		status: string;
		rejection_reason: string;
		rejection_detail: string;
	}>;
	count: number;
};

/**
 * How many domains are waiting to be moderated, or null if this user may not moderate.
 */
async function moderationPending(cookies: Cookies): Promise<number | null> {
	const res = await fetch(`${API_BASE}${API_ROOT}/queue?limit=1&offset=0`, {
		headers: { Authorization: 'Bearer ' + cookies.get('accessToken') }
	});

	if (!res.ok) return null;

	const queue: { count: number } = await res.json();
	return queue.count;
}

export async function load({ fetch, url, locals, cookies }) {
	const requestedPage = Number(url.searchParams.get('page') ?? 0);
	const page = Number.isInteger(requestedPage) && requestedPage >= 0
		? requestedPage
		: 0;

	const statusFilter = url.searchParams.get('status') ?? 'any';

	const offset = page * pageSize;

	const params = new URLSearchParams({
		limit: String(pageSize),
		offset: String(offset)
	});

	if (['APPROVED', 'REJECTED', 'PENDING'].includes(statusFilter)) {
		params.set('status', statusFilter);
	}

	const [response, moderatorPending] = await Promise.all([
		fetch(
			`${API_BASE}/api/v1/platform/domain-submissions?${params.toString()}`
		),
		locals.loginStatus === 'assumeLoggedIn'
			? moderationPending(cookies)
			: Promise.resolve(null)
	]);

	const submissions: SubmissionsResult = await response.json();

	return {
		submissions,
		page,
		maxPage: Math.max(0, Math.ceil(submissions.count / pageSize) - 1),
		filterStatus: statusFilter,
		status: locals.actionResult,
		moderatorPending
	};
}

export const actions: Actions = {
	submitDomain: async ({ request, cookies, locals }) => {
		const data = await request.formData();

		const res = await fetch(
			`${API_BASE}/api/v1/platform/domain-submissions/?domain=` +
				encodeURIComponent(String(data.get('domain') ?? '')),
			{
				method: 'POST',
				headers: {
					Authorization: 'Bearer ' + cookies.get('accessToken')
				}
			}
		);

		if (res.ok) {
			locals.actionResult = 'domainSubmitted';
		} else {
			locals.actionResult = 'domainSubmissionError';
		}
	}
};

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

export async function load({ fetch, url }) {
	const page = Number(url.searchParams.get('page'));
	const offset = page * pageSize;
	const response = await fetch(
		`https://api.mwmbl.org/api/v1/platform/domain-submissions?limit=${pageSize}&offset=${offset}`
	);
	const submissions: SubmissionsResult = await response.json();

	return {
		submissions,
		page,
		maxPage: Math.floor(submissions.count / pageSize)
	};
}
// export const actions: Actions = {
// 	submitDomain: async ({ cookies, locals }) => {}
// };

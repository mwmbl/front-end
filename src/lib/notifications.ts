// Notifications are fetched in the browser through the /api proxy, so they don't slow down page loads.

export type UserNotification = {
	id: number;
	kind: string;
	// Depends on kind: volunteer_membership_granted has tier and valid_until.
	data: Record<string, unknown>;
	created: string;
};

export type VolunteerTierInfo = { name: string; seedSearches: number };

// Mirrors the back end's VOLUNTEER_TIERS.
export const VOLUNTEER_TIERS: Record<string, VolunteerTierInfo> = {
	pollinator: { name: 'Pollinator', seedSearches: 300 }
};

export async function fetchNotifications(): Promise<UserNotification[]> {
	try {
		const res = await fetch('/api/v2/notifications/');
		if (res.ok) return await res.json();
	} catch (err) {
		console.log('Could not fetch notifications: ', err);
	}
	return [];
}

export function dismissNotification(id: number) {
	// keepalive lets the request finish if the user is navigating away, e.g. to the membership page.
	fetch(`/api/v2/notifications/${id}/dismiss`, { method: 'POST', keepalive: true }).catch((err) =>
		console.log('Could not dismiss notification: ', err)
	);
}

export type MonthContribution = { pages: number; days: number };

// Pages indexed, and days with any indexed, in the calendar month (UTC) the notification was created.
export async function fetchMonthContribution(created: string): Promise<MonthContribution | null> {
	try {
		const res = await fetch('/api/v1/platform/user/stats');
		if (!res.ok) return null;
		const stats: { results_indexed_daily: Record<string, number> } = await res.json();
		const month = new Date(created).toISOString().slice(0, 7);
		let pages = 0;
		let days = 0;
		for (const [date, count] of Object.entries(stats.results_indexed_daily ?? {})) {
			if (date.startsWith(month) && count > 0) {
				pages += count;
				days += 1;
			}
		}
		return days > 0 ? { pages, days } : null;
	} catch (err) {
		console.log('Could not fetch user stats: ', err);
		return null;
	}
}

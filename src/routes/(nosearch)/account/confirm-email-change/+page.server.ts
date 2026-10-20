import type { Actions } from './$types';
import { API_BASE as API } from '$lib/api';

export const actions: Actions = {
	// A button press rather than on load, so mail scanners that open links can't confirm.
	default: async ({ request }) => {
		const data = await request.formData();
		const res = await fetch(`${API}/api/v1/platform/user/email/confirm`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token: data.get('token') })
		});
		// Error pages from a proxy or a crash are not JSON.
		const json = await res.json().catch(() => ({}));
		if (!res.ok) {
			return { success: false, error: json.message ?? 'Failed to confirm your new email address.' };
		}
		return { success: true, email: json.email as string };
	}
};

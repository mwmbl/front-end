import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { API_BASE as API } from '$lib/api';

export type MembershipTierId = 'sprout' | 'sapling' | 'canopy';

export type MembershipTier = {
	tier: MembershipTierId;
	name: string;
	monthly_price_pence: number;
	perks: string[];
};

export type Membership = {
	tier: MembershipTierId;
	current_period_end: string | null;
	cancel_at_period_end: boolean;
};

// Mirrors the back end's tiers, used if /membership/tiers can't be reached.
const FALLBACK_TIERS: MembershipTier[] = [
	{
		tier: 'sprout',
		name: 'Sprout',
		monthly_price_pence: 100,
		perks: ['Access to the members area in Matrix and Discord']
	},
	{
		tier: 'sapling',
		name: 'Sapling',
		monthly_price_pence: 500,
		perks: ['Everything in Sprout', '1,000 Seed Search queries a month to enhance our index']
	},
	{
		tier: 'canopy',
		name: 'Canopy',
		monthly_price_pence: 2000,
		perks: [
			'Everything in Sapling',
			'A dedicated crawler, managed for you',
			'Your username on the crawler leaderboard'
		]
	}
];

async function getTiers(): Promise<MembershipTier[]> {
	try {
		const res = await fetch(`${API}/api/v1/platform/membership/tiers`);
		if (res.ok) return await res.json();
	} catch (err) {
		console.log('Could not fetch membership tiers: ', err);
	}
	return FALLBACK_TIERS;
}

async function getMembership(accessToken: string | undefined): Promise<Membership | null> {
	if (!accessToken) return null;
	try {
		const res = await fetch(`${API}/api/v1/platform/membership`, {
			headers: { Authorization: 'Bearer ' + accessToken }
		});
		if (res.ok) return await res.json();
	} catch (err) {
		console.log('Could not fetch membership: ', err);
	}
	return null;
}

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const loggedIn = locals.loginStatus === 'assumeLoggedIn';
	const [tiers, membership] = await Promise.all([
		getTiers(),
		loggedIn ? getMembership(cookies.get('accessToken')) : Promise.resolve(null)
	]);
	return { tiers, membership };
};

export const actions: Actions = {
	checkout: async ({ request, cookies, locals, url }) => {
		if (locals.loginStatus !== 'assumeLoggedIn') {
			redirect(303, '/account?next=/membership');
		}

		const data = await request.formData();
		const tier = data.get('tier');
		// Only set when JavaScript is running, in which case the checkout opens embedded in the page.
		const embedOrigin = data.get('embedOrigin') as string | null;

		const res = await fetch(`${API}/api/v1/platform/membership/checkout`, {
			method: 'POST',
			headers: {
				Authorization: 'Bearer ' + cookies.get('accessToken'),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				tier,
				success_url: `${url.origin}/membership?checkout=success`,
				...(embedOrigin ? { embed_origin: embedOrigin } : {})
			})
		});

		if (!res.ok) {
			let message = 'Could not start checkout. Please try again.';
			try {
				const json = await res.json();
				if (typeof json.message === 'string') message = json.message;
				else if (typeof json.detail === 'string') message = json.detail;
			} catch {
				// Keep the generic message
			}
			if (res.status === 403 && message === 'Email address is not verified') {
				message = 'Please confirm your email address before becoming a member.';
			}
			return fail(res.status, { error: message });
		}

		const { checkout_url: checkoutUrl } = await res.json();
		if (embedOrigin) {
			return { checkoutUrl: checkoutUrl as string };
		}
		redirect(303, checkoutUrl);
	}
};

import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { API_BASE as API } from '$lib/api';
import { fetchSeedSearchEnabled } from '$lib/seed-search';

export type MembershipTierId = 'sprout' | 'sapling' | 'canopy';

export type MembershipTier = {
	tier: MembershipTierId;
	name: string;
	monthly_price_pence: number;
	perks: string[];
};

export type Membership = {
	tier: MembershipTierId;
	name: string;
	current_period_end: string | null;
	cancel_at_period_end: boolean;
};

export type VolunteerTierId = 'pollinator';

// Earned by crawling rather than bought, so they're only shown to users who hold one.
export type VolunteerTier = {
	tier: VolunteerTierId;
	name: string;
	days_per_month: number;
	min_results_per_day: number;
	perks: string[];
};

export type VolunteerMembership = {
	tier: VolunteerTierId;
	name: string;
	// The last day it's valid (a date, no time), unless it's earned again before then.
	valid_until: string;
};

export type SeedSearchUsage = { monthly_usage: number; monthly_limit: number };

type MembershipV2 = {
	paid: Membership | null;
	volunteer: VolunteerMembership | null;
	combined_search: SeedSearchUsage;
};

// Mirrors the back end's tiers, used if /membership/tiers can't be reached.
const FALLBACK_TIERS: { paid: MembershipTier[]; volunteer: VolunteerTier[] } = {
	paid: [
		{
			tier: 'sprout',
			name: 'Sprout',
			monthly_price_pence: 100,
			perks: [
				'Access to the members area on Discord',
				'300 Seed Search queries a month to enhance our index'
			]
		},
		{
			tier: 'sapling',
			name: 'Sapling',
			monthly_price_pence: 500,
			perks: ['Everything in Sprout', '1,500 Seed Search queries a month to enhance our index']
		},
		{
			tier: 'canopy',
			name: 'Canopy',
			monthly_price_pence: 2000,
			perks: [
				'Everything in Sapling',
				'1 million pages a month crawled against your username',
				'Your username on the crawler leaderboard'
			]
		}
	],
	volunteer: [
		{
			tier: 'pollinator',
			name: 'Pollinator',
			days_per_month: 3,
			min_results_per_day: 100,
			perks: [
				'Access to the members area on Discord',
				'300 Seed Search queries a month to enhance our index'
			]
		}
	]
};

async function getTiers(): Promise<typeof FALLBACK_TIERS> {
	try {
		const res = await fetch(`${API}/api/v2/membership/tiers`);
		if (res.ok) return await res.json();
	} catch (err) {
		console.log('Could not fetch membership tiers: ', err);
	}
	return FALLBACK_TIERS;
}

async function getMembership(accessToken: string | undefined): Promise<MembershipV2 | null> {
	if (!accessToken) return null;
	try {
		const res = await fetch(`${API}/api/v2/membership/`, {
			headers: { Authorization: 'Bearer ' + accessToken }
		});
		if (res.ok) return await res.json();
	} catch (err) {
		console.log('Could not fetch membership: ', err);
	}
	return null;
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
	try {
		const json = await res.json();
		if (typeof json.message === 'string') return json.message;
		if (typeof json.detail === 'string') return json.detail;
	} catch {
		// Keep the fallback message
	}
	return fallback;
}

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const loggedIn = locals.loginStatus === 'assumeLoggedIn';
	const accessToken = cookies.get('accessToken');
	const [tiers, membership, seedSearchEnabled] = await Promise.all([
		getTiers(),
		loggedIn ? getMembership(accessToken) : Promise.resolve(null),
		loggedIn ? fetchSeedSearchEnabled(cookies) : Promise.resolve(false)
	]);
	const volunteer = membership?.volunteer ?? null;
	return {
		tiers: tiers.paid,
		membership: membership?.paid ?? null,
		volunteer,
		// Only the tier the user holds: volunteer tiers aren't advertised to anyone else.
		volunteerTier: volunteer
			? (tiers.volunteer.find((t) => t.tier === volunteer.tier) ?? null)
			: null,
		seedSearchUsage: membership?.combined_search ?? null,
		seedSearchEnabled
	};
};

// Posts to one of the endpoints that change an existing membership.
async function updateMembership(
	path: 'change' | 'cancel' | 'uncancel',
	accessToken: string | undefined,
	body: object | undefined,
	failure: string
) {
	const res = await fetch(`${API}/api/v1/platform/membership/${path}`, {
		method: 'POST',
		headers: {
			Authorization: 'Bearer ' + accessToken,
			...(body ? { 'Content-Type': 'application/json' } : {})
		},
		body: body ? JSON.stringify(body) : undefined
	});
	if (!res.ok) {
		return fail(res.status, { error: await errorMessage(res, failure) });
	}
	return { updated: path };
}

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
			let message = await errorMessage(res, 'Could not start checkout. Please try again.');
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
	},

	change: async ({ request, cookies, locals }) => {
		if (locals.loginStatus !== 'assumeLoggedIn') redirect(303, '/account?next=/membership');
		const tier = (await request.formData()).get('tier');
		return updateMembership(
			'change',
			cookies.get('accessToken'),
			{ tier },
			'Could not change your membership. Please try again.'
		);
	},

	cancel: async ({ cookies, locals }) => {
		if (locals.loginStatus !== 'assumeLoggedIn') redirect(303, '/account?next=/membership');
		return updateMembership(
			'cancel',
			cookies.get('accessToken'),
			undefined,
			'Could not cancel your membership. Please try again.'
		);
	},

	uncancel: async ({ cookies, locals }) => {
		if (locals.loginStatus !== 'assumeLoggedIn') redirect(303, '/account?next=/membership');
		return updateMembership(
			'uncancel',
			cookies.get('accessToken'),
			undefined,
			'Could not keep your membership. Please try again.'
		);
	}
};

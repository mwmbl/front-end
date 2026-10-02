<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { mode } from 'mode-watcher';
	import { Button } from '@/components/ui/button';
	import BottomLinks from '@/components/custom/brand/BottomLinks.svelte';

	import RiCheckLine from '~icons/ri/check-line';
	import RiSeedlingLine from '~icons/ri/seedling-line';
	import RiPlantLine from '~icons/ri/plant-line';
	import RiTreeLine from '~icons/ri/tree-line';
	import RiLoader4Line from '~icons/ri/loader-4-line';

	import type { MembershipTierId } from './+page.server';

	let { data, form } = $props();

	const icons: Record<MembershipTierId, typeof RiPlantLine> = {
		sprout: RiSeedlingLine,
		sapling: RiPlantLine,
		canopy: RiTreeLine
	};
	const popularTier: MembershipTierId = 'sapling';
	// Phrases picked out in bold wherever they appear in a perk.
	const highlights = ['1,000 Active Discovery queries', 'dedicated crawler'];

	function perkParts(perk: string): { text: string; bold: boolean }[] {
		const phrase = highlights.find((h) => perk.includes(h));
		if (!phrase) return [{ text: perk, bold: false }];
		const [before, after] = perk.split(phrase);
		return [
			{ text: before, bold: false },
			{ text: phrase, bold: true },
			{ text: after, bold: false }
		];
	}

	function formatPrice(pence: number): string {
		return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
	}

	const loggedIn = $derived(data.loginStatus === 'assumeLoggedIn');
	const membership = $derived(data.membership);
	const memberTierName = $derived(
		membership ? data.tiers.find((t) => t.tier === membership.tier)?.name : undefined
	);
	const justPaid = $derived(page.url.searchParams.get('checkout') === 'success');

	let pendingTier = $state<MembershipTierId | null>(null);
	let checkoutError = $state<string | null>(null);
	const error = $derived(checkoutError ?? form?.error ?? null);

	// The membership is recorded when Polar's webhook arrives, which can lag the checkout redirect,
	// so poll for it for a little while.
	let waitingForWebhook = $state(false);
	onMount(() => {
		if (!justPaid || data.membership) return;
		waitingForWebhook = true;
		let attempts = 0;
		const poll = setInterval(async () => {
			attempts++;
			await invalidateAll();
			if (data.membership || attempts >= 10) {
				clearInterval(poll);
				waitingForWebhook = false;
				if (data.membership) goto('/membership', { replaceState: true, invalidateAll: false });
			}
		}, 2000);
		return () => clearInterval(poll);
	});

	async function openEmbeddedCheckout(checkoutUrl: string) {
		try {
			const { PolarEmbedCheckout } = await import('@polar-sh/checkout/embed');
			const checkout = await PolarEmbedCheckout.create(checkoutUrl, {
				theme: mode.current === 'dark' ? 'dark' : 'light'
			});
			checkout.addEventListener('success', (event) => {
				event.preventDefault();
				checkout.close();
				window.location.href = '/membership?checkout=success';
			});
		} catch {
			window.location.href = checkoutUrl;
		}
	}
</script>

<svelte:head>
	<title>Become a member – Mwmbl</title>
</svelte:head>

<div class="membership-page flex flex-col">
	<section
		class="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 pt-10 text-center sm:px-8 sm:pt-16"
	>
		{#if waitingForWebhook}
			<span class="pill">
				<RiLoader4Line class="animate-spin" /> Thank you! Setting up your membership…
			</span>
		{:else if membership}
			<span class="pill"><RiCheckLine class="check" /> You're a {memberTierName} member</span>
		{:else if justPaid}
			<span class="pill">
				<RiCheckLine class="check" /> Thank you! Your membership will appear here shortly
			</span>
		{:else if loggedIn}
			<span class="pill"><RiCheckLine class="check" /> Your account is ready</span>
		{/if}
		<h1 class="text-4xl leading-snug! font-bold text-balance md:text-5xl lg:text-6xl">
			We need you to help Mwmbl grow
		</h1>
		<p class="text-unemphasized-2 text-lg text-pretty sm:text-xl">
			Members are our roots, supporting ethical, free search — built in the open, by and for the
			people who use it.
		</p>
	</section>

	<main class="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8 sm:pb-16">
		<div class="text-unemphasized-2 mt-16 mb-6 text-center text-sm font-semibold tracking-[0.12em]">
			PLANT YOUR SUPPORT
		</div>

		{#if error}
			<div role="alert" class="bg-card text-destructive mb-6 rounded-2xl p-4 text-center">
				{error}
			</div>
		{/if}

		<section
			class="grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-6"
			aria-label="Membership levels"
		>
			{#each data.tiers as tier (tier.tier)}
				{@const Icon = icons[tier.tier] ?? RiPlantLine}
				{@const popular = tier.tier === popularTier}
				{@const current = membership?.tier === tier.tier}
				<article class="tier bg-card flex flex-col gap-6 rounded-2xl p-6 sm:p-8" class:popular>
					<div class="flex items-center gap-4">
						<span class="tier-icon"><Icon /></span>
						<h2 class="font-display text-2xl font-bold">{tier.name}</h2>
						{#if current}
							<span class="chip">Your level</span>
						{:else if popular && !membership}
							<span class="chip">Popular</span>
						{/if}
					</div>
					<div class="flex items-baseline gap-2">
						<b class="font-display text-5xl leading-none font-extrabold">
							{formatPrice(tier.monthly_price_pence)}
						</b>
						<span class="text-unemphasized-2 text-lg">/ month</span>
					</div>
					<ul class="flex flex-1 flex-col gap-4">
						{#each tier.perks as perk}
							<li class="grid grid-cols-[1.25rem_1fr] gap-3 text-lg leading-[1.45] text-pretty">
								<RiCheckLine class="check mt-0.5 size-5" />
								<span>
									{#each perkParts(perk) as part}
										{#if part.bold}<b class="font-bold">{part.text}</b>{:else}{part.text}{/if}
									{/each}
								</span>
							</li>
						{/each}
					</ul>
					{#if membership}
						<Button variant="secondary" class="cta" disabled>
							{current ? 'Your current level' : `Join as ${tier.name}`}
						</Button>
					{:else if !loggedIn}
						<Button
							variant="secondary"
							class={popular ? 'cta cta-gradient' : 'cta'}
							href="/account?next=/membership"
						>
							Join as {tier.name}
						</Button>
					{:else}
						<form
							method="post"
							action="?/checkout"
							use:enhance={({ formData }) => {
								formData.set('embedOrigin', window.location.origin);
								pendingTier = tier.tier;
								checkoutError = null;
								return async ({ result, update }) => {
									if (result.type === 'success' && result.data?.checkoutUrl) {
										await openEmbeddedCheckout(result.data.checkoutUrl as string);
									} else if (result.type === 'failure') {
										checkoutError = (result.data?.error as string) ?? null;
									} else {
										await update();
									}
									pendingTier = null;
								};
							}}
						>
							<input type="hidden" name="tier" value={tier.tier} />
							<Button
								type="submit"
								variant="secondary"
								class={popular ? 'cta cta-gradient w-full' : 'cta w-full'}
								disabled={pendingTier !== null}
							>
								{#if pendingTier === tier.tier}
									<RiLoader4Line class="animate-spin" />
								{/if}
								Join as {tier.name}
							</Button>
						</form>
					{/if}
				</article>
			{/each}
		</section>

		<div class="mt-10 flex flex-col items-center gap-6 text-center">
			{#if membership?.cancel_at_period_end && membership.current_period_end}
				<p class="text-unemphasized-2 max-w-2xl text-lg text-pretty">
					Your membership ends on {new Date(membership.current_period_end).toLocaleDateString()}.
				</p>
			{/if}
			<p class="text-unemphasized-2 max-w-2xl text-lg text-pretty">
				Cancel anytime. Mwmbl stays free for everyone — membership keeps it independent and ad-free.
				All funds go to support the development of free search through the non-profit Mwmbl
				Foundation.
			</p>
			<a href="/" class="link text-lg font-medium underline underline-offset-4">
				{membership ? 'Take me to search' : 'Not now — take me to search'}
			</a>
		</div>
	</main>
</div>

<footer class="mt-auto flex justify-center px-8 pb-8">
	<BottomLinks />
</footer>

<style>
	/* Sage ground with flag-green accents. Set on the root so the page background and header pick it up. */
	:global(:root:has(.membership-page)) {
		--background: oklch(0.955 0.02 145);
		--secondary: oklch(0.9 0.035 145);
		--muted: oklch(0.9 0.035 145);
		--border: oklch(0.9 0.03 145);

		--mv-green: #009639;
		--mv-green-soft: oklch(0.94 0.045 150);
		--mv-check: #009639;
		--mv-link: #007a2e;
		--mv-chip-fg: #fff;
		--mv-grad: linear-gradient(
			in oklab 130deg,
			oklch(0.94 0.1 105),
			oklch(0.86 0.14 130),
			oklch(0.78 0.15 150)
		);
	}
	:global(:root.dark:has(.membership-page)) {
		--background: oklch(0.2 0.015 150);
		--card: oklch(0.25 0.02 150);
		--secondary: oklch(0.32 0.03 150);
		--muted: oklch(0.32 0.03 150);
		--border: oklch(0.3 0.02 150);

		--mv-green-soft: oklch(0.32 0.06 150);
		--mv-check: oklch(0.72 0.16 150);
		--mv-link: oklch(0.8 0.13 150);
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--card);
		border-radius: 1rem;
		padding: 0.375rem 1rem;
		font-weight: 500;
		color: var(--unemphasized-2);
	}
	.membership-page :global(.check) {
		color: var(--mv-check);
	}
	.link {
		color: var(--mv-link);
	}

	.tier {
		border: 2px solid transparent;
	}
	.tier.popular {
		border-color: var(--mv-green);
		box-shadow:
			0 10px 15px -3px hsl(0 0% 0% / 0.1),
			0 4px 6px -4px hsl(0 0% 0% / 0.1);
	}

	.tier-icon {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		flex-shrink: 0;
		border-radius: 1rem;
		background: var(--mv-green-soft);
		color: var(--mv-green);
		font-size: 1.5rem;
	}
	.popular .tier-icon {
		background-image: var(--mv-grad);
		background-color: hsl(220 8% 95% / 0.6);
		background-blend-mode: lighten;
	}
	:global(.dark) .popular .tier-icon {
		color: #000;
		background-color: hsl(220 8% 95% / 0.15);
	}

	.chip {
		margin-left: auto;
		border-radius: 1rem;
		padding: 0.25rem 0.75rem;
		background: var(--mv-green);
		color: var(--mv-chip-fg);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.tier :global(.cta) {
		width: 100%;
		height: 3rem;
		font-size: 1.125rem;
	}
	.tier :global(.cta:not(.cta-gradient):hover) {
		opacity: 0.8;
	}
	.tier :global(.cta-gradient) {
		background-image: var(--mv-grad);
		color: #000;
		transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.tier :global(.cta-gradient:hover) {
		transform: scale(1.03);
	}
</style>

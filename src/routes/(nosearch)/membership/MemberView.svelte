<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button } from '@/components/ui/button';
	import { Switch } from '@/components/ui/switch';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';

	import RiCheckLine from '~icons/ri/check-line';
	import RiSearchLine from '~icons/ri/search-line';
	import RiDiscordLine from '~icons/ri/discord-line';
	import RiGlobalLine from '~icons/ri/global-line';
	import RiArrowRightLine from '~icons/ri/arrow-right-line';
	import RiExternalLinkLine from '~icons/ri/external-link-line';
	import RiLoader4Line from '~icons/ri/loader-4-line';

	import type { Membership, MembershipTier, SeedSearchUsage } from './+page.server';
	import { formatPrice, perkParts, tierIcons } from './tiers';

	// Members connect their Discord account from Polar's customer portal, which grants the members role.
	const POLAR_PORTAL_URL = 'https://polar.sh/mwmbl-foundation/portal';
	const DISCORD_URL = 'https://discord.gg/2BGSUYFdkD';

	let {
		data,
		membership,
		form
	}: {
		data: {
			tiers: MembershipTier[];
			seedSearchUsage: SeedSearchUsage | null;
			seedSearchEnabled: boolean;
		};
		membership: Membership;
		form: { error?: string } | null;
	} = $props();

	const tier = $derived(data.tiers.find((t) => t.tier === membership.tier));
	const TierIcon = $derived(tierIcons[membership.tier]);
	const cancelling = $derived(membership.cancel_at_period_end);
	const usage = $derived(data.seedSearchUsage);
	const quotaExhausted = $derived(!!usage && usage.monthly_usage >= usage.monthly_limit);
	const canUpgrade = $derived(
		!!tier && data.tiers.some((t) => t.monthly_price_pence > tier.monthly_price_pence)
	);

	function formatDate(iso: string | null): string | null {
		if (!iso) return null;
		return new Date(iso).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		});
	}
	const periodEnd = $derived(formatDate(membership.current_period_end));

	let actionError = $state<string | null>(null);
	const error = $derived(actionError ?? form?.error ?? null);

	let submitting = $state(false);
	let changeTo = $state<MembershipTier | null>(null);
	let cancelOpen = $state(false);
	const upgrading = $derived(
		!!changeTo && !!tier && changeTo.monthly_price_pence > tier.monthly_price_pence
	);

	const submit: SubmitFunction = () => {
		submitting = true;
		actionError = null;
		return async ({ result, update }) => {
			if (result.type === 'failure') {
				actionError = (result.data?.error as string) ?? 'Something went wrong. Please try again.';
			}
			await update();
			submitting = false;
			changeTo = null;
			cancelOpen = false;
		};
	};

	// Seeded from the props so the server render shows the right position; kept in sync afterwards.
	let seedSearchOn = $state(untrack(() => data.seedSearchEnabled && !quotaExhausted));
	$effect.pre(() => {
		seedSearchOn = data.seedSearchEnabled && !quotaExhausted;
	});
	let savingSeedSearch = $state(false);
	async function onSeedSearchChange(value: boolean) {
		savingSeedSearch = true;
		try {
			const res = await fetch('/seed-search', {
				method: 'POST',
				// The Accept header routes this to +server.ts rather than the /seed-search page.
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({ enabled: value })
			});
			if (!res.ok) seedSearchOn = !value;
			await invalidateAll();
		} catch (err) {
			console.log('Saving Seed Search setting failed: ', err);
			seedSearchOn = !value;
		} finally {
			savingSeedSearch = false;
		}
	}
</script>

<section
	class="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 pt-10 text-center sm:px-8 sm:pt-16"
>
	<span class="hero-icon" class:ending={cancelling}><TierIcon /></span>
	{#if cancelling}
		<h1 class="text-4xl leading-snug! font-bold text-balance md:text-5xl">
			Your {tier?.name} membership {periodEnd ? `ends on ${periodEnd}` : 'is ending'}
		</h1>
		<p class="text-unemphasized-2 text-lg text-pretty sm:text-xl">
			Your perks stay active until then. Changed your mind? Keep your membership and it will renew
			as normal{tier ? ` at ${formatPrice(tier.monthly_price_pence)} a month` : ''}.
		</p>
		<form method="post" action="?/uncancel" use:enhance={submit}>
			<Button type="submit" variant="secondary" class="cta cta-gradient" disabled={submitting}>
				{#if submitting}<RiLoader4Line class="animate-spin" />{/if}
				Keep my membership
			</Button>
		</form>
	{:else}
		<h1 class="text-4xl leading-snug! font-bold text-balance md:text-5xl lg:text-6xl">
			You're a {tier?.name} member
		</h1>
		<p class="text-unemphasized-2 text-lg text-pretty sm:text-xl">
			Thank you for supporting free, independent search. Your membership keeps the crawler running
			and the index growing.
		</p>
		{#if tier || periodEnd}
			<span class="pill">
				{#if tier}<span>{formatPrice(tier.monthly_price_pence)} / month</span>{/if}
				{#if tier && periodEnd}<span aria-hidden="true">·</span>{/if}
				{#if periodEnd}<span>Renews on {periodEnd}</span>{/if}
			</span>
		{/if}
	{/if}
</section>

<main class="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8 sm:pb-16">
	{#if error}
		<div role="alert" class="bg-card text-destructive mt-10 rounded-2xl p-4 text-center">
			{error}
		</div>
	{/if}

	<h2 class="section-label mt-16 mb-6">
		{cancelling && periodEnd ? `YOUR PERKS UNTIL ${periodEnd.toUpperCase()}` : 'YOUR PERKS'}
	</h2>

	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-6">
		<article class="bg-card flex flex-col gap-5 rounded-2xl p-6 sm:p-8">
			<div class="flex items-center gap-4">
				<span class="tile"><RiSearchLine /></span>
				<h3 class="font-display flex-1 text-2xl font-bold">Seed Search</h3>
				<div class="flex items-center gap-2">
					<label for="member-seed-search" class="text-unemphasized-2 font-medium">
						{seedSearchOn ? 'On' : 'Off'}
					</label>
					<Switch
						id="member-seed-search"
						bind:checked={seedSearchOn}
						onCheckedChange={onSeedSearchChange}
						disabled={quotaExhausted || savingSeedSearch}
						class="data-[state=checked]:bg-brand-gradient"
					/>
				</div>
			</div>
			<p class="text-pretty">
				Searches the wider web alongside Mwmbl's own index and adds the pages it finds, so the index
				grows with every query you make.
			</p>
			{#if usage}
				<div class="panel flex flex-col gap-2.5 rounded-xl p-5">
					<div class="flex flex-wrap items-baseline justify-between gap-3">
						<span>
							<b class="font-display text-3xl font-extrabold">
								{usage.monthly_usage.toLocaleString('en-GB')}
							</b>
							<span class="text-unemphasized-2">
								of {usage.monthly_limit.toLocaleString('en-GB')} queries used this month
							</span>
						</span>
						<span class="link font-semibold">
							{Math.max(usage.monthly_limit - usage.monthly_usage, 0).toLocaleString('en-GB')} left
						</span>
					</div>
					<div
						class="meter"
						role="progressbar"
						aria-label="Seed Search queries used"
						aria-valuemin={0}
						aria-valuemax={usage.monthly_limit}
						aria-valuenow={usage.monthly_usage}
					>
						<div
							style:width="{Math.min(
								100,
								(usage.monthly_usage / Math.max(usage.monthly_limit, 1)) * 100
							)}%"
						></div>
					</div>
					{#if quotaExhausted}
						<p class="text-unemphasized-2 text-sm">
							You've used all your queries this month.
							{#if canUpgrade && !cancelling}
								<a href="#change-level" class="link font-semibold underline">Upgrade for more</a>
							{/if}
						</p>
					{/if}
				</div>
			{/if}
			<a href="/seed-search" class="link mt-auto inline-flex items-center gap-1.5 font-semibold">
				How Seed Search works <RiArrowRightLine />
			</a>
		</article>

		<article class="bg-card flex flex-col gap-5 rounded-2xl p-6 sm:p-8">
			<div class="flex items-center gap-4">
				<span class="tile"><RiDiscordLine /></span>
				<h3 class="font-display flex-1 text-2xl font-bold">Members' Discord</h3>
			</div>
			<p class="text-pretty">
				Chat with the team and other members in our members-only Discord channels. Connect your
				Discord account through Polar, who handle our payments, and you'll get access automatically.
			</p>
			<ol class="panel flex list-decimal flex-col gap-1.5 rounded-xl py-4 pr-5 pl-10">
				<li>Sign in to Polar with the email address you joined with.</li>
				<li>Under <b>Benefits</b>, choose <b>Connect Discord</b>.</li>
			</ol>
			<div class="mt-auto flex flex-wrap gap-3">
				<Button
					href={POLAR_PORTAL_URL}
					target="_blank"
					rel="noopener"
					class="action primary min-w-40 flex-1"
				>
					Connect Discord <RiExternalLinkLine />
				</Button>
				<Button
					href={DISCORD_URL}
					target="_blank"
					rel="noopener"
					variant="secondary"
					class="action min-w-40 flex-1"
				>
					Open Discord
				</Button>
			</div>
		</article>

		{#if membership.tier === 'canopy'}
			<article class="bg-card flex flex-col gap-5 rounded-2xl p-6 sm:p-8">
				<div class="flex items-center gap-4">
					<span class="tile"><RiGlobalLine /></span>
					<h3 class="font-display flex-1 text-2xl font-bold">Crawling</h3>
				</div>
				<p class="text-pretty">
					We'll set up <b>1 million pages</b> a month of crawling against your username, and you'll appear
					on the crawler leaderboard. There's nothing you need to do.
				</p>
				<a href="/stats" class="link mt-auto inline-flex items-center gap-1.5 font-semibold">
					See the leaderboard <RiArrowRightLine />
				</a>
			</article>
		{/if}
	</div>

	{#if !cancelling}
		<h2 id="change-level" class="section-label mt-16 mb-2 scroll-mt-8">CHANGE YOUR LEVEL</h2>
		<p class="text-unemphasized-2 mx-auto mb-6 max-w-xl text-center text-pretty">
			Changes take effect straight away. Your next invoice is adjusted for the rest of this billing
			period.
		</p>

		<section
			class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-6"
			aria-label="Membership levels"
		>
			{#each data.tiers as t (t.tier)}
				{@const Icon = tierIcons[t.tier]}
				{@const current = t.tier === membership.tier}
				{@const higher = !!tier && t.monthly_price_pence > tier.monthly_price_pence}
				<article class="tier bg-card flex flex-col gap-5 rounded-2xl p-6 sm:p-7" class:current>
					<div class="flex items-center gap-3.5">
						<span class="tile"><Icon /></span>
						<h3 class="font-display flex-1 text-2xl font-bold">{t.name}</h3>
						{#if current}<span class="chip">Your level</span>{/if}
					</div>
					<div class="flex items-baseline gap-2">
						<b class="font-display text-4xl leading-none font-extrabold">
							{formatPrice(t.monthly_price_pence)}
						</b>
						<span class="text-unemphasized-2">/ month</span>
					</div>
					<ul class="flex flex-1 flex-col gap-3">
						{#each t.perks as perk}
							<li class="grid grid-cols-[1.25rem_1fr] gap-2.5 leading-[1.45] text-pretty">
								<RiCheckLine class="check mt-0.5 size-5" />
								<span>
									{#each perkParts(perk) as part}
										{#if part.bold}<b class="font-bold">{part.text}</b>{:else}{part.text}{/if}
									{/each}
								</span>
							</li>
						{/each}
					</ul>
					{#if current}
						<Button variant="secondary" class="action" disabled>Your current level</Button>
					{:else}
						<Button
							variant="secondary"
							class={higher ? 'action cta-gradient' : 'action'}
							onclick={() => (changeTo = t)}
						>
							{higher ? 'Upgrade' : 'Downgrade'} to {t.name}
						</Button>
					{/if}
				</article>
			{/each}
		</section>

		<div class="mt-14 flex flex-col items-center gap-1 text-center">
			<button
				type="button"
				class="text-unemphasized-2 cursor-pointer px-3 py-2.5 font-medium underline underline-offset-4"
				onclick={() => (cancelOpen = true)}
			>
				Cancel membership
			</button>
			{#if periodEnd}
				<span class="text-unemphasized-2 text-sm">You'll keep your perks until {periodEnd}.</span>
			{/if}
		</div>
	{/if}
</main>

<AlertDialog.Root
	open={changeTo !== null}
	onOpenChange={(open) => {
		if (!open && !submitting) changeTo = null;
	}}
>
	<AlertDialog.Content class="bg-card rounded-2xl">
		<AlertDialog.Header>
			<AlertDialog.Title class="font-display text-2xl font-bold">
				{upgrading ? 'Upgrade' : 'Downgrade'} to {changeTo?.name}?
			</AlertDialog.Title>
			<AlertDialog.Description class="text-base">
				You'll move from {tier?.name}{tier
					? ` (${formatPrice(tier.monthly_price_pence)} a month)`
					: ''}
				to {changeTo?.name}{changeTo
					? ` (${formatPrice(changeTo.monthly_price_pence)} a month)`
					: ''}
				straight away. Your next invoice will be adjusted for the rest of this billing period.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={submitting}>Not now</AlertDialog.Cancel>
			<form method="post" action="?/change" use:enhance={submit} class="max-sm:w-full">
				<input type="hidden" name="tier" value={changeTo?.tier} />
				<AlertDialog.Action type="submit" class="confirm max-sm:w-full" disabled={submitting}>
					{#if submitting}<RiLoader4Line class="animate-spin" />{/if}
					{upgrading ? 'Upgrade' : 'Downgrade'} to {changeTo?.name}
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root
	open={cancelOpen}
	onOpenChange={(open) => {
		if (!submitting) cancelOpen = open;
	}}
>
	<AlertDialog.Content class="bg-card rounded-2xl">
		<AlertDialog.Header>
			<AlertDialog.Title class="font-display text-2xl font-bold">
				Cancel your membership?
			</AlertDialog.Title>
			<AlertDialog.Description class="text-base">
				Your {tier?.name} membership will end {periodEnd
					? `on ${periodEnd}`
					: 'at the end of this billing period'}, and you won't be charged again. You'll keep your
				perks until then.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={submitting}>Keep membership</AlertDialog.Cancel>
			<form method="post" action="?/cancel" use:enhance={submit} class="max-sm:w-full">
				<AlertDialog.Action
					type="submit"
					class="bg-destructive hover:bg-destructive/90 text-white max-sm:w-full"
					disabled={submitting}
				>
					{#if submitting}<RiLoader4Line class="animate-spin" />{/if}
					Cancel membership
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<style>
	.hero-icon {
		display: grid;
		place-items: center;
		width: 5rem;
		height: 5rem;
		border-radius: 1.5rem;
		font-size: 2.5rem;
		color: #0b3d1c;
		background-image: var(--mv-grad);
	}
	.hero-icon.ending {
		background: var(--card);
		color: var(--unemphasized-2);
	}

	.pill {
		display: inline-flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem 1rem;
		background: var(--card);
		border-radius: 999px;
		padding: 0.5rem 1.125rem;
		font-weight: 500;
		color: var(--unemphasized-2);
	}

	.section-label {
		text-align: center;
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		color: var(--unemphasized-2);
	}

	.tile {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		flex-shrink: 0;
		border-radius: 1rem;
		background: var(--mv-green-soft);
		color: var(--mv-link);
		font-size: 1.5rem;
	}

	.panel {
		background: var(--mv-panel);
	}

	.meter {
		height: 0.625rem;
		border-radius: 999px;
		background: var(--secondary);
		overflow: hidden;
	}
	.meter > div {
		height: 100%;
		border-radius: 999px;
		background: var(--mv-check);
	}

	.link {
		color: var(--mv-link);
	}
	main :global(.check) {
		color: var(--mv-check);
	}

	.tier {
		border: 2px solid transparent;
	}
	.tier.current {
		border-color: var(--mv-check);
	}

	.chip {
		border-radius: 1rem;
		padding: 0.25rem 0.75rem;
		background: #007a2e;
		color: #fff;
		font-size: 0.875rem;
		font-weight: 600;
	}

	main :global(.action) {
		height: 3rem;
		font-size: 1.0625rem;
	}
	main :global(.action.primary),
	:global(.confirm) {
		background: #007a2e;
		color: #fff;
	}
	main :global(.action.primary:hover),
	:global(.confirm:hover) {
		background: #00692a;
	}
	main :global(.cta-gradient),
	section :global(.cta-gradient) {
		background-image: var(--mv-grad);
		color: #000;
		transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	main :global(.cta-gradient:hover),
	section :global(.cta-gradient:hover) {
		transform: scale(1.03);
	}
	section :global(.cta) {
		height: 3.25rem;
		padding-inline: 1.75rem;
		font-size: 1.125rem;
	}
</style>

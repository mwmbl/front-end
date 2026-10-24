<script lang="ts">
	import type { Snippet } from 'svelte';

	import type { SeedSearchUsage, VolunteerMembership, VolunteerTier } from './+page.server';
	import { formatDate, volunteerTierImages } from './tiers';
	import SeedSearchCard from './SeedSearchCard.svelte';
	import VolunteerCard from './VolunteerCard.svelte';

	// Shown to users with a volunteer membership but no paid one; the page lists the paid tiers below.
	let {
		volunteer,
		tier,
		seedSearchUsage,
		seedSearchEnabled,
		status
	}: {
		volunteer: VolunteerMembership;
		tier: VolunteerTier | null;
		seedSearchUsage: SeedSearchUsage | null;
		seedSearchEnabled: boolean;
		// Checkout progress, shown above the heading.
		status?: Snippet;
	} = $props();

	const validUntil = $derived(formatDate(volunteer.valid_until));
</script>

<section
	class="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 pt-10 text-center sm:px-8 sm:pt-16"
>
	{@render status?.()}
	<span class="hero-icon">
		<img src={volunteerTierImages[volunteer.tier]} alt="" class="size-12" />
	</span>
	<h1 class="text-4xl leading-snug! font-bold text-balance md:text-5xl lg:text-6xl">
		You're a {volunteer.name}
	</h1>
	<p class="text-unemphasized-2 text-lg text-pretty sm:text-xl">
		Thank you for crawling for Mwmbl. Every page you index makes free, independent search better for
		everyone.
	</p>
	{#if validUntil}
		<span class="pill">Valid until {validUntil}</span>
	{/if}
</section>

<div class="mx-auto w-full max-w-6xl px-4 sm:px-8">
	<h2 class="section-label mt-16 mb-6">YOUR PERKS</h2>
	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-6">
		<SeedSearchCard usage={seedSearchUsage} enabled={seedSearchEnabled} upgradeHref="#join" />
		<VolunteerCard {volunteer} {tier} />
	</div>
</div>

<style>
	.hero-icon {
		display: grid;
		place-items: center;
		width: 5rem;
		height: 5rem;
		border-radius: 1.5rem;
		background: #fde3a6;
	}

	.pill {
		display: inline-flex;
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
</style>

<script lang="ts">
	import RiCheckLine from '~icons/ri/check-line';
	import RiArrowRightLine from '~icons/ri/arrow-right-line';

	import type { VolunteerMembership, VolunteerTier } from './+page.server';
	import { formatDate, perkParts, volunteerTierImages } from './tiers';

	let {
		volunteer,
		tier
	}: {
		volunteer: VolunteerMembership;
		tier: VolunteerTier | null;
	} = $props();

	const validUntil = $derived(formatDate(volunteer.valid_until));
</script>

<article class="bg-card flex flex-col gap-5 rounded-2xl p-6 sm:p-8">
	<div class="flex items-center gap-4">
		<span class="bee-tile">
			<img src={volunteerTierImages[volunteer.tier]} alt="" class="size-7" />
		</span>
		<h3 class="font-display flex-1 text-2xl font-bold">{volunteer.name} volunteer</h3>
	</div>
	<p class="text-pretty">
		You earned this membership by crawling for Mwmbl. Thank you! It's valid until
		<b>{validUntil}</b>{#if tier}, and is extended each month you index at least
			{tier.min_results_per_day.toLocaleString('en-GB')} pages on {tier.days_per_month} days{/if}.
	</p>
	{#if tier}
		<ul class="panel flex flex-col gap-2.5 rounded-xl p-5">
			{#each tier.perks as perk}
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
	{/if}
	<a href="/account/stats" class="link mt-auto inline-flex items-center gap-1.5 font-semibold">
		See your crawling stats <RiArrowRightLine />
	</a>
</article>

<style>
	.bee-tile {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		flex-shrink: 0;
		border-radius: 1rem;
		background: #fde3a6;
	}

	.panel {
		background: var(--mv-panel);
	}
	.panel :global(.check) {
		color: var(--mv-check);
	}

	.link {
		color: var(--mv-link);
	}
</style>

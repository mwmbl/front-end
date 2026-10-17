<script lang="ts">
	import { untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { Switch } from '@/components/ui/switch';

	import RiSearchLine from '~icons/ri/search-line';
	import RiArrowRightLine from '~icons/ri/arrow-right-line';

	import type { SeedSearchUsage } from './+page.server';

	let {
		usage,
		enabled,
		upgradeHref
	}: {
		usage: SeedSearchUsage | null;
		enabled: boolean;
		// Where to go for more queries when they've run out, if anywhere.
		upgradeHref: string | null;
	} = $props();

	const quotaExhausted = $derived(!!usage && usage.monthly_usage >= usage.monthly_limit);

	// Seeded from the props so the server render shows the right position; kept in sync afterwards.
	let seedSearchOn = $state(untrack(() => enabled && !quotaExhausted));
	$effect.pre(() => {
		seedSearchOn = enabled && !quotaExhausted;
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
				class="data-[state=checked]:bg-(image:--mv-grad)"
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
					{#if upgradeHref}
						<a href={upgradeHref} class="link font-semibold underline">Upgrade for more</a>
					{/if}
				</p>
			{/if}
		</div>
	{/if}
	<a href="/seed-search" class="link mt-auto inline-flex items-center gap-1.5 font-semibold">
		How Seed Search works <RiArrowRightLine />
	</a>
</article>

<style>
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
</style>

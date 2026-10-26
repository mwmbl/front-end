<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Button from '@/components/ui/button/button.svelte';
	import * as Card from '@/components/ui/card';
	import { buildLegend, trend } from '$lib/crawler-versions';

	let { data } = $props();

	const dayFormat = new Intl.DateTimeFormat('en-US', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		timeZone: 'UTC'
	});
	const numberFormat = new Intl.NumberFormat();

	const spread = $derived(data.access === 'ok' ? data.spread : null);

	const legend = $derived(spread ? buildLegend(spread) : []);

	let canvas: HTMLCanvasElement | undefined = $state();
	let chart: { destroy: () => void } | null = null;

	onMount(async () => {
		if (!browser || !spread || !canvas) return;

		const { default: Chart } = await import('chart.js/auto');
		const isDark = document.documentElement.classList.contains('dark');
		const textColor = isDark ? '#e5e7eb' : '#374151';
		const gridColor = isDark ? '#374151' : '#e5e7eb';
		Chart.defaults.font.size = 12;
		Chart.defaults.color = textColor;

		// Stacked bottom to top, so reversed to put the newest version on top.
		const rows = [...spread.rows].reverse();
		const colors = new Map(legend.map((entry) => [entry.version, entry.color]));
		const resultsByVersion = new Map(
			rows.map((row) => [row.version, row.days.map((cell) => cell.results)])
		);

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: spread.dates.map((day) => dayFormat.format(new Date(day))),
				datasets: rows.map((row) => ({
					label: row.version,
					data: row.days.map((cell) => cell.crawlers),
					backgroundColor: colors.get(row.version),
					borderWidth: 0
				}))
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					legend: { display: false },
					tooltip: {
						itemSort: (a, b) => b.datasetIndex - a.datasetIndex,
						callbacks: {
							label: (item) => {
								const results =
									resultsByVersion.get(item.dataset.label ?? '')?.[item.dataIndex] ?? 0;
								return `${item.dataset.label}: ${item.parsed.y} crawlers, ${numberFormat.format(results)} results`;
							},
							footer: (items) => `Total: ${spread.total_crawlers[items[0].dataIndex]} crawlers`
						}
					}
				},
				scales: {
					x: { stacked: true, grid: { display: false }, ticks: { color: textColor } },
					y: {
						stacked: true,
						beginAtZero: true,
						ticks: { color: textColor, precision: 0 },
						grid: { color: gridColor },
						title: { display: true, text: 'Crawlers', color: textColor }
					}
				}
			}
		});
	});

	onDestroy(() => chart?.destroy());
</script>

<svelte:head>
	<title>Crawler versions - Mwmbl</title>
</svelte:head>

<main class="flex w-full max-w-5xl flex-col self-center px-6">
	<h2 class="-mx-2 text-3xl">Crawler versions</h2>
	<hr class="my-2" />

	{#if data.access === 'anonymous'}
		<Card.Root class="flex flex-col items-start gap-4 p-4">
			<p>Sign in to see the crawler versions.</p>
			<Button href="/account?next={encodeURIComponent('/crawler-versions')}">Sign in</Button>
		</Card.Root>
	{:else if data.access === 'denied'}
		<Card.Root class="p-4">Only staff can see the crawler versions.</Card.Root>
	{:else if data.access === 'error'}
		<Card.Root class="p-4 outline-red-100 outline-solid dark:outline-red-900">
			{data.message}
		</Card.Root>
	{:else if data.spread.rows.length === 0}
		<Card.Root class="p-4">No crawler has submitted results in the last seven days.</Card.Root>
	{:else}
		<div class="flex flex-col gap-6 md:flex-row">
			<div class="h-96 min-w-0 flex-1">
				<canvas bind:this={canvas} class="h-full w-full"></canvas>
			</div>

			<div class="flex shrink-0 flex-col gap-2 md:w-60">
				<div class="text-unemphasized-1 flex justify-between text-xs font-semibold tracking-wide">
					<span>VERSION</span>
					<span>TODAY · VS YESTERDAY</span>
				</div>
				{#each legend as entry (entry.version)}
					<div class="flex items-center gap-2 text-sm">
						<span class="size-3 shrink-0 rounded-sm" style:background-color={entry.color}></span>
						<span class="flex-1 font-mono">{entry.version}</span>
						<span class="font-semibold">{numberFormat.format(entry.today)}</span>
						<span class="text-unemphasized-2 w-12 text-right text-xs">{trend(entry.change)}</span>
					</div>
				{/each}
				<div class="mt-1 flex items-center gap-2 border-t pt-2 text-sm font-semibold">
					<span class="flex-1">All versions</span>
					<span>{numberFormat.format(data.spread.total_crawlers.at(-1) ?? 0)}</span>
					<span class="w-12"></span>
				</div>
			</div>
		</div>

		<p class="text-unemphasized-2 mt-6 text-sm">
			Each bar is the crawlers that submitted results that day (UTC), split by version; hover a bar
			for results. Today is still filling, so "vs yesterday" understates a version that is growing.
			A crawler is a user and a device name, so several crawlers sharing one API key count
			separately. Crawlers that send no device name count as one per user, and a crawler updated
			during a day counts under both versions.
		</p>
	{/if}
</main>

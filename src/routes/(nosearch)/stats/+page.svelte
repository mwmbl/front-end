<script lang="ts">
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	// Debug: log the data
	console.log('Stats data received:', data);

	let activeTab = $state('overview');
	let activeChartTab = $state('crawlers');
	let showAllLeaderboard = $state(false);

	function formatNumber(num: number) {
		return new Intl.NumberFormat().format(num);
	}

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Chart.js initialization - will be implemented client-side only
	let chartInstance: any = null;
	let chartCanvas: HTMLCanvasElement;
	let chartError: string | null = $state(null);

	onMount(() => {
		if (browser) {
			initChart();
		}
	});

	async function initChart() {
		if (!chartCanvas) return;

		try {
			// Dynamically import Chart.js
			const ChartModule = await import('chart.js/auto');
			const Chart = ChartModule.default;
			const ctx = chartCanvas.getContext('2d');
			if (!ctx) return;

			// Destroy existing chart if any
			if (chartInstance) {
				chartInstance.destroy();
			}

			const chartData = getChartData();
			chartInstance = new Chart(ctx, {
				type: 'line',
				data: chartData,
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						mode: 'index',
						intersect: false
					},
					plugins: {
						legend: {
							position: 'top' as const,
						},
						title: {
							display: true,
							text: getChartTitle()
						}
					},
					scales: {
						y: {
							beginAtZero: true,
							ticks: {
								callback: function(value: number) {
									return formatNumber(value);
								}
							}
						},
						x: {
							ticks: {
								maxTicksLimit: 10,
								callback: function(value: number, index: number) {
									const labels = chartData.labels;
									if (labels && index < labels.length) {
										return formatDate(labels[index]);
									}
									return '';
								}
							}
						}
					}
				}
			});
		} catch (err) {
			console.error('Chart initialization failed:', err);
			chartError = err instanceof Error ? err.message : 'Unknown error';
		}
	}

	function getChartData() {
		const { chartData } = data;
		const labels = chartData.labels;

		switch (activeChartTab) {
			case 'crawlers':
				return {
					labels,
					datasets: [
						{
							label: 'Active Crawlers',
							data: chartData.usersCrawled,
							borderColor: 'rgb(59, 130, 246)',
							backgroundColor: 'rgba(59, 130, 246, 0.1)',
							fill: true,
							tension: 0.3
						},
						{
							label: 'Results Indexed',
							data: chartData.resultsIndexed,
							borderColor: 'rgb(16, 185, 129)',
							backgroundColor: 'rgba(16, 185, 129, 0.1)',
							fill: true,
							tension: 0.3
						}
					]
				};
			case 'index':
				return {
					labels,
					datasets: [
						{
							label: 'URLs in Index',
							data: chartData.urlsInIndex,
							borderColor: 'rgb(139, 92, 246)',
							backgroundColor: 'rgba(139, 92, 246, 0.1)',
							fill: true,
							tension: 0.3
						},
						{
							label: 'Domains in Index',
							data: chartData.domainsInIndex,
							borderColor: 'rgb(236, 72, 153)',
							backgroundColor: 'rgba(236, 72, 153, 0.1)',
							fill: true,
							tension: 0.3
						},
						{
							label: 'Results in Index',
							data: chartData.resultsInIndex,
							borderColor: 'rgb(249, 115, 22)',
							backgroundColor: 'rgba(249, 115, 22, 0.1)',
							fill: true,
							tension: 0.3
						}
					]
				};
			case 'dataset':
				return {
					labels,
					datasets: [
						{
							label: 'Dataset Queries',
							data: chartData.datasetQueries,
							borderColor: 'rgb(234, 179, 8)',
							backgroundColor: 'rgba(234, 179, 8, 0.1)',
							fill: true,
							tension: 0.3
						},
						{
							label: 'Dataset Results',
							data: chartData.datasetResults,
							borderColor: 'rgb(20, 184, 166)',
							backgroundColor: 'rgba(20, 184, 166, 0.1)',
							fill: true,
							tension: 0.3
						}
					]
				};
			case 'moderation':
				return {
					labels,
					datasets: [
						{
							label: 'Blacklisted Results Removed',
							data: chartData.blacklistedRemoved,
							borderColor: 'rgb(239, 68, 68)',
							backgroundColor: 'rgba(239, 68, 68, 0.1)',
							fill: true,
							tension: 0.3
						}
					]
				};
			default:
				return { labels, datasets: [] };
		}
	}

	function getChartTitle() {
		switch (activeChartTab) {
			case 'crawlers':
				return 'Crawler Activity (Last 30 Days)';
			case 'index':
				return 'Index Growth (Last 30 Days)';
			case 'dataset':
				return 'Dataset Statistics (Last 30 Days)';
			case 'moderation':
				return 'Moderation Activity (Last 30 Days)';
			default:
				return '';
		}
	}

	function updateChart() {
		if (chartInstance) {
			const chartData = getChartData();
			chartInstance.data = chartData;
			chartInstance.options.plugins.title.text = getChartTitle();
			chartInstance.update();
		}
	}

$effect.root(() => {
	$effect(() => {
		if (chartInstance && browser) {
			updateChart();
		}
	});
});
</script>

<svelte:head>
	<title>Statistics - MWMBL</title>
</svelte:head>

<main class="flex w-full max-w-5xl flex-col gap-6 self-center px-6 py-8">
	<h1 class="text-3xl font-bold mb-2">Statistics</h1>
	<p class="text-gray-600 dark:text-gray-400 mb-6">
		Comprehensive statistics about the Mwmbl search engine, crawler network, and index.
	</p>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Active Crawlers (30d)</h3>
			<p class="text-3xl font-bold text-blue-600 mt-1">{formatNumber(data.totals.usersCrawled)}</p>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Today: {formatNumber(data.latest.usersCrawled)}</p>
		</div>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Results Indexed (30d)</h3>
			<p class="text-3xl font-bold text-green-600 mt-1">{formatNumber(data.totals.resultsIndexed)}</p>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Today: {formatNumber(data.latest.resultsIndexed)}</p>
		</div>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">URLs in Index</h3>
			<p class="text-3xl font-bold text-purple-600 mt-1">{formatNumber(data.totals.urlsInIndex)}</p>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Current: {formatNumber(data.latest.urlsInIndex)}</p>
		</div>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Domains in Index</h3>
			<p class="text-3xl font-bold text-pink-600 mt-1">{formatNumber(data.totals.domainsInIndex)}</p>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Current: {formatNumber(data.latest.domainsInIndex)}</p>
		</div>
	</div>

	<!-- Additional Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Results in Index</h3>
			<p class="text-3xl font-bold text-orange-600 mt-1">{formatNumber(data.totals.resultsInIndex)}</p>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Current: {formatNumber(data.latest.resultsInIndex)}</p>
		</div>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Dataset Queries (30d)</h3>
			<p class="text-3xl font-bold text-yellow-600 mt-1">{formatNumber(data.totals.datasetQueries)}</p>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Today: {formatNumber(data.latest.datasetQueries)}</p>
		</div>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Dataset Results (30d)</h3>
			<p class="text-3xl font-bold text-teal-600 mt-1">{formatNumber(data.totals.datasetResults)}</p>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Today: {formatNumber(data.latest.datasetResults)}</p>
		</div>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Blacklisted Removed (30d)</h3>
			<p class="text-3xl font-bold text-red-600 mt-1">{formatNumber(data.totals.blacklistedRemoved)}</p>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Today: {formatNumber(data.latest.blacklistedRemoved)}</p>
		</div>
	</div>

	<!-- Tabs for different sections -->
	<Tabs value={activeTab} onchange={(e) => (activeTab = e.detail.value)} class="w-full">
		<TabsList class="grid w-full grid-cols-4">
			<TabsTrigger value="overview">Overview</TabsTrigger>
			<TabsTrigger value="charts">Charts</TabsTrigger>
			<TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
			<TabsTrigger value="details">Raw Data</TabsTrigger>
		</TabsList>

		<!-- Overview Tab -->
		<TabsContent value="overview" class="space-y-6">
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Index Statistics</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">URLs in Index</h3>
						<p class="text-2xl font-bold text-purple-600">{formatNumber(data.latest.urlsInIndex)}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Total unique URLs indexed</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Domains in Index</h3>
						<p class="text-2xl font-bold text-pink-600">{formatNumber(data.latest.domainsInIndex)}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Unique domains represented</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Results in Index</h3>
						<p class="text-2xl font-bold text-orange-600">{formatNumber(data.latest.resultsInIndex)}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Total searchable results</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Avg Results per Domain</h3>
						<p class="text-2xl font-bold text-indigo-600">
							{data.latest.domainsInIndex > 0
								? formatNumber(Math.round(data.latest.resultsInIndex / data.latest.domainsInIndex))
								: 0}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Average results per domain</p>
					</div>
				</div>
			</div>

			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Crawler Network (Last 30 Days)</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Total Active Crawlers</h3>
						<p class="text-2xl font-bold text-blue-600">{formatNumber(data.totals.usersCrawled)}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Unique crawlers in 30 days</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Total Results Indexed</h3>
						<p class="text-2xl font-bold text-green-600">{formatNumber(data.totals.resultsIndexed)}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Results submitted by crawlers</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Avg Crawlers/Day</h3>
						<p class="text-2xl font-bold text-blue-600">
							{data.chartData.labels.length > 0
								? formatNumber(Math.round(data.totals.usersCrawled / data.chartData.labels.length))
								: 0}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Average daily active crawlers</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Avg Results/Day</h3>
						<p class="text-2xl font-bold text-green-600">
							{data.chartData.labels.length > 0
								? formatNumber(Math.round(data.totals.resultsIndexed / data.chartData.labels.length))
								: 0}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Average daily results indexed</p>
					</div>
				</div>
			</div>

			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Dataset & Moderation (Last 30 Days)</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Dataset Queries</h3>
						<p class="text-2xl font-bold text-yellow-600">{formatNumber(data.totals.datasetQueries)}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Autocomplete queries collected</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Dataset Results</h3>
						<p class="text-2xl font-bold text-teal-600">{formatNumber(data.totals.datasetResults)}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Search results from datasets</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Blacklisted Removed</h3>
						<p class="text-2xl font-bold text-red-600">{formatNumber(data.totals.blacklistedRemoved)}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Results removed by moderation</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Success Rate</h3>
						<p class="text-2xl font-bold text-green-600">
							{data.totals.datasetQueries > 0
								? ((data.totals.datasetResults / data.totals.datasetQueries) * 100).toFixed(1) + '%'
								: '0%'}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Dataset results / queries</p>
					</div>
				</div>
			</div>
		</TabsContent>

		<!-- Charts Tab -->
		<TabsContent value="charts" class="space-y-6">
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
					<h2 class="text-xl font-semibold">Trend Charts</h2>
					<Tabs value={activeChartTab} onchange={(e) => (activeChartTab = e.detail.value)} class="w-full sm:w-auto">
						<TabsList class="grid grid-cols-4">
							<TabsTrigger value="crawlers">Crawlers</TabsTrigger>
							<TabsTrigger value="index">Index Growth</TabsTrigger>
							<TabsTrigger value="dataset">Dataset</TabsTrigger>
							<TabsTrigger value="moderation">Moderation</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
				<div class="h-96" style="position: relative; height: 400px; width: 100%;">
					<canvas bind:this={chartCanvas} class="w-full h-full"></canvas>
				</div>
			</div>
		</TabsContent>

		<!-- Leaderboard Tab -->
		<TabsContent value="leaderboard" class="space-y-6">
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
					<h2 class="text-xl font-semibold">Top Contributors</h2>
					<div class="flex space-x-4">
						<button
							class={!showAllLeaderboard ? 'text-blue-600 font-bold' : 'text-blue-600 hover:underline'}
							onclick={() => (showAllLeaderboard = false)}
						>
							Yesterday
						</button>
						<button
							class={showAllLeaderboard ? 'text-blue-600 font-bold' : 'text-blue-600 hover:underline'}
							onclick={() => (showAllLeaderboard = true)}
						>
							All Time
						</button>
					</div>
				</div>

				{#if !showAllLeaderboard}
					{#if data.yesterdayLeaderboard.length === 0}
						<p class="text-center text-gray-500 py-8">No data available for yesterday.</p>
					{:else}
						<div class="overflow-x-auto">
							<table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
								<thead>
									<tr class="bg-gray-100 dark:bg-gray-700">
										<th class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-left text-black dark:text-white">Rank</th>
										<th class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-left text-black dark:text-white">Username</th>
										<th class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-left text-black dark:text-white">Indexed Results</th>
									</tr>
								</thead>
								<tbody>
									{#each data.yesterdayLeaderboard as user, i}
										<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
											<td class="px-4 py-2 border border-gray-300 dark:border-gray-600">{i + 1}</td>
											<td class="px-4 py-2 border border-gray-300 dark:border-gray-600">{user.username}</td>
											<td class="px-4 py-2 border border-gray-300 dark:border-gray-600">{formatNumber(user.score)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				{:else}
					{#if data.allTimeLeaderboard.length === 0}
						<p class="text-center text-gray-500 py-8">No data available for all time.</p>
					{:else}
						<div class="overflow-x-auto">
							<table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
								<thead>
									<tr class="bg-gray-100 dark:bg-gray-700">
										<th class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-left text-black dark:text-white">Rank</th>
										<th class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-left text-black dark:text-white">Username</th>
										<th class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-left text-black dark:text-white">Total Indexed Results</th>
									</tr>
								</thead>
								<tbody>
									{#each data.allTimeLeaderboard as user, i}
										<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
											<td class="px-4 py-2 border border-gray-300 dark:border-gray-600">{i + 1}</td>
											<td class="px-4 py-2 border border-gray-300 dark:border-gray-600">{user.username}</td>
											<td class="px-4 py-2 border border-gray-300 dark:border-gray-600">{formatNumber(user.score)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				{/if}
			</div>
		</TabsContent>

		<!-- Raw Data Tab -->
		<TabsContent value="details" class="space-y-6">
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Raw Statistics Data</h2>
				<div class="overflow-auto max-h-96 font-mono text-sm">
					<pre>{JSON.stringify(data.stats, null, 2)}</pre>
				</div>
			</div>
		</TabsContent>
	</Tabs>
</main>

<style>
	/* Ensure canvas doesn't overflow */
	canvas {
		max-width: 100%;
	}
</style>
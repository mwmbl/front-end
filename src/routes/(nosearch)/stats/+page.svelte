<script lang="ts">
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
	import type { PageData } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	let activeTab = $state('overview');
	let showAllLeaderboard = $state(false);

	function formatNumber(num: number): string {
		if (num == null) return "0";
		return num.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
	}

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// Chart instances
	let resultsIndexedChart: any = null;
	let usersCrawledChart: any = null;
	let topUsersChart: any = null;
	let datasetQueriesChart: any = null;
	let datasetResultsChart: any = null;
	let indexGrowthChart: any = null;
	let moderationChart: any = null;

	// Canvas refs
	let resultsIndexedCanvas: HTMLCanvasElement;
	let usersCrawledCanvas: HTMLCanvasElement;
	let topUsersCanvas: HTMLCanvasElement;
	let datasetQueriesCanvas: HTMLCanvasElement;
	let datasetResultsCanvas: HTMLCanvasElement;
	let indexGrowthCanvas: HTMLCanvasElement;
	let moderationCanvas: HTMLCanvasElement;

	let chartError: string | null = $state(null);

	async function initCharts() {
		if (!browser) return;

		try {
			const ChartModule = await import('chart.js/auto');
			const Chart = ChartModule.default;

			// Use CSS variables for theme-aware colors
			const isDark = document.documentElement.classList.contains('dark');
			const textColor = isDark ? '#e5e7eb' : '#374151';
			const gridColor = isDark ? '#374151' : '#e5e7eb';

			Chart.defaults.font.size = 12;
			Chart.defaults.color = textColor;

			const commonOptions = {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: true,
						position: 'top' as const,
						labels: {
							color: textColor,
							font: { size: 11 }
						}
					},
					title: {
						display: true,
						font: { size: 14, weight: 'bold' as const },
						color: textColor
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							color: textColor,
							callback: (value: string | number) => formatNumber(Number(value))
						},
						grid: { color: gridColor }
					},
					x: {
						ticks: {
							color: textColor,
							maxTicksLimit: 10,
							callback: (value: string | number, index: number) => {
								const labels = data.chartData.labels;
								if (labels && index < labels.length) {
									return formatDate(labels[index]);
								}
								return '';
							}
						},
						grid: { color: gridColor }
					}
				}
			};

			// Results Indexed Daily Chart
			if (resultsIndexedCanvas) {
				resultsIndexedChart = new Chart(resultsIndexedCanvas, {
					type: 'line',
					data: {
						labels: data.chartData.labels,
						datasets: [{
							label: 'Results Indexed',
							data: data.chartData.resultsIndexed,
							borderColor: 'rgb(16, 185, 129)',
							backgroundColor: 'rgba(16, 185, 129, 0.1)',
							borderWidth: 2,
							fill: true,
							tension: 0.3
						}]
					},
					options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: 'Results Indexed by Day' } } }
				});
			}

			// Users Crawled Daily Chart
			if (usersCrawledCanvas) {
				usersCrawledChart = new Chart(usersCrawledCanvas, {
					type: 'line',
					data: {
						labels: data.chartData.labels,
						datasets: [{
							label: 'Active Crawlers',
							data: data.chartData.usersCrawled,
							borderColor: 'rgb(59, 130, 246)',
							backgroundColor: 'rgba(59, 130, 246, 0.1)',
							borderWidth: 2,
							fill: true,
							tension: 0.3
						}]
					},
					options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: 'Active Crawlers by Day' } } }
				});
			}

			// Top Users Chart (Horizontal Bar)
			if (topUsersCanvas) {
				topUsersChart = new Chart(topUsersCanvas, {
					type: 'bar',
					data: {
						labels: data.topUsers.labels,
						datasets: [{
							label: 'Top Contributors',
							data: data.topUsers.data,
							backgroundColor: 'rgba(139, 92, 246, 0.8)',
							borderColor: 'rgb(139, 92, 246)',
							borderWidth: 1
						}]
					},
					options: {
						...commonOptions,
						indexAxis: 'y',
						plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: 'Top Contributors (All Time)' } },
						scales: {
							x: {
								beginAtZero: true,
								ticks: { color: textColor, callback: (value: string | number) => formatNumber(Number(value)) },
								grid: { color: gridColor }
							},
							y: {
								ticks: { color: textColor, font: { size: 11 } },
								grid: { color: gridColor }
							}
						}
					}
				});
			}

			// Dataset Queries Daily Chart
			if (datasetQueriesCanvas) {
				datasetQueriesChart = new Chart(datasetQueriesCanvas, {
					type: 'line',
					data: {
						labels: data.chartData.labels,
						datasets: [{
							label: 'Dataset Queries',
							data: data.chartData.datasetQueries,
							borderColor: 'rgb(234, 179, 8)',
							backgroundColor: 'rgba(234, 179, 8, 0.1)',
							borderWidth: 2,
							fill: true,
							tension: 0.3
						}]
					},
					options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: 'Dataset Queries by Day' } } }
				});
			}

			// Dataset Results Daily Chart
			if (datasetResultsCanvas) {
				datasetResultsChart = new Chart(datasetResultsCanvas, {
					type: 'line',
					data: {
						labels: data.chartData.labels,
						datasets: [{
							label: 'Dataset Results',
							data: data.chartData.datasetResults,
							borderColor: 'rgb(20, 184, 166)',
							backgroundColor: 'rgba(20, 184, 166, 0.1)',
							borderWidth: 2,
							fill: true,
							tension: 0.3
						}]
					},
					options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: 'Dataset Results by Day' } } }
				});
			}

			// Index Growth Chart (URLs, Domains, Results)
			if (indexGrowthCanvas) {
				indexGrowthChart = new Chart(indexGrowthCanvas, {
					type: 'line',
					data: {
						labels: data.chartData.labels,
						datasets: [
							{
								label: 'URLs in Index',
								data: data.chartData.urlsInIndex,
								borderColor: 'rgb(139, 92, 246)',
								backgroundColor: 'rgba(139, 92, 246, 0.1)',
								borderWidth: 2,
								fill: true,
								tension: 0.3
							},
							{
								label: 'Domains in Index',
								data: data.chartData.domainsInIndex,
								borderColor: 'rgb(236, 72, 153)',
								backgroundColor: 'rgba(236, 72, 153, 0.1)',
								borderWidth: 2,
								fill: true,
								tension: 0.3
							},
							{
								label: 'Results in Index',
								data: data.chartData.resultsInIndex,
								borderColor: 'rgb(249, 115, 22)',
								backgroundColor: 'rgba(249, 115, 22, 0.1)',
								borderWidth: 2,
								fill: true,
								tension: 0.3
							}
						]
					},
					options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: 'Index Growth (Last 30 Days)' } } }
				});
			}

			// Moderation Chart
			if (moderationCanvas) {
				moderationChart = new Chart(moderationCanvas, {
					type: 'line',
					data: {
						labels: data.chartData.labels,
						datasets: [{
							label: 'Blacklisted Results Removed',
							data: data.chartData.blacklistedRemoved,
							borderColor: 'rgb(239, 68, 68)',
							backgroundColor: 'rgba(239, 68, 68, 0.1)',
							borderWidth: 2,
							fill: true,
							tension: 0.3
						}]
					},
					options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { ...commonOptions.plugins.title, text: 'Moderation Activity (Last 30 Days)' } } }
				});
			}
		} catch (err) {
			console.error('Chart initialization failed:', err);
			chartError = err instanceof Error ? err.message : 'Unknown error';
		}
	}

	function destroyCharts() {
		[resultsIndexedChart, usersCrawledChart, topUsersChart, datasetQueriesChart, datasetResultsChart, indexGrowthChart, moderationChart].forEach(chart => {
			if (chart) chart.destroy();
		});
	}

	onMount(() => {
		if (browser) {
			initCharts();
		}
	});

	onDestroy(() => {
		destroyCharts();
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
	<Tabs bind:value={activeTab} class="w-full">
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
			{#if chartError}
				<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
					<p class="text-red-700 dark:text-red-300">Chart error: {chartError}</p>
				</div>
			{/if}

			<!-- Crawler Activity Charts -->
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Crawler Activity (Last 30 Days)</h2>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<!-- Results Indexed Daily -->
					<div>
						<div class="h-80" style="position: relative; height: 320px; width: 100%;">
							<canvas bind:this={resultsIndexedCanvas} class="w-full h-full"></canvas>
						</div>
					</div>

					<!-- Users Crawled Daily -->
					<div>
						<div class="h-80" style="position: relative; height: 320px; width: 100%;">
							<canvas bind:this={usersCrawledCanvas} class="w-full h-full"></canvas>
						</div>
					</div>

					<!-- Top Users (Horizontal Bar) -->
					<div class="lg:col-span-2">
						<div class="h-96" style="position: relative; height: 384px; width: 100%;">
							<canvas bind:this={topUsersCanvas} class="w-full h-full"></canvas>
						</div>
					</div>

					<!-- Dataset Queries Daily -->
					<div>
						<div class="h-80" style="position: relative; height: 320px; width: 100%;">
							<canvas bind:this={datasetQueriesCanvas} class="w-full h-full"></canvas>
						</div>
					</div>

					<!-- Dataset Results Daily -->
					<div>
						<div class="h-80" style="position: relative; height: 320px; width: 100%;">
							<canvas bind:this={datasetResultsCanvas} class="w-full h-full"></canvas>
						</div>
					</div>
				</div>
			</div>

			<!-- Index Growth Chart -->
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Index Growth (Last 30 Days)</h2>
				<div class="h-96" style="position: relative; height: 400px; width: 100%;">
					<canvas bind:this={indexGrowthCanvas} class="w-full h-full"></canvas>
				</div>
			</div>

			<!-- Moderation Chart -->
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Moderation Activity (Last 30 Days)</h2>
				<div class="h-80" style="position: relative; height: 320px; width: 100%;">
					<canvas bind:this={moderationCanvas} class="w-full h-full"></canvas>
				</div>
			</div>

			<!-- Info Section -->
			<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
				<h2 class="text-lg font-semibold mb-3">About These Statistics</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
					<p><strong>Active Crawlers:</strong> Unique crawler users who submitted results on each day.</p>
					<p><strong>Results Indexed:</strong> Number of search results added to the index each day.</p>
					<p><strong>Top Contributors:</strong> All-time leaderboard of crawlers by total results submitted.</p>
					<p><strong>Dataset Queries:</strong> Autocomplete queries collected from the Firefox extension.</p>
					<p><strong>Dataset Results:</strong> Search results returned for dataset queries.</p>
					<p><strong>Index Growth:</strong> URLs, domains, and results in the search index over time.</p>
					<p><strong>Moderation:</strong> Results removed due to blacklisted domains.</p>
					<p><strong>Data Source:</strong> <a href="https://api.mwmbl.org/api/v1/crawler/stats" target="_blank" class="text-blue-600 hover:underline">api.mwmbl.org/api/v1/crawler/stats</a></p>
					<p><strong>Timezone:</strong> All dates are in UTC.</p>
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
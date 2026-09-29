<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Chart instances
	let resultsIndexedChart: any = null;
	let usersCrawledChart: any = null;
	let topUsersChart: any = null;
	let datasetQueriesChart: any = null;
	let datasetResultsChart: any = null;

	// Canvas refs
	let resultsIndexedCanvas: HTMLCanvasElement;
	let usersCrawledCanvas: HTMLCanvasElement;
	let topUsersCanvas: HTMLCanvasElement;
	let datasetQueriesCanvas: HTMLCanvasElement;
	let datasetResultsCanvas: HTMLCanvasElement;

	let chartError: string | null = $state(null);

	function formatNumber(num: number): string {
		if (num == null) return "0";
		return num.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
	}

	async function initCharts() {
		if (!browser) return;

		try {
			const ChartModule = await import('chart.js/auto');
			const Chart = ChartModule.default;

			Chart.defaults.font.size = 14;
			Chart.defaults.color = '#374151';

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
					options: getChartOptions('Results Indexed by Day')
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
					options: getChartOptions('Number of Users Crawling by Day')
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
						...getChartOptions('Top Contributors (All Time)'),
						indexAxis: 'y',
						scales: {
							x: {
								beginAtZero: true,
								ticks: {
									callback: (value: string | number) => formatNumber(Number(value))
								}
							},
							y: {
								ticks: {
									font: { size: 11 }
								}
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
					options: getChartOptions('Dataset Queries by Day')
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
					options: getChartOptions('Dataset Results by Day')
				});
			}
		} catch (err) {
			console.error('Chart initialization failed:', err);
			chartError = err instanceof Error ? err.message : 'Unknown error';
		}
	}

	function getChartOptions(title: string) {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false
				},
				title: {
					display: true,
					text: title,
					font: { size: 16, weight: 'bold' as const },
					color: '#1f2937'
				}
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						callback: (value: string | number) => formatNumber(Number(value))
					}
				},
				x: {
					ticks: {
						maxTicksLimit: 10,
						callback: (value: string | number, index: number) => {
							const labels = data.chartData.labels;
							if (labels && index < labels.length) {
								const date = new Date(labels[index]);
								return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
							}
							return '';
						}
					}
				}
			}
		};
	}

	function destroyCharts() {
		[resultsIndexedChart, usersCrawledChart, topUsersChart, datasetQueriesChart, datasetResultsChart].forEach(chart => {
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
	<title>Crawler Stats - MWMBL</title>
</svelte:head>

<main class="flex w-full max-w-5xl flex-col gap-6 self-center px-6 py-8">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-3xl font-bold">Crawler Stats</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">
				Real-time statistics from the Mwmbl crawler network. Updated every 5 seconds.
			</p>
		</div>
		<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
			<span class="flex items-center gap-1">
				<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
				Live
			</span>
			<span>UTC</span>
		</div>
	</div>

	{#if chartError}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
			<p class="text-red-700 dark:text-red-300">Chart error: {chartError}</p>
		</div>
	{/if}

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Active Crawlers Today</h3>
			<p class="text-3xl font-bold text-blue-600 mt-1">{formatNumber(data.latest.usersCrawled)}</p>
		</div>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Results Indexed Today</h3>
			<p class="text-3xl font-bold text-green-600 mt-1">{formatNumber(data.latest.resultsIndexed)}</p>
		</div>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-yellow-500">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Dataset Queries Today</h3>
			<p class="text-3xl font-bold text-yellow-600 mt-1">{formatNumber(data.latest.datasetQueries)}</p>
		</div>
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-teal-500">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Dataset Results Today</h3>
			<p class="text-3xl font-bold text-teal-600 mt-1">{formatNumber(data.latest.datasetResults)}</p>
		</div>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Results Indexed Daily -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<div class="h-80" style="position: relative; height: 320px; width: 100%;">
				<canvas bind:this={resultsIndexedCanvas} class="w-full h-full"></canvas>
			</div>
		</div>

		<!-- Users Crawled Daily -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<div class="h-80" style="position: relative; height: 320px; width: 100%;">
				<canvas bind:this={usersCrawledCanvas} class="w-full h-full"></canvas>
			</div>
		</div>

		<!-- Top Users (Horizontal Bar) -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
			<div class="h-96" style="position: relative; height: 384px; width: 100%;">
				<canvas bind:this={topUsersCanvas} class="w-full h-full"></canvas>
			</div>
		</div>

		<!-- Dataset Queries Daily -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<div class="h-80" style="position: relative; height: 320px; width: 100%;">
				<canvas bind:this={datasetQueriesCanvas} class="w-full h-full"></canvas>
			</div>
		</div>

		<!-- Dataset Results Daily -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<div class="h-80" style="position: relative; height: 320px; width: 100%;">
				<canvas bind:this={datasetResultsCanvas} class="w-full h-full"></canvas>
			</div>
		</div>
	</div>

	<!-- Info Section -->
	<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mt-6">
		<h2 class="text-lg font-semibold mb-3">About These Statistics</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
			<p><strong>Active Crawlers:</strong> Unique crawler users who submitted results on each day.</p>
			<p><strong>Results Indexed:</strong> Number of search results added to the index each day.</p>
			<p><strong>Top Contributors:</strong> All-time leaderboard of crawlers by total results submitted.</p>
			<p><strong>Dataset Queries:</strong> Autocomplete queries collected from the Firefox extension.</p>
			<p><strong>Dataset Results:</strong> Search results returned for dataset queries.</p>
			<p><strong>Data Source:</strong> <a href="https://api.mwmbl.org/api/v1/crawler/stats" target="_blank" class="text-blue-600 hover:underline">api.mwmbl.org/api/v1/crawler/stats</a></p>
			<p><strong>Timezone:</strong> All dates are in UTC.</p>
		</div>
	</div>
</main>

<style>
	canvas {
		max-width: 100%;
	}
</style>
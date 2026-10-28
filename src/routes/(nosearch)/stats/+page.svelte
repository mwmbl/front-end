<script lang="ts">
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
	import type { PageData } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { Chart, TooltipItem } from 'chart.js';

	let { data }: { data: PageData } = $props();

	let activeTab = $state('charts');
	let showAllLeaderboard = $state(false);

	function formatNumber(num: number): string {
		if (num == null) return '0';
		return num.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
	}

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
	}

	// Chart instances
	let resultsIndexedChart: Chart | null = null;
	let usersCrawledChart: Chart | null = null;
	let topUsersChart: Chart | null = null;
	let datasetQueriesChart: Chart | null = null;
	let datasetResultsChart: Chart | null = null;
	let indexGrowthCharts: Chart[] = [];
	let registeredWeeklyChart: Chart | null = null;

	// Canvas refs
	let resultsIndexedCanvas: HTMLCanvasElement;
	let usersCrawledCanvas: HTMLCanvasElement;
	let topUsersCanvas: HTMLCanvasElement;
	let datasetQueriesCanvas: HTMLCanvasElement;
	let datasetResultsCanvas: HTMLCanvasElement;
	let indexGrowthCanvases: HTMLCanvasElement[] = [];

	// The index is re-measured about weekly, so each point is one scan. Each metric gets its own
	// chart with a y-axis fitted to its range: on a shared axis the weekly change is invisible.
	const indexGrowthMetrics = [
		{ title: 'Pages in Index', values: 'urls', change: 'urlsChange', color: '139, 92, 246' },
		{
			title: 'Domains in Index',
			values: 'domains',
			change: 'domainsChange',
			color: '236, 72, 153'
		},
		{ title: 'Index Entries', values: 'results', change: 'resultsChange', color: '249, 115, 22' }
	] as const;
	let registeredWeeklyCanvas: HTMLCanvasElement;

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
						datasets: [
							{
								label: 'Results Indexed',
								data: data.chartData.resultsIndexed,
								borderColor: 'rgb(16, 185, 129)',
								backgroundColor: 'rgba(16, 185, 129, 0.1)',
								borderWidth: 2,
								fill: true,
								tension: 0.3
							}
						]
					},
					options: {
						...commonOptions,
						plugins: {
							...commonOptions.plugins,
							title: { ...commonOptions.plugins.title, text: 'Results Indexed by Day' }
						}
					}
				});
			}

			// Users Crawled Daily Chart
			if (usersCrawledCanvas) {
				usersCrawledChart = new Chart(usersCrawledCanvas, {
					type: 'line',
					data: {
						labels: data.chartData.labels,
						datasets: [
							{
								label: 'Active Crawlers',
								data: data.chartData.usersCrawled,
								borderColor: 'rgb(59, 130, 246)',
								backgroundColor: 'rgba(59, 130, 246, 0.1)',
								borderWidth: 2,
								fill: true,
								tension: 0.3
							}
						]
					},
					options: {
						...commonOptions,
						plugins: {
							...commonOptions.plugins,
							title: { ...commonOptions.plugins.title, text: 'Active Crawlers by Day' }
						}
					}
				});
			}

			// Users Registered Weekly Chart
			if (registeredWeeklyCanvas) {
				registeredWeeklyChart = new Chart(registeredWeeklyCanvas, {
					type: 'bar',
					data: {
						labels: data.registeredWeekly.labels,
						datasets: [
							{
								label: 'Users Registered',
								data: data.registeredWeekly.data,
								backgroundColor: 'rgba(99, 102, 241, 0.8)',
								borderColor: 'rgb(99, 102, 241)',
								borderWidth: 1
							}
						]
					},
					options: {
						...commonOptions,
						plugins: {
							...commonOptions.plugins,
							title: { ...commonOptions.plugins.title, text: 'Users Registered by Week' },
							tooltip: {
								callbacks: {
									title: (items: TooltipItem<'bar'>[]) =>
										`Week of ${formatDate(data.registeredWeekly.labels[items[0].dataIndex])}`
								}
							}
						},
						scales: {
							...commonOptions.scales,
							x: {
								...commonOptions.scales.x,
								ticks: {
									...commonOptions.scales.x.ticks,
									maxTicksLimit: 13,
									callback: (value: string | number, index: number) =>
										formatDate(data.registeredWeekly.labels[index])
								}
							}
						}
					}
				});
			}

			// Top Users Chart (Horizontal Bar)
			if (topUsersCanvas) {
				topUsersChart = new Chart(topUsersCanvas, {
					type: 'bar',
					data: {
						labels: data.topUsers.labels,
						datasets: [
							{
								label: 'Top Contributors',
								data: data.topUsers.data,
								backgroundColor: 'rgba(139, 92, 246, 0.8)',
								borderColor: 'rgb(139, 92, 246)',
								borderWidth: 1
							}
						]
					},
					options: {
						...commonOptions,
						indexAxis: 'y',
						plugins: {
							...commonOptions.plugins,
							title: { ...commonOptions.plugins.title, text: 'Top Contributors (All Time)' }
						},
						scales: {
							x: {
								beginAtZero: true,
								ticks: {
									color: textColor,
									callback: (value: string | number) => formatNumber(Number(value))
								},
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
						datasets: [
							{
								label: 'Dataset Queries',
								data: data.chartData.datasetQueries,
								borderColor: 'rgb(234, 179, 8)',
								backgroundColor: 'rgba(234, 179, 8, 0.1)',
								borderWidth: 2,
								fill: true,
								tension: 0.3
							}
						]
					},
					options: {
						...commonOptions,
						plugins: {
							...commonOptions.plugins,
							title: { ...commonOptions.plugins.title, text: 'Dataset Queries by Day' }
						}
					}
				});
			}

			// Dataset Results Daily Chart
			if (datasetResultsCanvas) {
				datasetResultsChart = new Chart(datasetResultsCanvas, {
					type: 'line',
					data: {
						labels: data.chartData.labels,
						datasets: [
							{
								label: 'Dataset Results',
								data: data.chartData.datasetResults,
								borderColor: 'rgb(20, 184, 166)',
								backgroundColor: 'rgba(20, 184, 166, 0.1)',
								borderWidth: 2,
								fill: true,
								tension: 0.3
							}
						]
					},
					options: {
						...commonOptions,
						plugins: {
							...commonOptions.plugins,
							title: { ...commonOptions.plugins.title, text: 'Dataset Results by Day' }
						}
					}
				});
			}

			// Index Growth Charts: the size at each scan as a line, the change since the previous scan as bars
			const indexHistory = data.indexHistory;
			const formatScanDate = (index: number) => formatDate(indexHistory.labels[index]);
			indexGrowthMetrics.forEach((metric, i) => {
				const canvas = indexGrowthCanvases[i];
				if (!canvas) return;
				indexGrowthCharts[i] = new Chart(canvas, {
					data: {
						labels: indexHistory.labels,
						datasets: [
							{
								type: 'bar',
								label: 'Change since previous scan',
								data: indexHistory[metric.change],
								yAxisID: 'change',
								backgroundColor: `rgba(${metric.color}, 0.35)`,
								order: 2
							},
							{
								type: 'line',
								label: metric.title,
								data: indexHistory[metric.values],
								yAxisID: 'total',
								borderColor: `rgb(${metric.color})`,
								backgroundColor: `rgba(${metric.color}, 0.1)`,
								borderWidth: 2,
								pointRadius: 4,
								tension: 0.2,
								order: 1
							}
						]
					},
					options: {
						...commonOptions,
						plugins: {
							...commonOptions.plugins,
							title: {
								...commonOptions.plugins.title,
								text: `${metric.title} (one point per scan, about weekly)`
							}
						},
						scales: {
							x: {
								ticks: {
									color: textColor,
									callback: (_value: string | number, index: number) => formatScanDate(index)
								},
								grid: { color: gridColor }
							},
							total: {
								type: 'linear' as const,
								position: 'left' as const,
								beginAtZero: false,
								title: { display: true, text: 'Total', color: textColor },
								ticks: {
									color: textColor,
									callback: (value: string | number) => formatNumber(Number(value))
								},
								grid: { color: gridColor }
							},
							change: {
								type: 'linear' as const,
								position: 'right' as const,
								title: { display: true, text: 'Change per scan', color: textColor },
								ticks: {
									color: textColor,
									callback: (value: string | number) => formatNumber(Number(value))
								},
								grid: { drawOnChartArea: false }
							}
						}
					}
				});
			});
		} catch (err) {
			console.error('Chart initialization failed:', err);
			chartError = err instanceof Error ? err.message : 'Unknown error';
		}
	}

	function destroyCharts() {
		[
			resultsIndexedChart,
			usersCrawledChart,
			registeredWeeklyChart,
			topUsersChart,
			datasetQueriesChart,
			datasetResultsChart,
			...indexGrowthCharts
		].forEach((chart) => {
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
	<h1 class="mb-2 text-3xl font-bold">Statistics</h1>
	<p class="mb-6 text-gray-600 dark:text-gray-400">
		Comprehensive statistics about the Mwmbl search engine, crawler network, and index.
	</p>

	<!-- The index, usable pages first: a page is stored once for every term it is indexed under, so the entries count is much larger than the number of pages -->
	<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Pages in Index</h3>
			<p class="mt-1 text-3xl font-bold text-purple-600">{formatNumber(data.latest.urlsInIndex)}</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Unique, searchable pages</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Domains in Index</h3>
			<p class="mt-1 text-3xl font-bold text-pink-600">
				{formatNumber(data.latest.domainsInIndex)}
			</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Unique domains</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Index Entries</h3>
			<p class="mt-1 text-3xl font-bold text-orange-600">
				{formatNumber(data.latest.resultsInIndex)}
			</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Pages counted once per term they are indexed under
			</p>
		</div>
	</div>

	<!-- Seed Search, all time -->
	<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Seed Searches</h3>
			<p class="mt-1 text-3xl font-bold text-emerald-600">{formatNumber(data.seed.searches)}</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Searches made with <a href="/seed-search" class="underline">Seed Search</a> on, all time
			</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Seed Pages</h3>
			<p class="mt-1 text-3xl font-bold text-emerald-600">{formatNumber(data.seed.pagesIndexed)}</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				New pages Seed Searches added to the index, all time
			</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">New Sites Found</h3>
			<p class="mt-1 text-3xl font-bold text-emerald-600">
				{formatNumber(data.seed.sitesDiscovered)}
			</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Sites Seed Searches were the first to bring to Mwmbl
			</p>
		</div>
	</div>

	<!-- Crawler and dataset activity -->
	<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Active Crawlers (30d)</h3>
			<p class="mt-1 text-3xl font-bold text-blue-600">{formatNumber(data.totals.usersCrawled)}</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Today: {formatNumber(data.latest.usersCrawled)}
			</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Results Indexed (30d)</h3>
			<p class="mt-1 text-3xl font-bold text-green-600">
				{formatNumber(data.totals.resultsIndexed)}
			</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Today: {formatNumber(data.latest.resultsIndexed)}
			</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Dataset Queries (30d)</h3>
			<p class="mt-1 text-3xl font-bold text-yellow-600">
				{formatNumber(data.totals.datasetQueries)}
			</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Today: {formatNumber(data.latest.datasetQueries)}
			</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Dataset Results (30d)</h3>
			<p class="mt-1 text-3xl font-bold text-teal-600">
				{formatNumber(data.totals.datasetResults)}
			</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Today: {formatNumber(data.latest.datasetResults)}
			</p>
		</div>
	</div>

	<!-- Tabs for different sections -->
	<Tabs bind:value={activeTab} class="w-full">
		<TabsList class="grid w-full grid-cols-3">
			<TabsTrigger value="charts">Charts</TabsTrigger>
			<TabsTrigger value="overview">Overview</TabsTrigger>
			<TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
		</TabsList>

		<!-- Charts Tab -->
		<TabsContent value="charts" class="space-y-6">
			{#if chartError}
				<div
					class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
				>
					<p class="text-red-700 dark:text-red-300">Chart error: {chartError}</p>
				</div>
			{/if}

			<!-- Crawler Activity Charts -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<h2 class="mb-4 text-xl font-semibold">Crawler Activity (Last 30 Days)</h2>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Results Indexed Daily -->
					<div>
						<div class="h-80" style="position: relative; height: 320px; width: 100%;">
							<canvas bind:this={resultsIndexedCanvas} class="h-full w-full"></canvas>
						</div>
					</div>

					<!-- Users Crawled Daily -->
					<div>
						<div class="h-80" style="position: relative; height: 320px; width: 100%;">
							<canvas bind:this={usersCrawledCanvas} class="h-full w-full"></canvas>
						</div>
					</div>

					<!-- Users Registered Weekly -->
					<div class="lg:col-span-2">
						<div class="h-80" style="position: relative; height: 320px; width: 100%;">
							<canvas bind:this={registeredWeeklyCanvas} class="h-full w-full"></canvas>
						</div>
					</div>

					<!-- Top Users (Horizontal Bar) -->
					<div class="lg:col-span-2">
						<div class="h-96" style="position: relative; height: 384px; width: 100%;">
							<canvas bind:this={topUsersCanvas} class="h-full w-full"></canvas>
						</div>
					</div>

					<!-- Dataset Queries Daily -->
					<div>
						<div class="h-80" style="position: relative; height: 320px; width: 100%;">
							<canvas bind:this={datasetQueriesCanvas} class="h-full w-full"></canvas>
						</div>
					</div>

					<!-- Dataset Results Daily -->
					<div>
						<div class="h-80" style="position: relative; height: 320px; width: 100%;">
							<canvas bind:this={datasetResultsCanvas} class="h-full w-full"></canvas>
						</div>
					</div>
				</div>
			</div>

			<!-- Index Growth Charts -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<h2 class="mb-1 text-xl font-semibold">Index Growth</h2>
				<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
					The index is re-measured about once a week. Lines show the size at each scan and bars the
					change since the previous one.
				</p>
				{#if data.indexHistory.labels.length === 0}
					<p class="py-8 text-center text-gray-500">No completed index scans yet.</p>
				{:else}
					<div class="grid grid-cols-1 gap-6">
						{#each indexGrowthMetrics.keys() as i}
							<div style="position: relative; height: 320px; width: 100%;">
								<canvas bind:this={indexGrowthCanvases[i]} class="h-full w-full"></canvas>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</TabsContent>

		<!-- Overview Tab -->
		<TabsContent value="overview" class="space-y-6">
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<h2 class="mb-4 text-xl font-semibold">Index Statistics</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Pages in Index</h3>
						<p class="text-2xl font-bold text-purple-600">
							{formatNumber(data.latest.urlsInIndex)}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Unique, searchable pages</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Domains in Index</h3>
						<p class="text-2xl font-bold text-pink-600">
							{formatNumber(data.latest.domainsInIndex)}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Unique domains represented</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Index Entries</h3>
						<p class="text-2xl font-bold text-orange-600">
							{formatNumber(data.latest.resultsInIndex)}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							Pages counted once per term they are indexed under
						</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Avg Pages per Domain</h3>
						<p class="text-2xl font-bold text-indigo-600">
							{data.latest.domainsInIndex > 0
								? formatNumber(Math.round(data.latest.urlsInIndex / data.latest.domainsInIndex))
								: 0}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Average unique pages per domain</p>
					</div>
				</div>
			</div>

			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<h2 class="mb-4 text-xl font-semibold">Crawler Network (Last 30 Days)</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Total Active Crawlers</h3>
						<p class="text-2xl font-bold text-blue-600">{formatNumber(data.totals.usersCrawled)}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Unique crawlers in 30 days</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Total Results Indexed</h3>
						<p class="text-2xl font-bold text-green-600">
							{formatNumber(data.totals.resultsIndexed)}
						</p>
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
								? formatNumber(
										Math.round(data.totals.resultsIndexed / data.chartData.labels.length)
									)
								: 0}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Average daily results indexed</p>
					</div>
				</div>
			</div>

			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<h2 class="mb-4 text-xl font-semibold">Dataset (Last 30 Days)</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Dataset Queries</h3>
						<p class="text-2xl font-bold text-yellow-600">
							{formatNumber(data.totals.datasetQueries)}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Autocomplete queries collected</p>
					</div>
					<div>
						<h3 class="font-medium text-gray-700 dark:text-gray-300">Dataset Results</h3>
						<p class="text-2xl font-bold text-teal-600">
							{formatNumber(data.totals.datasetResults)}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Search results from datasets</p>
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

			<!-- Metrics Explanations -->
			<div class="rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
				<h2 class="mb-3 text-lg font-semibold">About These Metrics</h2>
				<div class="grid grid-cols-1 gap-4 text-sm text-gray-600 sm:grid-cols-2 dark:text-gray-400">
					<p>
						<strong>Active Crawlers:</strong> Unique crawler users who submitted results on each day.
					</p>
					<p>
						<strong>Results Indexed:</strong> Number of search results added to the index each day.
					</p>
					<p>
						<strong>Users Registered:</strong> New user accounts registered each week (weeks start on
						Monday).
					</p>
					<p>
						<strong>Top Contributors:</strong> All-time leaderboard of crawlers by total results submitted.
					</p>
					<p>
						<strong>Dataset Queries:</strong> Autocomplete queries collected from the Firefox extension.
					</p>
					<p><strong>Dataset Results:</strong> Search results returned for dataset queries.</p>
					<p>
						<strong>Index Growth:</strong> Pages, domains, and index entries in the search index over
						time.
					</p>
					<p>
						<strong>Seed Searches:</strong> Searches made with Seed Search on, and the new pages and
						sites they brought in. Shown as all-time totals; we don't keep these per day.
					</p>
					<p><strong>Timezone:</strong> All dates are in UTC.</p>
				</div>
			</div>
		</TabsContent>

		<!-- Leaderboard Tab -->
		<TabsContent value="leaderboard" class="space-y-6">
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<h2 class="text-xl font-semibold">Top Contributors</h2>
					<div class="flex space-x-4">
						<button
							class={!showAllLeaderboard
								? 'font-bold text-blue-600'
								: 'text-blue-600 hover:underline'}
							onclick={() => (showAllLeaderboard = false)}
						>
							Yesterday
						</button>
						<button
							class={showAllLeaderboard
								? 'font-bold text-blue-600'
								: 'text-blue-600 hover:underline'}
							onclick={() => (showAllLeaderboard = true)}
						>
							All Time
						</button>
					</div>
				</div>

				{#if !showAllLeaderboard}
					{#if data.yesterdayLeaderboard.length === 0}
						<p class="py-8 text-center text-gray-500">No data available for yesterday.</p>
					{:else}
						<div class="overflow-x-auto">
							<table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
								<thead>
									<tr class="bg-gray-100 dark:bg-gray-700">
										<th
											class="border border-gray-300 px-4 py-2 text-left text-black dark:border-gray-600 dark:text-white"
											>Rank</th
										>
										<th
											class="border border-gray-300 px-4 py-2 text-left text-black dark:border-gray-600 dark:text-white"
											>Username</th
										>
										<th
											class="border border-gray-300 px-4 py-2 text-left text-black dark:border-gray-600 dark:text-white"
											>Indexed Results</th
										>
									</tr>
								</thead>
								<tbody>
									{#each data.yesterdayLeaderboard as user, i}
										<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
											<td class="border border-gray-300 px-4 py-2 dark:border-gray-600">{i + 1}</td>
											<td class="border border-gray-300 px-4 py-2 dark:border-gray-600"
												>{user.username}</td
											>
											<td class="border border-gray-300 px-4 py-2 dark:border-gray-600"
												>{formatNumber(user.score)}</td
											>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				{:else if data.allTimeLeaderboard.length === 0}
					<p class="py-8 text-center text-gray-500">No data available for all time.</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
							<thead>
								<tr class="bg-gray-100 dark:bg-gray-700">
									<th
										class="border border-gray-300 px-4 py-2 text-left text-black dark:border-gray-600 dark:text-white"
										>Rank</th
									>
									<th
										class="border border-gray-300 px-4 py-2 text-left text-black dark:border-gray-600 dark:text-white"
										>Username</th
									>
									<th
										class="border border-gray-300 px-4 py-2 text-left text-black dark:border-gray-600 dark:text-white"
										>Total Indexed Results</th
									>
								</tr>
							</thead>
							<tbody>
								{#each data.allTimeLeaderboard as user, i}
									<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
										<td class="border border-gray-300 px-4 py-2 dark:border-gray-600">{i + 1}</td>
										<td class="border border-gray-300 px-4 py-2 dark:border-gray-600"
											>{user.username}</td
										>
										<td class="border border-gray-300 px-4 py-2 dark:border-gray-600"
											>{formatNumber(user.score)}</td
										>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
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

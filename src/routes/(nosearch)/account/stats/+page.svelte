<script>
	export let data;

	// Compute a scale so the tallest day fills the chart container.
	$: maxIndexed = Math.max(...data.chartData.indexed, 1);
	$: scaledIndexed = data.chartData.indexed.map((v) => (v / maxIndexed) * 100);
</script>

<div class="min-h-screen">
	<header class="shadow-md">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<h1 class="text-3xl font-bold">{data.username}'s stats</h1>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<div class="bg-card rounded-lg p-6 shadow">
				<h2 class="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">Member Since</h2>
				<p class="text-3xl font-bold">{new Date(data.dateJoined).getFullYear()}</p>
			</div>
			<div class="bg-card rounded-lg p-6 shadow">
				<h2 class="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">
					Total Results Indexed
				</h2>
				<p class="text-3xl font-bold">{data.totalIndexed.toLocaleString()}</p>
			</div>
			<div class="bg-card rounded-lg p-6 shadow">
				<h2 class="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">Indexed Today</h2>
				<p class="text-3xl font-bold">{data.myIndexedToday.toLocaleString()}</p>
			</div>
			<div class="bg-brand-gradient rounded-lg p-[3px] shadow">
				<div class="bg-card h-full rounded-[5px] p-6">
					<h2 class="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">Seed Searches</h2>
					<p class="text-3xl font-bold">{data.seedSearches.toLocaleString()}</p>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Searches you made with <a href="/seed-search" class="underline">Seed Search</a> on, all time
					</p>
				</div>
			</div>
			<div class="bg-brand-gradient rounded-lg p-[3px] shadow">
				<div class="bg-card h-full rounded-[5px] p-6">
					<h2 class="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">Seed Pages</h2>
					<p class="text-3xl font-bold">{data.seedCrawlPagesIndexed.toLocaleString()}</p>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						New pages your Seed Searches added to the Mwmbl index, all time
					</p>
				</div>
			</div>
			<div class="bg-brand-gradient rounded-lg p-[3px] shadow">
				<div class="bg-card h-full rounded-[5px] p-6">
					<h2 class="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">New Sites Found</h2>
					<p class="text-3xl font-bold">{data.seedSitesDiscovered.toLocaleString()}</p>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Sites your Seed Searches were the first to bring to Mwmbl, all time
					</p>
				</div>
			</div>
		</div>

		<div class="bg-card mt-8 rounded-lg p-6 shadow">
			<h2 class="mb-4 text-lg font-medium text-gray-500 dark:text-gray-400">
				Results Indexed Per Day (Last 30 Days)
			</h2>
			<div class="flex h-64 w-full items-end gap-1">
				{#each data.chartLabels as label, i}
					<div
						class="flex h-64 min-w-0 flex-1 flex-col items-center justify-end"
						title="{label}: {data.chartData.indexed[i]}"
					>
						<div
							class="w-full rounded-t bg-blue-500 dark:bg-blue-600"
							style="height: {scaledIndexed[i] || 0}%; min-height: 16px"
						></div>
					</div>
				{/each}
			</div>
			<div class="mt-2 flex justify-between text-gray-500 dark:text-gray-400">
				<span>{data.chartLabels[0]}</span>
				<span>{data.chartLabels[data.chartLabels.length - 1]}</span>
			</div>
		</div>
	</main>
</div>

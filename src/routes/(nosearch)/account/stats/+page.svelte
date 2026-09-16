<script>
	export let data;

	// Compute a scale so the tallest day fills the chart container.
	$: maxIndexed = Math.max(...data.chartData.indexed, 1);
	$: scaledIndexed = data.chartData.indexed.map((v) => (v / maxIndexed) * 100);
</script>

<div class="min-h-screen text-gray-900 dark:text-gray-100">
	<header class="bg-white dark:bg-gray-800 shadow-md">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<h1 class="text-3xl font-bold">{data.username}'s stats</h1>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="grid gap-6 sm:grid-cols-3">
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Member Since</h2>
				<p class="text-3xl font-bold">{new Date(data.dateJoined).getFullYear()}</p>
			</div>
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Total Results Indexed</h2>
				<p class="text-3xl font-bold">{data.totalIndexed.toLocaleString()}</p>
			</div>
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Indexed Today</h2>
				<p class="text-3xl font-bold">{data.myIndexedToday.toLocaleString()}</p>
			</div>
		</div>

		<div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h2 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-4">Results Indexed Per Day (Last 30 Days)</h2>
			<div class="flex items-end gap-1 h-64 w-full">
				{#each data.chartLabels as label, i}
					<div class="flex flex-col justify-end items-center flex-1 h-64 min-w-0" title="{label}: {data.chartData.indexed[i]}">
						<div
							class="w-full bg-blue-500 dark:bg-blue-600 rounded-t"
							style="height: {scaledIndexed[i] || 0}%; min-height: 16px"
						></div>
					</div>
				{/each}
			</div>
			<div class="flex justify-between text-gray-500 dark:text-gray-400 mt-2">
				<span>{data.chartLabels[0]}</span>
				<span>{data.chartLabels[data.chartLabels.length - 1]}</span>
			</div>
		</div>
	</main>
</div>
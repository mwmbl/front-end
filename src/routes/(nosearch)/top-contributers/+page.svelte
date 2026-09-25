<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	
	const yesterdayData = data.yesterday || [];
	const allTimeData = data.allTime || [];
	
	let activeTab = $state('yesterday');
	
	function formatNumber(num: number) {
		return new Intl.NumberFormat().format(num);
	}
</script>

<svelte:head>
	<title>Top Contributors - MWMBL</title>
</svelte:head>

<main class="flex w-full max-w-2xl flex-col gap-2 self-center px-6">
	<h1 class="text-2xl font-bold mb-4">Top Contributors</h1>

	<p class="mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
		This page ranks contributors by the number of pages their web crawlers added to
		MWMBL. “Yesterday” shows the last 24 hours; “All Time” shows cumulative totals.
	</p>

	<p class="mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
		Want to help? Create an account, and run the crawler. See the <a href="https://book.mwmbl.org/page/community/#running-the-mwmbl-crawler-with-docker-compose"
		class="text-blue-600 underline" target="_blank" rel="noopener">Running the Crawler page</a> for details.
		You can also help anonymously by installing the <a href="https://addons.mozilla.org/en-US/firefox/addon/mwmbl-crawler/"
		class="text-blue-600 underline" target="_blank" rel="noopener">Firefox add‑on</a> or the
		<a href="https://chrome.google.com/webstore/detail/mwmbl-crawler/"
		class="text-blue-600 underline" target="_blank" rel="noopener">Chrome extension</a>.
	</p>

	<div class="mb-4 flex space-x-4">
		<a class={activeTab === 'yesterday' ? 'text-blue-600 font-bold' : 'text-blue-600 hover:underline'} href="#" onclick={() => { activeTab = 'yesterday'; return false; }}>
			Yesterday
		</a>
		<a class={activeTab === 'all' ? 'text-blue-600 font-bold' : 'text-blue-600 hover:underline'} href="#" onclick={() => { activeTab = 'all'; return false; }}>
			All Time
		</a>
	</div>
	
	{#if activeTab === 'yesterday'}
		{#if yesterdayData.length === 0}
			<p class="text-center text-gray-500 py-8">No data available for yesterday.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="min-w-full border-collapse border border-gray-300">
					<thead>
						<tr class="bg-gray-100">
							<th class="px-4 py-2 border border-gray-300 text-left text-black">Rank</th>
							<th class="px-4 py-2 border border-gray-300 text-left text-black">Username</th>
							<th class="px-4 py-2 border border-gray-300 text-left text-black">Indexed Results</th>
						</tr>
					</thead>
					<tbody>
						{#each yesterdayData as user, i}
							<tr class="hover:text-yellow-500">
								<td class="px-4 py-2 border border-gray-300">{i + 1}</td>
								<td class="px-4 py-2 border border-gray-300">{user.username}</td>
								<td class="px-4 py-2 border border-gray-300">{formatNumber(user.score ?? 0)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else}
		{#if allTimeData.length === 0}
			<p class="text-center text-gray-500 py-8">No data available for all time.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="min-w-full border-collapse border border-gray-300">
					<thead>
						<tr class="bg-gray-100">
							<th class="px-4 py-2 border border-gray-300 text-left text-black">Rank</th>
							<th class="px-4 py-2 border border-gray-300 text-left text-black">Username</th>
							<th class="px-4 py-2 border border-gray-300 text-left text-black">Indexed Results</th>
						</tr>
					</thead>
					<tbody>
						{#each allTimeData as user, i}
							<tr class="hover:text-yellow-500">
								<td class="px-4 py-2 border border-gray-300">{i + 1}</td>
								<td class="px-4 py-2 border border-gray-300">{user.username}</td>
								<td class="px-4 py-2 border border-gray-300">{formatNumber(user.score ?? 0)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</main>
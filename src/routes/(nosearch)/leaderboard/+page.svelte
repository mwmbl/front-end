<script lang="ts">
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	
	// Debug: log the data
	console.log('Leaderboard data received:', data);
	
	const yesterdayData = data.yesterday || [];
	const allTimeData = data.allTime || [];
	
	console.log('yesterdayData:', yesterdayData);
	console.log('allTimeData:', allTimeData);
	
	let activeTab = $state('yesterday');
	
	function formatNumber(num: number) {
		return new Intl.NumberFormat().format(num);
	}
</script>

<svelte:head>
	<title>Leaderboard - MWMBL</title>
</svelte:head>

<main class="flex w-full max-w-2xl flex-col gap-2 self-center px-6">
	<h1 class="text-2xl font-bold mb-4">Leaderboard</h1>
	
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
<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { getCookies } from '@/cookies.svelte';

	import RiArrowUpSLine from '~icons/ri/arrow-up-s-line';
	import RiArrowDownSLine from '~icons/ri/arrow-down-s-line';

	let {
		url,
		query
	}: {
		url: string;
		query?: string;
	} = $props();

	let currentVote: null | 'upvote' | 'downvote' = $state(null);

	async function vote(type: 'upvote' | 'downvote') {
		if (!query) return; // it should always exist, but let's not make bad api calls

		if (currentVote !== type) {
			const res = await fetch('/api/v1/platform/search-results/vote', {
				method: 'POST',
				body: JSON.stringify({
					url,
					query,
					vote_type: type
				})
			});
			if (res.ok) {
				currentVote = type;
			} else {
				currentVote = null;
			}
		} else {
			const res = await fetch('/api/v1/platform/search-results/vote', {
				method: 'DELETE',
				body: JSON.stringify({
					url,
					query
				})
			});
			if (res.ok) {
				currentVote = null;
			}
		}

		const res = await fetch(`/api/v1/platform/search-results/votes?query=${query}&urls=${url}`, {
			method: 'GET'
		});
		if (res.ok) {
			const data = await res.json();
			currentVote = data.votes[url].user_vote;
		}
	}
</script>

<div
	class="flex flex-col items-center justify-center gap-3 p-4 shadow-md [clip-path:inset(0_0_0_-15px)]"
>
	<Button
		size="icon"
		variant="outline"
		class={currentVote === 'upvote'
			? 'text-accent-text hover:text-gray-500'
			: ' hover:text-accent-text'}
		onclick={(e) => {
			e.preventDefault();
			vote('upvote');
		}}
	>
		<RiArrowUpSLine class="size-8" />
	</Button>
	<Button
		size="icon"
		variant="outline"
		class={currentVote === 'downvote'
			? 'text-accent-text hover:text-gray-500'
			: ' hover:text-accent-text'}
		onclick={(e) => {
			e.preventDefault();
			vote('downvote');
		}}
	>
		<RiArrowDownSLine class="size-8" />
	</Button>
</div>

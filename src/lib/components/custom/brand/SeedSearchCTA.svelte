<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import PromoCard from './PromoCard.svelte';

	let { loginStatus }: { loginStatus: string } = $props();

	const loggedIn = $derived(loginStatus === 'assumeLoggedIn');
	const loginHref = $derived(
		`/account?next=${encodeURIComponent(page.url.pathname + page.url.search)}`
	);

	let saving = $state(false);
	let failed = $state(false);
	async function tryIt() {
		if (!loggedIn) {
			await goto(loginHref);
			return;
		}
		saving = true;
		failed = false;
		try {
			const res = await fetch('/seed-search', {
				method: 'POST',
				// The Accept header routes this to +server.ts rather than the /seed-search page.
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({ enabled: true })
			});
			if (!res.ok) failed = true;
			await invalidateAll();
		} catch (err) {
			console.log('Turning on Seed Search failed: ', err);
			failed = true;
		} finally {
			saving = false;
		}
	}
</script>

<PromoCard
	title="Try Seed Search"
	action={saving ? 'Turning on…' : 'Try it'}
	onclick={tryIt}
	disabled={saving}
>
	Combine high quality results from The European Search Perspective (EUSP) with Mwmbl results and
	help grow our index.
	{#snippet after()}
		{#if failed}
			<span class="text-muted-foreground mt-2 block text-sm"
				>Couldn't turn on Seed Search. Try again later.</span
			>
		{/if}
	{/snippet}
</PromoCard>

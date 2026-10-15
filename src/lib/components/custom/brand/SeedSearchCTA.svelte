<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { Button } from '@/components/ui/button';

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

<div
	class="bg-card overflow-hidden rounded-2xl border border-black/12 shadow-md dark:border-transparent dark:shadow-none"
>
	<div class="bg-brand-gradient h-1.5"></div>
	<div class="p-5">
		<h2 class="font-display mb-2 text-xl font-extrabold">Try Seed Search</h2>
		<p class="text-foreground/80 leading-relaxed">
			Combine high quality results from The European Search Perspective (EUSP) with Mwmbl results
			and help grow our index.
		</p>
		<Button class="mt-4" onclick={tryIt} disabled={saving}>
			{saving ? 'Turning on…' : 'Try it'}
		</Button>
		{#if failed}
			<p class="text-muted-foreground mt-2 text-sm">
				Couldn't turn on Seed Search. Try again later.
			</p>
		{/if}
	</div>
</div>

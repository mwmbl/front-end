<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { Switch } from '@/components/ui/switch';
	import { Label } from '@/components/ui/label';

	let {
		loginStatus,
		enabled,
		quotaExhausted
	}: { loginStatus: string; enabled: boolean; quotaExhausted: boolean } = $props();

	const loggedIn = $derived(loginStatus === 'assumeLoggedIn');
	const disabled = $derived(!loggedIn || quotaExhausted);

	let checked = $state(false);
	$effect.pre(() => {
		checked = enabled && !disabled;
	});

	let saving = $state(false);
	async function onCheckedChange(value: boolean) {
		saving = true;
		try {
			const res = await fetch('/seed-search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled: value })
			});
			if (!res.ok) checked = !value;
			await invalidateAll();
		} catch (err) {
			console.log('Saving Seed Search setting failed: ', err);
			checked = !value;
		} finally {
			saving = false;
		}
	}

	const loginHref = $derived(
		`/account?next=${encodeURIComponent(page.url.pathname + page.url.search)}`
	);
</script>

<div class="flex shrink-0 flex-row items-center gap-2">
	<Switch
		id="seed-search-switch"
		bind:checked
		{onCheckedChange}
		disabled={disabled || saving}
		class="data-[state=checked]:bg-brand-gradient"
	/>
	{#if !loggedIn}
		<a href={loginHref} class="text-muted-foreground text-sm underline">Log in to use Seed Search</a
		>
	{:else if quotaExhausted}
		<Label for="seed-search-switch" class="text-muted-foreground text-sm">
			Seed Search quota used up
		</Label>
	{:else}
		<Label for="seed-search-switch" class="text-sm">Seed Search</Label>
	{/if}
</div>

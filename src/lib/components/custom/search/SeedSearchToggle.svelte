<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { Switch } from '@/components/ui/switch';
	import { Label } from '@/components/ui/label';

	let {
		loginStatus,
		enabled,
		quotaExhausted,
		showDescription = false
	}: {
		loginStatus: string;
		enabled: boolean;
		quotaExhausted: boolean;
		showDescription?: boolean;
	} = $props();

	const loggedIn = $derived(loginStatus === 'assumeLoggedIn');
	const disabled = $derived(!loggedIn || quotaExhausted);
	const loginHref = $derived(
		`/account?next=${encodeURIComponent(page.url.pathname + page.url.search)}`
	);

	let checked = $state(false);
	$effect.pre(() => {
		checked = enabled && !disabled;
	});

	let saving = $state(false);
	async function onCheckedChange(value: boolean) {
		// Logged-out users are sent to log in, same as the link next to the switch.
		if (!loggedIn) {
			checked = false;
			await goto(loginHref);
			return;
		}
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
</script>

<div class="flex shrink-0 flex-row items-center gap-2">
	<Switch
		id="seed-search-switch"
		bind:checked
		{onCheckedChange}
		disabled={quotaExhausted || saving}
		class="data-[state=checked]:bg-brand-gradient"
	/>
	{#if !loggedIn && showDescription}
		<p class="text-sm leading-snug font-bold">
			<a href={loginHref} class="underline">Log in to use Seed Search</a> — help build our index with
			high quality results from EUSP and ranking from Typesafe AI
		</p>
	{:else if !loggedIn}
		<a href={loginHref} class="text-muted-foreground text-sm underline">Log in to use Seed Search</a
		>
	{:else if quotaExhausted}
		<Label for="seed-search-switch" class="text-muted-foreground text-sm">
			Seed Search quota used up
		</Label>
	{:else}
		<Label
			for="seed-search-switch"
			class={['text-sm leading-snug', showDescription && 'font-bold']}
		>
			{#if showDescription}
				Seed Search — help build our index with high quality results from EUSP and ranking from
				Typesafe AI
			{:else}
				Seed Search
			{/if}
		</Label>
	{/if}
</div>

<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Skeleton } from '@/components/ui/skeleton';
	import { localStoragePreferences } from '@/localStoragePreferences.svelte';
	import { Button } from '@/components/ui/button';

	import { toggleMode } from 'mode-watcher';
	import PhSunFill from '~icons/ph/sun-fill';
	import PhMoonFill from '~icons/ph/moon-fill';

	let preferences = localStoragePreferences();

	let loaded = $state(false);
	$effect(() => {
		loaded = true;
	});
</script>

<main class="flex w-full max-w-2xl flex-col gap-2 self-center px-6">
	<h2 class="-mx-2 text-3xl">Preferences</h2>
	<hr class="my-2" />
	<div class="flex w-full max-w-2xl flex-row items-center justify-start gap-3">
		{#if !loaded}
			<Skeleton class="h-[24px] w-[44px] rounded-full bg-input" />
		{:else}
			<Switch id="newtab-switch" class="switch-fade" bind:checked={preferences.openInNewTab} />
		{/if}
		<Label for="newtab-switch">Open results in new tab</Label>
	</div>
	<div class="flex w-full max-w-2xl flex-row items-center justify-start gap-3">
		<Button
			on:click={toggleMode}
			variant="outline"
			size="icon"
			id="dark-toggle"
			title="Toggle theme"
			aria-label="Toggle theme"
		>
			<PhSunFill
				class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
			/>
			<PhMoonFill
				class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
			/>
		</Button>
		<Label for="dark-toggle">Switch between dark / light mode</Label>
	</div>
</main>

<style>
	@keyframes switch-fade {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
	:global(.switch-fade) {
		animation: switch-fade 0.2s ease-in-out;
	}
</style>

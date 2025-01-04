<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Skeleton } from '@/components/ui/skeleton';
	import { localStorageOptions } from '@/localStorageOptions.svelte';
	import { Button } from '@/components/ui/button';

	import { toggleMode } from 'mode-watcher';
	import PhSunFill from '~icons/ph/sun-fill';
	import PhMoonFill from '~icons/ph/moon-fill';

	let options = localStorageOptions();

	let loaded = $state(false);
	$effect(() => {
		loaded = true;
	});
</script>

<div class="flex flex-col gap-3">
	<div class="flex w-full max-w-2xl flex-row items-center justify-start gap-3">
		{#if !loaded}
			<Skeleton class="h-[24px] w-[44px] rounded-full bg-input" />
		{:else}
			<Switch id="newtab-switch" class="switch-fade" bind:checked={options.openInNewTab} />
		{/if}
		<Label for="newtab-switch">Open results in new tab</Label>
	</div>
	<div class="flex w-full max-w-2xl flex-row items-center justify-start gap-3">
		<Button
			on:click={toggleMode}
			variant="secondary"
			class="relative"
			id="dark-toggle"
			title="Toggle theme"
			aria-label="Toggle theme"
		>
			<PhSunFill
				class="absolute left-3.5 top-[0.66rem] h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
			/>
			<PhMoonFill
				class="absolute left-3.5 top-[0.66rem] h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
			/>
			<span class="ml-6 hidden dark:inline">Dark</span>
			<span class="ml-6 inline dark:hidden">Light</span>
		</Button>
		<Label for="dark-toggle">Switch theme</Label>
	</div>
</div>

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

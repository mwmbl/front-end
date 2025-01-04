<script>
	import '../app.css';
	import '@fontsource/hind-vadodara/300.css';
	import '@fontsource/hind-vadodara/400.css';
	import '@fontsource/hind-vadodara/500.css';
	import '@fontsource/hind-vadodara/600.css';
	import '@fontsource/hind-vadodara/700.css';
	import '@fontsource-variable/nunito';

	import { ModeWatcher } from 'mode-watcher';

	import { navigating } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head>
	<title>MWMBL</title>
	<meta property="og:title" content="The first truly open source search engine" />
	<meta property="og:site_name" content="MWMBL Search Engine" />
	<meta property="og:type" content="website" />
	<meta
		property="og:description"
		content={'Mwmbl (pronounced "mumble") is the first search engine that\'s completely independent, open source, and non-profit.'}
	/>
	<meta property="og:determiner" content="the" />
</svelte:head>

<ModeWatcher />
<div class="flex min-h-screen flex-col">
	{#if $navigating?.to != null}
		<div
			class="loading-animation absolute left-0 right-0 top-0 h-2 w-[200vw] bg-brand-gradient opacity-50"
		></div>
		<div
			class="loading-animation div-2 animation-delay-50 absolute left-0 right-0 top-0 h-2 w-[200vw] bg-brand-gradient opacity-50"
		></div>
	{/if}
	{@render children()}
</div>

<style>
	@keyframes loading {
		0% {
			transform: translateX(100%);
		}
		100% {
			transform: translateX(-100%);
		}
	}
	.loading-animation {
		animation: loading 4s linear infinite;
		background-image: linear-gradient(
			in oklab 130deg,
			hsla(0, 0%, 100%, 0%),
			hsla(48, 100%, 61%, var(--tw-bg-opacity)),
			hsla(283, 100%, 77%, var(--tw-bg-opacity)),
			hsla(206, 100%, 73%, var(--tw-bg-opacity)),
			hsla(0, 0%, 100%, 0%)
		);
	}
	.loading-animation.div-2 {
		animation-delay: 2s;
	}
</style>

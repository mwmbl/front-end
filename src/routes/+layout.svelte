<script>
	import '../app.css';
	import '@fontsource/hind-vadodara/300.css';
	import '@fontsource/hind-vadodara/400.css';
	import '@fontsource/hind-vadodara/500.css';
	import '@fontsource/hind-vadodara/600.css';
	import '@fontsource/hind-vadodara/700.css';

	import { ModeWatcher } from 'mode-watcher';
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
	<slot></slot>
</div>

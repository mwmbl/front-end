<script>
	import '../app.css';
	import '@fontsource/hind-vadodara/300.css';
	import '@fontsource/hind-vadodara/400.css';
	import '@fontsource/hind-vadodara/500.css';
	import '@fontsource/hind-vadodara/600.css';
	import '@fontsource/hind-vadodara/700.css';

	import { ModeWatcher } from 'mode-watcher';
</script>

<ModeWatcher />
<div class="flex min-h-screen flex-col">
	<slot></slot>
</div>

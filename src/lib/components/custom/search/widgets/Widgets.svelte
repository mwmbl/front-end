<script lang="ts">
	import type { Widget } from '$lib/widgets';
	import CalculationCard from './CalculationCard.svelte';
	import ProviderWidget from './ProviderWidget.svelte';

	let { widgets, query }: { widgets: Widget[]; query: string } = $props();
</script>

{#each widgets as widget, i (widget.type === 'widget' ? widget.url : `calculation-${i}`)}
	{#if widget.type === 'calculation'}
		<CalculationCard {widget} />
	{:else}
		<ProviderWidget stub={widget} {query} />
	{/if}
{/each}

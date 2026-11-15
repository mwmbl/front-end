<script lang="ts">
	import { API_BASE } from '$lib/api';
	import {
		parseForecast,
		parseWidgetValues,
		widgetTitle,
		widgetValuesUrl,
		type Forecast,
		type WidgetStub,
		type WidgetValues
	} from '$lib/widgets';
	import FieldsCard from './FieldsCard.svelte';
	import ForecastCard from './ForecastCard.svelte';

	let { stub, query }: { stub: WidgetStub; query: string } = $props();

	type State =
		| { status: 'loading' }
		| { status: 'hidden' }
		| { status: 'fields'; values: WidgetValues }
		| { status: 'forecast'; forecast: Forecast };

	let widget: State = $state({ status: 'loading' });

	// Weather stubs are known before their values arrive, so the loading card has the right shape.
	const looksLikeForecast = $derived(stub.sourceName === 'Open-Meteo.com');

	// Fetched from the browser rather than in `load`: the endpoint limits requests per caller
	// address, and every request from this server would share one address.
	$effect(() => {
		const controller = new AbortController();
		widget = { status: 'loading' };
		fetch(widgetValuesUrl(API_BASE, stub, query), { signal: controller.signal })
			.then((res) => (res.ok ? res.json() : null))
			.then((json) => {
				const values = parseWidgetValues(json);
				const forecast = values?.display === 'forecast' ? parseForecast(values.fields) : null;
				// Any failure (no widget, provider down, rate limited) just leaves the widget out.
				if (!values) widget = { status: 'hidden' };
				else if (forecast) widget = { status: 'forecast', forecast };
				else widget = { status: 'fields', values };
			})
			.catch((err) => {
				if (!controller.signal.aborted) {
					console.log('Widget failed: ', err);
					widget = { status: 'hidden' };
				}
			});
		return () => controller.abort();
	});

	const title = $derived(widgetTitle(stub));
</script>

{#if widget.status === 'forecast' || (widget.status === 'loading' && looksLikeForecast)}
	<ForecastCard
		{title}
		sourceName={stub.sourceName}
		shareUrl={stub.url}
		forecast={widget.status === 'forecast' ? widget.forecast : null}
	/>
{:else if widget.status === 'fields' || widget.status === 'loading'}
	<FieldsCard
		{title}
		sourceName={stub.sourceName}
		shareUrl={stub.url}
		values={widget.status === 'fields' ? widget.values : null}
	/>
{/if}

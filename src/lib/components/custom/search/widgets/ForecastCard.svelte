<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	import {
		formatDay,
		formatTemperature,
		formatWind,
		weatherIcon,
		type Forecast,
		type TemperatureUnit
	} from '$lib/widgets';
	import WeatherIcon from './WeatherIcon.svelte';
	import WidgetFooter from './WidgetFooter.svelte';

	// `forecast` is null while it loads: the title and source come with the search results.
	let {
		title,
		sourceName,
		shareUrl,
		forecast
	}: { title: string; sourceName: string; shareUrl: string; forecast: Forecast | null } = $props();

	const UNIT_KEY = 'temperatureUnit';

	let unit: TemperatureUnit = $state('c');

	// Read after hydration, so the server's °C markup and the first client render agree.
	$effect(() => {
		try {
			if (window.localStorage.getItem(UNIT_KEY) === 'f') unit = 'f';
		} catch {
			// Storage is blocked: stay in °C.
		}
	});

	function setUnit(value: TemperatureUnit) {
		unit = value;
		try {
			window.localStorage.setItem(UNIT_KEY, value);
		} catch {
			// The choice just isn't remembered.
		}
	}

	const daysAhead = $derived(forecast ? forecast.days.length : 3);

	// Open-Meteo's data is CC BY 4.0, which asks for the credit to name the licence.
	const licence = $derived(sourceName === 'Open-Meteo.com' ? 'CC BY 4.0' : '');
</script>

<Card.Root
	class="gap-4 border px-6 pt-5 pb-0"
	role="region"
	aria-label={title}
	aria-busy={forecast == null}
>
	<div>
		<h2 class="text-accent-text text-lg leading-6 font-medium">{title}</h2>
		<p class="text-muted-foreground mt-0.5 text-sm">
			{#if daysAhead === 0}
				Now
			{:else if daysAhead === 1}
				Now and tomorrow
			{:else}
				Now and the next {daysAhead} days
			{/if}
		</p>
	</div>

	{#if forecast}
		<div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
			<div class="flex flex-none flex-col justify-center gap-1.5 sm:w-56">
				<div class="flex items-center gap-2.5">
					<WeatherIcon icon={weatherIcon(forecast.conditions)} class="-my-2 -ml-2.5 h-18 w-18" />
					<span class="text-foreground text-5xl font-semibold tracking-tight tabular-nums">
						{formatTemperature(forecast.temperature, unit)}
					</span>
				</div>
				{#if forecast.conditions}
					<div class="text-foreground font-medium">{forecast.conditions}</div>
				{/if}
				{#if forecast.wind != null}
					<div class="text-unemphasized-2 flex items-center gap-1.5 text-sm">
						<WeatherIcon icon="wind" class="-my-1 -ml-1 h-5.5 w-5.5" />
						Wind {formatWind(forecast.wind, unit)}
					</div>
				{/if}
			</div>
			{#if forecast.days.length > 0}
				<ul class="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:gap-3">
					{#each forecast.days as day (day.date)}
						{@const when = formatDay(day.date)}
						<li class="bg-secondary/40 flex min-w-0 flex-col gap-1.5 rounded-lg px-3 py-2.5">
							<div class="flex flex-wrap items-baseline gap-x-1.5">
								<strong class="text-foreground text-sm font-semibold">{when.weekday}</strong>
								<span class="text-muted-foreground text-xs">{when.date}</span>
							</div>
							<WeatherIcon icon={weatherIcon(day.conditions)} class="-my-1.5 -ml-2 h-12 w-12" />
							<div class="text-unemphasized-2 min-h-8 text-xs leading-4 wrap-break-word">
								{day.conditions}
							</div>
							<div class="flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums">
								{#if day.high != null}
									<strong class="text-foreground font-semibold">
										<span class="sr-only">High</span>
										{formatTemperature(day.high, unit)}
									</strong>
								{/if}
								{#if day.low != null}
									<span class="text-muted-foreground">
										<span class="sr-only">Low</span>
										{formatTemperature(day.low, unit)}
									</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else}
		<div class="flex animate-pulse flex-col gap-4 sm:h-36 sm:flex-row sm:gap-6" aria-hidden="true">
			<div class="flex flex-none flex-col justify-center gap-2.5 sm:w-56">
				<div class="flex items-center gap-3.5">
					<div class="bg-muted h-12 w-12 rounded-xl"></div>
					<div class="bg-muted h-12 w-22 rounded-lg"></div>
				</div>
				<div class="bg-muted h-4 w-30 rounded-md"></div>
				<div class="bg-muted h-3 w-24 rounded-md"></div>
			</div>
			<div class="grid h-36 flex-1 grid-cols-3 gap-2 sm:gap-3">
				<div class="bg-secondary/40 rounded-lg"></div>
				<div class="bg-secondary/40 rounded-lg"></div>
				<div class="bg-secondary/40 rounded-lg"></div>
			</div>
		</div>
	{/if}

	<WidgetFooter label="Weather data by" {sourceName} {shareUrl} {licence}>
		<div
			role="group"
			aria-label="Temperature unit"
			class="bg-secondary/40 flex gap-0.5 rounded-lg p-0.5"
		>
			{#each [['c', '°C'], ['f', '°F']] as const as [value, label] (value)}
				<button
					type="button"
					aria-pressed={unit === value}
					onclick={() => setUnit(value)}
					class={[
						'h-9 min-w-11 rounded-md text-sm font-semibold',
						unit === value
							? 'bg-card text-foreground shadow-sm'
							: 'text-unemphasized-2 hover:text-foreground'
					]}
				>
					{label}
				</button>
			{/each}
		</div>
	</WidgetFooter>
</Card.Root>

<script lang="ts">
	// Meteocons by Bas Milius (MIT), "fill" style, through Iconify.
	import ClearDay from '~icons/meteocons/clear-day-fill';
	import PartlyCloudyDay from '~icons/meteocons/partly-cloudy-day-fill';
	import Overcast from '~icons/meteocons/overcast-fill';
	import Fog from '~icons/meteocons/fog-fill';
	import Drizzle from '~icons/meteocons/drizzle-fill';
	import Rain from '~icons/meteocons/rain-fill';
	import ExtremeRain from '~icons/meteocons/extreme-rain-fill';
	import Sleet from '~icons/meteocons/sleet-fill';
	import Snow from '~icons/meteocons/snow-fill';
	import ExtremeSnow from '~icons/meteocons/extreme-snow-fill';
	import PartlyCloudyDayRain from '~icons/meteocons/partly-cloudy-day-rain-fill';
	import PartlyCloudyDaySnow from '~icons/meteocons/partly-cloudy-day-snow-fill';
	import Thunderstorms from '~icons/meteocons/thunderstorms-fill';
	import Hail from '~icons/meteocons/hail-fill';
	import NotAvailable from '~icons/meteocons/not-available-fill';
	import Wind from '~icons/meteocons/wind-fill';

	import type { WeatherIcon } from '$lib/widgets';

	let { icon, class: className = '' }: { icon: WeatherIcon | 'wind'; class?: string } = $props();

	const ICONS: Record<WeatherIcon | 'wind', typeof ClearDay> = {
		'clear-day': ClearDay,
		'partly-cloudy-day': PartlyCloudyDay,
		overcast: Overcast,
		fog: Fog,
		drizzle: Drizzle,
		rain: Rain,
		'extreme-rain': ExtremeRain,
		sleet: Sleet,
		snow: Snow,
		'extreme-snow': ExtremeSnow,
		'partly-cloudy-day-rain': PartlyCloudyDayRain,
		'partly-cloudy-day-snow': PartlyCloudyDaySnow,
		thunderstorms: Thunderstorms,
		hail: Hail,
		'not-available': NotAvailable,
		wind: Wind
	};

	const Icon = $derived(ICONS[icon]);

	// The icons animate with SMIL, which CSS can't pause, so stop them here for people who
	// would rather not have motion. They stop a moment in, where every part is showing.
	function stillIfReducedMotion(node: HTMLElement) {
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const svg = node.querySelector('svg');
		svg?.setCurrentTime(0.5);
		svg?.pauseAnimations();
	}
</script>

{#key icon}
	<span class="contents" use:stillIfReducedMotion aria-hidden="true">
		<Icon class={className} />
	</span>
{/key}

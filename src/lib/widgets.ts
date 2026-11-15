// Widgets above the search results (mwmbl/mwmbl#317).
//
// A search response's `widgets` holds calculations, worked out by Mwmbl and complete, and stubs for
// widgets whose values come from another site. A stub's values are fetched from /api/v2/widgets/
// with its `url`, from the browser: the endpoint limits requests per caller address, so asking it
// from this server would share one allowance between everyone.

export type CalculationWidget = { type: 'calculation'; expression: string; result: string };
export type WidgetStub = { type: 'widget'; title: string; url: string; sourceName: string };
export type Widget = CalculationWidget | WidgetStub;

export type WidgetField = { label: string; value: string; unit: string };
export type WidgetInput = { name: string; label: string; value: string };
export type WidgetValues = {
	display: 'fields' | 'form' | 'forecast';
	fields: WidgetField[];
	inputs: WidgetInput[];
	shareUrl: string;
};

function httpsUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	try {
		return new URL(value).protocol === 'https:' ? value : null;
	} catch {
		return null;
	}
}

function text(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function record(value: unknown): Record<string, unknown> | null {
	return value != null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

// Unknown widget types are left out, so the API can add one without breaking this page.
export function parseWidgets(raw: unknown): Widget[] {
	if (!Array.isArray(raw)) return [];
	const widgets: Widget[] = [];
	for (const entry of raw) {
		const item = record(entry);
		if (item?.type === 'calculation') {
			const expression = text(item.expression).trim();
			const result = text(item.result).trim();
			if (expression && result) widgets.push({ type: 'calculation', expression, result });
		} else if (item?.type === 'widget') {
			const url = httpsUrl(item.url);
			const title = text(item.title).trim();
			if (url && title) {
				widgets.push({ type: 'widget', title, url, sourceName: text(item.source_name).trim() });
			}
		}
	}
	return widgets;
}

export function widgetValuesUrl(apiBase: string, stub: WidgetStub, query: string): string {
	const params = new URLSearchParams({ url: stub.url, q: query });
	return `${apiBase}/api/v2/widgets/?${params}`;
}

export function parseWidgetValues(raw: unknown): WidgetValues | null {
	const item = record(raw);
	if (!item || !Array.isArray(item.fields)) return null;
	const display =
		item.display === 'forecast' || item.display === 'form' ? item.display : ('fields' as const);
	const fields = item.fields
		.map(record)
		.filter((field) => field != null && typeof field.value === 'string' && field.value !== '')
		.map((field) => ({
			label: text(field!.label),
			value: text(field!.value),
			unit: text(field!.unit)
		}));
	if (fields.length === 0) return null;
	const inputs = (Array.isArray(item.inputs) ? item.inputs : [])
		.map(record)
		.filter((input) => input != null && typeof input.value === 'string' && input.value !== '')
		.map((input) => ({
			name: text(input!.name),
			label: text(input!.label),
			value: text(input!.value)
		}));
	const shareUrl = httpsUrl(item.share_url) ?? '';
	return { display, fields, inputs, shareUrl };
}

// The stub's title names the site after a comma ("Salary to hourly calculator, tannerd.net"); the
// card shows the site in its footer instead.
export function widgetTitle(stub: WidgetStub): string {
	const suffix = `, ${stub.sourceName}`;
	return stub.sourceName && stub.title.endsWith(suffix)
		? stub.title.slice(0, -suffix.length)
		: stub.title;
}

const PLAIN_NUMBER = /^(-?)(\d+)(\.\d+)?$/;

// Digit grouping for plain numbers ("4166.67" → "4,166.67"), leaving the decimals as given.
// Anything else (dates, words) is shown as it is.
export function formatValue(value: string): string {
	const match = PLAIN_NUMBER.exec(value.trim());
	if (!match) return value;
	const [, sign, whole, decimals = ''] = match;
	return `${sign}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${decimals}`;
}

export type ForecastDay = {
	date: string;
	conditions: string;
	high: number | null;
	low: number | null;
};
export type Forecast = {
	temperature: number;
	conditions: string;
	wind: number | null;
	days: ForecastDay[];
};

function numberValue(value: string | undefined): number | null {
	if (value == null || !/^-?\d+(\.\d+)?$/.test(value.trim())) return null;
	return Number(value);
}

// The forecast endpoint gives its values as labelled fields: "Temperature", "Conditions", "Wind", then
// "Day N", "Day N conditions", "Day N high" and "Day N low" for each day ahead. A field whose value
// the provider lacked is left out, so each is optional except the current temperature.
export function parseForecast(fields: WidgetField[]): Forecast | null {
	const byLabel = new Map(fields.map((field) => [field.label, field.value]));
	const temperature = numberValue(byLabel.get('Temperature'));
	if (temperature == null) return null;
	const days: ForecastDay[] = [];
	for (let n = 1; byLabel.has(`Day ${n}`); n++) {
		const date = byLabel.get(`Day ${n}`)!;
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
		days.push({
			date,
			conditions: byLabel.get(`Day ${n} conditions`) ?? '',
			high: numberValue(byLabel.get(`Day ${n} high`)),
			low: numberValue(byLabel.get(`Day ${n} low`))
		});
	}
	return {
		temperature,
		conditions: byLabel.get('Conditions') ?? '',
		wind: numberValue(byLabel.get('Wind')),
		days
	};
}

export type TemperatureUnit = 'c' | 'f';

export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
	const degrees = unit === 'f' ? (celsius * 9) / 5 + 32 : celsius;
	// Math.round gives -0 for small negatives, which would show as "-0°".
	return `${Math.round(degrees) || 0}°`;
}

export function formatWind(kmh: number, unit: TemperatureUnit): string {
	return unit === 'f' ? `${Math.round(kmh / 1.609344)} mph` : `${Math.round(kmh)} km/h`;
}

// A day as "Mon" and "16 Nov". The date is the place's own, so it is read as UTC and shown as UTC.
export function formatDay(isoDate: string, locale?: string): { weekday: string; date: string } {
	const date = new Date(`${isoDate}T12:00:00Z`);
	return {
		weekday: date.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }),
		date: date.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
	};
}

export type WeatherIcon =
	| 'clear-day'
	| 'partly-cloudy-day'
	| 'overcast'
	| 'fog'
	| 'drizzle'
	| 'rain'
	| 'extreme-rain'
	| 'sleet'
	| 'snow'
	| 'extreme-snow'
	| 'partly-cloudy-day-rain'
	| 'partly-cloudy-day-snow'
	| 'thunderstorms'
	| 'hail'
	| 'not-available';

// The WMO weather code words the API gives (mwmbl/widgets/wmo.py), as Meteocons icons.
const WEATHER_ICONS: Record<string, WeatherIcon> = {
	'clear sky': 'clear-day',
	'mainly clear': 'partly-cloudy-day',
	'partly cloudy': 'partly-cloudy-day',
	overcast: 'overcast',
	fog: 'fog',
	'rime fog': 'fog',
	'light drizzle': 'drizzle',
	'moderate drizzle': 'drizzle',
	'dense drizzle': 'drizzle',
	'light freezing drizzle': 'sleet',
	'dense freezing drizzle': 'sleet',
	'slight rain': 'rain',
	'moderate rain': 'rain',
	'heavy rain': 'extreme-rain',
	'light freezing rain': 'sleet',
	'heavy freezing rain': 'sleet',
	'slight snow': 'snow',
	'moderate snow': 'snow',
	'heavy snow': 'extreme-snow',
	'snow grains': 'snow',
	'slight rain showers': 'partly-cloudy-day-rain',
	'moderate rain showers': 'partly-cloudy-day-rain',
	'violent rain showers': 'extreme-rain',
	'slight snow showers': 'partly-cloudy-day-snow',
	'heavy snow showers': 'partly-cloudy-day-snow',
	thunderstorm: 'thunderstorms',
	'thunderstorm with slight hail': 'hail',
	'thunderstorm with heavy hail': 'hail'
};

export function weatherIcon(conditions: string): WeatherIcon {
	return WEATHER_ICONS[conditions.trim().toLowerCase()] ?? 'not-available';
}

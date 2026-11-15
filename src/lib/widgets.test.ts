import { describe, expect, it } from 'vitest';

import {
	formatDay,
	formatTemperature,
	formatValue,
	formatWind,
	parseForecast,
	parseWidgetValues,
	parseWidgets,
	weatherIcon,
	widgetTitle,
	widgetValuesUrl,
	type WidgetStub
} from './widgets';

const stub = {
	type: 'widget',
	title: 'York weather, United Kingdom',
	url: 'https://open-meteo.com/en/docs?latitude=53.95763&longitude=-1.08271&ref=mwmbl',
	source_name: 'Open-Meteo.com'
};

describe('parseWidgets', () => {
	it('maps calculations and stubs', () => {
		expect(
			parseWidgets([{ type: 'calculation', expression: '164*8', result: '1312' }, stub])
		).toEqual([
			{ type: 'calculation', expression: '164*8', result: '1312' },
			{ type: 'widget', title: stub.title, url: stub.url, sourceName: 'Open-Meteo.com' }
		]);
	});

	it('returns nothing for a missing field', () => {
		expect(parseWidgets(undefined)).toEqual([]);
		expect(parseWidgets({})).toEqual([]);
	});

	it('drops unknown types, stubs without an https URL and empty calculations', () => {
		expect(parseWidgets([{ ...stub, type: 'map' }])).toEqual([]);
		expect(parseWidgets([{ ...stub, url: 'javascript:alert(1)' }])).toEqual([]);
		expect(parseWidgets([{ ...stub, url: 'http://open-meteo.com/' }])).toEqual([]);
		expect(parseWidgets([{ type: 'calculation', expression: '1+1' }])).toEqual([]);
		expect(parseWidgets([null, 'x', 3])).toEqual([]);
	});
});

describe('widgetValuesUrl', () => {
	it('asks the widget endpoint about the stub and the query', () => {
		const parsed = parseWidgets([stub])[0] as WidgetStub;
		const url = new URL(widgetValuesUrl('https://api.mwmbl.org', parsed, 'york weather'));
		expect(url.origin + url.pathname).toBe('https://api.mwmbl.org/api/v2/widgets/');
		expect(url.searchParams.get('url')).toBe(stub.url);
		expect(url.searchParams.get('q')).toBe('york weather');
	});
});

describe('parseWidgetValues', () => {
	const response = {
		...stub,
		display: 'fields',
		fields: [
			{ label: 'Hourly', value: '24.04', unit: 'per hour' },
			{ label: 'Weekly', value: '', unit: 'per week' }
		],
		inputs: [{ name: 'annual_salary', type: 'number', label: 'Annual salary', value: '50000' }],
		share_url: 'https://tannerd.net/tools/salary-to-hourly-calculator/?ref=mwmbl'
	};

	it('maps the values, leaving out empty fields', () => {
		expect(parseWidgetValues(response)).toEqual({
			display: 'fields',
			fields: [{ label: 'Hourly', value: '24.04', unit: 'per hour' }],
			inputs: [{ name: 'annual_salary', label: 'Annual salary', value: '50000' }],
			shareUrl: response.share_url
		});
	});

	it('treats an unknown display as fields', () => {
		expect(parseWidgetValues({ ...response, display: 'chart' })?.display).toBe('fields');
	});

	it('gives nothing without any fields to show', () => {
		expect(parseWidgetValues({ ...response, fields: [] })).toBeNull();
		expect(parseWidgetValues({ detail: 'Not found' })).toBeNull();
		expect(parseWidgetValues(null)).toBeNull();
	});

	it('drops a share URL that is not https', () => {
		expect(parseWidgetValues({ ...response, share_url: 'javascript:x' })?.shareUrl).toBe('');
	});
});

describe('widgetTitle', () => {
	it('drops the site the footer already names', () => {
		const tannerd: WidgetStub = {
			type: 'widget',
			title: 'Salary to hourly calculator, tannerd.net',
			url: 'https://tannerd.net/',
			sourceName: 'tannerd.net'
		};
		expect(widgetTitle(tannerd)).toBe('Salary to hourly calculator');
		expect(widgetTitle({ ...tannerd, title: 'York weather, United Kingdom' })).toBe(
			'York weather, United Kingdom'
		);
	});
});

describe('formatValue', () => {
	it('groups the digits of plain numbers', () => {
		expect(formatValue('4166.67')).toBe('4,166.67');
		expect(formatValue('50000')).toBe('50,000');
		expect(formatValue('-1234567')).toBe('-1,234,567');
		expect(formatValue('961.54')).toBe('961.54');
		expect(formatValue('0.123456')).toBe('0.123456');
	});

	it('leaves anything else alone', () => {
		expect(formatValue('2026-11-16')).toBe('2026-11-16');
		expect(formatValue('increase')).toBe('increase');
		expect(formatValue('1e5')).toBe('1e5');
	});
});

const forecastFields = [
	{ label: 'Temperature', value: '7.4', unit: '°C' },
	{ label: 'Conditions', value: 'Overcast', unit: '' },
	{ label: 'Wind', value: '14.2', unit: 'km/h' },
	{ label: 'Day 1', value: '2026-11-16', unit: '' },
	{ label: 'Day 1 conditions', value: 'Slight rain', unit: '' },
	{ label: 'Day 1 high', value: '9.1', unit: '°C' },
	{ label: 'Day 1 low', value: '4.3', unit: '°C' },
	{ label: 'Day 2', value: '2026-11-17', unit: '' },
	{ label: 'Day 2 high', value: '8', unit: '°C' },
	{ label: 'Day 2 low', value: '-3.2', unit: '°C' }
];

describe('parseForecast', () => {
	it('reads now and the days ahead from the labelled fields', () => {
		expect(parseForecast(forecastFields)).toEqual({
			temperature: 7.4,
			conditions: 'Overcast',
			wind: 14.2,
			days: [
				{ date: '2026-11-16', conditions: 'Slight rain', high: 9.1, low: 4.3 },
				{ date: '2026-11-17', conditions: '', high: 8, low: -3.2 }
			]
		});
	});

	it('needs the current temperature', () => {
		expect(parseForecast(forecastFields.slice(1))).toBeNull();
		expect(parseForecast([{ label: 'Temperature', value: 'warm', unit: '' }])).toBeNull();
	});

	it('skips a day whose date is not a date', () => {
		const fields = [
			{ label: 'Temperature', value: '1', unit: '°C' },
			{ label: 'Day 1', value: 'soon', unit: '' }
		];
		expect(parseForecast(fields)?.days).toEqual([]);
	});
});

describe('formatting', () => {
	it('rounds temperatures, in either unit', () => {
		expect(formatTemperature(7.4, 'c')).toBe('7°');
		expect(formatTemperature(7.4, 'f')).toBe('45°');
		expect(formatTemperature(-0.3, 'c')).toBe('0°');
	});

	it('gives wind in km/h or mph', () => {
		expect(formatWind(14.2, 'c')).toBe('14 km/h');
		expect(formatWind(14.2, 'f')).toBe('9 mph');
	});

	it('gives the weekday and date of the day as given', () => {
		expect(formatDay('2026-11-16', 'en-GB')).toEqual({ weekday: 'Mon', date: '16 Nov' });
	});
});

describe('weatherIcon', () => {
	it('maps WMO condition words to icons', () => {
		expect(weatherIcon('Overcast')).toBe('overcast');
		expect(weatherIcon('Moderate rain showers')).toBe('partly-cloudy-day-rain');
		expect(weatherIcon('Thunderstorm with heavy hail')).toBe('hail');
		expect(weatherIcon('Sandstorm')).toBe('not-available');
		expect(weatherIcon('')).toBe('not-available');
	});
});

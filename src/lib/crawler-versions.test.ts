import { describe, expect, it } from 'vitest';

import {
	PALETTE,
	UNKNOWN_COLOR,
	accessFromStatus,
	buildDatasets,
	buildLegend,
	describeSpread,
	resultsFor,
	trend,
	type CrawlerVersionSpread
} from './crawler-versions';

function day(crawlers: number) {
	return { crawlers, results: crawlers * 100 };
}

const spread: CrawlerVersionSpread = {
	dates: ['2026-10-25', '2026-10-26'],
	rows: [
		{ version: '0.3.0', days: [day(1), day(4)] },
		{ version: '0.2.0', days: [day(3), day(2)] },
		{ version: '0.1.0', days: [day(2), day(2)] },
		{ version: 'unknown', days: [day(1), day(0)] }
	],
	total_crawlers: [7, 8]
};

describe('the legend', () => {
	it('keeps the order of the rows, newest version first', () => {
		expect(buildLegend(spread).map((entry) => entry.version)).toEqual([
			'0.3.0',
			'0.2.0',
			'0.1.0',
			'unknown'
		]);
	});

	it('reports today and the change since yesterday, so rising and falling versions show', () => {
		const [rising, falling, flat, gone] = buildLegend(spread);

		expect([rising.today, rising.change]).toEqual([4, 3]);
		expect([falling.today, falling.change]).toEqual([2, -1]);
		expect([flat.today, flat.change]).toEqual([2, 0]);
		expect([gone.today, gone.change]).toEqual([0, -1]);
	});

	it('gives each version its own colour and keeps unknown grey', () => {
		const legend = buildLegend(spread);
		const colors = legend.slice(0, 3).map((entry) => entry.color);

		expect(new Set(colors).size).toBe(3);
		expect(colors.every((color) => PALETTE.includes(color))).toBe(true);
		expect(legend[3].color).toBe(UNKNOWN_COLOR);
	});

	it('does not recolour a version when a newer one ships', () => {
		const before = buildLegend(spread);
		const after = buildLegend({
			...spread,
			rows: [{ version: '0.4.0', days: [day(0), day(1)] }, ...spread.rows]
		});

		for (const entry of before) {
			expect(after.find((other) => other.version === entry.version)?.color).toBe(entry.color);
		}
	});

	it('shows no change for a spread of a single day', () => {
		const [only] = buildLegend({
			dates: ['2026-10-26'],
			rows: [{ version: '0.3.0', days: [day(4)] }],
			total_crawlers: [4]
		});

		expect([only.today, only.change]).toEqual([4, 0]);
	});

	it('reuses the palette rather than running out of colours', () => {
		const many: CrawlerVersionSpread = {
			dates: spread.dates,
			rows: Array.from({ length: PALETTE.length + 1 }, (_, i) => ({
				version: `0.${i}.0`,
				days: [day(1), day(1)]
			})),
			total_crawlers: [1, 1]
		};

		const legend = buildLegend(many);

		expect(legend.every((entry) => PALETTE.includes(entry.color))).toBe(true);
	});

	it('is empty when no crawler reported', () => {
		expect(buildLegend({ dates: [], rows: [], total_crawlers: [] })).toEqual([]);
	});
});

describe('the trend', () => {
	it('points up, points down, or stays flat', () => {
		expect(trend(3)).toBe('▲ 3');
		expect(trend(-2)).toBe('▼ 2');
		expect(trend(0)).toBe('–');
	});
});

describe('the chart data', () => {
	it('stacks the newest version last, so it is drawn on top', () => {
		const datasets = buildDatasets(spread, buildLegend(spread));

		expect(datasets.map((dataset) => dataset.label)).toEqual([
			'unknown',
			'0.1.0',
			'0.2.0',
			'0.3.0'
		]);
		expect(datasets[3].data).toEqual([1, 4]);
		expect(datasets[0].backgroundColor).toBe(UNKNOWN_COLOR);
	});

	it('finds the results behind a bar', () => {
		expect(resultsFor(spread, '0.3.0', 1)).toBe(400);
		expect(resultsFor(spread, '0.3.0', 7)).toBe(0);
		expect(resultsFor(spread, '9.9.9', 0)).toBe(0);
	});

	it('describes the chart in words', () => {
		expect(describeSpread(spread, buildLegend(spread))).toBe(
			'Stacked bar chart of crawlers per version over the last 2 days. Today 8 crawlers (0.3.0: 4, 0.2.0: 2, 0.1.0: 2, unknown: 0).'
		);
	});
});

describe('access', () => {
	it('tells staff, other users and failures apart', () => {
		expect(accessFromStatus(200)).toBe('ok');
		expect(accessFromStatus(403)).toBe('denied');
		expect(accessFromStatus(401)).toBe('error');
		expect(accessFromStatus(500)).toBe('error');
	});
});

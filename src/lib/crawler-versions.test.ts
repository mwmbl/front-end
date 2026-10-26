import { describe, expect, it } from 'vitest';

import {
	PALETTE,
	UNKNOWN_COLOR,
	buildLegend,
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

		expect(legend.slice(0, 3).map((entry) => entry.color)).toEqual(PALETTE.slice(0, 3));
		expect(legend[3].color).toBe(UNKNOWN_COLOR);
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

		expect(legend[PALETTE.length].color).toBe(PALETTE[0]);
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

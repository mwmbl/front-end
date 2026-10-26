export type CrawlerVersionSpread = {
	dates: string[];
	rows: { version: string; days: { crawlers: number; results: number }[] }[];
	total_crawlers: number[];
};

export type LegendEntry = {
	version: string;
	color: string;
	today: number;
	change: number;
};

export const UNKNOWN_COLOR = '#9ca3af';
export const PALETTE = [
	'#8b5cf6',
	'#10b981',
	'#f59e0b',
	'#3b82f6',
	'#ec4899',
	'#14b8a6',
	'#ef4444',
	'#84cc16'
];

/** One entry per version, newest first, with today's crawlers and the change since yesterday. */
export function buildLegend(spread: CrawlerVersionSpread): LegendEntry[] {
	return spread.rows.map((row, i) => {
		const today = row.days[row.days.length - 1].crawlers;
		const yesterday = row.days[row.days.length - 2].crawlers;
		return {
			version: row.version,
			color: row.version === 'unknown' ? UNKNOWN_COLOR : PALETTE[i % PALETTE.length],
			today,
			change: today - yesterday
		};
	});
}

export function trend(change: number): string {
	if (change > 0) return `▲ ${change}`;
	if (change < 0) return `▼ ${-change}`;
	return '–';
}

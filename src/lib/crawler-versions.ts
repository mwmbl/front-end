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

function paletteStart(version: string): number {
	let hash = 0;
	for (const char of version) {
		hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
	}
	return hash % PALETTE.length;
}

/**
 * A version's colour comes from its name rather than its rank, so shipping a new version does
 * not recolour the others. Versions that land on the same colour step to the next free one.
 */
function assignColors(versions: string[]): Map<string, string> {
	const colors = new Map<string, string>();
	const used = new Set<number>();
	for (const version of versions) {
		if (version === 'unknown') {
			colors.set(version, UNKNOWN_COLOR);
			continue;
		}
		let index = paletteStart(version);
		while (used.has(index) && used.size < PALETTE.length) {
			index = (index + 1) % PALETTE.length;
		}
		used.add(index);
		colors.set(version, PALETTE[index]);
	}
	return colors;
}

/** One entry per version, newest first, with today's crawlers and the change since yesterday. */
export function buildLegend(spread: CrawlerVersionSpread): LegendEntry[] {
	const colors = assignColors(spread.rows.map((row) => row.version));
	return spread.rows.map((row) => {
		const today = row.days[row.days.length - 1].crawlers;
		// Nothing to compare with when the spread covers a single day.
		const yesterday = row.days.length > 1 ? row.days[row.days.length - 2].crawlers : today;
		return {
			version: row.version,
			color: colors.get(row.version)!,
			today,
			change: today - yesterday
		};
	});
}

/** Chart.js stacks the first dataset at the bottom, so reversed to put the newest version on top. */
export function buildDatasets(spread: CrawlerVersionSpread, legend: LegendEntry[]) {
	const colors = new Map(legend.map((entry) => [entry.version, entry.color]));
	return [...spread.rows].reverse().map((row) => ({
		label: row.version,
		data: row.days.map((cell) => cell.crawlers),
		backgroundColor: colors.get(row.version),
		borderWidth: 0
	}));
}

export function resultsFor(
	spread: CrawlerVersionSpread,
	version: string,
	dayIndex: number
): number {
	return spread.rows.find((row) => row.version === version)?.days[dayIndex]?.results ?? 0;
}

/** The chart in words, for screen readers. */
export function describeSpread(spread: CrawlerVersionSpread, legend: LegendEntry[]): string {
	const today = spread.total_crawlers[spread.total_crawlers.length - 1] ?? 0;
	const versions = legend.map((entry) => `${entry.version}: ${entry.today}`).join(', ');
	return `Stacked bar chart of crawlers per version over the last ${spread.dates.length} days. Today ${today} crawlers (${versions}).`;
}

export type Access = 'ok' | 'denied' | 'error';

/** The endpoint answers 403 for anyone who isn't staff. */
export function accessFromStatus(status: number): Access {
	if (status === 403) return 'denied';
	return status >= 200 && status < 300 ? 'ok' : 'error';
}

export function trend(change: number): string {
	if (change > 0) return `▲ ${change}`;
	if (change < 0) return `▼ ${-change}`;
	return '–';
}

// The image strip shown above the web results (mwmbl/mwmbl#650).

export type StripImage = {
	title: string;
	pageUrl: string;
	thumbnailUrl: string;
	licenseName: string;
	licenseUrl: string;
};

// The API shows this many before its "More" button when it doesn't say.
export const DEFAULT_DISPLAY_COUNT = 4;

function httpsUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	try {
		return new URL(value).protocol === 'https:' ? value : null;
	} catch {
		return null;
	}
}

// Keeps only images with https links and a licence to show: an image without its licence or its
// credit link can't be shown. A licence with no page of its own links to the file page.
// Repeats of a thumbnail are dropped: the strip keys its tiles by thumbnail URL.
export function parseImages(raw: unknown): StripImage[] {
	if (!Array.isArray(raw)) return [];
	const images: StripImage[] = [];
	const seen = new Set<string>();
	for (const entry of raw) {
		if (entry == null || typeof entry !== 'object') continue;
		const item = entry as Record<string, unknown>;
		const pageUrl = httpsUrl(item.page_url);
		const thumbnailUrl = httpsUrl(item.thumbnail_url);
		const licenseName = typeof item.license_name === 'string' ? item.license_name.trim() : '';
		if (!pageUrl || !thumbnailUrl || !licenseName || seen.has(thumbnailUrl)) continue;
		seen.add(thumbnailUrl);
		images.push({
			title: typeof item.title === 'string' ? item.title : '',
			pageUrl,
			thumbnailUrl,
			licenseName,
			licenseUrl: httpsUrl(item.license_url) ?? pageUrl
		});
	}
	return images;
}

export function parseDisplayCount(raw: unknown): number {
	return typeof raw === 'number' && Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_DISPLAY_COUNT;
}

export type StripTile =
	| { kind: 'image'; index: number; flex: string }
	| { kind: 'more'; flex: string };

export type StripLayout = {
	width: number;
	rowHeight: number;
	gap: number;
	displayCount: number;
	expanded: boolean;
	// Narrow screens lay out images in pairs.
	maxPerRow?: number;
};

// The "More" tile's width, as a fraction of the row height.
export const MORE_TILE_RATIO = 0.62;
// A last row narrower than this share of the strip keeps its images' natural widths rather than
// stretching them to fill the row.
const SHORT_ROW_SHARE = 0.75;

const grow = (ratio: number) => `${ratio} 1 0px`;

function chunk<T>(items: T[], size: number | undefined): T[][] {
	if (!size || items.length <= size) return items.length ? [items] : [];
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
	return chunks;
}

// Justified rows of tiles: each image's flex-grow is its aspect ratio, so a row fills the strip with
// little cropping. `ratios` are width / height, one per image, in order.
export function stripRows(ratios: number[], layout: StripLayout): StripTile[][] {
	const { width, rowHeight, gap, displayCount, expanded, maxPerRow } = layout;
	const hidden = Math.max(0, ratios.length - displayCount);
	const indices = ratios.map((_, index) => index);

	if (!expanded || hidden === 0) {
		const rows: StripTile[][] = chunk(indices.slice(0, displayCount), maxPerRow).map((row) =>
			row.map((index) => ({ kind: 'image', index, flex: grow(ratios[index]) }))
		);
		if (hidden > 0) rows[rows.length - 1].push({ kind: 'more', flex: grow(MORE_TILE_RATIO) });
		return rows;
	}

	const rows: StripTile[][] = [];
	let row: number[] = [];
	let sum = 0;
	for (const index of indices) {
		row.push(index);
		sum += ratios[index];
		const full = sum * rowHeight + gap * (row.length - 1) >= width;
		if (full || row.length === maxPerRow) {
			rows.push(row.map((i) => ({ kind: 'image', index: i, flex: grow(ratios[i]) })));
			row = [];
			sum = 0;
		}
	}
	if (row.length) {
		const natural = sum * rowHeight + gap * (row.length - 1);
		const short = natural < width * SHORT_ROW_SHARE;
		rows.push(
			row.map((i) => ({
				kind: 'image',
				index: i,
				flex: short ? `0 0 ${Math.round(ratios[i] * rowHeight)}px` : grow(ratios[i])
			}))
		);
	}
	return rows;
}

import { describe, expect, it } from 'vitest';

import { DEFAULT_DISPLAY_COUNT, parseDisplayCount, parseImages, stripRows } from './image-strip';

const apiImage = {
	title: 'Banana-Sitia-Crete.jpg',
	page_url: 'https://commons.wikimedia.org/wiki/File:Banana-Sitia-Crete.jpg',
	thumbnail_url:
		'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Banana-Sitia-Crete.jpg/330px-Banana-Sitia-Crete.jpg',
	source: 'commons',
	license_name: 'CC BY-SA 4.0',
	license_url: 'https://creativecommons.org/licenses/by-sa/4.0'
};

describe('parseImages', () => {
	it('maps API images', () => {
		expect(parseImages([apiImage])).toEqual([
			{
				title: 'Banana-Sitia-Crete.jpg',
				pageUrl: apiImage.page_url,
				thumbnailUrl: apiImage.thumbnail_url,
				licenseName: 'CC BY-SA 4.0',
				licenseUrl: apiImage.license_url
			}
		]);
	});

	it('returns nothing for a missing field', () => {
		expect(parseImages(undefined)).toEqual([]);
		expect(parseImages({})).toEqual([]);
	});

	it('drops images without an https page or thumbnail, or without a licence', () => {
		expect(parseImages([{ ...apiImage, page_url: 'javascript:alert(1)' }])).toEqual([]);
		expect(parseImages([{ ...apiImage, thumbnail_url: 'http://example.com/a.jpg' }])).toEqual([]);
		expect(parseImages([{ ...apiImage, license_name: ' ' }])).toEqual([]);
		expect(parseImages([null, 'x'])).toEqual([]);
	});

	it('links the file page when the licence URL is unusable', () => {
		const [image] = parseImages([{ ...apiImage, license_url: 'data:text/html,hi' }]);
		expect(image.licenseUrl).toBe(apiImage.page_url);
	});
});

describe('parseDisplayCount', () => {
	it('uses a positive integer and defaults otherwise', () => {
		expect(parseDisplayCount(6)).toBe(6);
		expect(parseDisplayCount(undefined)).toBe(DEFAULT_DISPLAY_COUNT);
		expect(parseDisplayCount(0)).toBe(DEFAULT_DISPLAY_COUNT);
		expect(parseDisplayCount(2.5)).toBe(DEFAULT_DISPLAY_COUNT);
	});
});

const layout = { width: 736, rowHeight: 144, gap: 3, displayCount: 4, expanded: false };
const kinds = (rows: ReturnType<typeof stripRows>) =>
	rows.map((row) => row.map((tile) => (tile.kind === 'image' ? tile.index : 'more')));

describe('stripRows', () => {
	const ratios = [1.43, 1.33, 1.56, 1.33, 0.81, 1.14];

	it('shows the first images in one row, then a More tile', () => {
		const rows = stripRows(ratios, layout);
		expect(kinds(rows)).toEqual([[0, 1, 2, 3, 'more']]);
		expect(rows[0][0].flex).toBe('1.43 1 0px');
	});

	it('has no More tile when every image fits', () => {
		expect(kinds(stripRows(ratios.slice(0, 3), layout))).toEqual([[0, 1, 2]]);
	});

	it('fills justified rows when expanded, leaving a short last row at natural widths', () => {
		const rows = stripRows(ratios, { ...layout, expanded: true });
		expect(kinds(rows)).toEqual([
			[0, 1, 2, 3],
			[4, 5]
		]);
		expect(rows[0][0].flex).toBe('1.43 1 0px');
		expect(rows[1][0].flex).toBe(`0 0 ${Math.round(0.81 * 144)}px`);
	});

	it('lays out pairs on narrow screens', () => {
		const narrow = { ...layout, width: 350, rowHeight: 112, maxPerRow: 2 };
		expect(kinds(stripRows(ratios, narrow))).toEqual([
			[0, 1],
			[2, 3, 'more']
		]);
		expect(kinds(stripRows(ratios, { ...narrow, expanded: true }))).toEqual([
			[0, 1],
			[2, 3],
			[4, 5]
		]);
	});

	it('returns no rows for no images', () => {
		expect(stripRows([], layout)).toEqual([]);
	});
});

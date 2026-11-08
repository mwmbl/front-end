import { describe, expect, it } from 'vitest';

import {
	fetchImages,
	fetchTopImage,
	imageCaption,
	isDisplayable,
	isWikimediaThumbnail,
	type ImageResult
} from './image-search';

const BASE = 'https://api.example.test';

function image(overrides: Partial<ImageResult> = {}): ImageResult {
	return {
		title: 'Red Panda.JPG',
		page_url: 'https://commons.wikimedia.org/wiki/File:Red_Panda.JPG',
		thumbnail_url:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Red_Panda.JPG/320px-Red_Panda.JPG',
		thumbnail_width: 320,
		thumbnail_height: 213,
		source: 'wikimedia-commons',
		license_name: 'CC BY-SA 4.0',
		license_url: 'https://creativecommons.org/licenses/by-sa/4.0',
		attribution: 'A. Photographer',
		...overrides
	};
}

function respond(status: number, body: unknown): typeof fetch {
	return (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;
}

const failing: typeof fetch = (async () => {
	throw new Error('network down');
}) as typeof fetch;

describe('thumbnails', () => {
	it('are only accepted from Wikimedia over https', () => {
		expect(isWikimediaThumbnail(image().thumbnail_url)).toBe(true);
		expect(isWikimediaThumbnail('https://thumb.wikimedia.org/a.jpg')).toBe(true);
		expect(isWikimediaThumbnail('http://upload.wikimedia.org/a.jpg')).toBe(false);
		expect(isWikimediaThumbnail('https://evil.example.com/a.jpg')).toBe(false);
		expect(isWikimediaThumbnail('https://upload.wikimedia.org.evil.example.com/a.jpg')).toBe(false);
		expect(isWikimediaThumbnail('not a url')).toBe(false);
	});
});

describe('displayable images', () => {
	it('need https links, because file pages are editable by anyone', () => {
		expect(isDisplayable(image())).toBe(true);
		expect(isDisplayable(image({ license_url: '' }))).toBe(true);
		expect(isDisplayable(image({ license_url: 'javascript:alert(1)' }))).toBe(false);
		expect(isDisplayable(image({ page_url: 'javascript:alert(1)' }))).toBe(false);
		expect(isDisplayable(image({ page_url: 'http://commons.wikimedia.org/wiki/File:a.jpg' }))).toBe(
			false
		);
	});
});

describe('captions', () => {
	it('drop the file extension', () => {
		expect(imageCaption(image())).toBe('Red Panda');
		expect(imageCaption(image({ title: 'Version 1.2 notes.png' }))).toBe('Version 1.2 notes');
	});
});

describe('fetchImages', () => {
	it('returns the images the API approved', async () => {
		const outcome = await fetchImages(
			BASE,
			'red panda',
			respond(200, { query: 'red panda', results: [image()] })
		);
		expect(outcome).toEqual({ status: 'ok', images: [image()] });
	});

	it('drops any image whose thumbnail is not from Wikimedia', async () => {
		const stray = image({ thumbnail_url: 'https://evil.example.com/a.jpg' });
		const outcome = await fetchImages(
			BASE,
			'x',
			respond(200, { query: 'x', results: [stray, image()] })
		);
		expect(outcome).toEqual({ status: 'ok', images: [image()] });
	});

	it('is unavailable, never empty, when the API errors', async () => {
		expect(await fetchImages(BASE, 'x', respond(503, { message: 'down' }))).toEqual({
			status: 'unavailable'
		});
	});

	it('is unavailable when the network fails', async () => {
		expect(await fetchImages(BASE, 'x', failing)).toEqual({ status: 'unavailable' });
	});

	it('is unavailable when the body has the wrong shape', async () => {
		expect(await fetchImages(BASE, 'x', respond(200, { results: 'nope' }))).toEqual({
			status: 'unavailable'
		});
	});
});

describe('fetchTopImage', () => {
	it('returns the image', async () => {
		expect(
			await fetchTopImage(BASE, 'red panda', respond(200, { query: 'red panda', image: image() }))
		).toEqual(image());
	});

	it('is null when there is no strong match', async () => {
		expect(await fetchTopImage(BASE, 'x', respond(200, { query: 'x', image: null }))).toBeNull();
	});

	it('is null on any failure rather than rejecting', async () => {
		expect(await fetchTopImage(BASE, 'x', respond(503, {}))).toBeNull();
		expect(await fetchTopImage(BASE, 'x', failing)).toBeNull();
	});

	it('is null when the thumbnail is not from Wikimedia', async () => {
		const stray = image({ thumbnail_url: 'https://evil.example.com/a.jpg' });
		expect(await fetchTopImage(BASE, 'x', respond(200, { query: 'x', image: stray }))).toBeNull();
	});
});

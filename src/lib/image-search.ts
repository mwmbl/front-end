export type ImageResult = {
	title: string;
	page_url: string;
	thumbnail_url: string;
	thumbnail_width: number;
	thumbnail_height: number;
	source: string;
	license_name: string;
	license_url: string;
	attribution: string;
};

export type ImageSearchOutcome =
	| { status: 'ok'; images: ImageResult[] }
	| { status: 'unavailable' };

const FILE_EXTENSION = /\.(jpe?g|png|webp)$/i;

// Commons titles are file names, which read better without their extension.
export function imageCaption(image: ImageResult): string {
	return image.title.replace(FILE_EXTENSION, '');
}

// Only a thumbnail served by Wikimedia is ever rendered: the API promises that, and this makes
// a response that broke the promise show nothing rather than load an image from anywhere else.
const THUMBNAIL_HOSTS = new Set(['upload.wikimedia.org', 'thumb.wikimedia.org']);

export function isWikimediaThumbnail(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'https:' && THUMBNAIL_HOSTS.has(parsed.hostname);
	} catch {
		return false;
	}
}

function isHttps(url: string): boolean {
	try {
		return new URL(url).protocol === 'https:';
	} catch {
		return false;
	}
}

// Links come from file pages anyone can edit, so only https ones are ever put in an href.
export function isDisplayable(image: ImageResult): boolean {
	return (
		isWikimediaThumbnail(image.thumbnail_url) &&
		isHttps(image.page_url) &&
		(image.license_url === '' || isHttps(image.license_url))
	);
}

function displayable(images: ImageResult[]): ImageResult[] {
	return images.filter(isDisplayable);
}

// The API's error pages are HTML, and a failed image search must not fail the whole page.
// Anything but a clean answer is "unavailable": images are never shown on a guess.
export async function fetchImages(
	apiBase: string,
	query: string,
	fetchFn: typeof fetch = fetch
): Promise<ImageSearchOutcome> {
	try {
		const res = await fetchFn(
			`${apiBase}/api/v2/image-search/?q=${encodeURIComponent(query)}&limit=30`
		);
		if (!res.ok) return { status: 'unavailable' };
		const json = await res.json();
		if (!Array.isArray(json?.results)) return { status: 'unavailable' };
		return { status: 'ok', images: displayable(json.results) };
	} catch (err) {
		console.log('Image search failed: ', err);
		return { status: 'unavailable' };
	}
}

// Resolves to null whenever there is nothing to show, for any reason.
export async function fetchTopImage(
	apiBase: string,
	query: string,
	fetchFn: typeof fetch = fetch
): Promise<ImageResult | null> {
	try {
		const res = await fetchFn(`${apiBase}/api/v2/image-search/top/?q=${encodeURIComponent(query)}`);
		if (!res.ok) return null;
		const json = await res.json();
		const image: ImageResult | null = json?.image ?? null;
		return image && isDisplayable(image) ? image : null;
	} catch (err) {
		console.log('Top image failed: ', err);
		return null;
	}
}

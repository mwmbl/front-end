import { browser } from '$app/environment';

export function getCookies(): { [key: string]: string } {
	let cookies: { [key: string]: string } = {};
	if (browser) {
		cookies = Object.fromEntries(document.cookie.split(';').map((s) => s.trim().split('=')));
	}
	return cookies;
}

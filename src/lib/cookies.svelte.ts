import { browser } from '$app/environment';

export function getCookies(): { [key: string]: string } {
	let cookies = $state({});
	if (browser) {
		cookies = Object.fromEntries(document.cookie.split(';').map((s) => s.trim().split('=')));
	}
	return cookies;
}

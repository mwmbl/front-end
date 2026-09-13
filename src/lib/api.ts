export const API_BASE = 'https://api.mwmbl.org';

/**
 * How this app's server-side calls identify themselves to the Mwmbl API.
 *
 * Node's global fetch sends `User-Agent: node` and `Accept-Language: *` by default, so
 * every SSR load and every proxied call arrived at api.mwmbl.org indistinguishable from
 * any other Node script - and, because `*` is a non-empty Accept-Language, sorted into the
 * same bucket as real browsers by the API's traffic counters. Naming ourselves is what
 * lets the API tell its own front end apart from the rest of its traffic.
 */
export const SERVER_USER_AGENT = 'mwmbl-front-end/1.0 (+https://github.com/mwmbl/front-end)';

/**
 * `fetch` for calls made from the server, with this app's User-Agent attached.
 *
 * Only for server-side code. Requests the browser makes carry the visitor's own
 * User-Agent, which is theirs to send and not ours to overwrite.
 */
export function serverFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set('User-Agent', SERVER_USER_AGENT);
	return fetch(input, { ...init, headers });
}

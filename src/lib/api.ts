import { env } from '$env/dynamic/public';

// Defaults to production so nothing changes without an explicit PUBLIC_API_BASE,
// which is what lets the app be pointed at a local mwmbl during development.
export const API_BASE = env.PUBLIC_API_BASE || 'https://api.mwmbl.org';

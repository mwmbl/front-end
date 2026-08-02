import { env } from '$env/dynamic/public';

export const API_BASE = env.PUBLIC_API_BASE || 'https://beta.mwmbl.org';

// Use local API in development, production API in production
export const API_BASE = import.meta.env.DEV ? 'http://localhost:8000' : 'https://api.mwmbl.org';

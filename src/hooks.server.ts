import { dev } from '$app/environment';

export async function handle({ event, resolve }) {
	const accessToken = event.cookies.get('accessToken');

	if (accessToken) {
		// Parse access token to see if it's expired
		const parsedJWT = JSON.parse(
			atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
		);

		if (parsedJWT.exp < Date.now() / 1000) {
			// Access token is expired, let's do a refresh
			const refreshToken = event.cookies.get('refreshToken');
			if (refreshToken) {
				const res = await fetch('https://api.mwmbl.org/api/v1/platform/token/refresh', {
					method: 'POST',
					body: JSON.stringify({
						refresh: refreshToken
					})
				});
				if (res.ok) {
					const json = await res.json();
					event.cookies.set('accessToken', json.access, {
						path: '/',
						httpOnly: false,
						sameSite: 'strict',
						secure: !dev,
						maxAge: 60 * 60 * 24 // 1 day
					});
					event.cookies.set('refreshToken', json.refresh, {
						path: '/',
						httpOnly: true,
						sameSite: 'strict',
						secure: !dev,
						maxAge: 60 * 60 * 24 * 30 // 30 days
					});
					event.locals.loginStatus = 'assumeLoggedIn';
				} else {
					event.locals.loginStatus = 'assumeLoggedOut';
				}
			} else {
				event.locals.loginStatus = 'assumeLoggedOut';
			}
		} else {
			event.locals.loginStatus = 'assumeLoggedIn';
		}
	} else {
		event.locals.loginStatus = 'assumeLoggedOut';
	}

	// Delete cookies if logged out
	if (event.locals.loginStatus === 'assumeLoggedOut') {
		event.cookies.delete('refreshToken', { path: '/' });
		event.cookies.delete('accessToken', { path: '/' });
	}

	return await resolve(event);
}

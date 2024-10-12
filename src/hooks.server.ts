import { dev } from '$app/environment';

export async function handle({ event, resolve }) {
	function setStatus(value: string) {
		event.cookies.set('status', value, {
			path: '/',
			httpOnly: false,
			sameSite: 'strict',
			secure: !dev,
			maxAge: 60 * 60 * 24 // 1 day
		});
	}

	const accessToken = event.cookies.get('accessToken');
	if (accessToken) {
		const res = await fetch('https://api.mwmbl.org/api/v1/platform/token/verify', {
			method: 'POST',
			body: JSON.stringify({
				token: accessToken
			})
		});
		if (res.ok) {
			setStatus('assumeLoggedIn');
		} else {
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
					setStatus('assumeLoggedIn');
				} else {
					setStatus('assumeLoggedOut');
				}
			}
		}
	} else {
		setStatus('assumeLoggedOut');
	}
	return await resolve(event);
}

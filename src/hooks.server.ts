import { dev } from '$app/environment';

export async function handle({ event, resolve }) {
	function setAssumeLoggedIn(value: boolean) {
		event.cookies.set('assumeLoggedIn', value.toString(), {
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
			setAssumeLoggedIn(true);
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
					setAssumeLoggedIn(true);
				} else {
					setAssumeLoggedIn(false);
				}
			}
		}
	} else {
		setAssumeLoggedIn(false);
	}
	console.log(event.cookies.get('assumeLoggedIn'));
	return await resolve(event);
}

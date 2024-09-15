import { browser } from '$app/environment';

type preferenceObject = {
	openInNewTab: boolean | undefined;
};

const defaults: preferenceObject = {
	openInNewTab: false
};

export function localStoragePreferences(): preferenceObject {
	let preferences: preferenceObject = $state(defaults);

	if (browser) {
		const value = window.localStorage.getItem('preferences');
		if (value) preferences = JSON.parse(value);
	}

	$effect(() => {
		window.localStorage.setItem('preferences', JSON.stringify(preferences));
	});

	return preferences;
}

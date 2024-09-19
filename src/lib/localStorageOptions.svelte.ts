import { browser } from '$app/environment';

type optionObject = {
	openInNewTab: boolean | undefined;
};

const defaults: optionObject = {
	openInNewTab: false
};

export function localStorageOptions(): optionObject {
	let options: optionObject = $state(defaults);

	if (browser) {
		const value = window.localStorage.getItem('options');
		if (value) options = JSON.parse(value);
	}

	$effect(() => {
		window.localStorage.setItem('options', JSON.stringify(options));
	});

	return options;
}

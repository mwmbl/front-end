import { browser } from '$app/environment';

type optionObject = {
	openInNewTab: boolean | undefined;
	showVotingInterface: boolean | undefined;
};

const defaults: optionObject = {
	openInNewTab: false,
	showVotingInterface: false
};

function createLocalStorageOptions(): {
	get options(): optionObject;
	set options(value: optionObject);
} {
	let options: optionObject = $state(defaults);

	if (browser) {
		const value = window.localStorage.getItem('options');
		if (value) options = { ...defaults, ...JSON.parse(value) };
	}

	return {
		get options() {
			return options;
		},
		set options(value) {
			options = value;
			window.localStorage.setItem('options', JSON.stringify(options));
		}
	};
}

export const localStorageOptions = createLocalStorageOptions();

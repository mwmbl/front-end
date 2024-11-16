// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			status:
				| 'assumeLoggedIn'
				| 'assumeLoggedOut'
				| 'accountError'
				| 'accountCreated'
				| 'accountDeleted';
			accountMessage: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

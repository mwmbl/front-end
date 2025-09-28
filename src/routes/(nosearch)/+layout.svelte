<script>
	import { Button } from '@/components/ui/button';
	import * as Sheet from '@/components/ui/sheet';

	import RiMenu3Fill from '~icons/ri/menu-3-fill';
	import RiSettings4Fill from '~icons/ri/settings-4-fill';
	import RiUserLine from '~icons/ri/user-line';

	import MobileMenu from '@/components/custom/menu/MobileMenu.svelte';
	import SignInButton from '@/components/custom/menu/SignInButton.svelte';

	let { children, data } = $props();
</script>

<header class="w-full">
	<aside
		class="font-display flex h-fit w-full items-center justify-center gap-3 bg-stone-900 p-2 text-white"
	>
		<img src="/palestine.svg" alt="Flag of Palestine" class="h-6" />
		<p class="hidden sm:block">
			The Mwmbl community supports the rights of Palestinians. End the genocide. Stop the man-made
			famine. End apartheid. Free Palestine!
		</p>
		<p class="sm:hidden">Mwmbl supports Palestine.</p>
		<img src="/palestine.svg" alt="Flag of Palestine" class="hidden h-6 md:block" />
	</aside>
	<div
		class="mx-auto flex h-16 w-full max-w-7xl flex-row items-center gap-2 px-5 pt-10 pb-8 sm:gap-6 lg:px-8"
	>
		<a href="/" class="col-start-1 mr-auto flex flex-row items-center gap-4">
			<img src="/logo.svg" alt="mwmbl" class="h-12" />
			<img src="/mwmbl-text.svg" alt="" class="h-6 dark:invert" />
		</a>
		<div class="hidden md:contents">
			<Button variant="link" href="https://opencollective.com/mwmbl" class="px-2">Donate</Button>
			<SignInButton loginStatus={data.loginStatus} />
		</div>
		<div class="contents">
			<MobileMenu loginStatus={data.loginStatus} />
		</div>
	</div>
</header>

{@render children()}

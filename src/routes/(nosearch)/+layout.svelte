<script>
	import { Button } from '@/components/ui/button';
	import * as Sheet from '@/components/ui/sheet';

	import RiMenu3Fill from '~icons/ri/menu-3-fill';
	import RiSettings4Fill from '~icons/ri/settings-4-fill';
	import RiUserLine from '~icons/ri/user-line';

	import MobileMenu from '@/components/custom/MobileMenu.svelte';
	import SignInButton from '@/components/custom/SignInButton.svelte';
</script>

<header
	class="flex h-16 w-full max-w-[80rem] flex-row items-center gap-2 self-center px-5 pb-8 pt-10 sm:gap-6 lg:px-8"
>
	<a href="/" class="col-start-1 mr-auto flex flex-row items-center gap-4">
		<img src="/logo.svg" alt="mwmbl" class="h-12" />
		<img src="/mwmbl-text.svg" alt="" class="h-6 dark:invert" />
	</a>
	<div class="hidden md:contents">
		<Button variant="link" href="https://opencollective.com/mwmbl" class="px-2">Donate</Button>
		<SignInButton />
	</div>
	<div class="contents md:hidden">
		<MobileMenu />
	</div>
</header>

<slot></slot>

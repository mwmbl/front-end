<script>
	import { Button } from '@/components/ui/button';

	import MobileMenu from '@/components/custom/menu/MobileMenu.svelte';
	import SignInButton from '@/components/custom/menu/SignInButton.svelte';

	let { children, data } = $props();
</script>

<header class="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
	<a href="/" class="col-start-1 mr-auto flex flex-row items-center gap-4">
		<img src="/logo.svg" alt="mwmbl" class="h-12" />
		<img src="/mwmbl-text.svg" alt="" class="h-6 dark:invert" />
	</a>
	<div class="flex items-center gap-3">
		<div class="hidden md:contents">
			<Button variant="link" href="https://opencollective.com/mwmbl">Donate</Button>
			<SignInButton loginStatus={data.loginStatus} />
		</div>
		<div class="contents">
			<MobileMenu loginStatus={data.loginStatus} />
		</div>
	</div>
</header>

{@render children()}

<script>
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { getCookies } from '@/cookies.svelte';

	const cookies = getCookies();
</script>

<main class="flex w-full max-w-2xl flex-col gap-2 self-center px-6">
	<h2 class="-mx-2 text-3xl">Account</h2>
	<hr class="my-2" />
	{#if cookies.assumeLoggedIn !== 'true'}
		<form method="post" action="?/login" class="flex flex-col gap-2">
			<Input type="text" name="username" placeholder="username" autocomplete="username"></Input>
			<Input type="password" name="password" placeholder="Password" autocomplete="password"></Input>
			<Button class="max-w-32" type="submit">Log in</Button>
		</form>
	{:else}
		Logged in as {cookies.username}.
		<form method="post" action="?/logout">
			<Button class="max-w-32" type="submit">Log out</Button>
		</form>
	{/if}
</main>

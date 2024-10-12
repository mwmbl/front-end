<script>
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card';
	import { Input } from '@/components/ui/input';
	import * as Tabs from '@/components/ui/tabs';

	import { getCookies } from '@/cookies.svelte';
	const cookies = getCookies();

	const { data } = $props();
</script>

<main class="flex w-full max-w-2xl flex-col gap-2 self-center px-6">
	<h2 class="-mx-2 text-3xl">
		{#if cookies.status !== 'assumeLoggedIn'}
			Sign in
		{:else}
			Logged in as {cookies.username}
		{/if}
	</h2>
	<hr class="my-2" />
	{#if cookies.status !== 'assumeLoggedIn'}
		{#if cookies.status === 'accountCreated'}
			<Card.Root class="p-4 outline outline-green-100 dark:outline-green-900">
				{cookies.registrationMessage.replaceAll('%20', ' ')}
			</Card.Root>
		{:else if cookies.status === 'accountCreationError'}
			<Card.Root class="p-4 outline outline-red-100 dark:outline-red-900">
				{cookies.registrationMessage.replaceAll('%20', ' ')}
			</Card.Root>
		{/if}
		<Tabs.Root value="Log in" class="Log in">
			<Tabs.List class="w-full rounded-2xl">
				<Tabs.Trigger value="Log in" class="w-full rounded-xl">Log in</Tabs.Trigger>
				<Tabs.Trigger value="Register" class="w-full rounded-xl">Register</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="Log in">
				<div class="mb-2 text-unemphasized-2">Log in to an existing account.</div>
				<form method="post" action="?/login" class="flex flex-col gap-2">
					<Input
						required
						type="text"
						name="username"
						placeholder="Username"
						autocomplete="username"
					/>
					<Input
						required
						type="password"
						name="password"
						placeholder="Password"
						autocomplete="password"
					/>
					<Button class="max-w-32" type="submit">Log in</Button>
				</form>
			</Tabs.Content>
			<Tabs.Content value="Register">
				<div class="mb-2 text-unemphasized-2">Create a new account.</div>
				<form method="post" action="?/register" class="flex flex-col gap-2">
					<Input
						required
						type="text"
						name="username"
						placeholder="Username"
						autocomplete="username"
					/>
					<Input required type="text" name="email" placeholder="Email" autocomplete="email" />
					<Input
						required
						type="password"
						name="password"
						placeholder="Password"
						autocomplete="password"
					/>
					<Button class="max-w-32" type="submit">Register</Button>
				</form>
			</Tabs.Content>
		</Tabs.Root>
	{:else}
		{#if data.awaitingEmailConfirmation}
			<Card.Root class="p-4 outline outline-red-100 dark:outline-red-900">
				Awaiting email confirmation, please check your email address.
			</Card.Root>
		{:else}
			<Card.Root class="p-4 outline outline-green-100 dark:outline-green-900">
				Your email address has been confirmed. Nice!
			</Card.Root>
		{/if}
		<form method="post" action="?/logout">
			<Button class="max-w-32" type="submit">Log out</Button>
		</form>
	{/if}
</main>

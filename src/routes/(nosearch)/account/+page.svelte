<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card';
	import { Input } from '@/components/ui/input';
	import * as Tabs from '@/components/ui/tabs';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';

	import RiArrowUpSLine from '~icons/ri/arrow-up-s-line';
	import RiArrowDownSLine from '~icons/ri/arrow-down-s-line';
	import RiDeleteBin5Line from '~icons/ri/delete-bin-5-line';

	import { getCookies } from '@/cookies.svelte';
	const cookies = getCookies();

	const { data } = $props();

	function deleteVote(query: string, url: string) {
		fetch('/api/v1/platform/search-results/vote', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ url, query })
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.error) {
					alert(data.error);
				} else {
					alert('Vote deleted successfully');
				}
			});
	}
</script>

<main class="flex w-full max-w-2xl flex-col gap-2 self-center px-6">
	<h2 class="-mx-2 text-3xl">
		{#if data.loginStatus !== 'assumeLoggedIn'}
			Sign in
		{:else}
			Logged in as {data.username}
		{/if}
	</h2>
	<hr class="my-2" />
	{#if data.loginStatus === 'accountError'}
		<Card.Root class="p-4 outline-red-100 outline-solid dark:outline-red-900">
			{data.accountMessage.replaceAll('%20', ' ')}
		</Card.Root>
	{:else if data.loginStatus === 'accountCreated'}
		<Card.Root class="p-4 outline-green-100 outline-solid dark:outline-green-900">
			{data.accountMessage.replaceAll('%20', ' ')}
		</Card.Root>
	{:else if data.loginStatus === 'accountDeleted'}
		<Card.Root class="p-4 outline-green-100 outline-solid dark:outline-green-900">
			{data.accountMessage.replaceAll('%20', ' ')}
		</Card.Root>
	{/if}
	{#if data.loginStatus !== 'assumeLoggedIn'}
		<Tabs.Root value="Log in" class="Log in">
			<Tabs.List class="w-full rounded-2xl">
				<Tabs.Trigger value="Log in" class="w-full rounded-xl">Log in</Tabs.Trigger>
				<Tabs.Trigger value="Register" class="w-full rounded-xl">Register</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="Log in">
				<div class="text-unemphasized-2 mb-2">Log in to an existing account.</div>
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
						autocomplete="current-password"
					/>
					<Button class="max-w-32" type="submit">Log in</Button>
				</form>
			</Tabs.Content>
			<Tabs.Content value="Register">
				<div class="text-unemphasized-2 mb-2">Create a new account.</div>
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
						autocomplete="new-password"
					/>
					<Button class="max-w-32" type="submit">Register</Button>
				</form>
			</Tabs.Content>
		</Tabs.Root>
	{:else}
		{#if data.awaitingEmailConfirmation}
			<Card.Root class="p-4 outline-red-100 outline-solid dark:outline-red-900">
				Awaiting email confirmation, please check your email address.
			</Card.Root>
		{:else}
			<Card.Root class="p-4 outline-green-100 outline-solid dark:outline-green-900">
				Your email address has been confirmed. Nice!
			</Card.Root>
		{/if}
		<form method="post" action="?/logout">
			<Button class="max-w-32" type="submit">Log out</Button>
		</form>
		<AlertDialog.Root>
			<AlertDialog.Trigger>
				{#snippet child({ props })}
					<Button {...props} class="max-w-32" type="submit" variant="destructive">
						Delete account
					</Button>
				{/snippet}
			</AlertDialog.Trigger>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Are you sure you want to delete your account?</AlertDialog.Title>
					<AlertDialog.Description>
						This action cannot be undone. This will permanently delete your account and remove your
						data from our servers.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<form method="post" action="?/deleteUser" class="max-sm:w-full">
						<AlertDialog.Action class="bg-red-600 max-sm:w-full" type="submit">
							Delete account
						</AlertDialog.Action>
					</form>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>

		<hr class="my-4" />

		<h3 class="text-xl">My votes</h3>
		{#if data.votes}
			<ul class="mt-4 flex flex-col gap-4">
				{#each data.votes.items as vote}
					<li class="flex flex-row gap-2 border-t-1 pt-4">
						<div class="bg-card text-accent-text flex items-center p-2">
							{#if vote.vote_type === 'upvote'}
								<RiArrowUpSLine class="size-8" />
							{:else}
								<RiArrowDownSLine class="size-8" />
							{/if}
						</div>
						<div class="flex flex-col">
							<Button variant="link" class="font-medium" href={vote.url}>{vote.url}</Button>
							<p class="px-4">for query: {vote.query}</p>
						</div>
						<Button
							onclick={() => deleteVote(vote.query, vote.url)}
							variant="destructive"
							size="icon"
							class="size-9"
						>
							<RiDeleteBin5Line class="size-6" />
						</Button>
					</li>
				{/each}
			</ul>
		{:else}
			<p>No votes yet.</p>
		{/if}
	{/if}
</main>

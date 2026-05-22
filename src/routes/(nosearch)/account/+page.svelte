<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import * as Tabs from '@/components/ui/tabs';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';

	import RiArrowUpSLine from '~icons/ri/arrow-up-s-line';
	import RiArrowDownSLine from '~icons/ri/arrow-down-s-line';
	import RiDeleteBin5Line from '~icons/ri/delete-bin-5-line';

	import { getCookies } from '@/cookies.svelte';
	const cookies = getCookies();

	const { data, form } = $props();

	// ── ToS dialog ────────────────────────────────────────────────────────────
	// Open whenever the user is logged in with confirmed email and hasn't agreed yet.
	// "Maybe later" closes it for this page visit; it reappears on the next visit.
	let tosDialogOpen = $state(
		data.loginStatus === 'assumeLoggedIn' &&
			!data.awaitingEmailConfirmation &&
			!data.hasAgreedToTerms
	);
	let pendingKeyCreation = $state(false);

	onMount(() => {
		if (
			data.loginStatus === 'assumeLoggedIn' &&
			!data.awaitingEmailConfirmation &&
			data.hasAgreedToTerms &&
			sessionStorage.getItem('pendingKeyCreation')
		) {
			sessionStorage.removeItem('pendingKeyCreation');
			createKeyDialogOpen = true;
		}
	});

	function openTosForKeyCreation() {
		pendingKeyCreation = true;
		tosDialogOpen = true;
	}

	function onAgreeToTerms() {
		if (pendingKeyCreation) {
			sessionStorage.setItem('pendingKeyCreation', '1');
		}
	}

	// ── Create key dialog ─────────────────────────────────────────────────────
	let createKeyDialogOpen = $state(false);
	let displayedNewKey = $state<string | null>(null);
	let displayedNewKeyName = $state<string | null>(null);

	$effect(() => {
		if (form?.success && form?.newKey) {
			displayedNewKey = form.newKey;
			displayedNewKeyName = form.newKeyName ?? null;
			createKeyDialogOpen = false;
		}
	});

	// ── Votes ─────────────────────────────────────────────────────────────────
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
					location.reload();
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
					<div class="flex items-center gap-2">
						<input id="tos-agree" type="checkbox" name="tosAgreed" required class="h-4 w-4" />
						<Label for="tos-agree" class="text-sm font-normal">
							I agree to the <a href="/terms" class="text-blue-600 hover:underline"
								>Terms of Service</a
							>
						</Label>
					</div>
					<Button class="max-w-32" type="submit">Register</Button>
				</form>
			</Tabs.Content>
		</Tabs.Root>
	{:else}
		<!-- ToS Agreement Dialog — controlled, no Trigger, opened programmatically -->
		<AlertDialog.Root bind:open={tosDialogOpen}>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Agree to the Crawling API Terms</AlertDialog.Title>
					<AlertDialog.Description>
						To create API keys, you must agree to the <a
							href="/terms#crawling-api"
							class="text-blue-600 hover:underline">Crawling API terms</a
						> in our Terms of Service.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Maybe later</AlertDialog.Cancel>
					<form method="post" action="?/agreeToTerms">
						<AlertDialog.Action type="submit" onclick={onAgreeToTerms}
							>I agree to the Terms of Service</AlertDialog.Action
						>
					</form>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>

		{#if data.awaitingEmailConfirmation}
			<Card.Root class="p-4 outline-red-100 outline-solid dark:outline-red-900">
				Awaiting email confirmation, please check your email address.
			</Card.Root>
		{:else}
			<Card.Root class="p-4 outline-green-100 outline-solid dark:outline-green-900">
				Your email address has been confirmed. Nice!
			</Card.Root>
		{/if}

		<!-- Newly created key banner — shown once after createApiKey action -->
		{#if displayedNewKey}
			<Card.Root class="p-4 outline-green-100 outline-solid dark:outline-green-900">
				<p class="mb-1 font-semibold">
					API key created{displayedNewKeyName ? ` — ${displayedNewKeyName}` : ''}
				</p>
				<p class="mb-2 text-sm">Copy this key now — it will not be shown again.</p>
				<div class="bg-muted break-all rounded p-2 font-mono text-sm">{displayedNewKey}</div>
				<div class="mt-2 flex gap-2">
					<Button
						variant="outline"
						onclick={() => navigator.clipboard.writeText(displayedNewKey!)}
					>
						Copy to clipboard
					</Button>
					<Button variant="ghost" onclick={() => (displayedNewKey = null)}>Dismiss</Button>
				</div>
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

		<h3 class="text-xl">API Keys</h3>

		{#if !data.hasAgreedToTerms}
			<p class="mt-2 text-sm">
				You need to <button
					class="cursor-pointer text-blue-600 underline"
					onclick={() => openTosForKeyCreation()}
				>
					agree to the Terms of Service
				</button> before creating API keys.
			</p>
		{/if}

		{#if data.apiKeys && data.apiKeys.length > 0}
			<ul class="mt-4 flex flex-col gap-2">
				{#each data.apiKeys as key}
					<li class="bg-muted flex flex-row items-center gap-2 p-4">
						<div class="flex flex-1 flex-col gap-1">
							<span class="font-medium">{key.name || '(unnamed)'}</span>
							<span class="text-xs">
								Created {new Date(key.created_on).toLocaleDateString()}
							</span>
						</div>
						<AlertDialog.Root>
							<AlertDialog.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="destructive" size="icon" class="size-9">
										<RiDeleteBin5Line class="size-5" />
									</Button>
								{/snippet}
							</AlertDialog.Trigger>
							<AlertDialog.Content>
								<AlertDialog.Header>
									<AlertDialog.Title>Revoke API key?</AlertDialog.Title>
									<AlertDialog.Description>
										This permanently revokes "{key.name ||
											'(unnamed)'}". Any clients using it will stop working.
									</AlertDialog.Description>
								</AlertDialog.Header>
								<AlertDialog.Footer>
									<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
									<form method="post" action="?/revokeApiKey">
										<input type="hidden" name="keyId" value={key.id} />
										<AlertDialog.Action class="bg-red-600" type="submit"
											>Revoke key</AlertDialog.Action
										>
									</form>
								</AlertDialog.Footer>
							</AlertDialog.Content>
						</AlertDialog.Root>
					</li>
				{/each}
			</ul>
		{:else if data.hasAgreedToTerms}
			<p class="mt-2 text-sm">No API keys yet.</p>
		{/if}

		{#if data.hasAgreedToTerms}
			<AlertDialog.Root bind:open={createKeyDialogOpen}>
				<AlertDialog.Trigger>
					{#snippet child({ props })}
						<Button {...props} class="mt-4 max-w-48">Create API key</Button>
					{/snippet}
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<form method="post" action="?/createApiKey">
						<AlertDialog.Header>
							<AlertDialog.Title>Create new API key</AlertDialog.Title>
							<AlertDialog.Description>
								Give your key an optional name. The raw key is shown once after creation.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<div class="px-6 pb-2">
							<Label for="key-name">Key name (optional)</Label>
							<Input
								id="key-name"
								name="keyName"
								type="text"
								placeholder="e.g. My crawler"
								class="mt-1"
							/>
						</div>
						<AlertDialog.Footer>
							<AlertDialog.Cancel onclick={() => (createKeyDialogOpen = false)}
								>Cancel</AlertDialog.Cancel
							>
							<AlertDialog.Action type="submit">Create key</AlertDialog.Action>
						</AlertDialog.Footer>
					</form>
				</AlertDialog.Content>
			</AlertDialog.Root>
		{:else}
			<Button class="mt-4 max-w-48" onclick={() => openTosForKeyCreation()}>
				Create API key
			</Button>
		{/if}

		<hr class="my-4" />

		<h3 class="text-xl">My votes</h3>
		{#if data.votes}
			<ul class="mt-4 flex flex-col gap-4">
				{#each data.votes.items as vote}
					<li class="bg-muted flex flex-row items-center gap-2 p-4">
						<div class="bg-card text-accent-text flex aspect-square items-center p-2">
							{#if vote.vote_type === 'upvote'}
								<RiArrowUpSLine class="size-8" />
							{:else}
								<RiArrowDownSLine class="size-8" />
							{/if}
						</div>
						<div class="flex flex-col gap-1">
							<Button variant="link" class="h-fit py-0 font-medium" href={vote.url}
								>{vote.url}</Button
							>
							<p class="px-4">for query: {vote.query}</p>
						</div>
						<Button
							onclick={() => deleteVote(vote.query, vote.url)}
							variant="destructive"
							size="icon"
							class="ml-auto size-9 hover:-rotate-20"
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

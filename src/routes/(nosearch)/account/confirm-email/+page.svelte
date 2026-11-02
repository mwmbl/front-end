<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card';
	import BottomLinks from '@/components/custom/brand/BottomLinks.svelte';

	const { form } = $props();

	const key = page.url.searchParams.get('key') ?? '';
	const email = page.url.searchParams.get('email') ?? '';
</script>

<main class="flex w-full max-w-2xl flex-col gap-2 self-center px-6">
	<h2 class="-mx-2 text-3xl">Confirm your email address</h2>
	<hr class="my-2" />
	{#if form?.success}
		<Card.Root role="status" class="p-4 outline-green-100 outline-solid dark:outline-green-900">
			Your email address is confirmed. Welcome to Mwmbl, {form.username}!
		</Card.Root>
		<a href="/account" class="text-blue-600 hover:underline">Log in to your account</a>
	{:else}
		{#if form?.error}
			<Card.Root role="alert" class="p-4 outline-red-100 outline-solid dark:outline-red-900">
				{form.error}
			</Card.Root>
		{/if}
		{#if key && email}
			<form method="post" class="flex flex-col gap-2">
				<input type="hidden" name="key" value={key} />
				<input type="hidden" name="email" value={email} />
				<p>Confirm {email} as the address for your Mwmbl account?</p>
				<Button class="max-w-48" type="submit">Confirm</Button>
			</form>
		{:else}
			<p>This link is incomplete. Please use the link from your email.</p>
		{/if}
	{/if}
</main>

<footer class="mt-4 flex justify-center px-8 pb-8">
	<BottomLinks />
</footer>

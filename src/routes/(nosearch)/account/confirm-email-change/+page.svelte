<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card';
	import BottomLinks from '@/components/custom/brand/BottomLinks.svelte';

	const { form } = $props();

	const token = page.url.searchParams.get('token') ?? '';
</script>

<main class="flex w-full max-w-2xl flex-col gap-2 self-center px-6">
	<h2 class="-mx-2 text-3xl">Confirm your new email address</h2>
	<hr class="my-2" />
	{#if form?.success}
		<Card.Root role="status" class="p-4 outline-green-100 outline-solid dark:outline-green-900">
			Your email address is now {form.email}.
		</Card.Root>
		<a href="/account" class="text-blue-600 hover:underline">Go to your account</a>
	{:else}
		{#if form?.error}
			<Card.Root role="alert" class="p-4 outline-red-100 outline-solid dark:outline-red-900">
				{form.error}
			</Card.Root>
		{/if}
		{#if token}
			<form method="post" class="flex flex-col gap-2">
				<input type="hidden" name="token" value={token} />
				<p>Use this address for your Mwmbl account from now on?</p>
				<Button class="max-w-48" type="submit">Confirm</Button>
			</form>
		{:else}
			<p>This link is missing its token. Please use the link from your email.</p>
		{/if}
	{/if}
</main>

<footer class="mt-4 flex justify-center px-8 pb-8">
	<BottomLinks />
</footer>

<script lang="ts">
	import { Button } from '@/components/ui/button';

	let { data } = $props();
</script>

<svelte:head>
	<title>Labs - MWMBL</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8">
	<h1 class="text-3xl font-bold">Labs</h1>

	<section class="flex flex-col gap-3">
		<h2 class="text-xl font-semibold">Combined Search</h2>
		<p class="text-muted-foreground">
			Use Combined Search as your default search. It pools the Mwmbl index, Staan and Wikipedia into
			one ranked list of results. It's limited to 100 searches a month; after that, standard search
			is used.
		</p>
		{#if data.loginStatus !== 'assumeLoggedIn'}
			<p class="text-muted-foreground text-sm">
				Combined Search only applies while you are <a href="/account" class="underline">signed in</a
				>.
			</p>
		{/if}
		<form method="post" action={data.combinedSearch ? '?/disable' : '?/enable'}>
			<Button type="submit" variant={data.combinedSearch ? 'secondary' : 'default'}>
				{data.combinedSearch ? 'Turn off Combined Search' : 'Turn on Combined Search'}
			</Button>
		</form>
		<p class="text-muted-foreground text-sm">
			Currently <strong>{data.combinedSearch ? 'on' : 'off'}</strong>.
		</p>
	</section>
</main>

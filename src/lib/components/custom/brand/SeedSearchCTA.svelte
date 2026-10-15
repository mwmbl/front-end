<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';

	let { loginStatus }: { loginStatus: string } = $props();

	const loggedIn = $derived(loginStatus === 'assumeLoggedIn');
	const loginHref = $derived(
		`/account?next=${encodeURIComponent(page.url.pathname + page.url.search)}`
	);

	let saving = $state(false);
	let failed = $state(false);
	async function tryIt() {
		if (!loggedIn) {
			await goto(loginHref);
			return;
		}
		saving = true;
		failed = false;
		try {
			const res = await fetch('/seed-search', {
				method: 'POST',
				// The Accept header routes this to +server.ts rather than the /seed-search page.
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({ enabled: true })
			});
			if (!res.ok) failed = true;
			await invalidateAll();
		} catch (err) {
			console.log('Turning on Seed Search failed: ', err);
			failed = true;
		} finally {
			saving = false;
		}
	}
</script>

<button
	type="button"
	onclick={tryIt}
	disabled={saving}
	class="group bg-card focus-visible:ring-ring relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-black/12 text-left shadow-md transition-shadow outline-none hover:shadow-lg focus-visible:ring-2 disabled:cursor-wait dark:border-transparent dark:shadow-none"
>
	<!-- Tints the whole box on hover. -->
	<span
		class="bg-brand-gradient absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-15 group-focus-visible:opacity-15"
		aria-hidden="true"
	></span>
	<span class="brand-bar relative block h-1.5"></span>
	<span class="relative block p-5">
		<span class="font-display mb-2 block text-xl font-extrabold">Try Seed Search</span>
		<span class="text-foreground/80 block leading-relaxed">
			Combine high quality results from The European Search Perspective (EUSP) with Mwmbl results
			and help grow our index.
		</span>
		<!-- Styled like a Button; a real one can't nest inside the box's button. -->
		<span
			class="try-it text-primary-foreground mt-4 inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors duration-300 group-hover:text-black group-focus-visible:text-black"
		>
			{saving ? 'Turning on…' : 'Try it'}
		</span>
		{#if failed}
			<span class="text-muted-foreground mt-2 block text-sm"
				>Couldn't turn on Seed Search. Try again later.</span
			>
		{/if}
	</span>
</button>

<style>
	/* Starts on the solid half; moving the position reveals the brand gradient underneath. Both are
	   backgrounds of one element so no colour fringes show at the rounded corners. On hover the solid
	   layer overshoots by a few px (no-repeat, so nothing wraps back in) to avoid a rounding sliver. */
	.try-it {
		background-image:
			linear-gradient(to right, transparent 50%, var(--primary) 50%),
			linear-gradient(130deg, hsl(48, 100%, 61%), hsl(283, 100%, 77%), hsl(206, 100%, 73%));
		background-size:
			200% 100%,
			100% 100%;
		background-repeat: no-repeat;
		background-position:
			100% 0,
			0 0;
		transition:
			background-position 300ms ease-out,
			color 300ms;
	}
	:global(.group:hover) .try-it,
	:global(.group:focus-visible) .try-it {
		background-position:
			4px 0,
			0 0;
	}

	/* Wider than the bar, so shifting it slides the colours along a little. */
	.brand-bar {
		background-image: linear-gradient(
			90deg,
			hsl(48, 100%, 61%),
			hsl(283, 100%, 77%),
			hsl(206, 100%, 73%)
		);
		background-size: 150% 100%;
		background-position: 0 0;
		transition: background-position 600ms ease-out;
	}
	:global(.group:hover) .brand-bar,
	:global(.group:focus-visible) .brand-bar {
		background-position: 100% 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.try-it,
		.brand-bar {
			transition: none;
		}
	}
</style>

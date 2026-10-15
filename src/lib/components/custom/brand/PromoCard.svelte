<script lang="ts">
	import type { Snippet } from 'svelte';

	// A whole-box call to action: a link when given href, otherwise a button.
	let {
		title,
		action,
		icon,
		href,
		onclick,
		disabled = false,
		children,
		after
	}: {
		title: string;
		action: string;
		icon?: Snippet;
		href?: string;
		onclick?: () => void;
		disabled?: boolean;
		children: Snippet;
		after?: Snippet;
	} = $props();
</script>

<!-- Always an <a> or <button>, which the a11y check can't see through. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
	this={href ? 'a' : 'button'}
	{href}
	target={href ? '_blank' : undefined}
	rel={href ? 'noopener' : undefined}
	type={href ? undefined : 'button'}
	disabled={href ? undefined : disabled}
	{onclick}
	class="group bg-card focus-visible:ring-ring relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-black/12 text-left shadow-md transition-shadow outline-none hover:shadow-lg focus-visible:ring-2 disabled:cursor-wait dark:border-transparent dark:shadow-none"
>
	<!-- Tints the whole box on hover. -->
	<span
		class="bg-brand-gradient absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-15 group-focus-visible:opacity-15"
		aria-hidden="true"
	></span>
	<span class="brand-bar relative block h-1.5"></span>
	<span class="relative block p-5">
		<span class="font-display mb-2 block text-xl font-extrabold">{title}</span>
		<span class="text-foreground/80 block leading-relaxed">{@render children()}</span>
		<!-- Styled like a Button; a real one can't nest inside the box's link or button. -->
		<span
			class="try-it text-primary-foreground mt-4 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-300 group-hover:text-black group-focus-visible:text-black"
		>
			{@render icon?.()}
			{action}
		</span>
		{@render after?.()}
	</span>
</svelte:element>

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

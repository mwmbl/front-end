<script>
	import { Button } from '@/components/ui/button';

	let { class: className = '' } = $props();

	const links = [
		{ label: 'Donate', href: 'https://opencollective.com/mwmbl' },
		{ label: 'Source Code', href: 'https://github.com/mwmbl' },
		{ label: 'Book', href: 'https://book.mwmbl.org/' },
		{ label: 'Blog', href: 'https://blog.mwmbl.org/' },
		{ label: 'YouTube', href: 'https://www.youtube.com/@mwmbl' }
	];
</script>

<section class="mt-2 flex flex-col gap-1">
	<div class="flex flex-row items-center text-sm font-medium text-unemphasized-2 {className}">
		{#each links as link}
			<Button
				variant="link"
				href={link.href}
				class="h-fit px-0 py-0 text-sm font-medium text-unemphasized-2"
				target="_blank"
			>
				{link.label}
			</Button>
			{#if links.indexOf(link) < links.length - 1}
				<span class="px-1">•</span>
			{/if}
		{/each}
	</div>
	<p class="flex flex-row text-sm text-unemphasized-2 {className}">
		© Mwmbl 2024, under the AGPL-3.0 license
	</p>
</section>

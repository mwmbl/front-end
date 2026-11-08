<script lang="ts">
	let { query, active }: { query: string | undefined; active: 'web' | 'images' } = $props();

	const suffix = $derived(query ? `?q=${encodeURIComponent(query)}` : '');
	const tabs = $derived([
		{ id: 'web', label: 'Web', href: `/search${suffix}` },
		{ id: 'images', label: 'Images', href: `/images${suffix}` }
	]);
</script>

<nav aria-label="Search type" class="flex flex-row gap-4">
	{#each tabs as tab}
		<a
			href={tab.href}
			aria-current={tab.id === active ? 'page' : undefined}
			class="border-b-2 px-1 pb-1 text-sm font-medium {tab.id === active
				? 'border-foreground'
				: 'text-muted-foreground hover:text-foreground border-transparent'}"
		>
			{tab.label}
		</a>
	{/each}
</nav>

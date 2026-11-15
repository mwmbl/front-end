<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	import { formatValue, type WidgetValues } from '$lib/widgets';
	import WidgetFooter from './WidgetFooter.svelte';

	// `values` is null while they load: the title and source come with the search results.
	let {
		title,
		sourceName,
		shareUrl,
		values
	}: { title: string; sourceName: string; shareUrl: string; values: WidgetValues | null } =
		$props();

	const head = $derived(values?.fields[0]);
	const rest = $derived(values?.fields.slice(1) ?? []);
</script>

<Card.Root class="gap-4 border px-6 pt-5 pb-0" aria-label={title} aria-busy={values == null}>
	<div>
		<h2 class="text-accent-text text-lg leading-6 font-medium">{title}</h2>
		<p class="text-muted-foreground mt-0.5 text-sm">Worked out from your search</p>
	</div>

	{#if values && head}
		<div class="flex flex-wrap items-end gap-x-10 gap-y-3">
			<div>
				<div class="text-muted-foreground text-sm">{head.label}</div>
				<div class="mt-0.5 flex flex-wrap items-baseline gap-x-2">
					<span class="text-foreground text-4xl font-semibold tracking-tight tabular-nums">
						{formatValue(head.value)}
					</span>
					<span class="text-unemphasized-2">{head.unit}</span>
				</div>
			</div>
			{#each rest as field, i (i)}
				<div class="pb-1">
					<div class="text-muted-foreground text-sm">{field.label}</div>
					<div class="mt-0.5 flex items-baseline gap-1.5">
						<span class="text-foreground text-xl font-medium tabular-nums">
							{formatValue(field.value)}
						</span>
						<span class="text-unemphasized-2 text-sm">{field.unit}</span>
					</div>
				</div>
			{/each}
		</div>
		{#if values.inputs.length > 0}
			<!-- What was read from the query, so a misreading is plain to see. -->
			<div class="flex flex-wrap items-center gap-2 text-sm">
				<span class="text-muted-foreground">Using</span>
				{#each values.inputs as input (input.name)}
					<span
						class="bg-secondary/50 text-unemphasized-2 inline-flex h-7 items-center gap-1.5 rounded-full px-2.5"
					>
						{input.label}
						<strong class="text-foreground font-semibold tabular-nums">
							{formatValue(input.value)}
						</strong>
					</span>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="flex animate-pulse flex-col gap-4" aria-hidden="true">
			<div class="flex items-end gap-10">
				<div>
					<div class="bg-muted h-3 w-14 rounded-md"></div>
					<div class="bg-muted mt-2.5 h-9 w-36 rounded-lg"></div>
				</div>
				<div class="pb-1">
					<div class="bg-muted h-3 w-14 rounded-md"></div>
					<div class="bg-muted mt-2.5 h-6 w-28 rounded-md"></div>
				</div>
			</div>
			<div class="flex gap-2">
				<div class="bg-muted h-7 w-40 rounded-full"></div>
				<div class="bg-muted h-7 w-36 rounded-full"></div>
			</div>
		</div>
	{/if}

	<WidgetFooter label="Calculated by" {sourceName} shareUrl={values?.shareUrl || shareUrl} />
</Card.Root>

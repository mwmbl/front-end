<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import RiCalculatorLine from '~icons/ri/calculator-line';
	import RiFileCopyLine from '~icons/ri/file-copy-line';
	import RiCheckLine from '~icons/ri/check-line';

	import type { CalculationWidget } from '$lib/widgets';

	let { widget }: { widget: CalculationWidget } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(widget.result);
		} catch {
			return;
		}
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 1500);
	}

	$effect(() => () => clearTimeout(timer));
</script>

<Card.Root class="gap-3 border px-6 py-5" aria-label="Calculator">
	<div class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
		<RiCalculatorLine class="h-4 w-4" aria-hidden="true" />
		Calculator
	</div>
	<div class="flex items-center justify-between gap-6">
		<div class="flex min-w-0 flex-col gap-0.5">
			<div class="text-unemphasized-2 break-words tabular-nums">{widget.expression} =</div>
			<output class="text-foreground text-4xl font-semibold tracking-tight break-all tabular-nums">
				{widget.result}
			</output>
		</div>
		<button
			type="button"
			onclick={copy}
			aria-label={copied ? 'Copied' : 'Copy result'}
			class="bg-secondary/50 text-unemphasized-2 hover:bg-secondary flex h-11 w-11 flex-none items-center justify-center rounded-lg border"
		>
			{#if copied}
				<RiCheckLine class="h-5 w-5" aria-hidden="true" />
			{:else}
				<RiFileCopyLine class="h-5 w-5" aria-hidden="true" />
			{/if}
		</button>
	</div>
</Card.Root>

<script lang="ts">
	import { STATUS_DOT, STATUS_LABEL, type PanelStatus } from '$lib/moderation';

	let { status }: { status: PanelStatus } = $props();
</script>

<span
	class="bg-secondary text-unemphasized-2 inline-flex items-center gap-1.5 rounded-2xl px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.05em]"
>
	<span class="size-1.5 rounded-full" style="background: {STATUS_DOT[status]}"></span>
	{STATUS_LABEL[status]}
</span>

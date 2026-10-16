<script>
	import PhMatrixLogoBold from '~icons/ph/matrix-logo-bold';
	import PromoCard from './PromoCard.svelte';
</script>

<PromoCard
	title="Join the Mwmbl community"
	action="Join us on Matrix"
	href="https://matrix.to/#/#mwmbl:matrix.org"
>
	Mwmbl is powered by you — our community. We're a friendly bunch and you can find us on Matrix.
	{#snippet icon()}
		<PhMatrixLogoBold />
	{/snippet}
</PromoCard>

<script>
	import { Button } from '@/components/ui/button';
	import RiDiscordFill from '~icons/ri/discord-fill';
	import PhMatrixLogoBold from '~icons/ph/matrix-logo-bold';
</script>

<div class="relative overflow-hidden rounded-2xl border-2 border-black/10 p-5">
	<div
		class="bg-brand-gradient absolute top-0 left-0 -z-10 size-full opacity-50 dark:opacity-25"
	></div>

	<h2 class="font-display mb-3 text-xl font-extrabold">Join the Mwmbl community</h2>
	<p class="text-unemphasized-2 dark:text-white/70">
		Mwmbl is powered by you — our community. We're a friendly bunch and you can find us on Matrix
		and Discord.
	</p>
	<p class="text-unemphasized-2 mt-1 font-semibold dark:text-white/70">Join the community now!</p>
	<div class="mt-3 flex flex-row gap-3">
		<Button href="https://matrix.to/#/#mwmbl:matrix.org" target="_blank">
			<PhMatrixLogoBold class="mr-2" />
			Matrix
		</Button>
		<Button
			href="https://discord.gg/2BGSUYFdkD"
			class="bg-primary/15 hover:bg-primary/25 text-black dark:text-white"
			target="_blank"
		>
			<RiDiscordFill class="mt-[0.07em] mr-2" />
			Discord
		</Button>
	</div>
</div>

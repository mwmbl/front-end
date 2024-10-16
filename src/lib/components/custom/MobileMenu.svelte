<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Sheet from '@/components/ui/sheet';

	import RiMenu3Fill from '~icons/ri/menu-3-fill';
	import RiMoneyDollarCircleFill from '~icons/ri/money-dollar-circle-fill';

	import Options from '@/components/custom/Options.svelte';
	import SignInButton from '@/components/custom/SignInButton.svelte';

	import { getCookies } from '@/cookies.svelte';
	let cookies = getCookies();

	let open = false;

	import { onNavigate } from '$app/navigation';
	onNavigate(() => {
		open = false;
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			class="lg:hidden"
			size="icon"
			variant="secondary"
			title="Menu"
			aria-label="Menu"
		>
			<RiMenu3Fill class="h-6 w-6 text-black dark:text-white" />
		</Button>
	</Sheet.Trigger>
	<Sheet.Content side="right" class="max-w-[75%]">
		<Sheet.Header class="mb-12 max-[340px]:text-left">
			<Sheet.Title>Options</Sheet.Title>
		</Sheet.Header>
		<hr class="absolute left-0 top-[4.5rem] w-full" />
		<div class="flex flex-col gap-4">
			<div class="grid gap-4 min-[400px]:grid-cols-2">
				<span>
					{#if cookies.status !== 'assumeLoggedIn'}
						Sign in to start curating
					{:else}
						Logged in as <em class="whitespace-nowrap">{cookies.username}</em>
					{/if}
				</span>
				<div class="min-[400px]:justify-self-end">
					<SignInButton />
				</div>
			</div>
			<div class="grid gap-4 min-[400px]:grid-cols-2">
				<span> Donate to keep Mwmbl running </span>
				<Button
					href="https://opencollective.com/mwmbl"
					class="max-w-min px-6 min-[400px]:justify-self-end"
					variant="secondary"
				>
					<RiMoneyDollarCircleFill class="mr-2 min-h-5 min-w-5 text-black dark:text-white" /> Donate
				</Button>
			</div>
			<hr class="my-2" />
			<Options />
		</div>
	</Sheet.Content>
</Sheet.Root>

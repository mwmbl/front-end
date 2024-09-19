<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Sheet from '@/components/ui/sheet';

	import RiMenu3Fill from '~icons/ri/menu-3-fill';
	import RiUserLine from '~icons/ri/user-line';
	import RiMoneyDollarCircleFill from '~icons/ri/money-dollar-circle-fill';

	import Options from '@/components/custom/Options.svelte';
</script>

<Sheet.Root>
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
	<Sheet.Content side="right">
		<Sheet.Header class="mb-12">
			<Sheet.Title>Options</Sheet.Title>
		</Sheet.Header>
		<hr class="absolute left-0 top-[4.5rem] w-full" />
		<div class="flex flex-col gap-4">
			<div class="grid grid-cols-2 gap-4">
				Sign in to start curating
				<Button href="/account" class="max-w-min justify-self-end px-6">
					<RiUserLine class="mr-2 min-h-5 min-w-5 text-white dark:text-black" /> Sign In
				</Button>
			</div>
			<div class="grid grid-cols-2 gap-4">
				Donate to keep Mwmbl running
				<Button
					href="https://opencollective.com/mwmbl"
					class="max-w-min justify-self-end px-6"
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

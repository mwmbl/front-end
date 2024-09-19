<script>
	import { Button } from '@/components/ui/button';
	import * as Sheet from '@/components/ui/sheet';

	import RiMenu3Fill from '~icons/ri/menu-3-fill';
	import RiSettings4Fill from '~icons/ri/settings-4-fill';
	import RiUserLine from '~icons/ri/user-line';
</script>

<header
	class="flex h-16 w-full max-w-[80rem] flex-row items-center gap-2 self-center px-5 pb-8 pt-10 sm:gap-6 lg:px-8"
>
	<a href="/" class="col-start-1 mr-auto flex flex-row items-center gap-4">
		<img src="/logo.svg" alt="mwmbl" class="h-12" />
		<img src="/mwmbl-text.svg" alt="" class="h-6" />
	</a>
	<div class="hidden md:contents">
		<Button variant="link" href="https://opencollective.com/mwmbl" class="px-2">Donate</Button>
		<Button href="/account" class="max-lg:hidden">
			<RiUserLine class="mr-2 min-h-5 min-w-5 text-white dark:text-black" /> Sign In
		</Button>
	</div>
	<div class="contents md:hidden">
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
					<RiMenu3Fill class="min-h-6 min-w-6 text-black dark:text-white" />
				</Button>
			</Sheet.Trigger>
			<Sheet.Content side="right">
				<Sheet.Header>
					<Sheet.Title>Mwmbl Menu</Sheet.Title>
				</Sheet.Header>
				<ol class="flex flex-col items-start">
					<Button variant="link" href="/" class="px-2">Home</Button>
					<Button variant="link" href="https://opencollective.com/mwmbl" class="px-2">
						Donate
					</Button>
					<Button variant="outline" href="/preferences" class="mb-3 px-2">
						<RiSettings4Fill class="mr-2 min-h-6 min-w-6 text-black dark:text-white" />
						Preferences
					</Button>
					<Button variant="outline" href="/account" class="px-2">
						<RiUserLine class="mr-2 min-h-6 min-w-6 text-black dark:text-white" />
						Account
					</Button>
				</ol>
			</Sheet.Content>
		</Sheet.Root>
	</div>
</header>

<slot></slot>

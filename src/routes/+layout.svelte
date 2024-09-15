<script>
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';

	import { Button } from '@/components/ui/button';
	import * as Sheet from '@/components/ui/sheet';

	import CiHamburgerMd from '~icons/ci/hamburger-md';
	import RiSettings4Fill from '~icons/ri/settings-4-fill';
</script>

<ModeWatcher />
<div class="flex min-h-screen flex-col">
	<div class="border-t-8 border-pink-400"></div>
	<header
		class="flex h-16 w-full max-w-[80rem] flex-row items-center gap-2 self-center px-5 pb-8 pt-10 sm:gap-6 lg:px-8"
	>
		<a href="/" class="mr-auto"><h1>mwmbl</h1></a>
		<div class="hidden md:contents">
			<Button variant="link" href="/" class="px-2">Home</Button>
			<Button variant="link" href="/" class="px-2">Our Mission</Button>
			<Button variant="link" href="/" class="px-2">The Team</Button>
			<Button variant="link" href="https://opencollective.com/mwmbl" class="px-2">Donate</Button>
			<Button
				variant="link"
				href="/preferences"
				class="px-2"
				title="Prefrences"
				aria-label="Preferences"
			>
				<RiSettings4Fill class="min-h-5 min-w-5 text-black dark:text-white" />
			</Button>
		</div>
		<div class="contents md:hidden">
			<Sheet.Root>
				<Sheet.Trigger asChild let:builder>
					<Button builders={[builder]} variant="outline" size="icon">
						<CiHamburgerMd class="h-7 w-7" />
					</Button>
				</Sheet.Trigger>
				<Sheet.Content side="right">
					<Sheet.Header>
						<Sheet.Title>Mwmbl Menu</Sheet.Title>
					</Sheet.Header>
					<ol class="flex flex-col items-start">
						<Button variant="link" href="/" class="px-2">Home</Button>
						<Button variant="link" href="/" class="px-2">Our Mission</Button>
						<Button variant="link" href="/" class="px-2">The Team</Button>
						<Button variant="link" href="https://opencollective.com/mwmbl" class="px-2">
							Donate
						</Button>
						<Button variant="link" href="/preferences" class="px-2">Preferences</Button>
					</ol>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	</header>
	<slot></slot>
</div>

<script lang="ts">
	import { Button } from '@/components/ui/button';

	import RiUserLine from '~icons/ri/user-line';

	import { getCookies } from '@/cookies.svelte';
	let cookies = getCookies();
</script>

{#if cookies.assumeLoggedIn !== 'true'}
	<Button href="/account" class="max-w-min px-6">
		<RiUserLine class="mr-2 min-h-5 min-w-5 text-white dark:text-black" /> Sign In
	</Button>
{:else}
	<Button href="/account" class="max-w-min px-6">
		<RiUserLine class="mr-2 min-h-5 min-w-5 text-white dark:text-black" /> Account
	</Button>
{/if}

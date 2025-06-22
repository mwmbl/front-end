<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import Input from '@/components/ui/input/input.svelte';

	import RiArrowDropLeftLine from '~icons/ri/arrow-drop-left-line';
	import RiArrowDropRightLine from '~icons/ri/arrow-drop-right-line';
	import RiLinksLine from '~icons/ri/links-line';
	import RiLoader2Line from '~icons/ri/loader-2-line';

	import type { SubmissionsResult } from './+page.server.js';
	import SignInButton from '@/components/custom/menu/SignInButton.svelte';

	import * as Card from '@/components/ui/card';
	import * as Select from '$lib/components/ui/select';

	let { data } = $props();

	let domainInput: string = $state('');

	let submissionsForInput: Promise<SubmissionsResult> = $state(
		Promise.resolve({ items: [], count: 0 })
	);

	async function fetchSubmissionsForInput() {
		const res = await fetch(
			'https://api.mwmbl.org/api/v1/platform/domain-submissions/domains/' + domainInput
		);
		if (res.ok) {
			const submissions: SubmissionsResult = await res.json();

			return submissions;
		} else {
			return { items: [], count: 0 };
		}
	}

	// Allow API only to be called once every X ms
	let debounceTimer = 0;
	function debounce(callback: Function, ms: number) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(callback, ms);
	}

	let filter = $state({
		status: { value: '', label: 'any' }
	});
</script>

{#snippet submissions(items: SubmissionsResult['items'])}
	{#if items.length > 0}
		<ul class="grid w-fit grid-cols-[16rem_1fr_1fr] gap-2 pr-16">
			{#each items as item}
				<li class="contents">
					<div class="grid grid-cols-[7rem_1fr] gap-x-2">
						<div
							class={`col-span-2 flex flex-col justify-center rounded-2xl p-2 px-4 text-black ${item.status == 'APPROVED' ? ' bg-green-300' : item.status == 'REJECTED' ? ' col-span-1! bg-red-300' : ' bg-gray-300'}`}
						>
							{item.status}
						</div>
						{#if item.status == 'REJECTED'}
							<div class="mr-2 flex flex-col">
								<div>reason: {item.rejection_reason}</div>
								{#if item.rejection_detail}
									<div>detail: {item.rejection_detail}</div>
								{/if}
							</div>
						{/if}
					</div>
					<div class="flex flex-row items-center gap-2 pr-4">
						<span>{item.name}</span>
					</div>
					<div class="flex flex-row items-center gap-2">
						{new Date(item.submitted_on).toISOString().slice(0, 10)},
						{new Date(item.submitted_on).toISOString().slice(11, 16)} (UTC)
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		Nothing on this page...
	{/if}
{/snippet}

<main class="flex w-full max-w-4xl flex-col gap-2 self-center px-6">
	<h2 class="-mx-2 text-3xl">Domain submissions</h2>
	<hr class="my-2" />
	{#if data.status === 'domainSubmissionError'}
		<Card.Root class="p-4 outline-solid outline-red-100 dark:outline-red-900">
			Error submitting domain. Please try again and file an issue if it does not work.
		</Card.Root>
	{:else if data.status === 'domainSubmitted'}
		<Card.Root class="p-4 outline-solid outline-green-100 dark:outline-green-900">
			Domain submitted successfully!
		</Card.Root>
	{/if}
	<div class="w-full rounded-2xl bg-card p-4">
		<h3 class="text-2xl">Submit domain</h3>
		<hr class="my-2" />
		<Input
			class="mt-4"
			type="text"
			placeholder="example.org"
			bind:value={domainInput}
			onkeyup={() => {
				submissionsForInput = new Promise(() => {});
				debounce(() => (submissionsForInput = fetchSubmissionsForInput()), 500);
			}}
		/>
		<div class="mt-2 p-2">
			{#await submissionsForInput}
				<RiLoader2Line class="h-8 w-8 animate-spin" />
			{:then submissionsForInput}
				{#if domainInput.length > 0}
					{#if submissionsForInput.count > 0}
						<div class="mb-4">Found {submissionsForInput.count} pre-existing submission(s)</div>
						{@render submissions(submissionsForInput.items)}
					{:else}
						Found no pre-existing submission(s)
					{/if}
					<form method="POST" action="?/submitDomain">
						{#if data.loginStatus == 'assumeLoggedIn'}
							<Button
								variant="secondary"
								class="mt-6 flex w-full flex-row items-center gap-2 dark:bg-muted"
								type="submit"
							>
								<RiLinksLine class="min-h-5 min-w-5 text-black dark:text-white" />
								{#if submissionsForInput.count > 0}
									Resubmit Domain
								{:else}
									Submit Domain
								{/if}
							</Button>
						{:else}
							<div class="mt-6 flex w-full flex-row items-center gap-2 dark:bg-muted">
								Authenticate to submit
								<SignInButton loginStatus={data.loginStatus} />
							</div>
						{/if}
					</form>
				{/if}
			{/await}
		</div>
	</div>
	<form class="mt-3 p-2">
		<h3 class="text-lg">Filter</h3>
		<label class="flex flex-row items-center gap-4">
			By Status <Select.Root bind:selected={filter.status}>
				<Select.Trigger class="w-[180px]">
					<Select.Value placeholder="any" />
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="">any</Select.Item>
					<Select.Item value="APPROVED">APPROVED</Select.Item>
					<Select.Item value="REJECTED">REJECTED</Select.Item>
					<Select.Item value="PENDING">PENDING</Select.Item>
				</Select.Content>
			</Select.Root>
		</label>
	</form>
	{@render submissions(
		data.submissions.items.filter((item) =>
			filter.status.value !== '' ? item.status == filter.status.value : true
		)
	)}
	<div class="flex flex-row items-center justify-center gap-4 p-4">
		<Button
			href={data.page == 0 ? '' : `?page=${data.page - 1}`}
			variant="ghost"
			class={data.page == 0 ? 'cursor-not-allowed opacity-75' : ''}
		>
			<RiArrowDropLeftLine class="h-4 w-4" /> Previous
		</Button>
		{#each Array.from({ length: data.maxPage + 1 }, (_, i) => i) as page}
			<Button variant={data.page == page ? 'default' : 'outline-solid'} size="icon" href="?page={page}">
				{page}
			</Button>
		{/each}
		<Button
			href={data.page == data.maxPage ? '' : `?page=${data.page + 1}`}
			variant="ghost"
			class={data.page == data.maxPage ? 'cursor-not-allowed opacity-75' : ''}
		>
			Next <RiArrowDropRightLine class="h-4 w-4" />
		</Button>
	</div>
</main>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Dialog } from 'bits-ui';
	import {
		dismissNotification,
		fetchMonthContribution,
		fetchNotifications,
		VOLUNTEER_TIERS,
		type MonthContribution,
		type UserNotification
	} from '$lib/notifications';

	let open = $state(false);
	let granted = $state<UserNotification[]>([]);
	let contribution = $state<MonthContribution | null>(null);
	let okButton = $state<HTMLButtonElement | null>(null);

	const tierId = $derived(String(granted[0]?.data.tier ?? ''));
	const tier = $derived(
		VOLUNTEER_TIERS[tierId] ?? {
			name: tierId.charAt(0).toUpperCase() + tierId.slice(1),
			seedSearches: 0
		}
	);

	onMount(async () => {
		const notifications = await fetchNotifications();
		granted = notifications.filter((n) => n.kind === 'volunteer_membership_granted');
		if (granted.length === 0) return;
		contribution = await fetchMonthContribution(granted[0].created);
		open = true;
	});

	// However the dialog is closed, it has been seen. A lapsed tier that's earned again is
	// notified afresh, so there may be more than one; they all say the same thing.
	function dismiss() {
		open = false;
		for (const n of granted) dismissNotification(n.id);
		granted = [];
	}

	// Confetti that flits about the sky like insects: [left %, top %, width, height, round, colour, path, seconds, delay].
	const confetti: [number, number, number, number, boolean, string, string, number, number][] = [
		[10, 9, 16, 8, false, '#f2b33d', 'a', 9, -1],
		[25, 18, 14, 7, false, '#e8664a', 'b', 11, -4],
		[15, 30, 11, 11, true, '#3d8fd6', 'c', 8, -2],
		[7, 46, 16, 8, false, '#a76bd1', 'a', 12, -6],
		[38, 6, 9, 9, true, '#4caf6a', 'c', 10, -3],
		[48, 23, 14, 7, false, '#3d8fd6', 'a', 13, -7],
		[60, 11, 12, 12, false, '#e8664a', 'b', 9.5, -5],
		[73, 29, 16, 8, false, '#4caf6a', 'c', 11.5, -1.5],
		[87, 40, 10, 10, true, '#f2b33d', 'b', 8.5, -2.5],
		[83, 51, 14, 7, false, '#a76bd1', 'a', 10.5, -8],
		[33, 39, 9, 9, true, '#e8664a', 'b', 12.5, -9],
		[3, 18, 14, 7, false, '#4caf6a', 'c', 10, -6],
		[18, 4, 10, 10, true, '#a76bd1', 'b', 12, -2],
		[30, 28, 16, 8, false, '#f2b33d', 'a', 9, -5],
		[43, 15, 9, 9, true, '#e8664a', 'c', 13, -8],
		[53, 5, 14, 7, false, '#a76bd1', 'a', 11, -3.5],
		[67, 20, 12, 12, false, '#3d8fd6', 'b', 10.5, -6.5],
		[77, 4, 14, 7, false, '#f2b33d', 'c', 9, -1],
		[92, 28, 9, 9, true, '#3d8fd6', 'a', 12, -4.5],
		[63, 37, 14, 7, false, '#e8664a', 'b', 8, -7],
		[12, 39, 12, 12, false, '#4caf6a', 'c', 11, -2.5],
		[93, 13, 14, 7, false, '#f2b33d', 'b', 10, -9.5]
	];
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && dismiss()}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-[rgba(16,32,24,0.6)]" />
		<Dialog.Content
			onOpenAutoFocus={(e) => {
				e.preventDefault();
				okButton?.focus();
			}}
			class="fixed inset-3 z-50 flex flex-col overflow-y-auto rounded-3xl bg-[#fffdf7] text-black shadow-2xl md:inset-10 md:flex-row md:overflow-hidden dark:bg-[hsl(220_4%_16%)] dark:text-white"
		>
			<div
				class="relative flex h-60 shrink-0 items-end justify-center overflow-hidden bg-[#dff0fb] md:h-auto md:w-[45%] md:max-w-[600px] dark:bg-[#1d2c3a]"
			>
				<div
					class="sun absolute top-[8%] right-[10%] size-16 rounded-full bg-[#ffcf4a] md:size-28"
					aria-hidden="true"
				></div>
				<div class="absolute inset-0" aria-hidden="true">
					{#each confetti as [left, top, width, height, round, colour, path, seconds, delay]}
						<span
							class="flit flit-{path}"
							style="left: {left}%; top: {top}%; animation-duration: {seconds}s; animation-delay: {delay}s"
						>
							<span
								class="wing"
								style="width: {width}px; height: {height}px; background: {colour}; border-radius: {round
									? '50%'
									: '2px'}"
							></span>
						</span>
					{/each}
				</div>
				<div
					class="absolute inset-x-0 bottom-0 h-[46px] bg-[#a47046] md:hidden"
					aria-hidden="true"
				></div>
				<img
					src="/thank-you-tree.webp"
					alt="A painted tree with roots in brown earth beneath green hills"
					class="relative block w-72 md:w-full"
				/>
			</div>

			<div
				class="flex flex-1 flex-col gap-4 p-6 md:justify-center md:gap-7 md:px-16 md:py-12 lg:px-20"
			>
				<div
					class="font-display flex items-center gap-2.5 self-start rounded-full bg-[#fde3a6] py-1.5 pr-4 pl-2 text-sm font-extrabold text-[#5a3b00] md:text-base"
				>
					<img src="/pollinator-bee.svg" alt="" class="size-6 md:size-7" />
					<span>{tier.name} member</span>
				</div>
				<Dialog.Title
					class="font-display text-3xl leading-tight font-black tracking-tight text-[#1f6e3a] md:text-5xl dark:text-[#7fd49a]"
				>
					Thank you for supporting Mwmbl!
				</Dialog.Title>
				<Dialog.Description
					class="flex flex-col gap-4 text-base leading-relaxed md:gap-7 md:text-xl"
				>
					<p>
						{#if contribution}
							You've indexed
							<strong class="highlight bg-[#c9ecd2] dark:bg-[#24553a]"
								>{contribution.pages.toLocaleString()} pages</strong
							>
							in
							<strong class="highlight bg-[#cfe5fb] dark:bg-[#22476b]"
								>{contribution.days} {contribution.days === 1 ? 'day' : 'days'}</strong
							>
							this month.
						{:else}
							You've been indexing pages for us this month.
						{/if}
						This really makes a difference to the quality of people's search results.
					</p>
					<p>
						To say thank you, we're gifting you a
						<strong class="highlight bg-[#fde3a6] dark:bg-[#6b4f12]">{tier.name} membership</strong
						>{#if tier.seedSearches}, with
							<strong class="highlight bg-[#fde3a6] dark:bg-[#6b4f12]"
								>{tier.seedSearches.toLocaleString()} seed searches</strong
							>
							per month{/if}. You can view details about your volunteer membership at any time on
						the
						<a href="/membership" onclick={dismiss} class="text-accent-text underline"
							>Membership page</a
						>.
					</p>
				</Dialog.Description>
				<Dialog.Close
					bind:ref={okButton}
					class="font-display mt-auto h-13 w-full shrink-0 cursor-pointer rounded-full bg-[#1f6e3a] px-10 text-lg font-extrabold text-white shadow-[0_8px_20px_rgba(31,110,58,0.3)] hover:bg-[#185a2f] md:mt-3 md:w-auto md:self-start md:text-xl"
				>
					OK
				</Dialog.Close>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.highlight {
		font-weight: 600;
		padding: 1px 6px;
		border-radius: 6px;
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
	}
	.flit {
		position: absolute;
		display: block;
		animation: flit-a 10s ease-in-out infinite alternate;
	}
	.flit-b {
		animation-name: flit-b;
	}
	.flit-c {
		animation-name: flit-c;
	}
	.wing {
		display: block;
		animation: flutter 0.45s ease-in-out infinite alternate;
	}
	.sun {
		animation: glow 4.5s ease-in-out infinite;
	}
	@keyframes flutter {
		to {
			transform: scaleY(0.3);
		}
	}
	@keyframes flit-a {
		25% {
			transform: translate(46px, -28px) rotate(25deg);
		}
		50% {
			transform: translate(80px, 12px) rotate(-12deg);
		}
		75% {
			transform: translate(34px, 40px) rotate(40deg);
		}
		100% {
			transform: translate(-24px, 8px) rotate(-20deg);
		}
	}
	@keyframes flit-b {
		30% {
			transform: translate(-50px, 22px) rotate(-30deg);
		}
		55% {
			transform: translate(-20px, -36px) rotate(15deg);
		}
		80% {
			transform: translate(36px, -10px) rotate(-25deg);
		}
		100% {
			transform: translate(10px, 30px) rotate(30deg);
		}
	}
	@keyframes flit-c {
		20% {
			transform: translate(24px, 30px) rotate(35deg);
		}
		45% {
			transform: translate(-30px, 46px) rotate(-10deg);
		}
		70% {
			transform: translate(-56px, 4px) rotate(20deg);
		}
		100% {
			transform: translate(-10px, -34px) rotate(-35deg);
		}
	}
	@keyframes glow {
		0%,
		100% {
			box-shadow:
				0 0 36px 12px rgba(255, 204, 74, 0.45),
				0 0 110px 40px rgba(255, 214, 110, 0.22);
			transform: scale(1);
		}
		50% {
			box-shadow:
				0 0 56px 22px rgba(255, 204, 74, 0.6),
				0 0 150px 64px rgba(255, 214, 110, 0.3);
			transform: scale(1.04);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.flit,
		.wing,
		.sun {
			animation: none;
		}
	}
</style>

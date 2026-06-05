<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import SearchResult from './SearchResult.svelte';
	import RiLoaderLine from '~icons/ri/loader-line';
	import RiCheckLine from '~icons/ri/check-line';

	let { query }: { query: string } = $props();

	type SuperResult = {
		url: string;
		title: string;
		extract: string;
		score: number;
		source: string;
		origin: string;
	};

	let streaming = $state(false);
	let done = $state(false);
	let errorMsg = $state<string | null>(null);
	let sources = $state<Record<string, 'loading' | number>>({});
	let results = $state<SuperResult[]>([]);
	let crawlCount = $state(0);
	let elapsedSeconds = $state<number | null>(null);
	let monthlyUsage = $state<number | null>(null);
	let monthlyLimit = $state<number | null>(null);
	let pagesIndexed = $state<number | null>(null);

	let abortController: AbortController | null = null;

	function toSegments(text: string): Array<{ value: string; is_bold: boolean }> {
		if (!text) return [];
		const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
		if (terms.length === 0) return [{ value: text, is_bold: false }];
		const termSet = new Set(terms);
		const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
		const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
		// split() with a capturing group keeps the matched terms as separate parts,
		// so a part is bold iff its lowercased value is one of the query terms.
		return text
			.split(pattern)
			.filter((p) => p.length > 0)
			.map((part) => ({
				value: part,
				is_bold: termSet.has(part.toLowerCase())
			}));
	}

	async function startSearch() {
		abortController?.abort();
		abortController = new AbortController();
		streaming = true;
		done = false;
		errorMsg = null;
		sources = {};
		results = [];
		crawlCount = 0;
		elapsedSeconds = null;
		monthlyUsage = null;
		monthlyLimit = null;
		pagesIndexed = null;

		try {
			const response = await fetch(`/api/v2/super-search/?q=${encodeURIComponent(query)}`, {
				signal: abortController.signal,
				headers: { Accept: 'text/event-stream' }
			});

			if (!response.ok || !response.body) {
				errorMsg = `Request failed (${response.status})`;
				streaming = false;
				return;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done: streamDone, value } = await reader.read();
				if (streamDone) break;

				buffer += decoder.decode(value, { stream: true });
				const blocks = buffer.split('\n\n');
				buffer = blocks.pop() ?? '';

				for (const block of blocks) {
					if (!block.trim()) continue;
					let eventType = '';
					let data = '';
					for (const line of block.split('\n')) {
						if (line.startsWith('event: ')) eventType = line.slice(7).trim();
						else if (line.startsWith('data: ')) data = line.slice(6);
					}
					if (!eventType || !data) continue;
					try {
						handleEvent(eventType, JSON.parse(data));
					} catch {
						// ignore malformed events
					}
				}
			}
		} catch (err: unknown) {
			if (!(err instanceof Error && err.name === 'AbortError')) {
				errorMsg = 'Connection lost';
			}
		} finally {
			finalizeSources();
			streaming = false;
			done = true;
		}
	}

	function finalizeSources() {
		sources = Object.fromEntries(
			Object.entries(sources).map(([k, v]) => [k, v === 'loading' ? 0 : v])
		);
	}

	function handleEvent(type: string, data: Record<string, unknown>) {
		if (type === 'source_started') {
			sources = { ...sources, [data.source as string]: 'loading' };
		} else if (type === 'source_returned') {
			sources = { ...sources, [data.source as string]: data.count as number };
		} else if (type === 'results') {
			const incoming = (data.results as SuperResult[]) ?? [];
			const seen = new Set<string>();
			results = incoming.filter((r) => (seen.has(r.url) ? false : seen.add(r.url)));
		} else if (type === 'page_fetched') {
			crawlCount += 1;
		} else if (type === 'done') {
			elapsedSeconds = (data.elapsed_seconds as number) ?? null;
			monthlyUsage = (data.monthly_usage as number) ?? null;
			monthlyLimit = (data.monthly_limit as number) ?? null;
			pagesIndexed = data.pages_indexed;
			// streaming/done flags and source finalisation are handled in startSearch's finally block
		}
	}

	onMount(() => startSearch());
	onDestroy(() => abortController?.abort());
</script>

<div class="flex flex-col gap-4">
	{#if Object.keys(sources).length > 0}
		<div class="flex flex-row flex-wrap gap-2 text-xs">
			{#each Object.entries(sources) as [source, status]}
				<span
					class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-medium transition-colors
						{status === 'loading'
						? 'border-border text-muted-foreground'
						: typeof status === 'number' && status > 0
							? 'border-primary/30 bg-primary/5 text-primary'
							: 'border-border text-muted-foreground/50'}"
				>
					{#if status === 'loading'}
						<RiLoaderLine class="animate-spin" />
					{/if}
					{source}
					{#if typeof status === 'number'}
						<span class="opacity-60">({status})</span>
					{/if}
				</span>
			{/each}
			{#if streaming && !done}
				<span
					class="text-muted-foreground inline-flex items-center gap-1 font-medium"
					title="Searching…"
				>
					<RiLoaderLine class="animate-spin" />
				</span>
			{:else if done}
				<span
					class="inline-flex items-center gap-1 font-medium text-green-600 dark:text-green-500"
					title="Search complete"
				>
					<RiCheckLine />
				</span>
			{/if}
		</div>
	{/if}

	{#each results as result (result.url)}
		<SearchResult
			result={{
				url: result.url,
				title: toSegments(result.title),
				extract: toSegments(result.extract),
				source: result.source,
				votes: undefined
			}}
			{query}
		/>
	{/each}

	{#if streaming && results.length === 0}
		<div class="text-muted-foreground flex items-center gap-2 text-sm">
			<RiLoaderLine class="animate-spin" />
			Searching the web…
		</div>
	{/if}

	{#if streaming && crawlCount > 0}
		<p class="text-muted-foreground text-xs">
			Crawled {crawlCount} page{crawlCount !== 1 ? 's' : ''}…
		</p>
	{/if}

	{#if done && elapsedSeconds !== null}
		<p class="text-muted-foreground text-xs">
			Search completed in {elapsedSeconds.toFixed(1)}s.
			{#if pagesIndexed !== null}
				Added {pagesIndexed} page{pagesIndexed !== 1 ? 's' : ''} to the index.
			{/if}
		</p>
	{/if}

	{#if done && monthlyUsage !== null && monthlyLimit !== null}
		<p class="text-muted-foreground text-xs">
			{monthlyUsage} of {monthlyLimit} super searches used this month.
		</p>
	{/if}

	{#if done && results.length === 0 && !errorMsg}
		<p class="text-muted-foreground text-sm">No results found.</p>
	{/if}

	{#if errorMsg}
		<p class="text-destructive text-sm">{errorMsg}</p>
	{/if}
</div>

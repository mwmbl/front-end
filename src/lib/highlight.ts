export type TextSegment = { value: string; is_bold: boolean };

// A result from the v2 (SearXNG-shaped) search endpoints.
export type SearchHit = {
	url: string;
	title: string;
	title_highlights: string[];
	content: string;
	content_highlights: string[];
	engine: string;
	score: number;
};

export function toSegments(text: string, terms: string[]): TextSegment[] {
	if (!text) return [];
	const lowered = terms.map((t) => t.toLowerCase()).filter(Boolean);
	if (lowered.length === 0) return [{ value: text, is_bold: false }];
	const termSet = new Set(lowered);
	// Longest first, so a multi-word phrase matches before any of its words.
	const escaped = [...termSet]
		.sort((a, b) => b.length - a.length)
		.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
	// split() with a capturing group keeps the matched terms as separate parts,
	// so a part is bold iff its lowercased value is one of the terms.
	return text
		.split(pattern)
		.filter((p) => p.length > 0)
		.map((part) => ({
			value: part,
			is_bold: termSet.has(part.toLowerCase())
		}));
}

export function hitToResult(hit: SearchHit) {
	return {
		url: hit.url,
		title: toSegments(hit.title, hit.title_highlights),
		extract: toSegments(hit.content, hit.content_highlights),
		source: hit.engine,
		votes: undefined
	};
}

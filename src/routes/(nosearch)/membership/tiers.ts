import RiSeedlingLine from '~icons/ri/seedling-line';
import RiPlantLine from '~icons/ri/plant-line';
import RiTreeLine from '~icons/ri/tree-line';

import type { MembershipTierId } from './+page.server';

export const tierIcons: Record<MembershipTierId, typeof RiPlantLine> = {
	sprout: RiSeedlingLine,
	sapling: RiPlantLine,
	canopy: RiTreeLine
};

// Phrases picked out in bold wherever they appear in a perk.
const highlights = ['300 Seed Search queries', '1,500 Seed Search queries', '1 million pages'];

export function perkParts(original: string): { text: string; bold: boolean }[] {
	// Active Discovery has been renamed Seed Search, and the members area is now on Discord only;
	// the back end may still use the old wording.
	const perk = original
		.replace('Active Discovery', 'Seed Search')
		.replace('in Matrix and Discord', 'on Discord');
	const phrase = highlights.find((h) => perk.includes(h));
	if (!phrase) return [{ text: perk, bold: false }];
	const [before, after] = perk.split(phrase);
	return [
		{ text: before, bold: false },
		{ text: phrase, bold: true },
		{ text: after, bold: false }
	];
}

export function formatPrice(pence: number): string {
	return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

import { describe, expect, it } from 'vitest';

import type { Action } from './moderation-session';
import {
	ARRIVING,
	DEPARTING,
	MOTION,
	asideFlight,
	flightCss,
	flightFor,
	motion,
	outcomeLine,
	riseFlight,
	trayFlight,
	type Rect
} from './moderation-motion';

/** The card slot on a 1280px window: full width of `max-w-5xl px-6`, `h-[376px]`. */
const card: Rect = { left: 152, top: 300, width: 976, height: 376 };
/** The "This session (N)" tray button, up and to the right. */
const tray: Rect = { left: 980, top: 176, width: 148, height: 36 };

/** Where a corner ends up once the flight has fully played out. */
function landed(from: Rect, flight: { dx: number; dy: number; scale: number }) {
	return {
		centreX: from.left + flight.dx + (from.width * flight.scale) / 2,
		centreY: from.top + flight.dy + (from.height * flight.scale) / 2
	};
}

describe('the flight to the session tray', () => {
	it('lands the shrunken card on the button, not next to it', () => {
		// `transform-origin: top left` keeps the top-left corner still, so the translation has to
		// carry the *scaled* centre. Missing that is what the old hard-coded offsets got wrong.
		const { centreX, centreY } = landed(card, trayFlight(card, tray));

		expect(centreX).toBeCloseTo(tray.left + tray.width / 2);
		expect(centreY).toBeCloseTo(tray.top + tray.height / 2);
	});

	it('aims at the button wherever the window puts it', () => {
		// The regression the whole rewrite is for: `translate-x-[300px]` was right at exactly one
		// viewport width. Shift both boxes and the offsets have to shift with them.
		const shift = (rect: Rect): Rect => ({ ...rect, left: rect.left + 300, top: rect.top + 80 });
		const wide = trayFlight(shift(card), shift(tray));

		expect(wide).toEqual(trayFlight(card, tray));
	});

	it('keeps the card big enough to read on the way', () => {
		// Shrinking to the button's own width would be about 0.15.
		expect(trayFlight(card, tray).scale).toBeGreaterThan(0.25);
	});
});

describe('setting a card aside', () => {
	it('moves it down and out of the way at its own size', () => {
		// A skip records nothing and sends nothing, so it must not borrow the motion that means
		// "this is now in the tray".
		const aside = asideFlight(card);

		expect(aside.dy).toBeGreaterThan(0);
		expect(aside.scale).toBe(1);
	});

	it('is what a skip and a jump both take, and a decision does not', () => {
		expect(flightFor('skip', card, tray)).toEqual(asideFlight(card));
		expect(flightFor('jump', card, tray)).toEqual(asideFlight(card));
		expect(flightFor('decide', card, tray)).toEqual(trayFlight(card, tray));
	});

	it('falls back to being set aside when there is no tray button to aim at', () => {
		expect(flightFor('decide', card, null)).toEqual(asideFlight(card));
	});
});

describe('rising out of an UP NEXT row', () => {
	const row: Rect = { left: 152, top: 720, width: 976, height: 36 };

	it('starts the card on the row it came from', () => {
		const rise = riseFlight(card, row);

		expect(card.left + rise.dx).toBe(row.left);
		expect(card.top + rise.dy).toBe(row.top);
	});

	it('scales evenly on both axes', () => {
		// The one axis-independent scale in the file. `crossfade` would use the height ratio here —
		// about a tenth — which crushes the card body into a sliver instead of growing it.
		const rise = riseFlight(card, row);

		expect(rise.scale).toBeGreaterThan(0.8);
		expect(rise.scale).toBeLessThan(1);
	});
});

describe('the transform at a given progress', () => {
	const flight = trayFlight(card, tray);

	it('is an exact identity at rest', () => {
		// What the old double `requestAnimationFrame` was trying to buy and kept losing: the card
		// must not jump on its first frame.
		const css = flightCss(0, flight);

		expect(css).toContain('translate(0px, 0px)');
		expect(css).toContain('scale(1)');
		expect(css).toContain('opacity: 1');
	});

	it('has faded out by the end, and stays valid if an easing overshoots', () => {
		expect(flightCss(1, flight)).toContain('opacity: 0');
		// A negative opacity would drop the whole declaration and flash the card back to full.
		expect(flightCss(1.2, flight)).toContain('opacity: 0');
	});

	it('never fades back in', () => {
		let previous = 1;
		for (let step = 0; step <= 20; step++) {
			const opacity = Number(/opacity: ([\d.e-]+)/.exec(flightCss(step / 20, flight))![1]);
			expect(opacity).toBeLessThanOrEqual(previous);
			previous = opacity;
		}
		expect(previous).toBe(0);
	});

	it('lifts the departing card over the one that replaced it', () => {
		// `{#key}` inserts the incoming branch after the outgoing one, so at equal depth the new
		// card would paint over the decision leaving and hide the whole flight.
		expect(DEPARTING).toBeGreaterThan(ARRIVING);
		expect(flightCss(0.5, flight)).toContain(`z-index: ${DEPARTING}`);
		expect(flightCss(0.5, flight, ARRIVING)).toContain(`z-index: ${ARRIVING}`);
	});
});

describe('durations', () => {
	it('are all zero under reduced motion', () => {
		// Svelte reads `duration: 0` as "no animation at all" — no keyframes, callbacks at once.
		expect(Object.values(motion(true)).every((ms) => ms === 0)).toBe(true);
	});

	it('stay short enough never to gate a decision', () => {
		for (const ms of Object.values(motion(false))) {
			expect(ms).toBeGreaterThanOrEqual(140);
			expect(ms).toBeLessThanOrEqual(260);
		}
		expect(motion(false)).toEqual(MOTION);
	});
});

describe('the line the tray shows', () => {
	const item = { name: 'a.example' } as Action['item'];

	it('says what happened, per outcome', () => {
		expect(outcomeLine({ id: 0, kind: 'skip', item, index: 0 })).toContain('still pending');
		expect(
			outcomeLine({ id: 0, kind: 'decision', item, index: 0, status: 'APPROVED', reason: '' })
		).toContain('crawling starts');
		expect(
			outcomeLine({ id: 0, kind: 'decision', item, index: 0, status: 'REJECTED', reason: 'SPAM' })
		).toBe('rejected — reason: spam');
	});
});

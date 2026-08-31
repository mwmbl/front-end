/**
 * The geometry and timing of the review screen's card motion.
 *
 * Kept apart from the screen for the same reason as $lib/moderation-session: the arithmetic that
 * lands a shrinking card on a button is easy to get wrong by half a box and impossible to eyeball
 * at 240ms. Nothing here touches the DOM — the caller measures and passes rectangles in.
 *
 * The screen's previous animation hard-coded its offsets, which aimed at the tray button at
 * exactly one viewport width. Every offset here is derived from two measured rectangles instead.
 */

import { reasonLabel } from './moderation';
import type { Action } from './moderation-session';

/** The part of a `DOMRect` this file needs, so the maths can be tested without a browser. */
export type Rect = { left: number; top: number; width: number; height: number };

/** Which interaction moved the cursor, and so which motion the card takes. */
export type MoveKind = 'decide' | 'skip' | 'jump' | 'undo';

export type Motion = {
	/** A decided card shrinking away to the session tray. */
	depart: number;
	/** A card set aside rather than decided — a skip, or one stepped over by a jump. */
	aside: number;
	/** The next card rising out of its UP NEXT row into the slot. */
	arrive: number;
	/** UP NEXT rows closing the gap left behind. */
	flip: number;
	/** The UP NEXT row vacating as its domain moves into the slot. */
	rowOut: number;
};

/**
 * Nothing here reaches 260ms.
 *
 * The point of the rebuild was that a moderator is never waiting on the animation: the cursor
 * moves in the same frame the card leaves, so these durations gate nothing at all. They are kept
 * short anyway, because a decision every 300ms should not leave four cards still in the air.
 */
export const MOTION: Motion = { depart: 240, aside: 200, arrive: 220, flip: 200, rowOut: 140 };

/** Svelte treats `duration: 0` as "no animation": no keyframes, and the callbacks fire at once. */
export const STILL: Motion = { depart: 0, aside: 0, arrive: 0, flip: 0, rowOut: 0 };

export function motion(reduced: boolean): Motion {
	return reduced ? STILL : MOTION;
}

/**
 * How small a decided card gets on its way to the tray.
 *
 * Deliberately not `tray.width / card.width`, which is around 0.15 and turns the card's own text
 * into unreadable slivers before it is halfway there. The card has to stay legible for as long as
 * it is worth looking at.
 */
export const TRAY_SHRINK = 0.34;

/** How small the next card starts, rising out of a row that is a tenth of its height. */
export const RISE_SCALE = 0.9;

export type Flight = { dx: number; dy: number; scale: number };

/**
 * Aim a shrinking card at a button.
 *
 * With `transform-origin: top left` a scaled box keeps its top-left corner where it was, so the
 * translation has to carry the *scaled* centre onto the target's centre — not the original one.
 * That half-a-box difference is most of what made the old offsets look arbitrary.
 */
export function trayFlight(from: Rect, to: Rect, scale = TRAY_SHRINK): Flight {
	return {
		dx: to.left + to.width / 2 - (from.left + (from.width * scale) / 2),
		dy: to.top + to.height / 2 - (from.top + (from.height * scale) / 2),
		scale
	};
}

/**
 * A card set aside rather than filed: down and a little out of the way, at its own size.
 *
 * Skipping is not a quieter way of deciding — it records nothing and sends nothing — so it must
 * not borrow the motion that means "this is now in the tray".
 */
export function asideFlight(from: Rect): Flight {
	return { dx: from.width * 0.06, dy: from.height * 0.28, scale: 1 };
}

/**
 * Start the arriving card on its own UP NEXT row, so it reads as rising out of the list.
 *
 * The scale is uniform. Scaling to the row's actual height would be a factor of about a tenth on
 * one axis only, which crushes the whole card body into a sliver rather than growing it — which
 * is exactly what `svelte/transition`'s `crossfade` does here, and why it is not used.
 */
export function riseFlight(from: Rect, row: Rect, scale = RISE_SCALE): Flight {
	return { dx: row.left - from.left, dy: row.top - from.top, scale };
}

export function flightFor(kind: MoveKind, from: Rect, tray: Rect | null): Flight {
	if (kind === 'decide' && tray) return trayFlight(from, tray);
	return asideFlight(from);
}

/** Which card wins where the two overlap. The one leaving is the one worth watching. */
export const DEPARTING = 30;
export const ARRIVING = 20;

/**
 * The card's transform at eased progress `p`, where 0 is resting in the slot and 1 is arrived.
 *
 * `z-index` belongs here rather than on the element because `{#key}` inserts the incoming branch
 * after the outgoing one — so at equal depth the card that just replaced a decision would paint
 * over it and hide the whole flight.
 *
 * At `p === 0` this is an exact identity — no translation, no scaling, full opacity — which is
 * what stops the card jumping on its first frame.
 */
export function flightCss(p: number, flight: Flight, layer = DEPARTING, fadeFrom = 0.55): string {
	// Clamped because an easing is free to overshoot either end, and `opacity: -2e-16` is not a
	// value — the whole declaration would be dropped and the card would flicker back to full.
	const fade = clamp(p <= fadeFrom ? 1 : 1 - (p - fadeFrom) / (1 - fadeFrom));
	return (
		`z-index: ${layer};` +
		'transform-origin: top left;' +
		`transform: translate(${p * flight.dx}px, ${p * flight.dy}px)` +
		` scale(${1 - p * (1 - flight.scale)});` +
		`opacity: ${fade};`
	);
}

function clamp(value: number): number {
	return Math.min(1, Math.max(0, value));
}

/** What the session tray says happened, in one line. */
export function outcomeLine(entry: Action): string {
	if (entry.kind === 'skip') return 'no decision yet — still pending';
	return entry.status === 'APPROVED'
		? 'approved — crawling starts within the hour'
		: `rejected — reason: ${reasonLabel(entry.reason)}`;
}

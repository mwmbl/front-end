/**
 * The review panel's motion — design 6a, "sink".
 *
 * A decision drops the card 18px with a hair of scale while it fades, and the next domain rises
 * 11px into its place, header first and the sample pages 45ms behind. The stagger is the whole
 * point: at this size a single block fading in reads as a flicker, whereas two arriving a beat
 * apart reads as one thing replacing another.
 *
 * Two rules the design arrived at the hard way, both of which fall out of using Svelte's own
 * transitions rather than driving this by hand:
 *
 *  - **The enter must not start before the new domain has painted.** Svelte applies a
 *    transition's `t = 0` style synchronously when the intro begins, so the incoming block is
 *    already at `opacity: 0` on its first frame. Hand-rolled versions of this flashed one
 *    full-opacity frame of the next card.
 *  - **The footer never moves.** The buttons and the undo line sit outside the keyed block, so
 *    the eye stays on the controls and the new "Rejected …" note cannot flash through the
 *    outgoing card.
 */

import type { TransitionConfig } from 'svelte/transition';

/** How long the decided card takes to leave. The enter waits this long before starting. */
export const EXIT_DURATION = 130;
/** How long an arriving region takes to rise into place. */
export const ENTER_DURATION = 300;
/** The gap between the header arriving and the sample pages arriving. */
export const STAGGER = 45;

/**
 * A CSS `cubic-bezier` as a Svelte easing function.
 *
 * `svelte/easing` ships named curves only, and 6a specifies its two curves numerically, so the
 * control points are solved here. Newton-Raphson on x, then evaluate y — the same approach
 * browsers use, and eight iterations is far more than these two curves need.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
	const a = (u: number, v: number) => 1 - 3 * v + 3 * u;
	const b = (u: number, v: number) => 3 * v - 6 * u;
	const c = (u: number) => 3 * u;
	const curve = (t: number, u: number, v: number) => ((a(u, v) * t + b(u, v)) * t + c(u)) * t;
	const slope = (t: number, u: number, v: number) => 3 * a(u, v) * t * t + 2 * b(u, v) * t + c(u);

	return (x: number) => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		let t = x;
		for (let i = 0; i < 8; i++) {
			const error = curve(t, x1, x2) - x;
			if (Math.abs(error) < 1e-6) break;
			const gradient = slope(t, x1, x2);
			if (Math.abs(gradient) < 1e-6) break;
			t -= error / gradient;
		}
		return curve(t, y1, y2);
	};
}

/**
 * Whether this viewer has asked for less movement.
 *
 * Checked at transition time rather than once at load, so a viewer changing the system setting
 * mid-session is respected without a reload. Always false server-side and under the unit tests,
 * where there is no `window` — those exercise the full curves deliberately.
 */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 6a's exit curve — starts moving at once and eases out. */
export const EXIT_EASING = cubicBezier(0.4, 0, 0.6, 1);
/** 6a's enter curve — decelerating, so the arrival settles rather than stopping dead. */
export const ENTER_EASING = cubicBezier(0.2, 0.7, 0.3, 1);

/**
 * The decided card sinking away.
 *
 * Svelte runs an outro from `t = 1` down to `t = 0`, so `t` is the opacity directly and the
 * travel is driven by its complement.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Svelte passes the node first.
export function sink(_node: Element): TransitionConfig {
	if (prefersReducedMotion()) return { duration: 0 };
	return {
		duration: EXIT_DURATION,
		easing: EXIT_EASING,
		css: (t: number) => {
			const gone = 1 - t;
			return `opacity: ${t}; transform: translateY(${gone * 18}px) scale(${1 - gone * 0.015});`;
		}
	};
}

/**
 * A region of the next domain rising into place.
 *
 * `delay` is what staggers the header against the sample pages; both wait out the exit first,
 * so the two cards never occupy the same moment at readable opacity.
 */
export function rise(_node: Element, { delay = 0 }: { delay?: number } = {}): TransitionConfig {
	// No travel and no stagger, but still a beat of nothing so the swap is not a hard cut.
	if (prefersReducedMotion()) return { duration: 0, delay: EXIT_DURATION };
	return {
		delay: EXIT_DURATION + delay,
		duration: ENTER_DURATION,
		easing: ENTER_EASING,
		css: (t: number) => `opacity: ${t}; transform: translateY(${(1 - t) * 11}px);`
	};
}

/**
 * How long after a decision the destination tab should tick.
 *
 * The count changes the moment the decision is recorded, but the tick lands as the card
 * finishes leaving, so it reads as the tab catching what was dropped.
 */
export const TAB_TICK_DELAY = EXIT_DURATION;
export const TAB_TICK_DURATION = 320;

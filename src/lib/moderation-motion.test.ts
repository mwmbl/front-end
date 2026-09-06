import { describe, expect, it } from 'vitest';

import {
	cubicBezier,
	ENTER_DURATION,
	ENTER_EASING,
	EXIT_DURATION,
	EXIT_EASING,
	rise,
	sink,
	STAGGER
} from './moderation-motion';

describe('cubicBezier', () => {
	it('pins both ends', () => {
		const ease = cubicBezier(0.4, 0, 0.6, 1);
		expect(ease(0)).toBe(0);
		expect(ease(1)).toBe(1);
	});

	it('clamps outside the unit interval', () => {
		const ease = cubicBezier(0.4, 0, 0.6, 1);
		expect(ease(-0.5)).toBe(0);
		expect(ease(1.5)).toBe(1);
	});

	it('is the identity for a linear curve', () => {
		const linear = cubicBezier(0, 0, 1, 1);
		for (const x of [0.1, 0.25, 0.5, 0.75, 0.9]) {
			expect(linear(x)).toBeCloseTo(x, 5);
		}
	});

	it('matches the browser on the classic ease curve', () => {
		// cubic-bezier(.25,.1,.25,1) at x=0.5 is ~0.8024 — the value every engine agrees on.
		expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 3);
	});

	it('is symmetric about the midpoint for a symmetric curve', () => {
		const ease = cubicBezier(0.4, 0, 0.6, 1);
		expect(ease(0.5)).toBeCloseTo(0.5, 4);
		expect(ease(0.25) + ease(0.75)).toBeCloseTo(1, 3);
	});

	it('rises monotonically', () => {
		for (const ease of [EXIT_EASING, ENTER_EASING]) {
			let previous = -1;
			for (let x = 0; x <= 1.0001; x += 0.02) {
				const y = ease(x);
				expect(y).toBeGreaterThanOrEqual(previous);
				previous = y;
			}
		}
	});

	it('front-loads the enter curve, so an arrival decelerates', () => {
		// .2,.7 pulls the curve above the diagonal early on.
		expect(ENTER_EASING(0.25)).toBeGreaterThan(0.25);
		expect(ENTER_EASING(0.5)).toBeGreaterThan(0.5);
	});
});

describe('sink', () => {
	const config = sink({} as Element);

	it('runs for 6a’s exit duration', () => {
		expect(config.duration).toBe(EXIT_DURATION);
		expect(config.easing).toBe(EXIT_EASING);
	});

	it('starts where the card already is', () => {
		// An outro begins at t = 1.
		const css = config.css!(1, 0);
		expect(css).toContain('opacity: 1');
		expect(css).toContain('translateY(0px)');
		expect(css).toContain('scale(1)');
	});

	it('ends 18px down, faded out, with a hair of scale', () => {
		const css = config.css!(0, 1);
		expect(css).toContain('opacity: 0');
		expect(css).toContain('translateY(18px)');
		expect(css).toContain('scale(0.985)');
	});
});

describe('rise', () => {
	const node = {} as Element;

	it('waits for the exit to finish before starting', () => {
		expect(rise(node).delay).toBe(EXIT_DURATION);
	});

	it('adds the stagger on top of that wait', () => {
		expect(rise(node, { delay: STAGGER }).delay).toBe(EXIT_DURATION + STAGGER);
	});

	it('runs for 6a’s enter duration', () => {
		const config = rise(node);
		expect(config.duration).toBe(ENTER_DURATION);
		expect(config.easing).toBe(ENTER_EASING);
	});

	it('is invisible and 11px low on its first frame, so nothing flashes', () => {
		const css = rise(node).css!(0, 1);
		expect(css).toContain('opacity: 0');
		expect(css).toContain('translateY(11px)');
	});

	it('lands at rest', () => {
		const css = rise(node).css!(1, 0);
		expect(css).toContain('opacity: 1');
		expect(css).toContain('translateY(0px)');
	});
});

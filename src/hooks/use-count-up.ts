import { useEffect, useState } from "react";

function prefersReducedMotion(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animates a number from 0 to the target value with an ease-out curve.
 * Respects `prefers-reduced-motion` — skips the animation when enabled.
 */
export function useCountUp(target: number, duration = 900) {
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (target === 0) {
			setCount(0);
			return;
		}

		// Skip animation for users who prefer reduced motion
		if (prefersReducedMotion()) {
			setCount(target);
			return;
		}

		let rafId: number;
		const startTime = performance.now();

		function update(currentTime: number) {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			// Ease-out cubic
			const eased = 1 - (1 - progress) ** 3;
			setCount(Math.round(eased * target));

			if (progress < 1) {
				rafId = requestAnimationFrame(update);
			}
		}

		rafId = requestAnimationFrame(update);

		return () => cancelAnimationFrame(rafId);
	}, [target, duration]);

	return count;
}

import { useEffect, useRef, useState } from 'react';

/**
 * Counts up to `value` once, then stays. Used for headline metrics.
 */
export default function AnimatedNumber({ value, duration = 700, decimals = 0, suffix = '' }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const from = useRef(0);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target);
      return undefined;
    }
    const start = performance.now();
    const origin = from.current;
    let frame;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(origin + (target - origin) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  const text = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();

  return (
    <span className="tnum">
      {text}
      {suffix}
    </span>
  );
}

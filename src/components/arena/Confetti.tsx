/** Lightweight CSS confetti burst shown on victory. */

import { useMemo } from "react";

export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 1.8 + Math.random() * 1.4,
        hue: Math.floor(Math.random() * 4),
        size: 6 + Math.random() * 8,
      })),
    [count],
  );

  return (
    <div className="confetti-layer" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`confetti confetti-${p.hue}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

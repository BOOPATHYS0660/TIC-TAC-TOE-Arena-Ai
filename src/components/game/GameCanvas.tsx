import { useEffect, useRef } from "react";
import { render } from "@/game/render";
import type { GameState } from "@/game/engine";

/** Thin React wrapper around the canvas renderer. */
export function GameCanvas({ stateRef }: { stateRef: React.RefObject<GameState | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      const ctx = canvas.getContext("2d");
      const s = stateRef.current;
      if (ctx && s) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        render(ctx, s, canvas.width / dpr, canvas.height / dpr);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [stateRef]);

  return <canvas ref={canvasRef} className="h-full w-full block" />;
}

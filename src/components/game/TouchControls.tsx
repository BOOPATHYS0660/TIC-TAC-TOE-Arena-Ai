import { useEffect, useRef, useState } from "react";
import type { Input } from "@/game/engine";

/** Virtual d-pad shown on touch devices. */
export function TouchControls({ inputRef }: { inputRef: React.RefObject<Input> }) {
  const [touch, setTouch] = useState(false);
  const held = useRef<Record<keyof Input, boolean>>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (!touch) return null;

  const set = (dir: keyof Input, value: boolean) => {
    held.current[dir] = value;
    inputRef.current[dir] = value;
  };

  const Btn = ({ dir, label, cls }: { dir: keyof Input; label: string; cls: string }) => (
    <button
      className={`dpad-btn ${cls}`}
      onPointerDown={(e) => {
        e.preventDefault();
        set(dir, true);
      }}
      onPointerUp={() => set(dir, false)}
      onPointerLeave={() => set(dir, false)}
      onPointerCancel={() => set(dir, false)}
    >
      {label}
    </button>
  );

  return (
    <div className="dpad">
      <Btn dir="up" label="▲" cls="col-start-2 row-start-1" />
      <Btn dir="left" label="◀" cls="col-start-1 row-start-2" />
      <Btn dir="right" label="▶" cls="col-start-3 row-start-2" />
      <Btn dir="down" label="▼" cls="col-start-2 row-start-3" />
    </div>
  );
}

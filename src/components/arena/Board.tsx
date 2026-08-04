/** Board grid — purely presentational. */

import { Cell } from "./Cell";
import type { GameState } from "@/game/arena/types";

interface BoardProps {
  state: GameState;
  validTargets: Set<number>;
  swapFrom: number | null;
  hint: number | null;
  onCell: (i: number) => void;
}

export function Board({ state, validTargets, swapFrom, hint, onCell }: BoardProps) {
  const disabled = state.status !== "playing" || state.turn !== "X";
  const winning = new Set(state.winningLine);

  return (
    <div
      className="arena-board"
      style={{ gridTemplateColumns: `repeat(${state.size}, minmax(0, 1fr))` }}
      role="grid"
      aria-label={`${state.size} by ${state.size} board`}
    >
      {state.board.map((cell, i) => (
        <Cell
          key={i}
          cell={cell}
          index={i}
          winning={winning.has(i) && state.status === "over"}
          targetable={validTargets.has(i)}
          selected={swapFrom === i}
          hinted={hint === i}
          disabled={disabled && !validTargets.has(i)}
          onClick={onCell}
        />
      ))}
    </div>
  );
}

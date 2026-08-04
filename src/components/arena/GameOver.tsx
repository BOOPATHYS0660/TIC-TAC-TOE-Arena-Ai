/** End-of-match summary. */

import { Confetti } from "./Confetti";
import { formatTime } from "./Hud";
import type { GameState } from "@/game/arena/types";

interface GameOverProps {
  state: GameState;
  elapsed: number;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOver({ state, elapsed, onRestart, onMenu }: GameOverProps) {
  const won = state.winner === "X";
  const title = won ? "Victory!" : state.winner === "O" ? "Defeated" : "Draw";

  return (
    <div className="overlay">
      {won && <Confetti />}
      <div className="overlay-card">
        <p className="eyebrow-text">Match complete</p>
        <h2 className="neon-heading mt-1">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>

        <dl className="mt-5 space-y-2 text-sm">
          <Row label="Your score" value={state.players.X.score} />
          <Row label="AI score" value={state.players.O.score} />
          <Row label="Moves played" value={state.moves} />
          <Row label="Duration" value={formatTime(elapsed)} />
          <Row label="Difficulty" value={state.difficulty} />
        </dl>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" className="neon-btn" onClick={onRestart}>
            Restart
          </button>
          <button type="button" className="neon-btn neon-btn-ghost" onClick={onMenu}>
            Main menu
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-border pb-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold capitalize text-foreground">{value}</dd>
    </div>
  );
}

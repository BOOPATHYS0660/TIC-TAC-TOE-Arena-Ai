/** Match screen: HUD + board + pause/game-over overlays. */

import { Home, Pause, Play, RotateCcw } from "lucide-react";

import { Board } from "./Board";
import { GameOver } from "./GameOver";
import { Hud } from "./Hud";
import { useArena } from "@/hooks/useArena";
import type { BoardSize, Difficulty } from "@/game/arena/types";

interface GameScreenProps {
  size: BoardSize;
  difficulty: Difficulty;
  onMenu: () => void;
  onRestart: () => void;
}

export function GameScreen({ size, difficulty, onMenu, onRestart }: GameScreenProps) {
  const arena = useArena(size, difficulty);
  const { state } = arena;

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-4 py-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate text-lg font-bold tracking-wide text-foreground">
          Tic-Tac-Toe <span className="text-primary">Arena AI</span>
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={arena.paused ? "Resume" : "Pause"}
            className="icon-button"
            onClick={() => arena.setPaused(!arena.paused)}
          >
            {arena.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button type="button" aria-label="Restart" className="icon-button" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Main menu" className="icon-button" onClick={onMenu}>
            <Home className="h-4 w-4" />
          </button>
        </div>
      </header>

      <Hud
        state={state}
        elapsed={arena.elapsed}
        target={arena.target}
        onActivate={arena.activate}
        onHint={arena.useHint}
      />

      <div className="relative">
        <Board
          state={state}
          validTargets={arena.validTargets}
          swapFrom={arena.swapFrom}
          hint={arena.hint}
          onCell={arena.clickCell}
        />
        {state.lastScore && (
          <span key={state.lastScore.at} className="score-pop">
            +{state.lastScore.points}
          </span>
        )}
      </div>

      {state.message && state.status === "playing" && (
        <p className="text-center text-xs text-muted-foreground">{state.message}</p>
      )}

      {arena.paused && state.status === "playing" && (
        <div className="overlay">
          <div className="overlay-card">
            <h2 className="neon-heading">Paused</h2>
            <div className="mt-6 grid gap-2">
              <button type="button" className="neon-btn" onClick={() => arena.setPaused(false)}>
                Resume
              </button>
              <button type="button" className="neon-btn neon-btn-ghost" onClick={onRestart}>
                Restart match
              </button>
              <button type="button" className="neon-btn neon-btn-ghost" onClick={onMenu}>
                Main menu
              </button>
            </div>
          </div>
        </div>
      )}

      {state.status === "over" && (
        <GameOver state={state} elapsed={arena.elapsed} onRestart={onRestart} onMenu={onMenu} />
      )}
    </div>
  );
}

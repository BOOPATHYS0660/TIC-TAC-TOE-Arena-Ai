/** Heads-up display: turn, timer, scores, abilities and power-ups. */

import { Bomb, Gem, Move, Shield, Snowflake, Sparkles, Star, Timer } from "lucide-react";

import { cn } from "@/lib/utils";
import type { GameState } from "@/game/arena/types";
import type { TargetMode } from "@/hooks/useArena";

export function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface HudProps {
  state: GameState;
  elapsed: number;
  target: TargetMode;
  onActivate: (mode: Exclude<TargetMode, null>) => void;
  onHint: () => void;
}

export function Hud({ state, elapsed, target, onActivate, onHint }: HudProps) {
  const me = state.players.X;
  const ai = state.players.O;
  const myTurn = state.turn === "X" && state.status === "playing";

  return (
    <div className="flex flex-col gap-3">
      {/* Scores + turn */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <ScorePill label="You" mark="X" score={me.score} active={state.turn === "X"} />
        <div className="neon-panel flex shrink-0 flex-col items-center px-3 py-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" /> {formatTime(elapsed)}
          </span>
          <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            {state.size}×{state.size} · {state.difficulty}
          </span>
        </div>
        <ScorePill label="AI" mark="O" score={ai.score} active={state.turn === "O"} align="right" />
      </div>

      <p className="text-center text-sm text-muted-foreground" aria-live="polite">
        {state.status === "playing"
          ? myTurn
            ? target
              ? `Select a target for ${target}…`
              : "Your turn — place an X"
            : "AI is thinking…"
          : state.message}
      </p>

      {/* Abilities */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <AbilityButton
          icon={Bomb}
          label="Bomb"
          available={me.abilities.bomb}
          active={target === "bomb"}
          disabled={!myTurn || !me.abilities.bomb}
          onClick={() => onActivate("bomb")}
        />
        <AbilityButton
          icon={Shield}
          label="Shield"
          available={me.abilities.shield}
          active={target === "shield"}
          disabled={!myTurn || !me.abilities.shield}
          onClick={() => onActivate("shield")}
        />
        <AbilityButton
          icon={Move}
          label="Swap"
          available={me.abilities.swap}
          active={target === "swap"}
          disabled={!myTurn || !me.abilities.swap}
          onClick={() => onActivate("swap")}
        />
      </div>

      {/* Collected power-ups */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <PowerChip icon={Star} label="Extra" count={me.extraMove ? 1 : 0} />
        <PowerChip icon={Gem} label="x2" count={me.doubleNext ? 1 : 0} />
        <button
          type="button"
          className={cn("power-chip", me.powers.hint > 0 && myTurn && "power-chip-ready")}
          disabled={me.powers.hint <= 0 || !myTurn}
          onClick={onHint}
        >
          <Sparkles className="h-3.5 w-3.5" /> Hint {me.powers.hint}
        </button>
        <button
          type="button"
          className={cn(
            "power-chip",
            me.powers.freeze > 0 && myTurn && "power-chip-ready",
            target === "freeze" && "power-chip-active",
          )}
          disabled={me.powers.freeze <= 0 || !myTurn}
          onClick={() => onActivate("freeze")}
        >
          <Snowflake className="h-3.5 w-3.5" /> Freeze {me.powers.freeze}
        </button>
      </div>
    </div>
  );
}

function ScorePill({
  label,
  mark,
  score,
  active,
  align = "left",
}: {
  label: string;
  mark: "X" | "O";
  score: number;
  active: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "neon-panel min-w-0 px-3 py-1.5",
        active && "neon-panel-active",
        align === "right" && "text-right",
      )}
    >
      <p className="truncate text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
        {label} ({mark})
      </p>
      <p className={cn("text-xl font-bold", mark === "X" ? "text-primary" : "text-accent")}>
        {score}
      </p>
    </div>
  );
}

function AbilityButton({
  icon: Icon,
  label,
  available,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  available: boolean;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn("ability-btn", active && "ability-btn-active", !available && "line-through")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function PowerChip({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <span className={cn("power-chip", count > 0 && "power-chip-ready")}>
      <Icon className="h-3.5 w-3.5" /> {label} {count}
    </span>
  );
}

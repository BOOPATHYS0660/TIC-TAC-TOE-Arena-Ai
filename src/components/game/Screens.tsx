import { useState } from "react";
import type { Difficulty } from "@/game/engine";
import { DIFFICULTY, formatTime } from "@/game/engine";

/** Reusable glowing button. */
export function GlowButton({
  children,
  onClick,
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={variant === "primary" ? "glow-btn" : "glow-btn glow-btn-ghost"}
    >
      {children}
    </button>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="screen-overlay">
      <div className="screen-card">{children}</div>
    </div>
  );
}

export function MainMenu({
  onStart,
  onInstructions,
  onAbout,
  difficulty,
  setDifficulty,
  highScore,
}: {
  onStart: () => void;
  onInstructions: () => void;
  onAbout: () => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  highScore: number;
}) {
  return (
    <Overlay>
      <p className="eyebrow">A 2D survival escape game</p>
      <h1 className="game-title">Escape the Haunted House</h1>
      <p className="text-sm text-muted-foreground">
        Three keys. One code. One very persistent ghost.
      </p>

      <div className="mt-6 space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Difficulty</p>
        <div className="flex justify-center gap-2">
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`diff-btn ${difficulty === d ? "diff-btn-active" : ""}`}
            >
              {DIFFICULTY[d].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <GlowButton onClick={onStart}>Start Game</GlowButton>
        <GlowButton variant="ghost" onClick={onInstructions}>
          Instructions
        </GlowButton>
        <GlowButton variant="ghost" onClick={onAbout}>
          About
        </GlowButton>
      </div>

      <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
        Best score: <span className="text-primary">{highScore}</span>
      </p>
    </Overlay>
  );
}

export function Instructions({ onExit }: { onExit: () => void }) {
  return (
    <Overlay>
      <h2 className="screen-heading">Instructions</h2>
      <ul className="mx-auto max-w-md space-y-2 text-left text-sm text-muted-foreground">
        <li>• Move with the Arrow Keys or WASD (drag the on-screen pad on mobile).</li>
        <li>• Explore eight rooms and collect 3 hidden keys (+100 each).</li>
        <li>• Glowing green notes reveal one digit of the exit code each.</li>
        <li>• With all keys, walk to the Exit Room door and enter the 4-digit code (+200).</li>
        <li>• Escape through the open door to win (+500).</li>
        <li>• The ghost patrols, detects, then chases. Break line of sight to lose it.</li>
        <li>• Press P to pause, H for a hint, M to mute.</li>
      </ul>
      <div className="mt-6">
        <GlowButton onClick={onExit}>Exit</GlowButton>
      </div>
    </Overlay>
  );
}

export function About({ onExit }: { onExit: () => void }) {
  return (
    <Overlay>
      <h2 className="screen-heading">About</h2>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        Escape the Haunted House is a small top-down browser game built with React and the
        HTML canvas. The house map, the ghost's patrol / detect / chase state machine and the
        breadth-first pathfinding all live in a plain TypeScript game module, kept separate
        from the React interface so the code stays easy to read and study.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        All sounds are synthesised live with the Web Audio API — no audio files needed.
      </p>
      <div className="mt-6">
        <GlowButton onClick={onExit}>Exit</GlowButton>
      </div>
    </Overlay>
  );
}

export function PauseMenu({
  onResume,
  onRestart,
  onMenu,
}: {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  return (
    <Overlay>
      <h2 className="screen-heading">Paused</h2>
      <div className="mt-4 flex flex-col gap-3">
        <GlowButton onClick={onResume}>Resume</GlowButton>
        <GlowButton variant="ghost" onClick={onRestart}>
          Restart
        </GlowButton>
        <GlowButton variant="ghost" onClick={onMenu}>
          Main Menu
        </GlowButton>
      </div>
    </Overlay>
  );
}

export function PuzzleScreen({
  clues,
  onSubmit,
  onCancel,
}: {
  clues: { digitIndex: number; digit: number; found: boolean }[];
  onSubmit: (code: string) => boolean;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (code.length !== 4) return setError("Enter all four digits.");
    if (!onSubmit(code)) {
      setError("The lock rattles… wrong code.");
      setCode("");
    }
  };

  return (
    <Overlay>
      <h2 className="screen-heading">The Exit Door</h2>
      <p className="text-sm text-muted-foreground">Enter the correct 4-digit code.</p>

      <input
        value={code}
        autoFocus
        inputMode="numeric"
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
          setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="code-input"
        placeholder="0000"
      />

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => {
          const clue = clues.find((c) => c.digitIndex === i);
          return (
            <div key={i} className="clue-tile">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                #{i + 1}
              </span>
              <span className="text-lg font-bold">{clue?.found ? clue.digit : "?"}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Unknown digits are still hidden on notes around the house.
      </p>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        <GlowButton onClick={submit}>Unlock</GlowButton>
        <GlowButton variant="ghost" onClick={onCancel}>
          Step Away
        </GlowButton>
      </div>
    </Overlay>
  );
}

export function GameOverScreen({
  score,
  time,
  keys,
  highScore,
  onRestart,
  onMenu,
}: {
  score: number;
  time: number;
  keys: number;
  highScore: number;
  onRestart: () => void;
  onMenu: () => void;
}) {
  return (
    <Overlay>
      <h2 className="screen-heading text-destructive">Game Over</h2>
      <p className="text-sm text-muted-foreground">The ghost got you.</p>
      <ResultList
        rows={[
          ["Final score", score.toString()],
          ["Time survived", formatTime(time)],
          ["Keys collected", `${keys}/3`],
          ["Best score", highScore.toString()],
        ]}
      />
      <div className="mt-6 flex flex-col gap-3">
        <GlowButton onClick={onRestart}>Restart</GlowButton>
        <GlowButton variant="ghost" onClick={onMenu}>
          Main Menu
        </GlowButton>
      </div>
    </Overlay>
  );
}

export function WinScreen({
  score,
  time,
  keys,
  highScore,
  onRestart,
  onMenu,
}: {
  score: number;
  time: number;
  keys: number;
  highScore: number;
  onRestart: () => void;
  onMenu: () => void;
}) {
  return (
    <Overlay>
      <h2 className="screen-heading text-primary">Congratulations! You Escaped!</h2>
      <ResultList
        rows={[
          ["Time taken", formatTime(time)],
          ["Keys collected", `${keys}/3`],
          ["Final score", score.toString()],
          ["Best score", highScore.toString()],
        ]}
      />
      <div className="mt-6 flex flex-col gap-3">
        <GlowButton onClick={onRestart}>Play Again</GlowButton>
        <GlowButton variant="ghost" onClick={onMenu}>
          Main Menu
        </GlowButton>
      </div>
    </Overlay>
  );
}

function ResultList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mx-auto mt-5 w-full max-w-xs space-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="result-row">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

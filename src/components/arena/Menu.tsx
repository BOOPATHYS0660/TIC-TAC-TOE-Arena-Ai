/** Main menu: play, board size, difficulty, how to play, settings, theme. */

import { BookOpen, Moon, Play, Settings as SettingsIcon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { winPercent, type Stats } from "@/game/arena/stats";
import type { BoardSize, Difficulty } from "@/game/arena/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];
const SIZES: BoardSize[] = [5, 7];

interface MenuProps {
  size: BoardSize;
  difficulty: Difficulty;
  stats: Stats;
  dark: boolean;
  onSize: (s: BoardSize) => void;
  onDifficulty: (d: Difficulty) => void;
  onPlay: () => void;
  onHowTo: () => void;
  onSettings: () => void;
  onToggleTheme: () => void;
}

export function Menu({
  size,
  difficulty,
  stats,
  dark,
  onSize,
  onDifficulty,
  onPlay,
  onHowTo,
  onSettings,
  onToggleTheme,
}: MenuProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-8">
      <header className="text-center">
        <p className="eyebrow-text">Strategy · 5 in a row</p>
        <h1 className="neon-title">Tic-Tac-Toe Arena AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Outsmart the machine with bombs, shields and power-ups.
        </p>
      </header>

      <section className="neon-panel w-full p-4">
        <h2 className="section-label">Board size</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSize(s)}
              className={cn("chip-btn", size === s && "chip-btn-active")}
            >
              {s}×{s}
            </button>
          ))}
        </div>

        <h2 className="section-label mt-4">Difficulty</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDifficulty(d)}
              className={cn("chip-btn capitalize", difficulty === d && "chip-btn-active")}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="neon-btn w-full text-lg" onClick={onPlay}>
        <Play className="h-5 w-5" /> Play
      </button>

      <div className="grid w-full grid-cols-3 gap-2">
        <button type="button" className="neon-btn neon-btn-ghost" onClick={onHowTo}>
          <BookOpen className="h-4 w-4" /> How
        </button>
        <button type="button" className="neon-btn neon-btn-ghost" onClick={onSettings}>
          <SettingsIcon className="h-4 w-4" /> Settings
        </button>
        <button type="button" className="neon-btn neon-btn-ghost" onClick={onToggleTheme}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? "Light" : "Dark"}
        </button>
      </div>

      <section className="neon-panel w-full p-4">
        <h2 className="section-label">Career stats</h2>
        <dl className="mt-2 grid grid-cols-3 gap-3 text-center">
          <Stat label="Played" value={stats.played} />
          <Stat label="Wins" value={stats.wins} />
          <Stat label="Losses" value={stats.losses} />
          <Stat label="Draws" value={stats.draws} />
          <Stat label="Win %" value={`${winPercent(stats)}%`} />
          <Stat label="High score" value={stats.highScore} />
        </dl>
        {stats.bestTime !== null && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Fastest win: {stats.bestTime}s
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="text-lg font-bold text-primary">{value}</dd>
    </div>
  );
}

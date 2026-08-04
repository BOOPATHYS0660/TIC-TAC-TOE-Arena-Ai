/**
 * Core types for "Tic-Tac-Toe Arena AI".
 * Pure data — no React, no DOM. Shared by the engine, the AI and the UI.
 */

export type Mark = "X" | "O";

/** Difficulty levels for the AI opponent. */
export type Difficulty = "easy" | "medium" | "hard" | "expert";

/** Supported square board sizes. */
export type BoardSize = 5 | 7;

/** Collectible power-ups that spawn on the board. */
export type PowerKind = "extra" | "double" | "hint" | "freeze";

/** One-per-match special abilities. */
export type AbilityKind = "bomb" | "shield" | "swap";

/** A single board square. */
export interface Cell {
  /** Mark placed here, if any. */
  mark: Mark | null;
  /** Shielded marks cannot be destroyed by Bomb. */
  shielded: boolean;
  /** Remaining turns before the rock disappears (null = no rock). */
  rock: number | null;
  /** Collectible power-up sitting on the square. */
  power: PowerKind | null;
  /** Which player is blocked from using this square. */
  frozenFor: Mark | null;
  /** Turns left on the freeze effect. */
  frozenTurns: number;
}

/** Per-player counters. */
export interface PlayerState {
  score: number;
  /** Abilities still available this match. */
  abilities: Record<AbilityKind, boolean>;
  /** Collected power-ups, by kind. */
  powers: Record<PowerKind, number>;
  /** Next completed line scores double. */
  doubleNext: boolean;
  /** Player gets another turn after the current one. */
  extraMove: boolean;
}

export type GameStatus = "playing" | "over";

export interface GameState {
  size: BoardSize;
  difficulty: Difficulty;
  board: Cell[];
  turn: Mark;
  players: Record<Mark, PlayerState>;
  /** Total turns played (both sides). */
  turnCount: number;
  /** Total marks placed. */
  moves: number;
  status: GameStatus;
  winner: Mark | "draw" | null;
  /** Cells forming the winning line (for the glow animation). */
  winningLine: number[];
  /** Last scoring event, used for the floating score pop-up. */
  lastScore: { mark: Mark; points: number; at: number } | null;
  /** Short human readable log of the latest event. */
  message: string;
}

/** Number of marks in a row required for an instant win. */
export const WIN_LEN = 5;

/** Points awarded per completed run length. */
export const RUN_POINTS: Record<number, number> = { 3: 10, 4: 30 };

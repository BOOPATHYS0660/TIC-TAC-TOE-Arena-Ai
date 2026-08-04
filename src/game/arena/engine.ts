/**
 * Game engine — pure functions over GameState.
 *
 * Every exported function returns a NEW state object, so React can diff it.
 * No UI concerns live here (see src/components/arena for rendering).
 */

import {
  RUN_POINTS,
  WIN_LEN,
  type AbilityKind,
  type BoardSize,
  type Cell,
  type Difficulty,
  type GameState,
  type Mark,
  type PowerKind,
} from "./types";

/** The four line directions we scan: →, ↓, ↘, ↗ */
const DIRECTIONS: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

const POWER_KINDS: PowerKind[] = ["extra", "double", "hint", "freeze"];

/** Spawn a power-up every N turns. */
const POWER_EVERY = 3;
/** Spawn a rock every N turns. */
const ROCK_EVERY = 6;
/** Rock lifetime, in turns. */
const ROCK_LIFETIME = 4;

export const other = (mark: Mark): Mark => (mark === "X" ? "O" : "X");

export const idx = (size: number, x: number, y: number) => y * size + x;
export const xy = (size: number, i: number) => ({ x: i % size, y: Math.floor(i / size) });

function emptyCell(): Cell {
  return { mark: null, shielded: false, rock: null, power: null, frozenFor: null, frozenTurns: 0 };
}

function newPlayer() {
  return {
    score: 0,
    abilities: { bomb: true, shield: true, swap: true } as Record<AbilityKind, boolean>,
    powers: { extra: 0, double: 0, hint: 0, freeze: 0 } as Record<PowerKind, number>,
    doubleNext: false,
    extraMove: false,
  };
}

/** Create a fresh match. */
export function createGame(size: BoardSize, difficulty: Difficulty): GameState {
  return {
    size,
    difficulty,
    board: Array.from({ length: size * size }, emptyCell),
    turn: "X",
    players: { X: newPlayer(), O: newPlayer() },
    turnCount: 0,
    moves: 0,
    status: "playing",
    winner: null,
    winningLine: [],
    lastScore: null,
    message: "Your move — connect 5 to win.",
  };
}

/** Shallow-clone the state, deep-cloning the mutable parts. */
function clone(s: GameState): GameState {
  return {
    ...s,
    board: s.board.map((c) => ({ ...c })),
    players: {
      X: { ...s.players.X, abilities: { ...s.players.X.abilities }, powers: { ...s.players.X.powers } },
      O: { ...s.players.O, abilities: { ...s.players.O.abilities }, powers: { ...s.players.O.powers } },
    },
  };
}

/** Can `mark` place a stone on cell `i`? */
export function canPlace(s: GameState, i: number, mark: Mark): boolean {
  const c = s.board[i];
  if (!c) return false;
  if (c.mark || c.rock !== null) return false;
  if (c.frozenFor === mark && c.frozenTurns > 0) return false;
  return true;
}

/** All legal placements for `mark`. */
export function legalMoves(s: GameState, mark: Mark): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.board.length; i++) if (canPlace(s, i, mark)) out.push(i);
  return out;
}

/**
 * Longest run of `mark` through cell `i`, per direction.
 * Returns the best run and the cells that form it.
 */
export function runThrough(board: Cell[], size: number, i: number, mark: Mark) {
  let best = { length: 0, cells: [] as number[] };
  const { x, y } = xy(size, i);
  for (const [dx, dy] of DIRECTIONS) {
    const cells = [i];
    for (const sign of [1, -1]) {
      let nx = x + dx * sign;
      let ny = y + dy * sign;
      while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[idx(size, nx, ny)]?.mark === mark) {
        cells.push(idx(size, nx, ny));
        nx += dx * sign;
        ny += dy * sign;
      }
    }
    if (cells.length > best.length) best = { length: cells.length, cells };
  }
  return best;
}

/** Advance the clock: rocks decay, freezes expire, hazards spawn, turn flips. */
function endTurn(s: GameState): GameState {
  const next = clone(s);
  next.turnCount += 1;

  for (const c of next.board) {
    if (c.rock !== null) {
      c.rock -= 1;
      if (c.rock <= 0) c.rock = null;
    }
    if (c.frozenTurns > 0) {
      c.frozenTurns -= 1;
      if (c.frozenTurns <= 0) c.frozenFor = null;
    }
  }

  if (next.turnCount % POWER_EVERY === 0) spawnPower(next);
  if (next.turnCount % ROCK_EVERY === 0) spawnRock(next);

  // Extra Move lets the same player go again.
  const current = next.players[next.turn];
  if (current.extraMove) {
    current.extraMove = false;
    next.message = `${next.turn === "X" ? "You get" : "AI gets"} an extra move!`;
  } else {
    next.turn = other(next.turn);
  }

  return checkBoardFull(next);
}

function freeCells(s: GameState): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.board.length; i++) {
    const c = s.board[i]!;
    if (!c.mark && c.rock === null && !c.power) out.push(i);
  }
  return out;
}

function spawnPower(s: GameState) {
  const free = freeCells(s);
  if (!free.length) return;
  const i = free[Math.floor(Math.random() * free.length)]!;
  s.board[i]!.power = POWER_KINDS[Math.floor(Math.random() * POWER_KINDS.length)]!;
}

function spawnRock(s: GameState) {
  const free = freeCells(s);
  if (!free.length) return;
  const i = free[Math.floor(Math.random() * free.length)]!;
  s.board[i]!.rock = ROCK_LIFETIME;
}

/** If no square is playable, the highest score wins. */
function checkBoardFull(s: GameState): GameState {
  if (s.status === "over") return s;
  const playable = s.board.some((c) => !c.mark && c.rock === null);
  if (playable) return s;
  const { X, O } = s.players;
  s.status = "over";
  s.winner = X.score === O.score ? "draw" : X.score > O.score ? "X" : "O";
  s.message = "Board full — highest score wins.";
  return s;
}

/**
 * Place a mark for the player whose turn it is.
 * Handles power-up pickup, run scoring and instant win.
 */
export function placeMark(s: GameState, i: number): GameState {
  if (s.status !== "playing" || !canPlace(s, i, s.turn)) return s;
  const next = clone(s);
  const mark = next.turn;
  const player = next.players[mark];
  const cell = next.board[i]!;
  cell.mark = mark;
  next.moves += 1;
  next.lastScore = null;
  next.message = "";

  // Collect a power-up sitting on the square.
  if (cell.power) {
    const kind = cell.power;
    cell.power = null;
    if (kind === "double") player.doubleNext = true;
    else if (kind === "extra") player.extraMove = true;
    else player.powers[kind] += 1;
    next.message = `${mark === "X" ? "You" : "AI"} picked up ${labelOfPower(kind)}.`;
  }

  // Score the run created by this placement.
  const run = runThrough(next.board, next.size, i, mark);
  if (run.length >= WIN_LEN) {
    next.status = "over";
    next.winner = mark;
    next.winningLine = run.cells;
    next.message = mark === "X" ? "You connected five!" : "AI connected five.";
    return next;
  }
  const base = RUN_POINTS[run.length] ?? 0;
  if (base > 0) {
    const points = player.doubleNext ? base * 2 : base;
    player.doubleNext = false;
    player.score += points;
    next.lastScore = { mark, points, at: Date.now() };
    next.winningLine = run.cells;
  } else {
    next.winningLine = [];
  }

  return endTurn(next);
}

export function labelOfPower(kind: PowerKind) {
  return { extra: "Extra Move", double: "Double Score", hint: "Hint", freeze: "Freeze" }[kind];
}

/** Bomb: destroy one unshielded opponent mark. */
export function useBomb(s: GameState, i: number): GameState {
  const mark = s.turn;
  const cell = s.board[i];
  if (s.status !== "playing" || !s.players[mark].abilities.bomb) return s;
  if (!cell || cell.mark !== other(mark) || cell.shielded) return s;
  const next = clone(s);
  next.players[mark].abilities.bomb = false;
  const target = next.board[i]!;
  target.mark = null;
  target.shielded = false;
  next.message = `${mark === "X" ? "You" : "AI"} detonated a bomb!`;
  next.winningLine = [];
  return endTurn(next);
}

/** Shield: make one of your own marks bomb-proof. */
export function useShield(s: GameState, i: number): GameState {
  const mark = s.turn;
  const cell = s.board[i];
  if (s.status !== "playing" || !s.players[mark].abilities.shield) return s;
  if (!cell || cell.mark !== mark || cell.shielded) return s;
  const next = clone(s);
  next.players[mark].abilities.shield = false;
  next.board[i]!.shielded = true;
  next.message = `${mark === "X" ? "Your" : "AI"} mark is shielded.`;
  next.winningLine = [];
  return endTurn(next);
}

/** Are two cells orthogonally or diagonally adjacent? */
export function isAdjacent(size: number, a: number, b: number) {
  const p = xy(size, a);
  const q = xy(size, b);
  const dx = Math.abs(p.x - q.x);
  const dy = Math.abs(p.y - q.y);
  return dx <= 1 && dy <= 1 && a !== b;
}

/** Swap: slide one of your marks into an adjacent empty square. */
export function useSwap(s: GameState, from: number, to: number): GameState {
  const mark = s.turn;
  if (s.status !== "playing" || !s.players[mark].abilities.swap) return s;
  if (s.board[from]?.mark !== mark || !canPlace(s, to, mark)) return s;
  if (!isAdjacent(s.size, from, to)) return s;

  const next = clone(s);
  next.players[mark].abilities.swap = false;
  const src = next.board[from]!;
  const dst = next.board[to]!;
  dst.mark = mark;
  dst.shielded = src.shielded;
  src.mark = null;
  src.shielded = false;
  next.message = `${mark === "X" ? "You" : "AI"} repositioned a mark.`;

  // A swap can also complete a line.
  const run = runThrough(next.board, next.size, to, mark);
  if (run.length >= WIN_LEN) {
    next.status = "over";
    next.winner = mark;
    next.winningLine = run.cells;
    return next;
  }
  next.winningLine = [];
  return endTurn(next);
}

/** Freeze power-up: lock one square against the opponent for a turn. */
export function useFreeze(s: GameState, i: number): GameState {
  const mark = s.turn;
  const cell = s.board[i];
  if (s.status !== "playing" || s.players[mark].powers.freeze <= 0) return s;
  if (!cell || cell.mark || cell.rock !== null) return s;
  const next = clone(s);
  next.players[mark].powers.freeze -= 1;
  const target = next.board[i]!;
  target.frozenFor = other(mark);
  target.frozenTurns = 2;
  next.message = "Square frozen for the opponent.";
  next.winningLine = [];
  return endTurn(next);
}

/** Consume a Hint charge (the UI computes and shows the suggestion). */
export function consumeHint(s: GameState): GameState {
  if (s.players[s.turn].powers.hint <= 0) return s;
  const next = clone(s);
  next.players[next.turn].powers.hint -= 1;
  return next;
}

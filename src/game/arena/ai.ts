/**
 * AI opponent — completely separated from the UI layer.
 *
 * easy    : random legal move
 * medium  : win / block immediate threats, otherwise a light heuristic
 * hard    : full heuristic with look-ahead of the opponent reply + ability use
 * expert  : alpha-beta search over the strongest candidate moves
 */

import {
  canPlace,
  legalMoves,
  other,
  runThrough,
  xy,
} from "./engine";
import { WIN_LEN, type Cell, type GameState, type Mark } from "./types";

export type AiAction =
  | { type: "move"; index: number }
  | { type: "bomb"; index: number }
  | { type: "shield"; index: number };

/** Value of owning n marks in an otherwise open window of WIN_LEN. */
const WINDOW_VALUE = [0, 1, 12, 90, 700, 100000];

/**
 * Static evaluation: sum the value of every WIN_LEN-window on the board
 * from `mark`'s point of view (own windows positive, opponent windows negative).
 */
export function evaluate(board: Cell[], size: number, mark: Mark): number {
  const foe = other(mark);
  let score = 0;
  const dirs: Array<[number, number]> = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      for (const [dx, dy] of dirs) {
        const ex = x + dx * (WIN_LEN - 1);
        const ey = y + dy * (WIN_LEN - 1);
        if (ex < 0 || ex >= size || ey < 0 || ey >= size) continue;
        let mine = 0;
        let theirs = 0;
        let blocked = false;
        for (let k = 0; k < WIN_LEN; k++) {
          const c = board[(y + dy * k) * size + (x + dx * k)]!;
          if (c.mark === mark) mine++;
          else if (c.mark === foe) theirs++;
        }
        if (mine && theirs) continue; // dead window

        if (mine) score += WINDOW_VALUE[mine]!;
        else if (theirs) score -= WINDOW_VALUE[theirs]! * 1.15; // slight defensive bias
      }
    }
  }
  return score;
}

/** Territory control: central squares are worth more. */
function centerBonus(size: number, i: number) {
  const { x, y } = xy(size, i);
  const c = (size - 1) / 2;
  return (size - (Math.abs(x - c) + Math.abs(y - c))) * 4;
}

/** Immediate value of placing `mark` at `i` (used for ordering + Hint). */
export function moveScore(s: GameState, i: number, mark: Mark): number {
  const board = s.board.map((c) => ({ ...c }));
  board[i]!.mark = mark;
  const own = runThrough(board, s.size, i, mark);
  if (own.length >= WIN_LEN) return 1_000_000;

  // Blocking value: what would the opponent get here?
  const foeBoard = s.board.map((c) => ({ ...c }));
  foeBoard[i]!.mark = other(mark);
  const foeRun = runThrough(foeBoard, s.size, i, other(mark));
  const blockValue = foeRun.length >= WIN_LEN ? 500_000 : WINDOW_VALUE[Math.min(foeRun.length, 5)]! * 1.2;

  const power = s.board[i]!.power ? 45 : 0;
  return evaluate(board, s.size, mark) + blockValue + centerBonus(s.size, i) + power;
}

/** Best move for a player — also powers the Hint power-up. */
export function bestMoveFor(s: GameState, mark: Mark): number | null {
  const moves = legalMoves(s, mark);
  if (!moves.length) return null;
  let best = moves[0]!;
  let bestScore = -Infinity;
  for (const m of moves) {
    const sc = moveScore(s, m, mark);
    if (sc > bestScore) {
      bestScore = sc;
      best = m;
    }
  }
  return best;
}

/** Candidate moves near existing action, to keep the search small. */
function candidates(s: GameState, mark: Mark, limit: number): number[] {
  const moves = legalMoves(s, mark);
  return moves
    .map((m) => ({ m, sc: moveScore(s, m, mark) }))
    .sort((a, b) => b.sc - a.sc)
    .slice(0, limit)
    .map((e) => e.m);
}

/** Alpha-beta search on a lightweight board copy. */
function alphaBeta(
  board: Cell[],
  size: number,
  mark: Mark,
  turn: Mark,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (depth === 0) return evaluate(board, size, mark);
  const pseudo = { size, board } as unknown as GameState;
  const options = board
    .map((c, i) => i)
    .filter((i) => !board[i]!.mark)
    .map((i) => ({ i, sc: quickScore(board, size, i, turn) }))
    .sort((a, b) => b.sc - a.sc)
    .slice(0, 8)
    .map((e) => e.i);
  void pseudo;
  if (!options.length) return evaluate(board, size, mark);

  if (turn === mark) {
    let value = -Infinity;
    for (const i of options) {
      board[i]!.mark = turn;
      const win = runThrough(board, size, i, turn).length >= WIN_LEN;
      const v = win ? 1_000_000 : alphaBeta(board, size, mark, other(turn), depth - 1, alpha, beta);
      board[i]!.mark = null;
      value = Math.max(value, v);
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }
  let value = Infinity;
  for (const i of options) {
    board[i]!.mark = turn;
    const win = runThrough(board, size, i, turn).length >= WIN_LEN;
    const v = win ? -1_000_000 : alphaBeta(board, size, mark, other(turn), depth - 1, alpha, beta);
    board[i]!.mark = null;
    value = Math.min(value, v);
    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return value;
}

/** Cheap ordering heuristic used inside the search. */
function quickScore(board: Cell[], size: number, i: number, mark: Mark) {
  board[i]!.mark = mark;
  const a = runThrough(board, size, i, mark).length;
  board[i]!.mark = other(mark);
  const b = runThrough(board, size, i, other(mark)).length;
  board[i]!.mark = null;
  return a * 10 + b * 9 + centerBonus(size, i);
}

/** Should the AI spend an ability this turn? (hard / expert only) */
function abilityAction(s: GameState, mark: Mark): AiAction | null {
  const foe = other(mark);
  const ai = s.players[mark];

  // Bomb the opponent mark that carries their longest, unshielded run.
  if (ai.abilities.bomb) {
    let target = -1;
    let len = 0;
    for (let i = 0; i < s.board.length; i++) {
      const c = s.board[i]!;
      if (c.mark !== foe || c.shielded) continue;
      const r = runThrough(s.board, s.size, i, foe).length;
      if (r > len) {
        len = r;
        target = i;
      }
    }
    if (len >= 4 && target >= 0) return { type: "bomb", index: target };
  }

  // Shield our own longest run once it becomes a real threat.
  if (ai.abilities.shield) {
    let target = -1;
    let len = 0;
    for (let i = 0; i < s.board.length; i++) {
      const c = s.board[i]!;
      if (c.mark !== mark || c.shielded) continue;
      const r = runThrough(s.board, s.size, i, mark).length;
      if (r > len) {
        len = r;
        target = i;
      }
    }
    if (len >= 4 && target >= 0 && s.players[foe].abilities.bomb) {
      return { type: "shield", index: target };
    }
  }
  return null;
}

/** Pick the AI's action for the current state. */
export function chooseAiAction(s: GameState, mark: Mark = "O"): AiAction | null {
  const moves = legalMoves(s, mark);
  if (!moves.length) return null;
  const foe = other(mark);

  if (s.difficulty === "easy") {
    return { type: "move", index: moves[Math.floor(Math.random() * moves.length)]! };
  }

  // Always take an immediate win, always block an immediate loss.
  for (const m of moves) {
    const b = s.board.map((c) => ({ ...c }));
    b[m]!.mark = mark;
    if (runThrough(b, s.size, m, mark).length >= WIN_LEN) return { type: "move", index: m };
  }
  for (const m of moves) {
    if (!canPlace(s, m, foe)) continue;
    const b = s.board.map((c) => ({ ...c }));
    b[m]!.mark = foe;
    if (runThrough(b, s.size, m, foe).length >= WIN_LEN) return { type: "move", index: m };
  }

  if (s.difficulty === "medium") {
    // Light heuristic with a bit of noise so it stays beatable.
    const top = candidates(s, mark, 4);
    return { type: "move", index: top[Math.floor(Math.random() * Math.min(2, top.length))]! };
  }

  const ability = abilityAction(s, mark);
  if (ability) return ability;

  if (s.difficulty === "hard") {
    return { type: "move", index: bestMoveFor(s, mark)! };
  }

  // Expert: alpha-beta over the strongest candidates.
  const board = s.board.map((c) => ({ ...c }));
  const options = candidates(s, mark, s.size === 5 ? 8 : 6);
  let best = options[0]!;
  let bestValue = -Infinity;
  for (const i of options) {
    board[i]!.mark = mark;
    const win = runThrough(board, s.size, i, mark).length >= WIN_LEN;
    const v = win
      ? 1_000_000
      : alphaBeta(board, s.size, mark, foe, 2, -Infinity, Infinity) + centerBonus(s.size, i);
    board[i]!.mark = null;
    if (v > bestValue) {
      bestValue = v;
      best = i;
    }
  }
  return { type: "move", index: best };
}

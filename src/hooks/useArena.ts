/**
 * useArena — binds the pure game engine to React.
 * Owns: match state, the match timer, AI turn scheduling, ability targeting
 * mode and hint highlighting. UI components stay presentational.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { bestMoveFor, chooseAiAction } from "@/game/arena/ai";
import { audio } from "@/game/arena/audio";
import {
  canPlace,
  consumeHint,
  createGame,
  isAdjacent,
  placeMark,
  useBomb,
  useFreeze,
  useShield,
  useSwap,
} from "@/game/arena/engine";
import { loadStats, recordMatch, saveStats, type Stats } from "@/game/arena/stats";
import type { AbilityKind, BoardSize, Difficulty, GameState } from "@/game/arena/types";

/** Which targeting mode the player is in, if any. */
export type TargetMode = AbilityKind | "freeze" | null;

export function useArena(size: BoardSize, difficulty: Difficulty) {
  const [state, setState] = useState<GameState>(() => createGame(size, difficulty));
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState<TargetMode>(null);
  const [swapFrom, setSwapFrom] = useState<number | null>(null);
  const [hint, setHint] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>(emptyRef);
  const recorded = useRef(false);

  // Load stored statistics after hydration.
  useEffect(() => setStats(loadStats()), []);

  /** Match timer. */
  useEffect(() => {
    if (state.status !== "playing" || paused) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [state.status, paused]);

  /** AI turn. */
  useEffect(() => {
    if (state.status !== "playing" || state.turn !== "O" || paused) return;
    const id = window.setTimeout(() => {
      const action = chooseAiAction(state, "O");
      if (!action) return;
      setState((s) => {
        if (s.turn !== "O" || s.status !== "playing") return s;
        if (action.type === "bomb") {
          audio.play("bomb");
          return useBomb(s, action.index);
        }
        if (action.type === "shield") {
          audio.play("shield");
          return useShield(s, action.index);
        }
        audio.play("ai");
        return placeMark(s, action.index);
      });
    }, 520);
    return () => window.clearTimeout(id);
  }, [state, paused]);

  /** Record the finished match once. */
  useEffect(() => {
    if (state.status !== "over" || recorded.current) return;
    recorded.current = true;
    audio.play(state.winner === "X" ? "win" : "lose");
    const outcome = state.winner === "X" ? "win" : state.winner === "O" ? "loss" : "draw";
    setStats((prev) => {
      const next = recordMatch(prev, {
        outcome,
        seconds: elapsed,
        score: state.players.X.score,
      });
      saveStats(next);
      return next;
    });
  }, [state.status, state.winner, state.players.X.score, elapsed]);

  const reset = useCallback(
    (nextSize: BoardSize = size, nextDifficulty: Difficulty = difficulty) => {
      recorded.current = false;
      setState(createGame(nextSize, nextDifficulty));
      setElapsed(0);
      setPaused(false);
      setTarget(null);
      setSwapFrom(null);
      setHint(null);
    },
    [size, difficulty],
  );

  /** Cells that are valid targets for the active ability (for highlighting). */
  const validTargets = useMemo(() => {
    if (!target || state.turn !== "X" || state.status !== "playing") return new Set<number>();
    const set = new Set<number>();
    state.board.forEach((c, i) => {
      if (target === "bomb" && c.mark === "O" && !c.shielded) set.add(i);
      if (target === "shield" && c.mark === "X" && !c.shielded) set.add(i);
      if (target === "freeze" && !c.mark && c.rock === null) set.add(i);
      if (target === "swap") {
        if (swapFrom === null) {
          if (c.mark === "X") set.add(i);
        } else if (canPlace(state, i, "X") && isAdjacent(state.size, swapFrom, i)) set.add(i);
      }
    });
    return set;
  }, [target, swapFrom, state]);

  /** Handle a click on a board cell. */
  const clickCell = useCallback(
    (i: number) => {
      if (state.status !== "playing" || state.turn !== "X" || paused) return;
      setHint(null);

      if (target === "bomb" && validTargets.has(i)) {
        audio.play("bomb");
        setState((s) => useBomb(s, i));
        setTarget(null);
        return;
      }
      if (target === "shield" && validTargets.has(i)) {
        audio.play("shield");
        setState((s) => useShield(s, i));
        setTarget(null);
        return;
      }
      if (target === "freeze" && validTargets.has(i)) {
        audio.play("click");
        setState((s) => useFreeze(s, i));
        setTarget(null);
        return;
      }
      if (target === "swap") {
        if (!validTargets.has(i)) return;
        if (swapFrom === null) {
          audio.play("click");
          setSwapFrom(i);
          return;
        }
        const from = swapFrom;
        audio.play("swap");
        setState((s) => useSwap(s, from, i));
        setSwapFrom(null);
        setTarget(null);
        return;
      }

      if (!canPlace(state, i, "X")) return;
      audio.play("place");
      setState((s) => placeMark(s, i));
    },
    [state, target, validTargets, swapFrom, paused],
  );

  /** Toggle an ability targeting mode. */
  const activate = useCallback(
    (mode: Exclude<TargetMode, null>) => {
      audio.play("click");
      setSwapFrom(null);
      setTarget((cur) => (cur === mode ? null : mode));
    },
    [],
  );

  /** Spend a Hint charge and highlight the strongest move. */
  const useHint = useCallback(() => {
    if (state.players.X.powers.hint <= 0 || state.turn !== "X") return;
    const best = bestMoveFor(state, "X");
    audio.play("click");
    setState((s) => consumeHint(s));
    setHint(best);
    window.setTimeout(() => setHint(null), 2600);
  }, [state]);

  // Score pop-up trigger.
  useEffect(() => {
    if (state.lastScore) audio.play("score");
  }, [state.lastScore]);

  return {
    state,
    stats,
    elapsed,
    paused,
    setPaused,
    target,
    swapFrom,
    validTargets,
    hint,
    clickCell,
    activate,
    useHint,
    reset,
  };
}

const emptyRef: Stats = {
  played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  bestTime: null,
  highScore: 0,
};

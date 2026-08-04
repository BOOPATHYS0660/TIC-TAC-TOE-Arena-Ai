/**
 * Local-storage backed match statistics.
 */

export interface Stats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  bestTime: number | null; // fastest win, in seconds
  highScore: number;
}

const KEY = "ttt-arena-stats-v1";

export const emptyStats: Stats = {
  played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  bestTime: null,
  highScore: 0,
};

export function loadStats(): Stats {
  if (typeof window === "undefined") return emptyStats;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...emptyStats, ...(JSON.parse(raw) as Stats) } : emptyStats;
  } catch {
    return emptyStats;
  }
}

export function saveStats(stats: Stats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Fold a finished match into the stored statistics. */
export function recordMatch(
  prev: Stats,
  result: { outcome: "win" | "loss" | "draw"; seconds: number; score: number },
): Stats {
  return {
    played: prev.played + 1,
    wins: prev.wins + (result.outcome === "win" ? 1 : 0),
    losses: prev.losses + (result.outcome === "loss" ? 1 : 0),
    draws: prev.draws + (result.outcome === "draw" ? 1 : 0),
    bestTime:
      result.outcome === "win"
        ? prev.bestTime === null
          ? result.seconds
          : Math.min(prev.bestTime, result.seconds)
        : prev.bestTime,
    highScore: Math.max(prev.highScore, result.score),
  };
}

export const winPercent = (s: Stats) => (s.played ? Math.round((s.wins / s.played) * 100) : 0);

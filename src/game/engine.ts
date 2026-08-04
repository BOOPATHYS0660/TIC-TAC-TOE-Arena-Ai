/**
 * Pure game logic (no React, no DOM).
 * The React layer only feeds input and renders the state produced here.
 */

import {
  buildGrid,
  MAP_H,
  MAP_W,
  ROOMS,
  roomAt,
  roomCenter,
  type RoomName,
} from "./map";

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY = {
  easy: { ghostSpeed: 2.6, detect: 5, loseInterest: 3, label: "Easy" },
  medium: { ghostSpeed: 3.4, detect: 7, loseInterest: 5, label: "Medium" },
  hard: { ghostSpeed: 4.3, detect: 9.5, loseInterest: 8, label: "Hard" },
} as const;

export const PLAYER_SPEED = 4.6; // tiles per second
export const SCORE = { key: 100, puzzle: 200, escape: 500 };

export type Vec = { x: number; y: number };

export type KeyItem = {
  id: number;
  x: number;
  y: number;
  room: RoomName;
  collected: boolean;
  pop: number; // pickup animation timer
};

export type Clue = {
  id: number;
  x: number;
  y: number;
  room: RoomName;
  digitIndex: number;
  digit: number;
  found: boolean;
};

export type GhostState = "patrol" | "detect" | "chase";

export type Input = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export type GameEvent =
  | "key"
  | "clue"
  | "door"
  | "ghost"
  | "step"
  | "caught"
  | "escaped"
  | "puzzle";

export type GameState = {
  grid: number[][];
  player: Vec & { dir: Vec; moving: boolean; bob: number };
  ghost: Vec & {
    state: GhostState;
    target: Vec;
    path: Vec[];
    lostTimer: number;
    detectTimer: number;
    float: number;
  };
  keys: KeyItem[];
  clues: Clue[];
  code: string;
  codeSolved: boolean;
  doorOpen: number; // 0..1 door opening animation
  keysCollected: number;
  score: number;
  time: number;
  shake: number;
  hintTimer: number;
  hintTarget: KeyItem | null;
  status: "playing" | "puzzle" | "won" | "lost";
  message: string;
  messageTimer: number;
  difficulty: Difficulty;
};

const KEY_ROOMS: RoomName[] = ["Library", "Kitchen", "Bedroom"];
const CLUE_ROOMS: RoomName[] = ["Entrance", "Hall", "Storage Room", "Bathroom"];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Random floor point inside a room, with a little padding from the walls. */
function pointInRoom(name: RoomName): Vec {
  const r = ROOMS[name];
  return { x: rand(r.x + 1.5, r.x + r.w - 1.5), y: rand(r.y + 1.5, r.y + r.h - 1.5) };
}

export function createGame(difficulty: Difficulty): GameState {
  const grid = buildGrid();
  const code = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join("");

  const keys: KeyItem[] = KEY_ROOMS.map((room, id) => {
    const p = pointInRoom(room);
    return { id, x: p.x, y: p.y, room, collected: false, pop: 0 };
  });

  const clues: Clue[] = CLUE_ROOMS.map((room, i) => {
    const p = pointInRoom(room);
    return {
      id: i,
      x: p.x,
      y: p.y,
      room,
      digitIndex: i,
      digit: Number(code[i]),
      found: false,
    };
  });

  const start = roomCenter("Entrance");
  const ghostStart = roomCenter("Storage Room");

  return {
    grid,
    player: { x: start.x, y: start.y, dir: { x: 0, y: 1 }, moving: false, bob: 0 },
    ghost: {
      x: ghostStart.x,
      y: ghostStart.y,
      state: "patrol",
      target: roomCenter("Hall"),
      path: [],
      lostTimer: 0,
      detectTimer: 0,
      float: 0,
    },
    keys,
    clues,
    code,
    codeSolved: false,
    doorOpen: 0,
    keysCollected: 0,
    score: 0,
    time: 0,
    shake: 0,
    hintTimer: 0,
    hintTarget: null,
    status: "playing",
    message: "",
    messageTimer: 0,
    difficulty,
  };
}

export function isFloor(grid: number[][], x: number, y: number) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  return grid[ty]?.[tx] === 1;
}

/** Circle-vs-tile collision check used for both player and ghost movement. */
function canStand(grid: number[][], x: number, y: number, r = 0.32) {
  return (
    isFloor(grid, x - r, y - r) &&
    isFloor(grid, x + r, y - r) &&
    isFloor(grid, x - r, y + r) &&
    isFloor(grid, x + r, y + r)
  );
}

/** Breadth-first search on the tile grid → shortest path of tile centers. */
export function findPath(grid: number[][], from: Vec, to: Vec): Vec[] {
  const sx = Math.floor(from.x);
  const sy = Math.floor(from.y);
  const gx = Math.floor(to.x);
  const gy = Math.floor(to.y);
  if (!isFloor(grid, gx, gy)) return [];
  const key = (x: number, y: number) => y * MAP_W + x;
  const prev = new Map<number, number>();
  const seen = new Set<number>([key(sx, sy)]);
  const queue: Vec[] = [{ x: sx, y: sy }];

  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.x === gx && cur.y === gy) break;
    const neighbours = [
      { x: cur.x + 1, y: cur.y },
      { x: cur.x - 1, y: cur.y },
      { x: cur.x, y: cur.y + 1 },
      { x: cur.x, y: cur.y - 1 },
    ];
    for (const n of neighbours) {
      const k = key(n.x, n.y);
      if (seen.has(k)) continue;
      if (!isFloor(grid, n.x, n.y)) continue;
      seen.add(k);
      prev.set(k, key(cur.x, cur.y));
      queue.push(n);
    }
  }

  if (!seen.has(key(gx, gy))) return [];
  const path: Vec[] = [];
  let cur = key(gx, gy);
  const startKey = key(sx, sy);
  while (cur !== startKey) {
    path.push({ x: (cur % MAP_W) + 0.5, y: Math.floor(cur / MAP_W) + 0.5 });
    const p = prev.get(cur);
    if (p === undefined) break;
    cur = p;
  }
  return path.reverse();
}

/** Straight-line visibility between two points (used for ghost detection). */
function hasLineOfSight(grid: number[][], a: Vec, b: Vec) {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.ceil(dist * 4);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (!isFloor(grid, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
  }
  return true;
}

export const EXIT_DOOR: Vec = { x: 36, y: 27 };

/** Advance the simulation by dt seconds. Returns the events that happened. */
export function update(s: GameState, dt: number, input: Input): GameEvent[] {
  const events: GameEvent[] = [];
  if (s.status !== "playing") return events;

  s.time += dt;
  s.shake = Math.max(0, s.shake - dt * 2);
  s.hintTimer = Math.max(0, s.hintTimer - dt);
  if (s.hintTimer === 0) s.hintTarget = null;
  s.messageTimer = Math.max(0, s.messageTimer - dt);
  if (s.messageTimer === 0) s.message = "";
  s.ghost.float += dt;

  // ---------- Player movement ----------
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const len = Math.hypot(dx, dy);
  s.player.moving = len > 0;
  if (len > 0) {
    dx /= len;
    dy /= len;
    s.player.dir = { x: dx, y: dy };
    const step = PLAYER_SPEED * dt;
    // Axis-separated movement so we slide along walls instead of sticking.
    if (canStand(s.grid, s.player.x + dx * step, s.player.y)) s.player.x += dx * step;
    if (canStand(s.grid, s.player.x, s.player.y + dy * step)) s.player.y += dy * step;
    s.player.bob += dt;
    if (s.player.bob > 0.34) {
      s.player.bob = 0;
      events.push("step");
    }
  }

  // ---------- Pickups ----------
  for (const k of s.keys) {
    if (k.pop > 0) k.pop = Math.max(0, k.pop - dt);
    if (!k.collected && Math.hypot(k.x - s.player.x, k.y - s.player.y) < 0.7) {
      k.collected = true;
      k.pop = 0.6;
      s.keysCollected++;
      s.score += SCORE.key;
      events.push("key");
      s.message = `Key found in the ${k.room}! (${s.keysCollected}/3)`;
      s.messageTimer = 3;
    }
  }

  for (const c of s.clues) {
    if (!c.found && Math.hypot(c.x - s.player.x, c.y - s.player.y) < 0.8) {
      c.found = true;
      events.push("clue");
      s.message = `Clue: digit #${c.digitIndex + 1} of the code is ${c.digit}`;
      s.messageTimer = 4.5;
    }
  }

  // ---------- Exit door ----------
  const nearDoor = Math.hypot(EXIT_DOOR.x - s.player.x, EXIT_DOOR.y - s.player.y) < 1.4;
  if (nearDoor && s.keysCollected === 3 && !s.codeSolved) {
    s.status = "puzzle";
    events.push("puzzle");
    return events;
  }
  if (s.codeSolved) {
    s.doorOpen = Math.min(1, s.doorOpen + dt * 1.5);
    if (nearDoor) {
      s.status = "won";
      s.score += SCORE.escape;
      events.push("escaped");
      return events;
    }
  }

  // ---------- Ghost AI ----------
  const g = s.ghost;
  const cfg = DIFFICULTY[s.difficulty];
  const distToPlayer = Math.hypot(s.player.x - g.x, s.player.y - g.y);
  const sees =
    distToPlayer < cfg.detect && hasLineOfSight(s.grid, g, { x: s.player.x, y: s.player.y });

  if (sees) {
    if (g.state === "patrol") {
      g.state = "detect";
      g.detectTimer = 0.6;
      events.push("ghost");
    } else if (g.state === "detect") {
      g.detectTimer -= dt;
      if (g.detectTimer <= 0) g.state = "chase";
    }
    g.lostTimer = 0;
  } else if (g.state === "chase") {
    g.lostTimer += dt;
    if (g.lostTimer > cfg.loseInterest) {
      g.state = "patrol";
      g.path = [];
    }
  } else if (g.state === "detect") {
    g.state = "patrol";
  }

  // Repath periodically.
  g.detectTimer -= g.state === "detect" ? 0 : dt;
  if (g.state === "chase") {
    if (g.path.length === 0 || Math.random() < dt * 4) {
      g.path = findPath(s.grid, g, { x: s.player.x, y: s.player.y });
    }
  } else if (g.state === "patrol") {
    if (g.path.length === 0) {
      const names = Object.keys(ROOMS) as RoomName[];
      const target = pointInRoom(names[Math.floor(Math.random() * names.length)]!);
      g.path = findPath(s.grid, g, target);
    }
  }

  // Follow the path.
  const speed = g.state === "chase" ? cfg.ghostSpeed : cfg.ghostSpeed * 0.55;
  if (g.state !== "detect" && g.path.length) {
    const next = g.path[0]!;
    const vx = next.x - g.x;
    const vy = next.y - g.y;
    const d = Math.hypot(vx, vy);
    if (d < 0.12) {
      g.path.shift();
    } else {
      g.x += (vx / d) * speed * dt;
      g.y += (vy / d) * speed * dt;
    }
  }

  // ---------- Caught ----------
  if (distToPlayer < 0.55) {
    s.status = "lost";
    s.shake = 1;
    events.push("caught");
  }

  return events;
}

/** Objective text shown in the HUD. */
export function objectiveText(s: GameState) {
  if (s.keysCollected < 3) {
    const missing = s.keys.filter((k) => !k.collected).map((k) => k.room);
    return `Find ${3 - s.keysCollected} more key${3 - s.keysCollected > 1 ? "s" : ""} (search: ${missing.join(", ")})`;
  }
  if (!s.codeSolved) return "Reach the Exit Room door and enter the 4-digit code";
  return "The door is open — escape!";
}

export function currentRoom(s: GameState) {
  return roomAt(s.player.x, s.player.y) ?? "Hallway";
}

export function formatTime(t: number) {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
}

/** Activate the hint: highlights the nearest uncollected key. */
export function activateHint(s: GameState) {
  const remaining = s.keys.filter((k) => !k.collected);
  if (!remaining.length) return false;
  remaining.sort(
    (a, b) =>
      Math.hypot(a.x - s.player.x, a.y - s.player.y) -
      Math.hypot(b.x - s.player.x, b.y - s.player.y),
  );
  s.hintTarget = remaining[0]!;
  s.hintTimer = 5;
  s.message = `Hint: nearest key is in the ${remaining[0]!.room}`;
  s.messageTimer = 4;
  return true;
}

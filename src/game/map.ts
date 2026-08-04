/**
 * Map definition for "Escape the Haunted House".
 * The house is a tile grid: 0 = wall, 1 = floor.
 * Rooms are rectangles carved out of a solid block of walls,
 * connected by 2-tile wide corridors ("doors").
 */

export const TILE = 1; // logical tile unit (rendering scales this)
export const MAP_W = 44;
export const MAP_H = 30;

export type Rect = { x: number; y: number; w: number; h: number };

export type RoomName =
  | "Entrance"
  | "Hall"
  | "Library"
  | "Kitchen"
  | "Storage Room"
  | "Bathroom"
  | "Bedroom"
  | "Exit Room";

export const ROOMS: Record<RoomName, Rect> = {
  Entrance: { x: 2, y: 2, w: 10, h: 7 },
  Hall: { x: 14, y: 2, w: 14, h: 7 },
  Library: { x: 30, y: 2, w: 12, h: 7 },
  Kitchen: { x: 2, y: 11, w: 10, h: 7 },
  "Storage Room": { x: 14, y: 11, w: 14, h: 7 },
  Bathroom: { x: 30, y: 11, w: 12, h: 7 },
  Bedroom: { x: 2, y: 20, w: 10, h: 8 },
  "Exit Room": { x: 30, y: 20, w: 12, h: 8 },
};

/** Corridors connecting the rooms (also rectangles of floor). */
const CORRIDORS: Rect[] = [
  { x: 12, y: 5, w: 2, h: 2 }, // Entrance <-> Hall
  { x: 28, y: 5, w: 2, h: 2 }, // Hall <-> Library
  { x: 6, y: 9, w: 2, h: 2 }, // Entrance <-> Kitchen
  { x: 20, y: 9, w: 2, h: 2 }, // Hall <-> Storage
  { x: 35, y: 9, w: 2, h: 2 }, // Library <-> Bathroom
  { x: 12, y: 14, w: 2, h: 2 }, // Kitchen <-> Storage
  { x: 28, y: 14, w: 2, h: 2 }, // Storage <-> Bathroom
  { x: 6, y: 18, w: 2, h: 2 }, // Kitchen <-> Bedroom
  { x: 35, y: 18, w: 2, h: 2 }, // Bathroom <-> Exit Room
  { x: 12, y: 23, w: 18, h: 2 }, // Bedroom <-> Exit Room (long hallway)
];

/** Builds the walkable grid: grid[y][x] === 1 means floor. */
export function buildGrid(): number[][] {
  const grid: number[][] = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => 0),
  );
  const carve = (r: Rect) => {
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) grid[y]![x] = 1;
      }
    }
  };
  Object.values(ROOMS).forEach(carve);
  CORRIDORS.forEach(carve);
  return grid;
}

/** Doorways get a special visual treatment. */
export const DOORWAYS: Rect[] = CORRIDORS;

export function roomCenter(name: RoomName) {
  const r = ROOMS[name];
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Which room contains this point (or null when in a corridor). */
export function roomAt(x: number, y: number): RoomName | null {
  for (const [name, r] of Object.entries(ROOMS) as [RoomName, Rect][]) {
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return name;
  }
  return null;
}

export const ROOM_NAMES = Object.keys(ROOMS) as RoomName[];

/**
 * Canvas renderer. Draws the house, entities and the flashlight effect.
 * Purely visual — it never mutates game state.
 */

import { DOORWAYS, MAP_H, MAP_W, ROOMS, type RoomName } from "./map";
import { EXIT_DOOR, type GameState } from "./engine";

const COLORS = {
  wall: "#0b0714",
  wallTop: "#1a1030",
  floor: "#141029",
  floorAlt: "#181334",
  grout: "#221845",
  door: "#3b1f6b",
  player: "#c8a2ff",
  ghost: "#8de3ff",
  key: "#ffd469",
  clue: "#7cf5c8",
  exit: "#a855f7",
};

export function render(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  width: number,
  height: number,
) {
  const tile = Math.max(26, Math.min(44, Math.round(Math.min(width, height) / 14)));
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#05030c";
  ctx.fillRect(0, 0, width, height);

  // Camera follows the player, clamped to the map bounds.
  const shakeX = s.shake ? (Math.random() - 0.5) * 24 * s.shake : 0;
  const shakeY = s.shake ? (Math.random() - 0.5) * 24 * s.shake : 0;
  let camX = s.player.x * tile - width / 2;
  let camY = s.player.y * tile - height / 2;
  camX = Math.max(0, Math.min(camX, MAP_W * tile - width));
  camY = Math.max(0, Math.min(camY, MAP_H * tile - height));
  if (MAP_W * tile < width) camX = (MAP_W * tile - width) / 2;
  if (MAP_H * tile < height) camY = (MAP_H * tile - height) / 2;
  ctx.translate(-camX + shakeX, -camY + shakeY);

  // ---- Floors & walls ----
  const x0 = Math.max(0, Math.floor(camX / tile) - 1);
  const x1 = Math.min(MAP_W, Math.ceil((camX + width) / tile) + 1);
  const y0 = Math.max(0, Math.floor(camY / tile) - 1);
  const y1 = Math.min(MAP_H, Math.ceil((camY + height) / tile) + 1);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const px = x * tile;
      const py = y * tile;
      if (s.grid[y]![x] === 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
        ctx.fillRect(px, py, tile, tile);
        ctx.strokeStyle = COLORS.grout;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, tile - 1, tile - 1);
      } else {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, tile, tile);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px, py, tile, Math.max(2, tile * 0.16));
      }
    }
  }

  // ---- Doorways ----
  for (const d of DOORWAYS) {
    ctx.fillStyle = "rgba(122,60,200,0.16)";
    ctx.fillRect(d.x * tile, d.y * tile, d.w * tile, d.h * tile);
  }

  // ---- Room labels ----
  ctx.font = `600 ${Math.round(tile * 0.42)}px 'Rajdhani', system-ui, sans-serif`;
  ctx.textAlign = "center";
  for (const [name, r] of Object.entries(ROOMS) as [RoomName, (typeof ROOMS)[RoomName]][]) {
    ctx.fillStyle = "rgba(190,160,255,0.32)";
    ctx.fillText(name.toUpperCase(), (r.x + r.w / 2) * tile, (r.y + 0.9) * tile);
  }

  // ---- Exit door ----
  const doorW = tile * 1.6;
  const openShift = s.doorOpen * doorW * 0.9;
  ctx.save();
  ctx.translate(EXIT_DOOR.x * tile, EXIT_DOOR.y * tile);
  ctx.fillStyle = s.codeSolved ? "rgba(168,85,247,0.25)" : "#2a1550";
  ctx.fillRect(-doorW / 2 + openShift, -tile * 0.9, doorW, tile * 1.8);
  ctx.strokeStyle = COLORS.exit;
  ctx.lineWidth = 3;
  ctx.shadowColor = COLORS.exit;
  ctx.shadowBlur = 18;
  ctx.strokeRect(-doorW / 2 + openShift, -tile * 0.9, doorW, tile * 1.8);
  ctx.restore();

  // ---- Clues ----
  for (const c of s.clues) {
    if (c.found) continue;
    const pulse = 0.6 + Math.sin(s.time * 3 + c.id) * 0.2;
    ctx.save();
    ctx.translate(c.x * tile, c.y * tile);
    ctx.fillStyle = COLORS.clue;
    ctx.globalAlpha = pulse;
    ctx.shadowColor = COLORS.clue;
    ctx.shadowBlur = 14;
    ctx.fillRect(-tile * 0.18, -tile * 0.22, tile * 0.36, tile * 0.44);
    ctx.restore();
  }

  // ---- Keys ----
  for (const k of s.keys) {
    if (k.collected) {
      if (k.pop > 0) {
        // pickup burst animation
        const p = 1 - k.pop / 0.6;
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = COLORS.key;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(k.x * tile, k.y * tile, tile * (0.3 + p * 1.2), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      continue;
    }
    const bob = Math.sin(s.time * 3 + k.id * 2) * tile * 0.1;
    ctx.save();
    ctx.translate(k.x * tile, k.y * tile + bob);
    ctx.shadowColor = COLORS.key;
    ctx.shadowBlur = 16;
    ctx.fillStyle = COLORS.key;
    ctx.beginPath();
    ctx.arc(0, -tile * 0.1, tile * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-tile * 0.05, -tile * 0.02, tile * 0.1, tile * 0.32);
    ctx.fillRect(-tile * 0.05, tile * 0.16, tile * 0.2, tile * 0.06);
    ctx.restore();

    // Hint beacon
    if (s.hintTarget && s.hintTarget.id === k.id) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,212,105,0.9)";
      ctx.lineWidth = 2;
      const r = tile * (1 + Math.sin(s.time * 6) * 0.3);
      ctx.beginPath();
      ctx.arc(k.x * tile, k.y * tile, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(s.player.x * tile, s.player.y * tile);
      ctx.lineTo(k.x * tile, k.y * tile);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---- Ghost ----
  const g = s.ghost;
  const float = Math.sin(g.float * 2.4) * tile * 0.14;
  ctx.save();
  ctx.translate(g.x * tile, g.y * tile + float);
  const ghostColor =
    g.state === "chase" ? "#ff7ba8" : g.state === "detect" ? "#ffd166" : COLORS.ghost;
  ctx.shadowColor = ghostColor;
  ctx.shadowBlur = 26;
  ctx.fillStyle = ghostColor;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(0, -tile * 0.12, tile * 0.36, Math.PI, 0);
  ctx.lineTo(tile * 0.36, tile * 0.3);
  for (let i = 0; i < 3; i++) {
    ctx.quadraticCurveTo(
      tile * (0.24 - i * 0.24),
      tile * (0.44 + Math.sin(g.float * 6 + i) * 0.06),
      tile * (0.12 - i * 0.24),
      tile * 0.3,
    );
  }
  ctx.lineTo(-tile * 0.36, -tile * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#12071f";
  ctx.beginPath();
  ctx.arc(-tile * 0.13, -tile * 0.16, tile * 0.07, 0, Math.PI * 2);
  ctx.arc(tile * 0.13, -tile * 0.16, tile * 0.07, 0, Math.PI * 2);
  ctx.fill();
  if (g.state !== "patrol") {
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.round(tile * 0.6)}px system-ui`;
    ctx.fillText(g.state === "chase" ? "!" : "?", 0, -tile * 0.7);
  }
  ctx.restore();

  // ---- Player (small explorer) ----
  const p = s.player;
  const step = p.moving ? Math.sin(s.time * 12) * tile * 0.06 : 0;
  ctx.save();
  ctx.translate(p.x * tile, p.y * tile);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.ellipse(0, tile * 0.34, tile * 0.26, tile * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2d1b57"; // body
  ctx.fillRect(-tile * 0.16, -tile * 0.08, tile * 0.32, tile * 0.42);
  ctx.fillStyle = COLORS.player; // head
  ctx.beginPath();
  ctx.arc(0, -tile * 0.22 + step, tile * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5b3fa0"; // explorer hat
  ctx.fillRect(-tile * 0.24, -tile * 0.32 + step, tile * 0.48, tile * 0.07);
  ctx.restore();

  // ---- Flashlight / darkness ----
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const px = p.x * tile - camX + shakeX;
  const py = p.y * tile - camY + shakeY;
  const radius = tile * 5.4;
  const dark = ctx.createRadialGradient(px, py, tile * 0.6, px, py, radius);
  dark.addColorStop(0, "rgba(3,2,10,0)");
  dark.addColorStop(0.45, "rgba(3,2,10,0.42)");
  dark.addColorStop(1, "rgba(3,2,10,0.93)");
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, width, height);

  // Directional cone of light.
  const ang = Math.atan2(p.dir.y, p.dir.x);
  const cone = ctx.createRadialGradient(px, py, 0, px, py, radius * 1.5);
  cone.addColorStop(0, "rgba(216,190,255,0.20)");
  cone.addColorStop(1, "rgba(216,190,255,0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, radius * 1.5, ang - 0.55, ang + 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

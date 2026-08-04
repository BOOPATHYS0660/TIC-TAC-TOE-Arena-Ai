import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas } from "./GameCanvas";
import { Hud, type HudData } from "./Hud";
import { TouchControls } from "./TouchControls";
import {
  About,
  GameOverScreen,
  Instructions,
  MainMenu,
  PauseMenu,
  PuzzleScreen,
  WinScreen,
} from "./Screens";
import { audio } from "@/game/audio";
import {
  createGame,
  currentRoom,
  objectiveText,
  SCORE,
  update,
  activateHint,
  type Difficulty,
  type GameState,
  type Input,
} from "@/game/engine";

type Screen = "menu" | "instructions" | "about" | "playing" | "paused" | "gameover" | "win";

const HIGH_SCORE_KEY = "ethh-high-score";

/** Top-level game container: owns the loop, screens and audio wiring. */
export function Game() {
  const stateRef = useRef<GameState | null>(null);
  const inputRef = useRef<Input>({ up: false, down: false, left: false, right: false });
  const [screen, setScreen] = useState<Screen>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [muted, setMuted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [hud, setHud] = useState<HudData>({
    score: 0,
    keys: 0,
    time: 0,
    objective: "",
    room: "",
    message: "",
    ghostState: "patrol",
  });

  // Load the saved best score once on mount.
  useEffect(() => {
    const saved = Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0);
    if (!Number.isNaN(saved)) setHighScore(saved);
  }, []);

  const saveHighScore = useCallback((score: number) => {
    setHighScore((prev) => {
      if (score <= prev) return prev;
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
      return score;
    });
  }, []);

  const startGame = useCallback(() => {
    stateRef.current = createGame(difficulty);
    inputRef.current = { up: false, down: false, left: false, right: false };
    setPuzzleOpen(false);
    setScreen("playing");
    audio.play("click");
    audio.startMusic();
  }, [difficulty]);

  const toMenu = useCallback(() => {
    audio.stopMusic();
    audio.play("click");
    setPuzzleOpen(false);
    setScreen("menu");
  }, []);

  // ---------- Keyboard input ----------
  useEffect(() => {
    const map: Record<string, keyof Input> = {
      arrowup: "up",
      w: "up",
      arrowdown: "down",
      s: "down",
      arrowleft: "left",
      a: "left",
      arrowright: "right",
      d: "right",
    };
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (map[k]) {
        inputRef.current[map[k]] = true;
        e.preventDefault();
      }
      if (k === "p") setScreen((s) => (s === "playing" ? "paused" : s === "paused" ? "playing" : s));
      if (k === "m") setMuted((m) => !m);
      if (k === "h" && stateRef.current && !puzzleOpen) activateHint(stateRef.current);
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (map[k]) inputRef.current[map[k]] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [puzzleOpen]);

  useEffect(() => audio.setMuted(muted), [muted]);

  // ---------- Game loop ----------
  useEffect(() => {
    if (screen !== "playing" || puzzleOpen) return;
    let raf = 0;
    let last = performance.now();
    let hudTick = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;
      if (s) {
        const events = update(s, dt, inputRef.current);
        for (const ev of events) {
          if (ev === "step") audio.play("step");
          if (ev === "key") audio.play("key");
          if (ev === "clue") audio.play("click");
          if (ev === "ghost") audio.play("ghost");
          if (ev === "puzzle") setPuzzleOpen(true);
          if (ev === "caught") {
            audio.play("lose");
            audio.stopMusic();
            saveHighScore(s.score);
            setScreen("gameover");
          }
          if (ev === "escaped") {
            audio.play("win");
            audio.stopMusic();
            saveHighScore(s.score);
            setScreen("win");
          }
        }
        hudTick += dt;
        if (hudTick > 0.1) {
          hudTick = 0;
          setHud({
            score: s.score,
            keys: s.keysCollected,
            time: s.time,
            objective: objectiveText(s),
            room: currentRoom(s),
            message: s.message,
            ghostState: s.ghost.state,
          });
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [screen, puzzleOpen, saveHighScore]);

  const s = stateRef.current;
  const inGame = screen === "playing" || screen === "paused";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <div className="absolute inset-0 vignette">
        {inGame || screen === "gameover" || screen === "win" ? (
          <GameCanvas stateRef={stateRef} />
        ) : (
          <div className="menu-backdrop h-full w-full" />
        )}
      </div>

      {inGame && (
        <>
          <Hud
            data={hud}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            onPause={() => setScreen("paused")}
            onHint={() => s && activateHint(s)}
            hintReady={!!s && s.hintTimer === 0 && s.keysCollected < 3}
          />
          <TouchControls inputRef={inputRef} />
        </>
      )}

      <div className="fade-in">
        {screen === "menu" && (
          <MainMenu
            onStart={startGame}
            onInstructions={() => setScreen("instructions")}
            onAbout={() => setScreen("about")}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            highScore={highScore}
          />
        )}
        {screen === "instructions" && <Instructions onExit={toMenu} />}
        {screen === "about" && <About onExit={toMenu} />}
        {screen === "paused" && (
          <PauseMenu
            onResume={() => setScreen("playing")}
            onRestart={startGame}
            onMenu={toMenu}
          />
        )}
        {puzzleOpen && s && (
          <PuzzleScreen
            clues={s.clues}
            onCancel={() => {
              // Step back from the door so the puzzle doesn't reopen instantly.
              s.player.y -= 2;
              s.status = "playing";
              setPuzzleOpen(false);
            }}
            onSubmit={(code) => {
              if (code !== s.code) {
                audio.play("error");
                return false;
              }
              s.codeSolved = true;
              s.score += SCORE.puzzle;
              s.status = "playing";
              s.message = "The lock clicks open — run!";
              s.messageTimer = 4;
              audio.play("door");
              setPuzzleOpen(false);
              return true;
            }}
          />
        )}
        {screen === "gameover" && s && (
          <GameOverScreen
            score={s.score}
            time={s.time}
            keys={s.keysCollected}
            highScore={highScore}
            onRestart={startGame}
            onMenu={toMenu}
          />
        )}
        {screen === "win" && s && (
          <WinScreen
            score={s.score}
            time={s.time}
            keys={s.keysCollected}
            highScore={highScore}
            onRestart={startGame}
            onMenu={toMenu}
          />
        )}
      </div>
    </div>
  );
}

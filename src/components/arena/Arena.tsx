/**
 * Arena — top level container.
 * Owns navigation between the menu and a match, plus theme/audio settings.
 */

import { useCallback, useEffect, useState } from "react";

import { GameScreen } from "./GameScreen";
import { HowToPlay } from "./HowToPlay";
import { Menu } from "./Menu";
import { SettingsPanel } from "./SettingsPanel";
import { audio } from "@/game/arena/audio";
import { loadStats, type Stats } from "@/game/arena/stats";
import type { BoardSize, Difficulty } from "@/game/arena/types";

const THEME_KEY = "ttt-arena-theme";

export function Arena() {
  const [screen, setScreen] = useState<"menu" | "game">("menu");
  const [size, setSize] = useState<BoardSize>(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [matchKey, setMatchKey] = useState(0);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sfx, setSfx] = useState(true);
  const [music, setMusic] = useState(false);
  const [dark, setDark] = useState(true);
  const [stats, setStats] = useState<Stats>(() => loadStats());

  // Refresh stats whenever we come back to the menu.
  useEffect(() => {
    if (screen === "menu") setStats(loadStats());
  }, [screen, matchKey]);

  // Theme: restore preference, then reflect it on <html>.
  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved) setDark(saved === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    audio.sfxOn = sfx;
  }, [sfx]);

  useEffect(() => {
    audio.setMusic(music);
    return () => audio.stopMusic();
  }, [music]);

  const play = useCallback(() => {
    audio.play("click");
    setMatchKey((k) => k + 1);
    setScreen("game");
  }, []);

  const restart = useCallback(() => {
    setMatchKey((k) => k + 1);
  }, []);

  return (
    <main className="arena-shell">
      <div className="arena-grid-bg" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-3">
        {screen === "menu" ? (
          <Menu
            size={size}
            difficulty={difficulty}
            stats={stats}
            dark={dark}
            onSize={setSize}
            onDifficulty={setDifficulty}
            onPlay={play}
            onHowTo={() => setShowHowTo(true)}
            onSettings={() => setShowSettings(true)}
            onToggleTheme={() => setDark((d) => !d)}
          />
        ) : (
          <GameScreen
            key={matchKey}
            size={size}
            difficulty={difficulty}
            onMenu={() => setScreen("menu")}
            onRestart={restart}
          />
        )}
      </div>

      {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}
      {showSettings && (
        <SettingsPanel
          sfx={sfx}
          music={music}
          dark={dark}
          onSfx={setSfx}
          onMusic={setMusic}
          onDark={setDark}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}

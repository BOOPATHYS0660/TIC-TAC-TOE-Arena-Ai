import { Key, Timer, Trophy, Volume2, VolumeX, Pause, Lightbulb } from "lucide-react";
import { formatTime } from "@/game/engine";

export type HudData = {
  score: number;
  keys: number;
  time: number;
  objective: string;
  room: string;
  message: string;
  ghostState: string;
};

type Props = {
  data: HudData;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onHint: () => void;
  hintReady: boolean;
};

/** Heads-up display: score, keys, timer, objective + quick actions. */
export function Hud({ data, muted, onToggleMute, onPause, onHint, hintReady }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
      <div className="hud-panel pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Stat icon={<Trophy className="size-4" />} label="Score" value={data.score.toString()} />
        <Stat icon={<Key className="size-4" />} label="Keys" value={`${data.keys}/3`} />
        <Stat icon={<Timer className="size-4" />} label="Time" value={formatTime(data.time)} />

        <div className="ml-auto flex items-center gap-2">
          <button className="icon-btn" onClick={onHint} disabled={!hintReady} title="Hint">
            <Lightbulb className="size-4" />
          </button>
          <button className="icon-btn" onClick={onToggleMute} title="Mute">
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button className="icon-btn" onClick={onPause} title="Pause">
            <Pause className="size-4" />
          </button>
        </div>

        <div className="flex w-full items-center gap-2 border-t border-border/60 pt-2 text-xs sm:text-sm">
          <span className="objective-chip">Objective</span>
          <span className="truncate text-muted-foreground">{data.objective}</span>
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span>Room: {data.room}</span>
          <span className={data.ghostState === "chase" ? "text-destructive animate-pulse" : ""}>
            Ghost: {data.ghostState}
          </span>
        </div>
      </div>

      {/* Inventory bar */}
      <div className="pointer-events-none mt-3 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`key-slot ${i < data.keys ? "key-slot-filled" : ""}`}>
            <Key className="size-4" />
          </div>
        ))}
      </div>

      {data.message && (
        <div key={data.message} className="toast-message pointer-events-none mt-3">
          {data.message}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

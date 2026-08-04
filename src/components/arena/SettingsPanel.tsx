/** Settings overlay: audio + theme. */

import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  sfx: boolean;
  music: boolean;
  dark: boolean;
  onSfx: (v: boolean) => void;
  onMusic: (v: boolean) => void;
  onDark: (v: boolean) => void;
  onClose: () => void;
}

export function SettingsPanel({
  sfx,
  music,
  dark,
  onSfx,
  onMusic,
  onDark,
  onClose,
}: SettingsPanelProps) {
  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2 className="neon-heading">Settings</h2>
        <div className="mt-5 space-y-3">
          <Toggle label="Sound effects" value={sfx} onChange={onSfx} />
          <Toggle label="Background music" value={music} onChange={onMusic} />
          <Toggle label="Dark mode" value={dark} onChange={onDark} />
        </div>
        <button type="button" className="neon-btn mt-5 w-full" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm"
    >
      <span>{label}</span>
      <span className={cn("switch", value && "switch-on")}>
        <span className="switch-knob" />
      </span>
    </button>
  );
}

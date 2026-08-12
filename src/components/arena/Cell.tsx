/** A single animated board cell. */

import { Bomb, Gem, HelpCircle, Snowflake, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Cell as CellData, PowerKind } from "@/game/arena/types";

const POWER_ICON: Record<PowerKind, React.ComponentType<{ className?: string }>> = {
  extra: Star,
  double: Gem,
  hint: HelpCircle,
  freeze: Snowflake,
};

interface CellProps {
  cell: CellData;
  index: number;
  winning: boolean;
  targetable: boolean;
  selected: boolean;
  hinted: boolean;
  disabled: boolean;
  onClick: (index: number) => void;
}

export function Cell({
  cell,
  index,
  winning,
  targetable,
  selected,
  hinted,
  disabled,
  onClick,
}: CellProps) {
  const PowerIcon = cell.power ? POWER_ICON[cell.power] : null;
  const frozen = cell.frozenTurns > 0;

  return (
    <button
      type="button"
      aria-label={`Cell ${index + 1}${cell.mark ? `, ${cell.mark}` : ", empty"}`}
      disabled={disabled}
      onClick={() => onClick(index)}
      className={cn(
        "arena-cell",
        winning && "arena-cell-win",
        targetable && "arena-cell-target",
        selected && "arena-cell-selected",
        hinted && "arena-cell-hint",
        frozen && "arena-cell-frozen",
      )}
    >
      {cell.mark ? (
        <span className={cn("arena-mark", cell.mark === "X" ? "arena-mark-x" : "arena-mark-o")}>
          {cell.mark}
          {cell.shielded && <span className="arena-shield" aria-hidden />}
        </span>
      ) : PowerIcon ? (
        <PowerIcon className="arena-power-icon" />
      ) : frozen ? (
        <Snowflake className="arena-frozen-icon" />
      ) : null}
      {cell.mark === null && !cell.power && targetable && (
        <Bomb className="hidden" />
      )}

    </button>
  );
}

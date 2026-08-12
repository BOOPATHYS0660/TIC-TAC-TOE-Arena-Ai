/** Rules overlay. */

export function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay">
      <div className="overlay-card text-left">
        <h2 className="neon-heading text-center">How to play</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Goal:</strong> connect 5 of your marks in a row —
            horizontally, vertically or diagonally — for an instant win.
          </li>
          <li>
            <strong className="text-foreground">Scoring:</strong> 3 in a row = 10 pts, 4 in a row =
            30 pts. If the board fills up, the highest score wins.
          </li>
          <li>
            <strong className="text-foreground">Bomb:</strong> once per match, destroy one unshielded
            enemy mark.
          </li>
          <li>
            <strong className="text-foreground">Shield:</strong> once per match, make one of your
            marks bomb-proof.
          </li>
          <li>
            <strong className="text-foreground">Swap:</strong> once per match, move one of your marks
            to an adjacent empty square.
          </li>
          <li>
            <strong className="text-foreground">⭐ Extra Move:</strong> take another turn immediately.
          </li>
          <li>
            <strong className="text-foreground">💎 Double Score:</strong> your next completed line
            scores double.
          </li>
          <li>
            <strong className="text-foreground">🔍 Hint:</strong> highlights your strongest move.
          </li>
          <li>
            <strong className="text-foreground">⚡ Freeze:</strong> lock one square against the AI for
            a turn.
          </li>
        </ul>
        <button type="button" className="neon-btn mt-5 w-full" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

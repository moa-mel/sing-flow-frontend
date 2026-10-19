'use client';

import { useMemo } from 'react';

interface Props {
  lines: string[];
  index: number;
  /** Visible lines (default 4) */
  windowSize?: number;
  /**
   * When current reaches this position inside the window (0-based),
   * the window starts sliding. Default 2 = 3rd line of 4.
   */
  advanceAt?: number;
  fontSize?: string;
}

export default function LyricsView({
  lines,
  index,
  windowSize = 4,
  advanceAt = 2,
  fontSize,
}: Props) {
  const safeIndex = Math.max(
    0,
    Math.min(index, Math.max(0, lines.length - 1)),
  );

  const { start, visible } = useMemo(() => {
    if (lines.length === 0) return { start: 0, visible: [] as string[] };

    // Keep current on row `advanceAt` once we've moved past the opening.
    // index 0,1,2 → start 0 (current on rows 0,1,2)
    // index 3 → start 1
    // index 4 → start 2
    let start = Math.max(0, safeIndex - advanceAt);

    if (start + windowSize > lines.length) {
      start = Math.max(0, lines.length - windowSize);
    }

    return {
      start,
      visible: lines.slice(start, start + windowSize),
    };
  }, [lines, safeIndex, windowSize, advanceAt]);

  return (
    <div
      className="lyrics lyrics-window"
      style={fontSize ? { fontSize } : undefined}
    >
      {visible.map((line, i) => {
        const absoluteIndex = start + i;
        const kind =
          absoluteIndex === safeIndex
            ? 'current'
            : absoluteIndex < safeIndex
              ? 'past'
              : 'upcoming';

        return (
          <div key={absoluteIndex} className={`line ${kind}`}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
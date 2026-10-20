
'use client';

import { useEffect, useMemo } from 'react';

interface Props {
  lines: string[];
  index: number;
  windowSize?: number;
  currentRow?: number;
  fontSize?: string;
}

export default function LyricsView({
  lines,
  index,
  windowSize = 4,
  currentRow = 1,
  fontSize,
}: Props) {
  const safeIndex = Math.max(
    0,
    Math.min(index, Math.max(0, lines.length - 1)),
  );

  // Keep the active lyric on the third row.
  // At the start, never scroll above the first lyric.
  const start = Math.max(
    0,
    Math.min(
      safeIndex - currentRow,
      Math.max(0, lines.length - windowSize),
    ),
  );

  const visibleLines = useMemo(
    () => lines.slice(start, start + windowSize),
    [lines, start, windowSize],
  );

  useEffect(() => {
    console.debug('[LyricsView]', {
      activeLine: safeIndex + 1,
      firstVisibleLine: start + 1,
      visibleLineCount: visibleLines.length,
    });
  }, [safeIndex, start, visibleLines.length]);

  return (
    <div
      className="lyrics lyrics-window"
      style={{
        ...(fontSize ? { fontSize } : {}),
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5em',
      }}
    >
      {visibleLines.map((line, visibleIndex) => {
        const lineIndex = start + visibleIndex;

        const kind =
          lineIndex === safeIndex
            ? 'current'
            : lineIndex < safeIndex
              ? 'past'
              : 'upcoming';

        return (
          <div
            key={`${lineIndex}-${line}`}
            className={`line ${kind}`}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}

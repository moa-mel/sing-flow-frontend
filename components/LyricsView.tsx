'use client';

import { useMemo } from 'react';

interface Props {
  lines: string[];
  index: number;
  windowSize?: number;
  /** Row (0-based) the current line sits on once scrolling begins. Default 1. */
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
  const safeIndex = Math.max(0, Math.min(index, Math.max(0, lines.length - 1)));

  const start = useMemo(() => {
    // Scroll as soon as current passes row `currentRow`
    let s = Math.max(0, safeIndex - currentRow);
    // Don't scroll past the end
    s = Math.min(s, Math.max(0, lines.length - windowSize));
    return s;
  }, [safeIndex, currentRow, windowSize, lines.length]);

  return (
    <div
      className="lyrics lyrics-window"
      style={{
        ...(fontSize ? { fontSize } : {}),
        height: `calc(${windowSize} * 1.5em)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          transform: `translateY(calc(${start} * -1.5em))`,
          transition: 'transform 0.35s ease',
        }}
      >
        {lines.map((line, i) => {
          const kind =
            i === safeIndex ? 'current' : i < safeIndex ? 'past' : 'upcoming';
          return (
            <div
              key={i}
              className={`line ${kind}`}
              style={{
                height: '1.5em',
                lineHeight: '1.5em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}
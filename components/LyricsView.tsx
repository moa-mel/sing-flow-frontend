'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';

interface Props {
  lines: string[];
  index: number;
  windowSize?: number;
  /** Row (0-based) the current line sits on once scrolling begins. */
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
    const s = Math.max(0, safeIndex - currentRow);
    return Math.min(s, Math.max(0, lines.length - windowSize));
  }, [safeIndex, currentRow, windowSize, lines.length]);

  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const [box, setBox] = useState<{ offset: number; height?: number }>({ offset: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const first = rows.current[start];
      const last = rows.current[Math.min(start + windowSize, lines.length) - 1];
      if (!first || !last) return;
      setBox({
        offset: first.offsetTop,
        height: last.offsetTop + last.offsetHeight - first.offsetTop,
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [start, windowSize, lines, fontSize]);

  return (
    <div
      className="lyrics lyrics-window"
      style={{
        ...(fontSize ? { fontSize } : {}),
        height: box.height,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          transform: `translateY(${-box.offset}px)`,
          transition: 'transform 0.3s ease',
        }}
      >
        {lines.map((line, i) => {
          const kind =
            i === safeIndex ? 'current' : i < safeIndex ? 'past' : 'upcoming';
          return (
            <div
              key={i}
              ref={(el) => {
                rows.current[i] = el;
              }}
              className={`line ${kind}`}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}
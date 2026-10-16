'use client';
import { useEffect, useRef } from 'react';

interface Props {
  lines: string[];
  index: number;
  fontSize?: string;
}

/** Highlights the current line and smooth-scrolls it near the top, with upcoming lines visible below. */
export default function LyricsView({ lines, index, fontSize }: Props) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    refs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [index, lines]);

  return (
    <div className="lyrics" style={fontSize ? { fontSize } : undefined}>
      {lines.map((line, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`line ${i === index ? 'current' : i < index ? 'past' : 'upcoming'}`}
        >
          {line}
        </div>
      ))}
      <div className="lyrics-tail" />
    </div>
  );
}

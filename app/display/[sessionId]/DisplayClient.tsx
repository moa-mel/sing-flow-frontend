'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import LyricsView from '@/components/LyricsView';
import { useLyricsSession } from '@/hooks/useLyricsSession';

function Spinner({ label }: { label?: string }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" aria-hidden />
      {label && <p className="spinner-label">{label}</p>}
    </div>
  );
}

export default function DisplayClient({ sessionId }: { sessionId: string }) {
  const searchParams = useSearchParams();
  const preselectSong = searchParams.get('song');
  const preselectDone = useRef(false);

  const { state, joined } = useLyricsSession(sessionId, 'display');

  // Load the song from ?song= once we're joined
  useEffect(() => {
    if (!joined || !preselectSong || preselectDone.current) return;
    preselectDone.current = true;
  }, [joined, preselectSong]);

  if (!sessionId) {
    return (
      <div className="display">
        <div className="empty">Missing session…</div>
      </div>
    );
  }

  if (!joined || !state.song) {
    return (
      <div className="display">
        <Spinner
          label={
            !joined
              ? 'Connecting…'
              : preselectSong
                ? 'Loading song…'
                : 'Waiting for a song…'
          }
        />
      </div>
    );
  }

  return (
    <div className="display">
      <div className="title">{state.song.title}</div>
      <LyricsView
        key={state.songId}
        lines={state.song.lines}
        index={state.lineIndex}
      />
    </div>
  );
}
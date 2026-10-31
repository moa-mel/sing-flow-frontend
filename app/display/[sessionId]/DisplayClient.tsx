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

  const { state, joined, socket } = useLyricsSession(sessionId, 'display');

  // Load the song from ?song= once we're joined
  useEffect(() => {
    if (!joined || !socket || !preselectSong || preselectDone.current) {
      return;
    }

    preselectDone.current = true;

    socket.emit(
      'song:select',
      {
        songId: preselectSong,
        lineIndex: 0,
      },
      (ack: { ok: boolean; error?: string }) => {
        if (!ack.ok) {
          console.error('[Display] Failed to select song:', ack.error);
        }
      },
    );
  }, [joined, socket, preselectSong]);

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
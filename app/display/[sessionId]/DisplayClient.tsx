'use client';

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
  const { state, joined } = useLyricsSession(sessionId, 'display');

  if (!sessionId) {
    return (
      <div className="display">
        <div className="empty">Missing session…</div>
      </div>
    );
  }

  // Connecting or waiting for a song
  if (!joined || !state.song) {
    return (
      <div className="display">
        <Spinner label={!joined ? 'Connecting…' : 'Waiting for a song…'} />
      </div>
    );
  }

  return (
    <div className="display">
      <div className="title">{state.song.title}</div>
      <LyricsView key={state.songId} lines={state.song.lines} index={state.lineIndex} />
    </div>
  );
}
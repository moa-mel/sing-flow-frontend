'use client';

import LyricsView from '@/components/LyricsView';
import { useLyricsSession } from '@/hooks/useLyricsSession';

export default function DisplayClient({ sessionId }: { sessionId: string }) {
  const { state } = useLyricsSession(sessionId, 'display');

  if (!sessionId) {
    return (
      <div className="display">
        <div className="empty">Missing session…</div>
      </div>
    );
  }

  return (
    <div className="display">
      {state.song ? (
        <>
          <div className="title">{state.song.title}</div>
          <LyricsView lines={state.song.lines} index={state.lineIndex} />
        </>
      ) : (
        <div className="empty">Waiting for a song…</div>
      )}
    </div>
  );
}

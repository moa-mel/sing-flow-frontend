'use client';
import { useParams } from 'next/navigation';
import LyricsView from '@/components/LyricsView';
import { useLyricsSession } from '@/hooks/useLyricsSession';

export default function DisplayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state } = useLyricsSession(sessionId, 'display');

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

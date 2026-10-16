'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import LyricsView from '@/components/LyricsView';
import { useLyricsSession } from '@/hooks/useLyricsSession';
import { useMicStreamer } from '@/hooks/useMicStreamer';
import { FRONTEND_BASE_URL } from '@/lib/config';

export default function OperatorPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [key, setKey] = useState('');
  const [connect, setConnect] = useState(false);
  const [songs, setSongs] = useState<{ id: string; title: string }[]>([]);

  const { socket, joined, error, state, transcript, suggestions } = useLyricsSession(sessionId, 'operator', {
    key,
    enabled: connect,
  });
  const mic = useMicStreamer(socket, joined);

  useEffect(() => {
    fetch(`${FRONTEND_BASE_URL}/songs`).then((r) => r.json()).then(setSongs).catch(() => setSongs([]));
  }, []);

  if (!connect) {
    return (
      <main className="center">
        <div className="stack" style={{ width: 'min(380px, 90vw)' }}>
          <h2>Operator · {sessionId}</h2>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Operator key" />
          <button className="primary" onClick={() => setConnect(true)}>Connect</button>
        </div>
      </main>
    );
  }

  const send = (event: string, payload?: unknown) => socket?.emit(event, payload);

  return (
    <div className="operator">
      <div className="panel stack">
        <h2>Operator · {sessionId}</h2>
        <div className="status">{joined ? '● Connected' : '○ Connecting…'}</div>
        {(error || mic.error) && <div className="error">{error ?? mic.error}</div>}

        <div className="row">
          {mic.active ? (
            <button className="danger" onClick={mic.stop}>Stop listening</button>
          ) : (
            <button className="primary" onClick={mic.start} disabled={!joined}>Start listening</button>
          )}
        </div>

        <div className={`transcript ${transcript && !transcript.isFinal ? 'interim' : ''}`}>
          {transcript?.text ?? <span className="small">Heard text appears here…</span>}
        </div>

        <h2>Song</h2>
        <select
          value={state.songId ?? ''}
          onChange={(e) => send('song:select', { songId: e.target.value || null })}
          disabled={!joined}
        >
          <option value="">— none (auto-detect by voice) —</option>
          {songs.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>

        <div className="row">
          <button onClick={() => send('line:prev')} disabled={!joined || !state.song}>◀ Prev line</button>
          <button onClick={() => send('line:next')} disabled={!joined || !state.song}>Next line ▶</button>
        </div>

        {suggestions.length > 0 && (
          <>
            <h2>Did you mean…</h2>
            {suggestions.map((h) => (
              <button
                key={h.songId}
                className="suggestion"
                onClick={() => send('song:select', { songId: h.songId, lineIndex: h.lineIndex + 1 })}
              >
                {h.title} <span className="small">({Math.round(h.score * 100)}%)</span>
              </button>
            ))}
          </>
        )}

        <div className="small">
          Projector: <a href={`/display/${sessionId}`} target="_blank" rel="noreferrer">/display/{sessionId}</a>
        </div>
      </div>

      <div className="preview">
        {state.song ? (
          <LyricsView lines={state.song.lines} index={state.lineIndex} />
        ) : (
          <div className="display empty" style={{ position: 'static' }}>No song selected</div>
        )}
      </div>
    </div>
  );
}

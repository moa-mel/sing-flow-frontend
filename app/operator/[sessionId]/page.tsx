'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import LyricsView from '@/components/LyricsView';
import { useLyricsSession } from '@/hooks/useLyricsSession';
import { useMicStreamer } from '@/hooks/useMicStreamer';

function OperatorConsole() {
  const params = useParams();
  const sessionId = Array.isArray(params.sessionId)
    ? params.sessionId[0] ?? ''
    : (params.sessionId ?? '');

  const searchParams = useSearchParams();
  const preselectSong = searchParams.get('song');

  const [key, setKey] = useState('');
  const [connect, setConnect] = useState(false);
  const [songs, setSongs] = useState<{ id: number; title: string }[]>([]);
  const preselectDone = useRef(false);

  const { socket, joined, error, state, transcript, suggestions } =
    useLyricsSession(sessionId, 'operator', {
      key,
      enabled: connect,
    });
  const mic = useMicStreamer(socket, joined);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE}/songs`)
      .then((r) => r.json())
      .then((data) => setSongs(Array.isArray(data) ? data : []))
      .catch(() => setSongs([]));
  }, []);

  // Apply ?song= once after join
  useEffect(() => {
    if (!joined || !socket || !preselectSong || preselectDone.current) return;
    preselectDone.current = true;
    socket.emit('song:select', { songId: preselectSong });
  }, [joined, socket, preselectSong]);

  if (!connect) {
    return (
      <main className="center login-screen">
        <div className="login-box stack">
          <div className="login-header">
            <span className="badge">Live Control</span>
            <h2>Session: {sessionId}</h2>
          </div>
          {preselectSong && (
            <p className="hint">
              Song id <strong>{preselectSong}</strong> will load on connect.
            </p>
          )}
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter operator key..."
            autoFocus
          />
          <button className="primary" onClick={() => setConnect(true)}>
            Connect to Console
          </button>
        </div>
      </main>
    );
  }

  const send = (event: string, payload?: unknown) =>
    socket?.emit(event, payload);

  return (
    <div className="operator-layout">
      {/* LEFT: Control Panel */}
      <div className="panel stack">
        <div className="panel-header">
          <h2>Operator <span>/ {sessionId}</span></h2>
          <div className={`status ${joined ? 'connected' : 'connecting'}`}>
            {joined ? '● Live' : '○ Connecting…'}
          </div>
        </div>

        {(error || mic.error) && (
          <div className="error-box">{error ?? mic.error}</div>
        )}

        <div className="control-group">
          <label>Mic Input</label>
          <div className="row">
            {mic.active ? (
              <button className="danger" onClick={mic.stop}>
                <span className="icon">⏹</span> Stop Listening
              </button>
            ) : (
              <button
                className="primary"
                onClick={mic.start}
                disabled={!joined}
              >
                <span className="icon">🎤</span> Start Listening
              </button>
            )}
          </div>
        </div>

        <div className="control-group">
          <label>Live Transcript</label>
          <div
            className={`transcript ${
              transcript && !transcript.isFinal ? 'interim' : ''
            }`}
          >
            {transcript?.text ?? (
              <span className="placeholder">Awaiting voice input...</span>
            )}
          </div>
        </div>

        <div className="control-group">
          <label>Active Song</label>
          <select
            value={state.songId ?? ''}
            onChange={(e) =>
              send('song:select', {
                songId: e.target.value || null,
              })
            }
            disabled={!joined}
          >
            <option value="">— Auto-detect by voice —</option>
            {songs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          <div className="row mt-2">
            <button
              className="ghost"
              onClick={() => send('line:prev')}
              disabled={!joined || !state.song}
            >
              ◀ Prev
            </button>
            <button
              className="ghost"
              onClick={() => send('line:next')}
              disabled={!joined || !state.song}
            >
              Next ▶
            </button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="control-group">
            <label>Did you mean...</label>
            <div className="suggestions-list">
              {suggestions.map((h) => (
                <button
                  key={h.songId}
                  className="suggestion-btn"
                  onClick={() =>
                    send('song:select', {
                      songId: h.songId,
                      lineIndex: h.lineIndex + 1,
                    })
                  }
                >
                  <span className="sugg-title">{h.title}</span>
                  <span className="sugg-score">
                    {Math.round(h.score * 100)}% Match
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="panel-footer">
          Projector Link:{' '}
          <a href={`/display/${sessionId}`} target="_blank" rel="noreferrer">
            /display/{sessionId} ↗
          </a>
        </div>
      </div>

      {/* RIGHT: Live Preview */}
      <div className="preview-area">
        <div className="preview-label">Live Output Preview</div>
        <div className="preview-container">
          {state.song ? (
            <LyricsView lines={state.song.lines} index={state.lineIndex} />
          ) : (
            <div className="empty-state">No song currently active</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OperatorPage() {
  return (
    <Suspense
      fallback={
        <main className="center login-screen">
          <p className="hint">Loading operator console…</p>
        </main>
      }
    >
      <OperatorConsole />
    </Suspense>
  );
}
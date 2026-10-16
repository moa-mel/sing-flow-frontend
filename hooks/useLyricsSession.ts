'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { FRONTEND_BASE_URL } from '@/lib/config';
import type { Role, SearchHit, SessionStatePayload, Transcript } from '@/lib/types';

/** Connects to the gateway, joins the session, and exposes live state. Re-joins automatically on reconnect. */
export function useLyricsSession(sessionId: string, role: Role, opts: { key?: string; enabled?: boolean } = {}) {
  const { key, enabled = true } = opts;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<SessionStatePayload>({ songId: null, lineIndex: 0, song: null });
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const s = io(`${FRONTEND_BASE_URL}/lyrics`, { transports: ['websocket'] });
    setSocket(s);

    s.on('connect', () => {
      s.emit('session:join', { sessionId, role, key }, (ack: { ok: boolean; error?: string }) => {
        setJoined(ack.ok);
        setError(ack.ok ? null : ack.error ?? 'join failed');
      });
    });
    s.on('disconnect', () => setJoined(false));
    s.on('state', (p: SessionStatePayload) => {
      setState(p);
      setSuggestions([]); // a new line/song makes old suggestions stale
    });
    s.on('transcript', (t: Transcript) => setTranscript(t));
    s.on('search:suggestions', (h: SearchHit[]) => setSuggestions(h));
    s.on('stt:error', (e: { message: string }) => setError(`Speech-to-text: ${e.message}`));

    return () => {
      s.disconnect();
      setSocket(null);
      setJoined(false);
    };
  }, [sessionId, role, key, enabled]);

  return { socket, joined, error, state, transcript, suggestions };
}

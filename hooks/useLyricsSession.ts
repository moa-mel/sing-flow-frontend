'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Role, SearchHit, SessionStatePayload, Transcript } from '@/lib/types';

/** Connects to the gateway, joins the session, and exposes live state. Re-joins automatically on reconnect. */
export function useLyricsSession(
  sessionId: string,
  role: Role,
  opts: { key?: string; enabled?: boolean } = {},
) {
  const { key, enabled = true } = opts;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<SessionStatePayload>({
    songId: null,
    lineIndex: 0,
    song: null,
  });
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);

  const API_BASE = process.env.NEXT_PUBLIC_SOCKET_URL;

  useEffect(() => {
    if (!enabled || !sessionId) return;

    console.log('[Socket] Connecting to', `${API_BASE}/lyrics`, 'sessionId=', sessionId);

    const s = io(`${API_BASE}/lyrics`, {
      transports: ['polling', 'websocket'], // temporarily allow polling
    });

    setSocket(s);

    s.on('connect', () => {
      console.log('[Socket] CONNECTED, id=', s.id);
      s.emit('session:join', { sessionId, role, key }, (ack: { ok: boolean; error?: string }) => {
        console.log('[Socket] session:join ack →', ack);
        setJoined(ack.ok);
        setError(ack.ok ? null : ack.error ?? 'join failed');
      });
    });

    s.on('connect_error', (err) => {
      console.error('[Socket] connect_error →', err.message, err);
    });

    s.on('disconnect', (reason) => {
      console.warn('[Socket] DISCONNECTED →', reason);
      setJoined(false);
    });

    s.on('state', (p: SessionStatePayload) => {
      console.log('[Socket] received state →', p);
      setState(p);
      setSuggestions([]);
    });

    s.on('transcript', (t: Transcript) => {
      console.log('[Socket] transcript →', t);
      setTranscript(t);
    });

    s.on('search:suggestions', (h: SearchHit[]) => {
      console.log('[Socket] suggestions →', h);
      setSuggestions(h);
    });

    s.on('stt:error', (e: { message: string }) => {
      console.error('[Socket] stt:error →', e);
      setError(`Speech-to-text: ${e.message}`);
    });

    return () => {
      console.log('[Socket] cleaning up');
      s.disconnect();
      setSocket(null);
      setJoined(false);
    };
  }, [sessionId, role, key, enabled]);

  // ← THIS return must be outside the useEffect
  return { socket, joined, error, state, transcript, suggestions };
}
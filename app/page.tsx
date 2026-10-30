'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SongItem = { id: number; title: string; author?: string | null };

/** Minimal shape of the browser SpeechRecognition API (not in default TS DOM libs). */
interface SpeechRec extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
}

type SpeechRecCtor = new () => SpeechRec;

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState('main');
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const id = encodeURIComponent(session.trim() || 'main');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

useEffect(() => {
  setLoading(true);
  fetch(`${API_BASE}/songs`)
    .then(async (r) => {
      if (!r.ok) throw new Error(`Could not load songs (${r.status})`);
      return r.json();
    })
    .then((data: SongItem[]) => {
      setSongs(Array.isArray(data) ? data : []);
      setLoadError(null);
    })
    .catch((err) => {
      console.error(err);
      setSongs([]);
      setLoadError('Could not load songs. Is the backend running?');
    })
    .finally(() => setLoading(false));
}, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.author?.toLowerCase().includes(q) ?? false),
    );
  }, [songs, query]);

  const selected = useMemo(
    () => songs.find((s) => s.id === selectedId) ?? null,
    [songs, selectedId],
  );

  const startVoiceSearch = useCallback(() => {
    if (typeof window === 'undefined') return;

    const w = window as unknown as {
      SpeechRecognition?: SpeechRecCtor;
      webkitSpeechRecognition?: SpeechRecCtor;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SR) {
      alert('Voice search needs Chrome or Edge.');
      return;
    }

    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);

    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? '';
      setQuery(text);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }, []);

  
  return (
    <div className="landing">
      <header className="hero">
        <div className="hero-inner">
          <p className="badge">AI · Live lyrics · Auto-scroll</p>
          <h1>Sing Flow</h1>
          <p className="tagline">
            Search a song or let the choir start singing — lyrics appear and scroll by themselves.
          </p>

          <div className="session-row">
            <label htmlFor="session">Session name</label>
            <input
              id="session"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="e.g. main, sunday-service"
              autoComplete="off"
            />
          </div>

          <div className="cta-row">
            <Link href={`/display/${id}`}>
              <button type="button" className="ghost">
                Open projector
              </button>
            </Link>
          </div>
          <p className="hint">Use the same session name on both screens.</p>
        </div>
      </header>

      <section className="library">
        <div className="library-inner">
          <div className="search-bar">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs by title or author…"
              aria-label="Search songs"
            />
            <button
              type="button"
              className={`mic ${listening ? 'active' : ''}`}
              onClick={startVoiceSearch}
              title="Search by voice"
              aria-label="Search by voice"
            >
              {listening ? '●' : '🎤'}
            </button>
          </div>

          {loadError && <p className="error">{loadError}</p>}
          {loading && <p className="hint">Loading songs…</p>}

          <div className="song-grid">
            {!loading && filtered.length === 0 ? (
              <p className="empty-songs">
                {songs.length === 0
                  ? 'No songs in the library yet.'
                  : 'No matches. Try another search or voice.'}
              </p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="song-card"
                  onClick={() => {
                    // Go straight to lyrics view with this song
                    router.push(`/display/${id}?song=${s.id}`);
                  }}
                >
                  <span className="song-title">{s.title}</span>
                  {s.author && <span className="song-author">{s.author}</span>}
                </button>
              ))
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
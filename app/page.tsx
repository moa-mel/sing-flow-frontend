
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SongItem = {
  id: number;
  title: string;
  author?: string | null;
};

interface SpeechRec extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: {
    results: ArrayLike<ArrayLike<{ transcript: string }>>;
  }) => void) | null;
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
  const id = encodeURIComponent(session.trim() || 'main');

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
      const transcript = e.results[0]?.[0]?.transcript ?? '';
      setQuery(transcript);
      setListening(false);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    rec.start();
  }, []);

  return (
    <main className="landing">

      {/* Navigation */}
      <nav className="site-nav">
        <Link href="/" className="brand">
          <span className="brand-mark">s.</span>
          <span>singflow</span>
        </Link>

        <div className="nav-right">
          <span className="nav-caption">
            LIVE LYRICS PLATFORM
          </span>

          <Link href={`/display/${id}`} className="nav-projector">
            Open projector <span>↗</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">

          <div className="hero-eyebrow">
            <span className="live-indicator" />
            BUILT FOR LIVE WORSHIP
          </div>

          <h1>
            Let the music
            <br />
            <span>lead the words.</span>
          </h1>

          <p className="hero-description">
            Find your song, start singing, and let SingFlow
            keep the lyrics moving with the music.
          </p>

          <div className="hero-bottom">
            <div className="hero-feature">
              <span>01</span>
              Live lyric tracking
            </div>

            <div className="hero-feature">
              <span>02</span>
              Automatic scrolling
            </div>

            <div className="hero-feature">
              <span>03</span>
              Projector ready
            </div>
          </div>
        </div>

        {/* Session setup */}
        <aside className="session-panel">
          <div className="session-panel-top">
            <span className="section-index">01 / SESSION</span>
            <span className="session-status">READY</span>
          </div>

          <h2>Start a session</h2>

          <p>
            Connect your singing screen and projector
            using the same session name.
          </p>

          <div className="session-footnote">
            <span className="footnote-dot" />
            Your session is ready to connect
          </div>
        </aside>
      </section>

      {/* Song library */}
      <section className="library">
        <div className="library-heading">
          <div>
            <span className="section-index">02 / YOUR MUSIC</span>
            <h2>Song library</h2>
            <p>
              Find a song to get started.
            </p>
          </div>

          <div className="library-count">
            <strong>{songs.length.toString().padStart(2, '0')}</strong>
            <span>SONGS AVAILABLE</span>
          </div>
        </div>

        {/* Search */}
        <div className="library-toolbar">
          <div className="search-wrapper">
            <span className="search-icon">⌕</span>

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by song title or artist..."
              aria-label="Search songs"
            />

            {query && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className={`voice-search ${listening ? 'active' : ''}`}
            onClick={startVoiceSearch}
            aria-label="Search by voice"
            title="Search by voice"
          >
            <span>{listening ? '●' : '◉'}</span>
            {listening ? 'Listening...' : 'Voice search'}
          </button>
        </div>

        {loadError && (
          <div className="library-message error">
            {loadError}
          </div>
        )}

        {loading && (
          <div className="library-message">
            Loading your music library...
          </div>
        )}

        {!loading && !loadError && (
          <>
            <div className="song-list-header">
              <span>TRACK</span>
              <span>ARTIST / AUTHOR</span>
              <span>ACTION</span>
            </div>

            <div className="song-list">
              {filtered.length === 0 ? (
                <div className="empty-songs">
                  <span className="empty-icon">♫</span>

                  <h3>
                    {songs.length === 0
                      ? 'Your library is empty'
                      : 'No songs found'}
                  </h3>

                  <p>
                    {songs.length === 0
                      ? 'Songs will appear here once they are added.'
                      : 'Try another search or use voice search.'}
                  </p>
                </div>
              ) : (
                filtered.map((song, index) => (
                  <button
                    key={song.id}
                    type="button"
                    className="song-row"
                    onClick={() =>
                      router.push(`/display/${id}?song=${song.id}`)
                    }
                  >
                    <div className="song-track">
                      <span className="track-number">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>

                      <span className="track-symbol">♫</span>

                      <span className="song-title">
                        {song.title}
                      </span>
                    </div>

                    <span className="song-author">
                      {song.author || 'Unknown artist'}
                    </span>

                    <span className="song-action">
                      Select song <span>↗</span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="library-footer">
              <span>
                Showing {filtered.length} of {songs.length} songs
              </span>

              <span>
                SINGFLOW MUSIC LIBRARY
              </span>
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <Link href="/" className="footer-brand">
          singflow<span>.</span>
        </Link>

        <span>Made for moments that matter.</span>

        <span>LIVE LYRICS · 2026</span>
      </footer>

    </main>
  );
}

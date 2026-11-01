
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LyricsView from '@/components/LyricsView';
import { useLyricsSession } from '@/hooks/useLyricsSession';
import { useMicStreamer } from '@/hooks/useMicStreamer';

type SongItem = {
  id: number;
  title: string;
  author?: string | null;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type SongsResponse = {
  data: SongItem[];
  pagination: Pagination;
};

const PAGE_SIZE = 20;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

function DisplayLoader({ label }: { label: string }) {
  return (
    <div className="display-loader">
      <span className="loader-ring" />
      <p>{label}</p>
    </div>
  );
}

export default function DisplayClient({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preselectSong = searchParams.get('song');
  const preselectDone = useRef(false);

  const [songs, setSongs] = useState<SongItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [songsLoading, setSongsLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const [isSelectingSong, setIsSelectingSong] = useState(false);

  const { state, joined, socket } = useLyricsSession(
    sessionId,
    'display',
  );

  const { active, error, start, stop } = useMicStreamer(
    socket,
    joined,
  );

  // Fetch songs using the same backend search as app/page.tsx.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchSongs() {
      try {
        setSongsLoading(true);
        setSearchError('');

        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        if (searchQuery.trim()) {
          params.set('title', searchQuery.trim());
        }

        const response = await fetch(
          `${API_BASE.replace(/\/$/, '')}/songs?${params.toString()}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const errorBody = await response.text();

          console.error('Songs API error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
            url: response.url,
          });

          throw new Error(
            `Could not load songs (${response.status}): ${errorBody}`,
          );
        }

        const result: SongsResponse = await response.json();

        setSongs(
          Array.isArray(result.data) ? result.data : [],
        );

        setPagination(result.pagination);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        console.error(err);
        setSongs([]);
        setSearchError('Could not load songs. Is the backend running?');
      } finally {
        if (!controller.signal.aborted) {
          setSongsLoading(false);
        }
      }
    }

    fetchSongs();

    return () => controller.abort();
  }, [page, searchQuery]);

  // Search and reset pagination.
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    setSelectionError('');
  };

  // Select a song from the URL once the socket connects.
  useEffect(() => {
    if (
      !joined ||
      !socket ||
      !preselectSong ||
      preselectDone.current
    ) {
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
        if (!ack?.ok) {
          console.error(
            '[Display] Failed to select song:',
            ack?.error,
          );
        }
      },
    );
  }, [joined, socket, preselectSong]);

  // Select a song through the existing WebSocket event.
  const handleSongSelect = (song: SongItem) => {
    if (!socket || !joined || isSelectingSong) return;

    setIsSelectingSong(true);
    setSelectionError('');

    socket.emit(
      'song:select',
      {
        songId: song.id,
        lineIndex: 0,
      },
      (ack: { ok: boolean; error?: string }) => {
        setIsSelectingSong(false);

        if (!ack?.ok) {
          setSelectionError(
            ack?.error || 'Unable to select this song.',
          );
          return;
        }

        setSearchQuery('');
        setPage(1);
      },
    );
  };

  if (!sessionId) {
    return (
      <main className="display-page">
        <div className="display-empty">
          <span className="display-brand">singflow.</span>
          <h2>Session not found</h2>
          <p>A valid session is required to display lyrics.</p>
        </div>
      </main>
    );
  }

  if (!joined) {
    return (
      <main className="display-page">
        <header className="display-topbar">
          <span className="display-brand">singflow.</span>

          <div className="display-connection">
            <span className="connection-dot connecting" />
            Connecting
          </div>
        </header>

        <DisplayLoader label="Connecting to your session..." />
      </main>
    );
  }

  return (
    <main className="display-page">
      {/* Top navigation */}
      <header className="display-topbar">
        <span className="display-brand">singflow.</span>

        {state.song && (
          <div className="display-song-info">
            <span>NOW PLAYING</span>
            <strong>{state.song.title}</strong>
          </div>
        )}

        <div className="display-session">
          <span>SESSION</span>
          <strong>{sessionId}</strong>
        </div>

        {/* Compact song search */}
        <div className="topbar-search">
          <span className="topbar-search-icon">⌕</span>

          <input
            type="search"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search songs"
          />

          {searchQuery && (
            <button
              type="button"
              className="topbar-search-clear"
              onClick={() => handleSearch('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}

          {searchQuery.trim() && (
            <div className="topbar-search-results">
              {songsLoading ? (
                <p>Loading songs...</p>
              ) : searchError ? (
                <p className="search-error">{searchError}</p>
              ) : songs.length > 0 ? (
                <>
                  {songs.map((song) => (
                    <button
                      type="button"
                      key={song.id}
                      onClick={() => handleSongSelect(song)}
                      disabled={isSelectingSong}
                    >
                      <span className="search-result-details">
                        <strong>{song.title}</strong>

                        {song.author && (
                          <small>{song.author}</small>
                        )}
                      </span>

                      <span>→</span>
                    </button>
                  ))}

                  {/* Search result pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="search-pagination">
                      <button
                        type="button"
                        onClick={() =>
                          setPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={
                          !pagination.hasPreviousPage || songsLoading
                        }
                      >
                        ←
                      </button>

                      <span>
                        {pagination.page} / {pagination.totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={
                          !pagination.hasNextPage || songsLoading
                        }
                      >
                        →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p>No songs found.</p>
              )}

              {isSelectingSong && (
                <p>Loading selected song...</p>
              )}

              {selectionError && (
                <p className="search-error">{selectionError}</p>
              )}
            </div>
          )}
        </div>

        {/* Connection status */}
        <div className="display-connection">
          <span className="connection-dot connected" />
          Connected
        </div>
      </header>

      {/* Main lyrics workspace */}
      <section className="display-workspace">
        {!state.song ? (
          <section className="display-waiting">
            <div className="waiting-content">
              <span className="waiting-icon">♫</span>

              <span className="waiting-label">
                WAITING FOR MUSIC
              </span>

              <h1>
                Ready when<br />you are.
              </h1>

              <p>
                Search for a song above and select it
                to start displaying lyrics.
              </p>

              <div className="waiting-divider" />

              <span className="waiting-session">
                SESSION / {sessionId}
              </span>
            </div>
          </section>
        ) : (
          <>
            {/* Lyrics heading and controls */}
            <div className="workspace-heading">
              <div>
                <button
                  type="button"
                  className="back-button"
                  onClick={() => router.push('/')}
                  aria-label="Go back to main page"
                >
                  ←
                </button>

                <span className="workspace-eyebrow">
                  LIVE LYRICS
                </span>

                <h1>{state.song.title}</h1>
              </div>

              <div className="workspace-controls">
                <span
                  className={`listening-status ${
                    active ? 'is-active' : ''
                  }`}
                >
                  <span />
                  {active
                    ? 'Listening to audio'
                    : 'Microphone paused'}
                </span>

                <button
                  type="button"
                  className={`listen-button ${
                    active ? 'is-active' : ''
                  }`}
                  onClick={active ? stop : start}
                  disabled={!joined}
                  aria-pressed={active}
                >
                  <span className="listen-icon">
                    {active ? '■' : '◉'}
                  </span>

                  {active
                    ? 'Stop listening'
                    : 'Start listening'}
                </button>
              </div>
            </div>

            {error && (
              <div className="display-error">
                {error}
              </div>
            )}

            {/* Lyrics canvas */}
            <div className="display-lyrics">
              <LyricsView
                key={state.songId}
                lines={state.song.lines}
                index={state.lineIndex}
              />
            </div>

            {/* Bottom status */}
            <footer className="display-bottom">
              <span>
                <span className="bottom-dot" />
                LIVE SESSION
              </span>

              <span>
                SINGFLOW LYRICS DISPLAY
              </span>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}

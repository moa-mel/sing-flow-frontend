'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [session, setSession] = useState('main');
  const id = encodeURIComponent(session.trim() || 'main');
  return (
    <main className="center">
      <div className="stack" style={{ width: 'min(420px, 90vw)' }}>
        <h1>Church Lyrics</h1>
        <input value={session} onChange={(e) => setSession(e.target.value)} placeholder="Session name (e.g. main)" />
        <Link href={`/operator/${id}`}><button className="primary" style={{ width: '100%' }}>Open operator console</button></Link>
        <Link href={`/display/${id}`}><button style={{ width: '100%' }}>Open projector display</button></Link>
        <p className="small">Use the same session name on both screens.</p>
      </div>
    </main>
  );
}

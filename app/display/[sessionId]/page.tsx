import { Suspense } from 'react';
import DisplayClient from './DisplayClient';

export default function DisplayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="display">
          <div className="spinner-wrap">
            <div className="spinner" aria-hidden />
            <p className="spinner-label">Loading…</p>
          </div>
        </div>
      }
    >
      <DisplayLoader params={params} />
    </Suspense>
  );
}

async function DisplayLoader({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <DisplayClient sessionId={sessionId} />;
}

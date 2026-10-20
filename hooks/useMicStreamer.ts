'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

/**
 * Captures the mic, downsamples to 16 kHz PCM16 in an AudioWorklet, and streams it to the gateway.
 * If the socket drops and reconnects, it re-announces `audio:start` once the session is re-joined.
 */
export function useMicStreamer(socket: Socket | null, joined: boolean) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const graph = useRef<{ stream: MediaStream; ctx: AudioContext; node: AudioWorkletNode; src: MediaStreamAudioSourceNode } | null>(null);

  const teardown = useCallback(() => {
    const g = graph.current;
    if (!g) return;
    g.node.port.onmessage = null;
    g.src.disconnect();
    g.node.disconnect();
    g.stream.getTracks().forEach((t) => t.stop());
    void g.ctx.close();
    graph.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!socket || graph.current) return;
    setError(null);
    try {
      // Singing/PA audio: don't let the browser "clean up" the voice.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      await ctx.audioWorklet.addModule('/pcm-worklet.js');
      const src = ctx.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(ctx, 'pcm-processor');
      node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => socket.emit('audio:chunk', e.data);
      src.connect(node); // not connected to destination: no feedback
      graph.current = { stream, ctx, node, src };
      setActive(true);
    } catch (e) {
      teardown();
      setError(e instanceof Error ? e.message : 'Could not access the microphone');
    }
  }, [socket, teardown]);

  const stop = useCallback(() => {
    teardown();
    setActive(false);
    socket?.emit('audio:stop');
  }, [socket, teardown]);

  // (Re)announce streaming whenever we're active and (re)joined.
  useEffect(() => {
    if (active && joined) socket?.emit('audio:start');
  }, [active, joined, socket]);

  useEffect(() => teardown, [teardown]);

  return { active, error, start, stop };
}

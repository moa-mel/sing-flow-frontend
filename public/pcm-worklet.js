// Downsamples mic audio to 16 kHz mono PCM16 and posts ~100 ms chunks to the main thread.
class PcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000; // input samples per output sample
    this.pos = 0;
    this.acc = 0;
    this.cnt = 0;
    this.out = new Int16Array(1600); // 100 ms @ 16 kHz
    this.n = 0;
  }

  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;

    for (let i = 0; i < ch.length; i++) {
      this.acc += ch[i];
      this.cnt++;
      this.pos += 1;
      if (this.pos >= this.ratio) {
        const s = Math.max(-1, Math.min(1, this.acc / this.cnt)); // box-filter average
        this.out[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        this.pos -= this.ratio;
        this.acc = 0;
        this.cnt = 0;
        if (this.n === this.out.length) {
          this.port.postMessage(this.out.buffer, [this.out.buffer]);
          this.out = new Int16Array(1600);
          this.n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PcmProcessor);

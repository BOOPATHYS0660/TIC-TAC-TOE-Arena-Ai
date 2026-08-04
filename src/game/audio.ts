/**
 * Tiny synthesised sound engine (Web Audio API) — no external audio files.
 * Every sound is generated with oscillators / noise so the game stays offline.
 */

type Sfx =
  | "step"
  | "key"
  | "door"
  | "ghost"
  | "win"
  | "lose"
  | "click"
  | "error";

class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicNodes: { stop: () => void } | null = null;
  muted = false;

  /** Lazily create the AudioContext (browsers require a user gesture). */
  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
  }

  /** Creepy droning background music: two detuned low oscillators + slow bell. */
  startMusic() {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.musicNodes) return;

    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    gain.connect(this.master);

    const drones = [55, 82.4, 110.5].map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? "sawtooth" : "sine";
      osc.frequency.value = freq;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06 + i * 0.03;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2.5;
      lfo.connect(lfoGain).connect(osc.frequency);
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.05 : 0.25;
      osc.connect(g).connect(gain);
      osc.start();
      lfo.start();
      return { osc, lfo };
    });

    // Sparse eerie bell every few seconds.
    const bell = window.setInterval(() => {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "triangle";
      o.frequency.value = 440 + Math.random() * 500;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g).connect(gain);
      o.start(t);
      o.stop(t + 2.3);
    }, 6000);

    this.musicNodes = {
      stop: () => {
        window.clearInterval(bell);
        drones.forEach(({ osc, lfo }) => {
          try {
            osc.stop();
            lfo.stop();
          } catch {
            /* already stopped */
          }
        });
        gain.disconnect();
      },
    };
  }

  stopMusic() {
    this.musicNodes?.stop();
    this.musicNodes = null;
  }

  /** One-shot sound effects. */
  play(sfx: Sfx) {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const t = ctx.currentTime;

    const tone = (
      freq: number,
      dur: number,
      type: OscillatorType = "sine",
      vol = 0.2,
      slideTo?: number,
      delay = 0,
    ) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t + delay);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + delay + dur);
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(vol, t + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
      o.connect(g).connect(this.master!);
      o.start(t + delay);
      o.stop(t + delay + dur + 0.02);
    };

    const noise = (dur: number, vol = 0.15, freq = 1000) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter).connect(g).connect(this.master!);
      src.start(t);
    };

    switch (sfx) {
      case "step":
        noise(0.08, 0.06, 320);
        break;
      case "key":
        tone(880, 0.12, "triangle", 0.18);
        tone(1320, 0.22, "triangle", 0.15, undefined, 0.1);
        break;
      case "door":
        tone(120, 0.5, "sawtooth", 0.12, 60);
        noise(0.4, 0.06, 200);
        break;
      case "ghost":
        tone(300, 0.7, "sine", 0.12, 90);
        break;
      case "win":
        [523, 659, 784, 1047].forEach((f, i) =>
          tone(f, 0.3, "triangle", 0.18, undefined, i * 0.14),
        );
        break;
      case "lose":
        tone(320, 1.2, "sawtooth", 0.2, 60);
        noise(0.6, 0.12, 150);
        break;
      case "click":
        tone(660, 0.06, "square", 0.08);
        break;
      case "error":
        tone(180, 0.25, "square", 0.14, 110);
        break;
    }
  }
}

export const audio = new GameAudio();

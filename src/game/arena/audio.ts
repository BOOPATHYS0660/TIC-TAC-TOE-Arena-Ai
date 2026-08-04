/**
 * Synthesised sound effects + ambient background music (Web Audio API).
 * No external/copyrighted audio assets are used.
 */

export type Sfx = "place" | "ai" | "score" | "bomb" | "shield" | "swap" | "win" | "lose" | "click";

class ArenaAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: { stop: () => void } | null = null;
  sfxOn = true;
  musicOn = true;

  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.3, delay = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(dur: number, gain = 0.4) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(this.master);
    src.start();
  }

  play(sfx: Sfx) {
    if (!this.sfxOn) return;
    switch (sfx) {
      case "place":
        this.tone(660, 0.12, "triangle", 0.25);
        break;
      case "ai":
        this.tone(330, 0.14, "sawtooth", 0.18);
        break;
      case "score":
        [740, 880, 1180].forEach((f, i) => this.tone(f, 0.16, "square", 0.16, i * 0.06));
        break;
      case "bomb":
        this.noise(0.45, 0.5);
        this.tone(90, 0.4, "sawtooth", 0.3);
        break;
      case "shield":
        this.tone(520, 0.3, "sine", 0.22);
        this.tone(780, 0.3, "sine", 0.14, 0.05);
        break;
      case "swap":
        this.tone(440, 0.1, "triangle", 0.2);
        this.tone(620, 0.12, "triangle", 0.2, 0.08);
        break;
      case "win":
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, "triangle", 0.24, i * 0.11));
        break;
      case "lose":
        [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.35, "sawtooth", 0.2, i * 0.13));
        break;
      case "click":
        this.tone(880, 0.06, "square", 0.12);
        break;
    }
  }

  /** Slow arpeggiated pad loop. */
  startMusic() {
    if (!this.musicOn || this.music) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const notes = [220, 277, 330, 415, 330, 277];
    let step = 0;
    const bus = ctx.createGain();
    bus.gain.value = 0.1;
    bus.connect(this.master);
    const id = window.setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = notes[step % notes.length]!;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      osc.connect(g).connect(bus);
      osc.start(t);
      osc.stop(t + 1.7);
      step += 1;
    }, 900);
    this.music = {
      stop: () => {
        window.clearInterval(id);
        bus.disconnect();
      },
    };
  }

  stopMusic() {
    this.music?.stop();
    this.music = null;
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (on) this.startMusic();
    else this.stopMusic();
  }
}

export const audio = new ArenaAudio();

// EMBER TIDE — audio: WebAudio synth. A sunset-synth loop for TIDE FM
// 92.7, engine hum, sirens, gunshots and stings — all generated, no files.

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicOn = false;
    this._musicTimer = null;
    this._engineOsc = null;
  }

  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setMuted(m) { this.muted = m; }

  _tone(freq, dur, type, vol, when = 0) {
    if (!this.ensure() || this.muted) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  startMusic() {
    if (this.musicOn) return;
    this.musicOn = true;
    const notes = [220, 261.6, 329.6, 392, 329.6, 261.6, 196, 246.9];
    let i = 0;
    const step = () => {
      if (!this.musicOn) return;
      this._tone(notes[i % notes.length], 0.5, 'sawtooth', 0.045);
      this._tone(notes[i % notes.length] / 2, 0.5, 'sine', 0.06);
      i += 1;
      this._musicTimer = setTimeout(step, 420);
    };
    step();
  }

  stopMusic() { this.musicOn = false; if (this._musicTimer) clearTimeout(this._musicTimer); }

  playShot() { this._tone(880, 0.12, 'square', 0.12); this._tone(140, 0.1, 'sawtooth', 0.1); }
  playSting() { this._tone(523, 0.25, 'triangle', 0.14); this._tone(659, 0.25, 'triangle', 0.14, 0.18); this._tone(784, 0.5, 'triangle', 0.16, 0.36); }
  playPickup() { this._tone(660, 0.15, 'sine', 0.12); this._tone(990, 0.25, 'sine', 0.12, 0.1); }
  playSiren() { this._tone(720, 0.4, 'sine', 0.03); this._tone(960, 0.4, 'sine', 0.03, 0.4); }
  playCrash() { this._tone(90, 0.3, 'sawtooth', 0.16); }
}

// Web Audio API Synthesizer for game sound effects
class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Squeaky Toy Hammer Smack effect (variety show classic bonk)
  playHammer() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // High pitched squeak followed by a wooden bonk
      const squeakOsc = this.ctx.createOscillator();
      const squeakGain = this.ctx.createGain();
      squeakOsc.type = 'triangle';
      squeakOsc.frequency.setValueAtTime(950, now);
      squeakOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      squeakOsc.frequency.exponentialRampToValueAtTime(700, now + 0.16);

      squeakGain.gain.setValueAtTime(0.4, now);
      squeakGain.gain.linearRampToValueAtTime(0.6, now + 0.05);
      squeakGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      squeakOsc.connect(squeakGain);
      squeakGain.connect(this.ctx.destination);

      squeakOsc.start(now);
      squeakOsc.stop(now + 0.22);

      // Low thump
      const thumpOsc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thumpOsc.type = 'sine';
      thumpOsc.frequency.setValueAtTime(180, now + 0.02);
      thumpOsc.frequency.exponentialRampToValueAtTime(50, now + 0.25);

      thumpGain.gain.setValueAtTime(0.7, now + 0.02);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(this.ctx.destination);

      thumpOsc.start(now + 0.02);
      thumpOsc.stop(now + 0.28);
    } catch {
      // AudioContext policy fallback
    }
  }

  // Dramatic Game Show Buzzer (Wrong / Caught)
  playBuzzer() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(120, now + 0.15);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // AudioContext policy fallback
    }
  }

  // Correct Deduction / Success Jingle
  playSuccess() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.25, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.35);
      });
    } catch {
      // AudioContext policy fallback
    }
  }

  // Celebratory Fanfare (Game Over / Victory)
  playCheer() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chords = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 0.1 },
        { f: 783.99, t: 0.2 },
        { f: 1046.5, t: 0.3 },
        { f: 1318.51, t: 0.45 },
      ];

      chords.forEach(({ f, t }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.3, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.6);
      });
    } catch {
      // AudioContext policy fallback
    }
  }

  // Gentle Click / Turn / Ready ding
  playDing() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // AudioContext policy fallback
    }
  }
}

export const sounds = new SoundEffects();

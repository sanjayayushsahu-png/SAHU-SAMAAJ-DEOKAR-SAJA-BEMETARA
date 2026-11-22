/**
 * Lightweight offline Web Audio API devotional melody & temple bell synthesizer.
 * Plays gentle harmonium-like Indian classical notes (Raag Bhupali / Yaman)
 * so Bhakt Maa Karma Aarti & Bhajans work smoothly even without network MP3s.
 */

const MELODIES = {
  aarti: [
    261.63, 293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66,
    329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63, 261.63,
  ],
  bhajan1: [
    293.66, 329.63, 392.0, 440.0, 440.0, 392.0, 329.63, 293.66,
    261.63, 293.66, 329.63, 392.0, 329.63, 293.66, 261.63, 261.63,
  ],
  bhajan2: [
    261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63, 293.66,
    293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66, 261.63,
  ],
};

class DevotionalAudioEngine {
  constructor() {
    this.ctx = null;
    this.timer = null;
    this.droneOsc = null;
    this.droneGain = null;
    this.isPlaying = false;
    this.stepIndex = 0;
    this.currentKey = 'aarti';
    this.volume = 0.5;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playBell(ctx) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now);
    gain.gain.setValueAtTime(0.08 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.45);
  }

  playNote(ctx, freq, durationSec) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 2, now);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.18, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16 * this.volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.002, now + durationSec);

    osc.connect(gain);
    oscHarmonic.connect(harmonicGain);
    harmonicGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + durationSec + 0.05);
    oscHarmonic.stop(now + durationSec + 0.05);
  }

  start(melodyKey = 'aarti', tempo = 96, onTick) {
    this.stop();
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.currentKey = MELODIES[melodyKey] ? melodyKey : 'aarti';
    this.isPlaying = true;
    this.stepIndex = 0;

    // Gentle Sa-Pa Tanpura drone
    this.droneOsc = ctx.createOscillator();
    this.droneGain = ctx.createGain();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.setValueAtTime(130.81, ctx.currentTime);
    this.droneGain.gain.setValueAtTime(0.045 * this.volume, ctx.currentTime);
    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(ctx.destination);
    this.droneOsc.start();

    const notes = MELODIES[this.currentKey];
    const intervalMs = Math.max(420, Math.round((60 / tempo) * 1000));

    const playStep = () => {
      if (!this.isPlaying) return;
      const freq = notes[this.stepIndex % notes.length];
      this.playNote(ctx, freq, intervalMs / 1000);
      if (this.stepIndex % 8 === 0) {
        this.playBell(ctx);
      }
      if (onTick) onTick(this.stepIndex);
      this.stepIndex += 1;
    };

    playStep();
    this.timer = setInterval(playStep, intervalMs);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setValueAtTime(0.045 * this.volume, this.ctx.currentTime);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.droneOsc) {
      try {
        this.droneOsc.stop();
        this.droneOsc.disconnect();
      } catch {
        // ignore already stopped
      }
      this.droneOsc = null;
    }
    if (this.droneGain) {
      try {
        this.droneGain.disconnect();
      } catch {
        // ignore
      }
      this.droneGain = null;
    }
  }
}

export const devotionalAudio = new DevotionalAudioEngine();

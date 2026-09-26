// ─── AUDIO (WebAudio synthesized — no MP3 deps) ──────────────────────────────
'use strict';

const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let muted = false;
  const throttle = new Map();
  const THROTTLE_MS = 80;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    masterGain.connect(comp);
    comp.connect(ctx.destination);
    masterGain.gain.value = 0.7;
    // resume on user gesture
    document.addEventListener('pointerdown', () => { if(ctx.state==='suspended') ctx.resume(); }, {once:true});
    document.addEventListener('keydown',     () => { if(ctx.state==='suspended') ctx.resume(); }, {once:true});
  }

  function play(key, fn) {
    if (muted || !ctx) return;
    const now = performance.now();
    if (throttle.has(key) && now - throttle.get(key) < THROTTLE_MS) return;
    throttle.set(key, now);
    if (ctx.state === 'suspended') ctx.resume();
    try { fn(ctx, masterGain); } catch(e) {}
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function osc(type, freq, gainVal, attackT, decayT, offset=0) {
    const t = ctx.currentTime + offset;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    o.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gainVal, t + attackT);
    g.gain.exponentialRampToValueAtTime(0.001, t + attackT + decayT);
    o.start(t); o.stop(t + attackT + decayT + 0.01);
  }

  function noise(gainVal, cutoff, Q, attackT, decayT, offset=0) {
    const t = ctx.currentTime + offset;
    const bufLen = ctx.sampleRate * (attackT + decayT + 0.05);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = cutoff; filter.Q.value = Q;
    const g = ctx.createGain();
    src.connect(filter); filter.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(gainVal, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + attackT + decayT);
    src.start(t); src.stop(t + attackT + decayT + 0.05);
  }

  // ── Sound library ──────────────────────────────────────────────────────────────
  const sounds = {
    jump() {
      play('jump', () => {
        osc('sine', 220, 0.3, 0.01, 0.15);
        osc('sine', 440, 0.2, 0.01, 0.12, 0.02);
        noise(0.15, 1200, 2, 0.01, 0.1);
      });
    },
    duck() {
      play('duck', () => {
        osc('sine', 150, 0.3, 0.01, 0.18);
        noise(0.1, 400, 3, 0.01, 0.15);
      });
    },
    land() {
      play('land', () => {
        noise(0.4, 180, 8, 0.005, 0.12);
        osc('sine', 80, 0.35, 0.005, 0.1);
      });
    },
    left() {
      play('left', () => {
        osc('square', 300, 0.15, 0.01, 0.08);
        osc('square', 240, 0.1,  0.01, 0.08, 0.04);
      });
    },
    right() {
      play('right', () => {
        osc('square', 240, 0.15, 0.01, 0.08);
        osc('square', 300, 0.1,  0.01, 0.08, 0.04);
      });
    },
    hit() {
      play('hit', () => {
        noise(0.5, 400, 5, 0.005, 0.25);
        osc('sawtooth', 120, 0.3, 0.005, 0.2);
      });
    },
    smash1() {
      play('smash1', () => {
        noise(0.4, 600, 4, 0.005, 0.2);
        osc('square', 180, 0.25, 0.005, 0.18);
      });
    },
    smash2() {
      play('smash2', () => {
        noise(0.5, 500, 5, 0.005, 0.25);
        osc('square', 140, 0.3, 0.005, 0.22);
      });
    },
    smash3() {
      play('smash3', () => {
        // big shatter
        noise(0.7, 800, 2, 0.01, 0.5);
        noise(0.5, 200, 8, 0.01, 0.45, 0.02);
        osc('sawtooth', 80, 0.4, 0.01, 0.4);
        osc('sine', 1200, 0.2, 0.01, 0.1, 0.05);
      });
    },
    push() {
      play('push', () => {
        noise(0.3, 300, 6, 0.02, 0.3);
        osc('sawtooth', 100, 0.2, 0.02, 0.3);
      });
    },
    rasengan() {
      play('rasengan', () => {
        // spinning charge sound
        const t = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(200, t);
        o.frequency.exponentialRampToValueAtTime(800, t+0.5);
        o.frequency.exponentialRampToValueAtTime(400, t+0.8);
        o.connect(g); g.connect(masterGain);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.4, t+0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t+1.0);
        o.start(t); o.stop(t+1.1);
        noise(0.3, 1000, 3, 0.1, 0.5);
      });
    },
    chidori() {
      play('chidori', () => {
        noise(0.35, 3000, 2, 0.05, 0.4);
        osc('sawtooth', 600, 0.2, 0.05, 0.35);
        osc('sine', 1200, 0.15, 0.05, 0.3, 0.05);
      });
    },
    bossHit() {
      play('bossHit', () => {
        noise(0.6, 250, 7, 0.005, 0.35);
        osc('sawtooth', 100, 0.4, 0.005, 0.3);
        osc('square', 60, 0.3, 0.005, 0.25, 0.02);
      });
    },
    levelUp() {
      play('levelUp', () => {
        // C-E-G-C arpeggio
        [261.6, 329.6, 392.0, 523.3].forEach((freq, i) => {
          osc('sine', freq, 0.3, 0.01, 0.3, i*0.12);
          osc('triangle', freq*2, 0.1, 0.01, 0.2, i*0.12+0.02);
        });
      });
    },
    finalBlow() {
      play('finalBlow', () => {
        noise(0.8, 150, 10, 0.005, 0.8);
        osc('sawtooth', 60, 0.5, 0.005, 0.7);
        osc('sine', 1800, 0.3, 0.01, 0.15, 0.05);
        [261.6, 392, 523.3, 783.9, 1046.5].forEach((freq, i) => {
          osc('sine', freq, 0.25, 0.01, 0.4, i*0.05+0.1);
        });
      });
    },
    chakraCharge() {
      play('chakraCharge', () => {
        const t = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(100, t);
        o.frequency.linearRampToValueAtTime(600, t+1.5);
        o.connect(g); g.connect(masterGain);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.3, t+0.2);
        g.gain.setValueAtTime(0.3, t+1.3);
        g.gain.linearRampToValueAtTime(0, t+1.6);
        o.start(t); o.stop(t+1.7);
      });
    },
  };

  function toggleMute() {
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.7;
    return muted;
  }

  return { init, ...sounds, toggleMute };
})();

window.Audio = Audio;

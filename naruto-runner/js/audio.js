// Audio: voice-cue MP3s (user's own recordings), TTS fallback for extra words,
// procedural Japanese-flavoured music (taiko + koto/shamisen plucks + bass + flute pad), SFX.
(function (DS) {
  const A = {
    ctx: null, master: null, musicGain: null, sfxGain: null, voiceGain: null,
    buffers: {}, muted: false, section: null, bpm: 120,
    step: 0, nextTime: 0, timer: null, intensity: 0,
    musicEnabled: false, // background music OFF (added later in editing)
    tts: false   // spoken fallback for words without an MP3 (slash/pose/...). Off: drop your own MP3s in sounds/
  };

  // Voice cue files (optional extras: drop slash.mp3 / pose.mp3 / nice.mp3 ... into sounds/ to override TTS)
  // core voice files (in sounds/). Optional extra cues (slash, pose, finalblow...) -> add names to DS.CONFIG.extraSounds
  const CORE = ['jump', 'duck', 'left', 'right', 'hit', 'push', 'smash'];
  const TTS_WORDS = { slash: 'Slash!', pose: 'Mirror me!', hold: 'Hold it!', nice: 'Nice!', perfect: 'Perfect!', finalblow: 'Final blow!', go: "Let's go!", round1: 'Round one!', round2: 'Round two!', round3: 'Final round!', x: 'Cross slash!' };

  A.init = async function () {
    if (A.ctx) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    A.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    A.master = ctx.createGain(); A.master.gain.value = 0.9;
    A.master.connect(comp); comp.connect(ctx.destination);
    A.musicGain = ctx.createGain(); A.musicGain.gain.value = 0.42; A.musicGain.connect(A.master);
    A.sfxGain = ctx.createGain(); A.sfxGain.gain.value = 0.7; A.sfxGain.connect(A.master);
    A.voiceGain = ctx.createGain(); A.voiceGain.gain.value = 1.0; A.voiceGain.connect(A.master);
    // noise buffer
    const nb = ctx.createBuffer(1, ctx.sampleRate * 1.0, ctx.sampleRate);
    const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    A.noise = nb;
    A.setVolumes();
    const FILES = CORE.concat((DS.CONFIG && DS.CONFIG.extraSounds) || []);
    await Promise.all(FILES.map(async (f) => {
      try {
        const r = await fetch('sounds/' + f + '.mp3');
        if (!r.ok) return;
        const ab = await r.arrayBuffer();
        A.buffers[f] = await ctx.decodeAudioData(ab);
      } catch (e) { /* missing file -> TTS fallback */ }
    }));
    // NOTE: no background music (user adds music in editing). Enable with A.musicEnabled = true.
    if (A.musicEnabled) A.startScheduler();
  };

  A.vol = { master: 0.9, voice: 1, sfx: 0.7 };
  A.setVolumes = function (m, v, s) {
    if (m != null) A.vol.master = m; if (v != null) A.vol.voice = v; if (s != null) A.vol.sfx = s;
    if (!A.ctx) return;
    A.master.gain.value = A.muted ? 0 : A.vol.master; A.voiceGain.gain.value = A.vol.voice; A.sfxGain.gain.value = A.vol.sfx;
  };
  A.setMuted = (m) => { A.muted = m; A.setVolumes(); };

  // ---------------- voice cues ----------------
  const lastPlay = {};
  A.cue = function (name) {
    if (!A.ctx || A.muted) return;
    const now = performance.now();
    if (lastPlay[name] && now - lastPlay[name] < 250) return;
    lastPlay[name] = now;
    const buf = A.buffers[name];
    if (buf) {
      const s = A.ctx.createBufferSource(); s.buffer = buf; s.connect(A.voiceGain); s.start();
      return;
    }
    const txt = TTS_WORDS[name];
    if (A.tts && txt && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(txt);
        u.rate = 1.15; u.pitch = 1.05; u.volume = 1;
        const v = window.speechSynthesis.getVoices().find(v => /en(-|_)US/i.test(v.lang) && /male|david|guy|mark/i.test(v.name))
          || window.speechSynthesis.getVoices().find(v => /^en/i.test(v.lang));
        if (v) u.voice = v;
        window.speechSynthesis.speak(u);
      } catch (e) { }
    }
  };

  // ---------------- synth helpers ----------------
  function env(g, t, a, peak, dec) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function osc(type, f, t, dur, out, peak = 0.3, a = 0.005) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    env(g, t, a, peak, dur); o.connect(g); g.connect(out);
    o.start(t); o.stop(t + a + dur + 0.05);
    return o;
  }
  function noise(t, dur, out, peak, type, f0, f1, q = 1) {
    const c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noise; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.004, peak, dur); s.connect(f); f.connect(g); g.connect(out);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // instruments
  function taiko(t, big = 1) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(110 * big, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.25);
    env(g, t, 0.003, 0.9 * big, 0.45); o.connect(g); g.connect(A.musicGain); o.start(t); o.stop(t + 0.6);
    noise(t, 0.08, A.musicGain, 0.25 * big, 'lowpass', 900, 200);
  }
  function rim(t) { noise(t, 0.05, A.musicGain, 0.18, 'bandpass', 2400, null, 3); osc('square', 900, t, 0.03, A.musicGain, 0.04); }
  function shaker(t, v = 0.06) { noise(t, 0.04, A.musicGain, v, 'highpass', 7000); }
  function pluck(t, note, v = 0.22, dur = 0.35) { // koto/shamisen-like
    const c = A.ctx, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o2.type = 'triangle';
    o.frequency.setValueAtTime(midi(note), t); o2.frequency.setValueAtTime(midi(note) * 2.005, t);
    f.type = 'lowpass'; f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
    env(g, t, 0.002, v, dur); o.connect(f); o2.connect(f); f.connect(g); g.connect(A.musicGain);
    o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  }
  function bass(t, note, dur, v = 0.35) {
    const c = A.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(midi(note), t);
    f.type = 'lowpass'; f.frequency.setValueAtTime(420, t);
    env(g, t, 0.01, v, dur); o.connect(f); f.connect(g); g.connect(A.musicGain); o.start(t); o.stop(t + dur + 0.1);
  }
  function flute(t, note, dur, v = 0.12) { // shakuhachi-ish with vibrato + breath
    const c = A.ctx, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(midi(note), t);
    lfo.frequency.value = 5.2; lg.gain.value = midi(note) * 0.012; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.12);
    g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(A.musicGain); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
    noise(t, 0.15, A.musicGain, v * 0.4, 'bandpass', 1800, null, 2);
  }

  // D minor pentatonic (D F G A C) + D major pent for victory
  const MIN = [62, 65, 67, 69, 72, 74, 77, 79, 81];
  const MAJ = [62, 64, 66, 69, 71, 74, 76, 78, 81];
  const MEL = {
    forest: [4, -1, 3, -1, 2, -1, 0, -1, 1, -1, 2, 3, 2, -1, -1, -1, 4, -1, 5, -1, 4, 3, 2, -1, 0, -1, 2, -1, 1, -1, -1, -1],
    castle: [0, -1, -1, 2, -1, -1, 1, -1, 0, -1, -1, 4, -1, 3, -1, -1, 2, -1, -1, 1, -1, -1, 0, -1, 3, -1, 2, -1, 1, -1, 0, -1],
    train: [4, 4, 3, 4, 5, -1, 4, 3, 2, 2, 1, 2, 3, -1, 2, 1, 4, 4, 3, 4, 6, -1, 5, 4, 3, 2, 3, 4, 2, -1, -1, -1],
    boss: [5, -1, 4, 5, 7, -1, 6, 5, 4, -1, 3, 4, 5, -1, -1, -1, 5, -1, 4, 5, 8, -1, 7, 6, 5, 4, 3, 2, 4, -1, -1, -1],
    victory: [4, -1, 5, -1, 6, -1, 8, -1, 7, -1, 6, -1, 5, -1, -1, -1, 4, -1, 6, -1, 5, -1, 3, -1, 4, -1, -1, -1, -1, -1, -1, -1]
  };
  const BASS = [50, 50, 48, 48, 46, 46, 45, 45];
  const SECTIONS = {
    forest: { bpm: 112, drums: 1, mel: 'forest', scale: MIN, pad: true },
    castle: { bpm: 104, drums: 1.2, mel: 'castle', scale: MIN, pad: true },
    train: { bpm: 132, drums: 2, mel: 'train', scale: MIN, pad: false },
    boss: { bpm: 140, drums: 3, mel: 'boss', scale: MIN, pad: false },
    victory: { bpm: 116, drums: 1.5, mel: 'victory', scale: MAJ, pad: true },
    silent: null
  };

  A.setSection = function (name) {
    A.section = name;
    const s = SECTIONS[name];
    if (s) A.bpm = s.bpm;
  };

  function scheduleStep(step, t) {
    const s = SECTIONS[A.section];
    if (!s) return;
    const i16 = step % 32, bar = Math.floor(step / 16);
    const sp = 60 / A.bpm / 4; // 16th
    const mel = MEL[s.mel];
    const n = mel[i16];
    if (n >= 0) pluck(t, s.scale[n], s.drums >= 2 ? 0.2 : 0.17, sp * 3);
    if (s.pad && i16 % 16 === 0) flute(t, s.scale[(bar % 2) ? 3 : 4] - 12 + 12, sp * 14, 0.07);
    // bass: every 8th for intense, every quarter otherwise
    const bn = BASS[bar % 8];
    if (s.drums >= 2 ? (i16 % 2 === 0) : (i16 % 4 === 0)) bass(t, bn - 12 + 12, sp * (s.drums >= 2 ? 1.6 : 3.2), 0.28);
    // drums
    if (s.drums >= 1) {
      if (i16 % 8 === 0) taiko(t, 1);
      if (s.drums >= 1.2 && i16 % 8 === 6) taiko(t, 0.6);
      if (i16 % 8 === 4) rim(t);
      if (s.drums >= 1.5 && i16 % 2 === 1) shaker(t, 0.04);
    }
    if (s.drums >= 2) {
      if (i16 % 4 === 2) taiko(t, 0.55);
      shaker(t, i16 % 2 ? 0.035 : 0.06);
    }
    if (s.drums >= 3) {
      if (i16 % 16 === 14 || i16 % 16 === 15) taiko(t, 0.8);
      if (i16 % 4 === 0) rim(t);
    }
  }

  A.startScheduler = function () {
    A.nextTime = A.ctx.currentTime + 0.1;
    A.timer = setInterval(() => {
      if (!A.ctx) return;
      while (A.nextTime < A.ctx.currentTime + 0.12) {
        scheduleStep(A.step, A.nextTime);
        A.step++;
        A.nextTime += 60 / A.bpm / 4;
      }
    }, 25);
  };

  // ---------------- SFX ----------------
  A.sfx = function (name) {
    if (!A.ctx || A.muted) return;
    const t = A.ctx.currentTime + 0.005, out = A.sfxGain;
    switch (name) {
      case 'whoosh': noise(t, 0.3, out, 0.35, 'bandpass', 600, 2400, 1.5); break;
      case 'jump': noise(t, 0.25, out, 0.25, 'bandpass', 500, 1800, 1.2); osc('sine', 300, t, 0.2, out, 0.08); break;
      case 'land': noise(t, 0.12, out, 0.3, 'lowpass', 500, 120); break;
      case 'slash':
        noise(t, 0.22, out, 0.5, 'highpass', 1500, 6000);
        osc('triangle', 1800, t + 0.05, 0.5, out, 0.05); osc('sine', 2700, t + 0.05, 0.6, out, 0.035);
        noise(t + 0.02, 0.35, out, 0.18, 'bandpass', 800, 300, 2); // water splash
        break;
      case 'hit':
        osc('sine', 90, t, 0.3, out, 0.6); noise(t, 0.2, out, 0.45, 'lowpass', 1800, 200); break;
      case 'splat': noise(t, 0.3, out, 0.4, 'lowpass', 1200, 200); osc('sine', 140, t, 0.2, out, 0.3); break;
      case 'paper': noise(t, 0.4, out, 0.35, 'highpass', 3000, 1200); noise(t + 0.08, 0.25, out, 0.2, 'bandpass', 2500, 900, 2); break;
      case 'roar': {
        const c = A.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(140, t + 0.4); o.frequency.exponentialRampToValueAtTime(60, t + 1.2);
        f.type = 'lowpass'; f.frequency.value = 700; env(g, t, 0.05, 0.5, 1.2);
        o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + 1.4);
        noise(t, 1.2, out, 0.25, 'bandpass', 400, 200, 1); break;
      }
      case 'shockwave': noise(t, 0.6, out, 0.45, 'lowpass', 2500, 150); osc('sine', 70, t, 0.5, out, 0.5); break;
      case 'gong': [1, 2.76, 5.4, 8.9].forEach((m, i) => osc('sine', 110 * m, t, 2.2 - i * 0.4, out, 0.2 / (i + 1))); break;
      case 'final':
        [0, 0.08, 0.16].forEach(d => noise(t + d, 0.5, out, 0.5, 'highpass', 1200, 5000));
        osc('sine', 60, t, 1.2, out, 0.7); [1, 2.76, 5.4].forEach((m, i) => osc('sine', 220 * m, t + 0.1, 2.5, out, 0.15 / (i + 1)));
        break;
      case 'burn': noise(t, 2.5, out, 0.3, 'bandpass', 900, 3000, 0.8); break;
      case 'cheer': for (let i = 0; i < 8; i++) noise(t + i * 0.06, 0.8, out, 0.08, 'bandpass', 900 + i * 180, 1400 + i * 200, 3); break;
      case 'coin': osc('square', 988, t, 0.08, out, 0.08); osc('square', 1319, t + 0.07, 0.25, out, 0.08); break;
    }
  };

  DS.Audio = A;
})(window.DS);

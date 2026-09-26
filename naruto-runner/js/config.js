// Level script for NARUTO: HIDDEN LEAF RUN (fan-made) — a PLAYABLE game (keyboard/touch).
// Intro/level cards/outro are added later in video editing; the game only fades to black between levels.
// Obstacles are placed by DISTANCE (t * speed), so the layout is identical every run.
(function (DS) {
  DS.CONFIG = {
    bannerText: 'SUBSCRIBE',
    fadeBetweenLevels: 1.4,
    showCues: true,
    cueLead: 1.0,
    extraSounds: []
  };

  // Event kinds:
  //  jump / duck / left / right (dodge) / cart (push) / wall (smash) / pose (hand-sign)
  const L = [];

  // ── LEVEL 1 — NINJA ACADEMY (Konoha, day) ─────────────────────────────
  L.push({
    id: 'academy', name: 'NINJA ACADEMY', world: 'forest', preset: 'forest', hero: 'naruto', speed: 13, dur: 48,
    katana: false, music: 'forest',
    seq: [
      [3.5, 'jump'], [6.3, 'duck'], [9.2, 'left'], [12.0, 'jump'], [15.0, 'cart'],
      [19.0, 'right'], [21.8, 'duck'], [24.4, 'jump'], [27.5, 'wall'],
      [31.0, 'left'], [33.8, 'duck'], [36.4, 'jump'], [39.2, 'right'], [42.0, 'duck'], [44.6, 'jump']
    ]
  });

  // ── LEVEL 2 — FOREST OF DEATH (Chunin, dusk; snakes + logs) ────────────
  L.push({
    id: 'forestofdeath', name: 'FOREST OF DEATH', world: 'forest', preset: 'forestDusk', hero: 'naruto', speed: 15, dur: 50,
    katana: false, music: 'forest',
    seq: [
      [3.4, 'left'], [6.0, 'duck'], [8.6, 'right'], [11.0, 'jump'], [13.4, 'left'],
      [16.0, 'duck'], [18.4, 'right'], [20.8, 'jump'], [23.2, 'left'], [25.8, 'duck'],
      [28.2, 'right'], [30.6, 'jump'], [33.0, 'left'], [35.4, 'duck'], [37.8, 'right'],
      [40.2, 'jump'], [42.6, 'duck'], [45.0, 'left'], [47.4, 'jump']
    ]
  });

  // ── LEVEL 3 — CHAKRA CONTROL (tree/water walking, morning; fast) ───────
  L.push({
    id: 'chakra', name: 'CHAKRA CONTROL', world: 'forest', preset: 'chakra', hero: 'naruto', speed: 19, dur: 46,
    katana: false, music: 'train',
    seq: [
      [3.2, 'jump'], [5.4, 'right'], [7.6, 'duck'], [9.8, 'left'], [12.0, 'jump'],
      [14.2, 'right'], [16.4, 'duck'], [18.6, 'left'], [20.8, 'jump'], [23.0, 'duck'],
      [25.2, 'right'], [27.4, 'jump'], [29.6, 'left'], [31.8, 'duck'], [34.0, 'right'],
      [36.2, 'jump'], [38.4, 'left'], [40.6, 'duck'], [42.8, 'jump'], [45.0, 'right']
    ]
  });

  // ── LEVEL 4 — JUTSU TRAINING (hand-sign pose walls) ────────────────────
  L.push({
    id: 'jutsu', name: 'JUTSU TRAINING', world: 'castle', preset: 'castle', hero: 'naruto', speed: 14, dur: 52,
    katana: false, music: 'castle',
    seq: [
      [3.5, 'jump'], [6.2, 'duck'], [9.5, 'pose', 'star'], [12.5, 'left'], [15.2, 'jump'],
      [18.5, 'pose', 'tree'], [21.5, 'duck'], [24.2, 'right'], [27.5, 'pose', 'warrior'],
      [30.5, 'jump'], [33.2, 'left'], [36.5, 'pose', 'kick'], [40.0, 'duck'], [43.0, 'right'], [46.5, 'pose', 'tpose']
    ]
  });

  // ── LEVEL 5 — GAARA'S DEFENSE (sand arena; smash sand walls) ───────────
  L.push({
    id: 'gaara', name: "GAARA'S DEFENSE", world: 'castle', preset: 'sand', hero: 'naruto', speed: 16, dur: 50,
    katana: false, music: 'castle',
    seq: [
      [3.5, 'jump'], [6.2, 'duck'], [9.0, 'left'], [12.0, 'wall'],
      [16.0, 'right'], [18.6, 'duck'], [21.2, 'jump'], [24.0, 'wall'],
      [28.0, 'left'], [30.6, 'duck'], [33.2, 'right'], [35.8, 'jump'], [38.4, 'wall'],
      [42.5, 'duck'], [45.0, 'jump'], [47.6, 'left']
    ]
  });

  // ── LEVEL 6 — AKATSUKI AMBUSH (night fog; paper bombs, crows) ──────────
  L.push({
    id: 'akatsuki', name: 'AKATSUKI AMBUSH', world: 'forest', preset: 'night', hero: 'sasuke', speed: 18, dur: 50,
    katana: false, music: 'train',
    seq: [
      [3.2, 'right'], [5.4, 'jump'], [7.6, 'left'], [9.6, 'duck'], [11.8, 'right'],
      [13.8, 'jump'], [16.0, 'left'], [18.0, 'duck'], [20.2, 'right'], [22.2, 'jump'],
      [24.4, 'left'], [26.4, 'duck'], [28.6, 'right'], [30.6, 'jump'], [32.8, 'left'],
      [35.0, 'duck'], [37.2, 'right'], [39.4, 'jump'], [41.6, 'left'], [43.8, 'duck'], [46.0, 'jump']
    ]
  });

  // ── LEVEL 7 — ESCORT MISSION (bridge; push the scroll cart) ────────────
  L.push({
    id: 'escort', name: 'ESCORT MISSION', world: 'train', preset: 'train', hero: 'naruto', speed: 17, dur: 50,
    katana: false, music: 'train',
    seq: [
      [3.5, 'jump'], [6.2, 'duck'], [9.0, 'left'], [12.0, 'cart'],
      [16.5, 'right'], [19.2, 'duck'], [21.8, 'jump'], [24.4, 'left'], [27.0, 'cart'],
      [31.5, 'right'], [34.2, 'duck'], [36.8, 'jump'], [39.4, 'left'], [42.0, 'duck'], [44.6, 'jump'], [47.2, 'right']
    ]
  });

  // ── LEVEL 8 — PAIN'S ASSAULT (destroyed Konoha, red sky) ───────────────
  L.push({
    id: 'pain', name: "PAIN'S ASSAULT", world: 'train', preset: 'redsky', hero: 'naruto', speed: 20, dur: 50,
    katana: false, music: 'boss',
    seq: [
      [3.0, 'jump'], [5.0, 'jump'], [7.2, 'duck'], [9.2, 'left'], [11.2, 'right'],
      [13.2, 'jump'], [15.2, 'duck'], [17.2, 'jump'], [19.4, 'left'], [21.4, 'right'],
      [23.4, 'duck'], [25.4, 'jump'], [27.6, 'left'], [29.6, 'jump'], [31.6, 'duck'],
      [33.6, 'right'], [35.8, 'jump'], [37.8, 'left'], [39.8, 'duck'], [41.8, 'jump'],
      [43.8, 'right'], [45.8, 'jump'], [47.8, 'duck']
    ]
  });

  // ── LEVEL 9 — MADARA'S METEORS (war battlefield; shadow-dodge) ─────────
  L.push({
    id: 'madara', name: "MADARA'S METEORS", world: 'forest', preset: 'storm', hero: 'naruto', speed: 21, dur: 48,
    katana: false, music: 'boss',
    seq: [
      [3.0, 'left'], [5.0, 'right'], [7.0, 'left'], [9.0, 'right'], [11.0, 'jump'],
      [13.0, 'left'], [15.0, 'right'], [17.0, 'duck'], [19.0, 'left'], [21.0, 'right'],
      [23.0, 'jump'], [25.0, 'left'], [27.0, 'right'], [29.0, 'left'], [31.0, 'duck'],
      [33.0, 'right'], [35.0, 'left'], [37.0, 'jump'], [39.0, 'right'], [41.0, 'left'],
      [43.0, 'duck'], [45.0, 'right'], [47.0, 'left']
    ]
  });

  // ── LEVEL 10 — SASUKE BOSS (Valley of the End; Rasengan vs Chidori) ────
  const notes = [];
  const r1 = 4.0, r2 = 23.0, r3 = 42.0;
  ['L', 'R', 'L', 'R', 'D', 'L', 'R', 'L', 'R', 'D', 'X'].forEach((n, i) => notes.push([r1 + 2 + i * 1.45, n]));
  ['R', 'L', 'R', 'D', 'L', 'X', 'R', 'L', 'D', 'R', 'L', 'X'].forEach((n, i) => notes.push([r2 + 2 + i * 1.25, n]));
  ['L', 'R', 'L', 'R', 'D', 'X', 'L', 'R', 'D', 'L', 'R', 'X'].forEach((n, i) => notes.push([r3 + 2 + i * 1.1, n]));
  const lastNote = r3 + 2 + 11 * 1.1;
  L.push({
    id: 'boss', name: 'VALLEY OF THE END', world: 'arena', preset: 'arena', hero: 'sasuke', speed: 0, dur: lastNote + 16,
    katana: true, music: 'boss', boss: true,
    rounds: [[r1, 'ROUND 1'], [r2, 'ROUND 2'], [r3, 'FINAL ROUND']],
    notes, travel: 1.5,
    finalBlowAt: lastNote + 1.6,
    celebrateDelay: 5.0
  });

  DS.LEVELS = L;
})(window.DS);

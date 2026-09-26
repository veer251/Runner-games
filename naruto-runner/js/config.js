// Level script for DEMON SLAYER: INFINITY CASTLE RUN (fan-made) — a PLAYABLE game (keyboard/touch).
// Intro/level cards/outro are added later in video editing; the game only fades to black between levels.
// Obstacles are placed by DISTANCE (t * speed), so the layout is identical every run.
(function (DS) {
  DS.CONFIG = {
    bannerText: 'SUBSCRIBE',   // text on in-world banners (castle)
    fadeBetweenLevels: 1.4,    // seconds of black between levels (cut point for editing)
    showCues: true,            // small move-cue icon above obstacles' approach (toggle with H)
    cueLead: 1.0,              // seconds before arrival the cue icon appears
    extraSounds: []            // optional voice files in sounds/, e.g. ['slash','pose','finalblow'] (slash.mp3, pose.mp3 ...)
  };

  // Event kinds (t = seconds of running from level start, converted to distance = t * speed):
  //  jump        full-width low obstacle             -> W / Space / Up
  //  duck        full-width overhead obstacle        -> S / Down
  //  left/right  blocker in the player's lane        -> A,D / arrows (the kind names the SAFE direction)
  //  cart        push-cart set piece (stop, hold Shift to push, auto lane-change at the end)
  //  wall        smash wall set piece (stop, Shift x3: crack, crack, shatter)
  //  pose        pose wall: stop, 3-2-1 hold the pose, Shift to burst through   (value = pose name)
  //  slash       tentacle in the player's lane: press Shift when close           (value = swing dir)
  const L = [];

  // LEVEL 1 — WISTERIA FOREST (easy: run, jump, duck, dodge + push cart + smash wall)
  L.push({
    id: 'forest', name: 'KONOHA VILLAGE', world: 'forest', preset: 'forest', speed: 13, dur: 48,
    katana: false, music: 'forest',
    seq: [
      [3.5, 'jump'], [6.3, 'duck'], [9.2, 'left'], [12.0, 'jump'], [15.0, 'cart'],
      [19.0, 'right'], [21.8, 'duck'], [24.4, 'jump'], [27.5, 'wall'],
      [31.0, 'left'], [33.8, 'duck'], [36.4, 'jump'], [39.2, 'right'], [42.0, 'duck'], [44.6, 'jump']
    ]
  });

  // LEVEL 2 — INFINITY CASTLE (pose walls = "mirror me")
  L.push({
    id: 'castle', name: 'CHUNIN EXAMS', world: 'castle', preset: 'castle', speed: 14, dur: 50,
    katana: false, music: 'castle',
    seq: [
      [3.5, 'jump'], [6.2, 'duck'], [9.5, 'pose', 'star'], [12.5, 'left'], [15.2, 'jump'],
      [18.5, 'pose', 'tree'], [21.5, 'duck'], [24.2, 'right'], [27.5, 'pose', 'warrior'],
      [30.5, 'jump'], [33.2, 'left'], [36.5, 'wall'], [40.0, 'pose', 'kick'], [43.0, 'duck'], [46.5, 'pose', 'tpose']
    ]
  });

  // LEVEL 3 — NIGHT TRAIN ROOFTOP (NEW: katana SLASH)
  L.push({
    id: 'train', name: 'ROOFTOP CHASE', world: 'train', preset: 'train', speed: 16, dur: 50,
    katana: false, music: 'train',
    seq: [
      [3.5, 'right'], [6.0, 'jump'], [8.6, 'left'], [11.2, 'duck'],
      [13.8, 'left'], [16.4, 'right'], [18.8, 'left'], [21.4, 'jump'],
      [24.0, 'duck'], [26.6, 'right'], [29.2, 'jump'], [32.0, 'wall'],
      [35.5, 'jump'], [38.0, 'duck'], [40.6, 'right'], [43.0, 'left'], [45.6, 'jump'], [48.0, 'left']
    ]
  });

  // LEVEL 4 — UPPER MOON BOSS (rhythm: A/D slash orbs left/right, S duck shockwave, Shift = cross slash on X)
  const notes = [];
  const r1 = 4.0, r2 = 23.0, r3 = 42.0;
  ['L', 'R', 'L', 'R', 'D', 'L', 'R', 'L', 'R', 'D', 'X'].forEach((n, i) => notes.push([r1 + 2 + i * 1.45, n]));
  ['R', 'L', 'R', 'D', 'L', 'X', 'R', 'L', 'D', 'R', 'L', 'X'].forEach((n, i) => notes.push([r2 + 2 + i * 1.25, n]));
  ['L', 'R', 'L', 'R', 'D', 'X', 'L', 'R', 'D', 'L', 'R', 'X'].forEach((n, i) => notes.push([r3 + 2 + i * 1.1, n]));
  const lastNote = r3 + 2 + 11 * 1.1;
  L.push({
    id: 'boss', name: 'VALLEY OF THE END', world: 'arena', preset: 'arena', speed: 0, dur: lastNote + 16,
    katana: true, music: 'boss', boss: true,
    rounds: [[r1, 'ROUND 1'], [r2, 'ROUND 2'], [r3, 'FINAL ROUND']],
    notes, travel: 1.5,                 // seconds a note flies from boss to player
    finalBlowAt: lastNote + 1.6,        // "FINAL BLOW" prompt: press Shift (auto after 3 s)
    celebrateDelay: 5.0                 // seconds after the final blow until heroes cheer
  });

  DS.LEVELS = L;
})(window.DS);

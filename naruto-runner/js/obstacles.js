// Obstacles, set pieces (push cart, smash wall, pose wall, slash tentacles), collisions and stop mechanics.
(function (DS) {
  const LANES = DS.LANES;

  // ---------------------------------------------------------------- shared assets
  function tex(key, w, h, draw, opts) { return DS.cache('obs_' + key, () => DS.canvasTex(w, h, draw, opts)); }

  const T = {
    bark: () => tex('bark', 256, 256, (g, w, h) => {
      g.fillStyle = '#3b2a22'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        g.strokeStyle = `rgba(${20 + Math.random() * 30},${14 + Math.random() * 20},${10 + Math.random() * 14},0.8)`;
        g.lineWidth = 2 + Math.random() * 5; g.beginPath();
        const x = Math.random() * w; g.moveTo(x, 0);
        for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * 0.05 + i) * 6, y);
        g.stroke();
      }
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(120,140,90,0.25)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 8 + Math.random() * 16, 4 + Math.random() * 8, 0, 0, 7); g.fill(); }
    }, { repeat: [4, 1] }),
    wood: () => tex('wood', 256, 256, (g, w, h) => {
      g.fillStyle = '#6b4226'; g.fillRect(0, 0, w, h);
      const tones = ['#6b4226', '#7a4c2c', '#5e3a22', '#80522f'];
      for (let i = 0; i < 4; i++) { g.fillStyle = tones[i]; g.fillRect(i * 64, 0, 62, h); }
      for (let i = 0; i < 90; i++) { g.strokeStyle = 'rgba(40,20,8,0.35)'; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const x = Math.random() * w; g.moveTo(x, 0); g.bezierCurveTo(x + 6, h * 0.3, x - 6, h * 0.6, x + 3, h); g.stroke(); }
      g.fillStyle = 'rgba(20,10,4,0.7)'; for (let i = 1; i < 4; i++) g.fillRect(i * 64 - 2, 0, 3, h);
    }),
    rope: () => tex('rope', 128, 64, (g, w, h) => {
      g.fillStyle = '#d9c38a'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#a98b4f'; g.lineWidth = 7;
      for (let x = -h; x < w + h; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); }
    }, { repeat: [12, 1] }),
    tatami: () => tex('tatami', 256, 128, (g, w, h) => {
      g.fillStyle = '#b7b86a'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 3) { g.fillStyle = x % 6 ? 'rgba(90,95,40,0.35)' : 'rgba(230,230,160,0.25)'; g.fillRect(x, 0, 1.5, h); }
      g.fillStyle = '#1f3b2a'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
      g.fillStyle = '#c9a64a'; for (let x = 8; x < w; x += 24) { g.fillRect(x, 4, 10, 6); g.fillRect(x, h - 10, 10, 6); }
    }),
    shoji: () => tex('shoji', 256, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff1c9'); gr.addColorStop(1, '#f6c679');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#3a1f10'; const b = 7;
      for (let x = 0; x <= w; x += w / 4) g.fillRect(x - b / 2, 0, b, h);
      for (let y = 0; y <= h; y += h / 5) g.fillRect(0, y - b / 2, w, b);
      g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16); g.fillRect(0, 0, 16, h); g.fillRect(w - 16, 0, 16, h);
    }, { wrap: false }),
    flesh: () => tex('flesh', 256, 256, (g, w, h) => {
      g.fillStyle = '#9c2f45'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        g.strokeStyle = `rgba(${200 + Math.random() * 55},${60 + Math.random() * 40},${90 + Math.random() * 40},0.8)`; g.lineWidth = 2 + Math.random() * 5;
        g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y);
        for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; g.lineTo(x, y); } g.stroke();
      }
      for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(60,5,20,0.4)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 9, 0, 7); g.fill(); }
    }),
    steel: () => tex('steel', 128, 128, (g, w, h) => {
      g.fillStyle = '#3a3f4a'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${Math.random() * 60},${Math.random() * 60},${Math.random() * 70},0.25)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = '#8a8f99'; for (let x = 8; x < w; x += 20) { g.beginPath(); g.arc(x, 8, 3, 0, 7); g.arc(x, h - 8, 3, 0, 7); g.fill(); }
    }),
    ofuda: () => tex('ofuda', 64, 192, (g, w, h) => {
      g.fillStyle = '#f4ecd6'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#b3121b'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#1b1210'; g.font = 'bold 30px serif'; g.textAlign = 'center';
      ['滅', '鬼', '封'].forEach((c, i) => g.fillText(c, w / 2, 52 + i * 52));
    }, { wrap: false }),
    crack: (stage) => tex('crack' + stage, 512, 512, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const r = DS.rng(stage * 77 + 3);
      const paths = [];
      const n = stage === 1 ? 5 : 11;
      for (let i = 0; i < n; i++) {
        const pts = [[w / 2 + (r() - 0.5) * 40, h / 2 + (r() - 0.5) * 40]];
        let a = r() * Math.PI * 2; let x = pts[0][0], y = pts[0][1];
        const len = stage === 1 ? 5 : 8;
        for (let k = 0; k < len; k++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * 30; y += Math.sin(a) * 30; pts.push([x, y]); }
        paths.push(pts);
      }
      const stroke = (col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
        paths.forEach(p => { g.beginPath(); g.moveTo(p[0][0], p[0][1]); p.forEach(q => g.lineTo(q[0], q[1])); g.stroke(); }); };
      stroke('rgba(255,140,40,0.55)', 16); stroke('#ffd27a', 6); stroke('rgba(255,255,255,0.95)', 2);
    }, { wrap: false })
  };

  const M = {}; // materials (lazy)
  function mat(key, make) { return DS.cache('obsmat_' + key, make); }

  // ---------------------------------------------------------------- builders
  // Every builder returns a Group positioned at local z=0 (placed by manager), with userData:
  //  kind, need ('jump'|'duck'|'lane'|'slash'|'stop'), lanes[] (for lane blockers), cue, update(dt,t,info)
  const B = {};

  // ---- FOREST ----
  B.log = function () {
    const g = new THREE.Group();
    const bark = mat('bark', () => DS.std(0xffffff, { map: T.bark(), roughness: 0.95 }));
    const log = DS.mesh(new THREE.CylinderGeometry(0.42, 0.46, 9.2, 10), bark, 0, 0.42, 0, g);
    log.rotation.z = Math.PI / 2; log.rotation.x = 0.08;
    const endMat = mat('logend', () => DS.std(0xb58a5a));
    [-4.6, 4.6].forEach(x => { const e = DS.mesh(new THREE.CircleGeometry(0.44, 10), endMat, x, 0.42, 0, g); e.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2; });
    const moss = mat('moss', () => DS.std(0x3f7a3a, { roughness: 1 }));
    const mg = new THREE.DodecahedronGeometry(0.3, 0);
    for (let i = 0; i < 9; i++) { const m = DS.mesh(mg, moss, -4 + i + Math.random() * 0.4, 0.78, (Math.random() - 0.5) * 0.3, g); m.scale.set(1.3, 0.45, 1); }
    const shroom = mat('shroom', () => DS.glow(0x7ff0ff, 1.6));
    for (let i = 0; i < 6; i++) {
      const x = -3.8 + i * 1.5 + Math.random() * 0.4;
      const cap = DS.mesh(new THREE.SphereGeometry(0.1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), shroom, x, 0.62, 0.36, g, false);
      const h = DS.halo(0x7ff0ff, 0.6, 0.6); h.position.set(x, 0.66, 0.4); g.add(h);
      void cap;
    }
    g.add(DS.shadowBlob(10, 1.6, 0.55));
    g.userData = { kind: 'log', need: 'jump', cue: 'jump' };
    return g;
  };

  B.rope = function () { // shimenawa rope with shide papers (duck)
    const g = new THREE.Group();
    const wood = mat('darkwood', () => DS.std(0x4a2e1d, { map: T.wood() }));
    [-4.4, 4.4].forEach(x => { DS.mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.2, 8), wood, x, 1.6, 0, g); });
    const pts = []; for (let i = 0; i <= 20; i++) { const x = -4.4 + i * 0.44; const n = x / 4.4; pts.push(new THREE.Vector3(x, 2.05 - 0.35 * (1 - n * n), 0)); }
    const rope = mat('rope', () => DS.std(0xffffff, { map: T.rope(), roughness: 0.9 }));
    DS.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.2, 8, false), rope, 0, 0, 0, g);
    // shide zigzag papers
    const shideTex = DS.cache('shide', () => DS.canvasTex(64, 128, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = '#fbf7ea';
      c.beginPath(); c.moveTo(18, 0); c.lineTo(46, 0); c.lineTo(46, 34); c.lineTo(20, 34); c.lineTo(20, 64); c.lineTo(46, 64); c.lineTo(46, 98); c.lineTo(20, 98); c.lineTo(20, 128); c.lineTo(0, 128); c.lineTo(0, 86); c.lineTo(26, 86); c.lineTo(26, 52); c.lineTo(0, 52); c.lineTo(0, 22); c.lineTo(18, 22); c.closePath(); c.fill();
    }, { wrap: false }));
    const sm = mat('shide', () => new THREE.MeshStandardMaterial({ map: shideTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8, emissive: DS.C(0x554433), emissiveIntensity: 0.3 }));
    const sg = new THREE.PlaneGeometry(0.32, 0.64);
    const shides = [];
    for (let i = 0; i < 7; i++) { const x = -3.3 + i * 1.1; const n = x / 4.4; const s = DS.mesh(sg, sm, x, 2.05 - 0.35 * (1 - n * n) - 0.5, 0.05, g, false); shides.push(s); }
    // hanging wisteria tassels at posts
    g.add(DS.shadowBlob(9, 0.8, 0.25));
    g.userData = { kind: 'rope', need: 'duck', cue: 'duck',
      update: (dt, t) => { shides.forEach((s, i) => { s.rotation.x = Math.sin(t * 3 + i) * 0.25; }); } };
    return g;
  };

  B.demons = function (lanes) {
    const g = new THREE.Group(); const list = [];
    lanes.forEach((li, i) => { const d = DS.Chars.demon((li + i) % 3); d.position.x = LANES[li]; d.userData.face && d.userData.face(1); g.add(d); list.push(d); const sb = DS.shadowBlob(1.8, 1.4, 0.5); sb.position.x = LANES[li]; g.add(sb); });
    g.userData = { kind: 'demons', need: 'lane', lanes, cue: null, demons: list,
      update: (dt, t) => list.forEach(d => d.userData.update && d.userData.update(dt, t)),
      onHit: (dir) => list.forEach(d => d.userData.knock && d.userData.knock(dir)) };
    return g;
  };

  // ---- CASTLE ----
  B.tatami = function () {
    const g = new THREE.Group();
    const tm = mat('tatami', () => DS.std(0xffffff, { map: T.tatami(), roughness: 0.85, flatShading: false }));
    for (let i = 0; i < 3; i++) {
      const m = DS.mesh(new THREE.BoxGeometry(2.6, 0.26, 1.2), tm, -2.8 + i * 2.8 + (Math.random() - 0.5) * 0.2, 0.13, 0, g);
      const m2 = DS.mesh(new THREE.BoxGeometry(2.5, 0.26, 1.15), tm, m.position.x + 0.1, 0.39, 0.05, g); m2.rotation.y = 0.06;
      const m3 = DS.mesh(new THREE.BoxGeometry(2.4, 0.24, 1.1), tm, m.position.x - 0.05, 0.64, -0.03, g); m3.rotation.y = -0.05;
    }
    g.add(DS.shadowBlob(9.5, 1.8, 0.5));
    g.userData = { kind: 'tatami', need: 'jump', cue: 'jump' };
    return g;
  };

  B.beam = function () {
    const g = new THREE.Group();
    const wood = mat('redwood', () => DS.std(0x5a1f14, { map: T.wood(), roughness: 0.55 }));
    DS.mesh(new THREE.BoxGeometry(10, 0.55, 0.6), wood, 0, 2.25, 0, g);
    [-4.7, 4.7].forEach(x => DS.mesh(new THREE.BoxGeometry(0.45, 4.6, 0.45), wood, x, 2.3, 0, g));
    // noren curtain strips (bottom at ~1.45)
    const norenTex = DS.cache('noren', () => DS.canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = '#1d2f5c'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#f3e7cf'; c.beginPath(); c.arc(w / 2, h / 2, 34, 0, 7); c.fill();
      c.fillStyle = '#1d2f5c'; c.beginPath(); c.arc(w / 2 + 12, h / 2 - 6, 30, 0, 7); c.fill();
    }, { wrap: false }));
    const nm = mat('noren', () => new THREE.MeshStandardMaterial({ map: norenTex, side: THREE.DoubleSide, roughness: 0.9 }));
    const strips = [];
    for (let i = 0; i < 6; i++) {
      const s = DS.mesh(new THREE.PlaneGeometry(1.45, 0.6), nm, -3.7 + i * 1.48, 1.7, 0.02, g, false); strips.push(s);
    }
    // lanterns
    const lanternMat = mat('lanternR', () => DS.glow(0xff5a2a, 1.4));
    [-3.8, 3.8].forEach(x => { DS.mesh(new THREE.SphereGeometry(0.3, 10, 8), lanternMat, x, 2.9, 0.1, g, false).scale.y = 1.3; const h = DS.halo(0xff7a3a, 2.4, 0.8); h.position.set(x, 2.9, 0.2); g.add(h); });
    g.userData = { kind: 'beam', need: 'duck', cue: 'duck', update: (dt, t) => strips.forEach((s, i) => s.rotation.x = Math.sin(t * 2.5 + i) * 0.12) };
    return g;
  };

  B.doors = function (lanes) {
    const g = new THREE.Group(); const panels = [];
    const sm = mat('shojiPanel', () => new THREE.MeshStandardMaterial({ map: T.shoji(), emissive: DS.C(0xffb45a), emissiveMap: T.shoji(), emissiveIntensity: 0.55, roughness: 0.7 }));
    const frame = mat('darkwood', () => DS.std(0x4a2e1d, { map: T.wood() }));
    lanes.forEach((li) => {
      const p = new THREE.Group();
      DS.mesh(new THREE.BoxGeometry(2.1, 3.2, 0.12), sm, 0, 1.6, 0, p);
      DS.mesh(new THREE.BoxGeometry(2.3, 0.14, 0.2), frame, 0, 3.25, 0, p);
      DS.mesh(new THREE.BoxGeometry(2.3, 0.14, 0.2), frame, 0, 0.05, 0, p);
      p.userData.tx = LANES[li]; p.userData.from = LANES[li] < 0 ? -5.5 : (LANES[li] > 0 ? 5.5 : (li % 2 ? 5.5 : -5.5));
      p.position.x = p.userData.from; g.add(p); panels.push(p);
      const sb = DS.shadowBlob(2.4, 1, 0.35); sb.position.x = LANES[li]; g.add(sb);
    });
    g.userData = { kind: 'doors', need: 'lane', lanes, panels,
      update: (dt, t, info) => { // slide into lanes when close
        const k = DS.clamp(1 - (info.dist - 18) / 22, 0, 1), e = DS.smooth(k);
        panels.forEach(p => p.position.x = DS.lerp(p.userData.from, p.userData.tx, e));
      },
      onHit: () => panels.forEach(p => { p.visible = false; }) };
    return g;
  };

  // ---- TRAIN ----
  B.ridge = function () {
    const g = new THREE.Group();
    const fm = mat('flesh', () => new THREE.MeshStandardMaterial({ map: T.flesh(), emissive: DS.C(0x6a0a24), emissiveIntensity: 0.6, roughness: 0.45, metalness: 0.05 }));
    const body = DS.mesh(new THREE.CylinderGeometry(0.45, 0.45, 8.6, 12), fm, 0, 0.4, 0, g);
    body.rotation.z = Math.PI / 2; body.scale.set(1, 1, 0.85);
    [-4.3, 4.3].forEach(x => DS.mesh(new THREE.SphereGeometry(0.45, 12, 8), fm, x, 0.4, 0, g));
    const eyeW = mat('eyeWhite', () => DS.std(0xf2e8d0, { flatShading: false, roughness: 0.3 }));
    const eyeP = mat('eyeRed', () => DS.glow(0xff2a2a, 2));
    const eyes = [];
    for (let i = 0; i < 5; i++) {
      const x = -3.2 + i * 1.6;
      const e = DS.mesh(new THREE.SphereGeometry(0.17, 10, 8), eyeW, x, 0.62, 0.3, g, false);
      const p = DS.mesh(new THREE.SphereGeometry(0.08, 8, 6), eyeP, x, 0.64, 0.44, g, false); eyes.push(e, p);
    }
    g.add(DS.shadowBlob(9.5, 1.4, 0.5));
    g.userData = { kind: 'ridge', need: 'jump', cue: 'jump', update: (dt, t) => { const s = 1 + Math.sin(t * 5) * 0.06; body.scale.set(s, 1, 0.85 * s); } };
    return g;
  };

  B.bridge = function () {
    const g = new THREE.Group();
    const st = mat('steel', () => new THREE.MeshStandardMaterial({ map: T.steel(), color: DS.C(0x9aa3b5), roughness: 0.45, metalness: 0.6 }));
    const stone = mat('stone', () => DS.std(0x5c5a66, { roughness: 0.95 }));
    DS.mesh(new THREE.BoxGeometry(13, 0.35, 1.2), st, 0, 1.55, 0, g); // bottom chord ~ 1.38..1.73
    DS.mesh(new THREE.BoxGeometry(13, 0.35, 1.2), st, 0, 3.2, 0, g);
    for (let i = 0; i < 9; i++) {
      const x = -6 + i * 1.5; const d = DS.mesh(new THREE.BoxGeometry(0.16, 1.9, 0.16), st, x + 0.75, 2.4, 0.5, g); d.rotation.z = (i % 2 ? 1 : -1) * 0.55;
      const d2 = d.clone(); d2.position.z = -0.5; g.add(d2);
    }
    [-6.8, 6.8].forEach(x => DS.mesh(new THREE.BoxGeometry(1.4, 12, 1.8), stone, x, -2.6, 0, g));
    const lamp = DS.halo(0xffd28a, 1.6, 0.8); lamp.position.set(0, 3.5, 0.7); g.add(lamp);
    g.userData = { kind: 'bridge', need: 'duck', cue: 'duck' };
    return g;
  };

  B.vents = function (lanes) {
    const g = new THREE.Group();
    const iron = mat('iron', () => DS.std(0x2b2f36, { roughness: 0.5, metalness: 0.5 }));
    const brass = mat('brass', () => DS.std(0xb08a3e, { roughness: 0.35, metalness: 0.8 }));
    const puffs = [];
    const smoke = mat('smoke', () => new THREE.SpriteMaterial({ map: DS.glowTex(), color: DS.C(0xc9ccd6), transparent: true, opacity: 0.55, depthWrite: false }));
    lanes.forEach((li) => {
      const x = LANES[li];
      DS.mesh(new THREE.CylinderGeometry(0.75, 0.9, 2.6, 12), iron, x, 1.3, 0, g);
      DS.mesh(new THREE.CylinderGeometry(1.05, 0.8, 0.4, 12), iron, x, 2.75, 0, g);
      DS.mesh(new THREE.TorusGeometry(0.82, 0.07, 6, 16), brass, x, 1.6, 0, g).rotation.x = Math.PI / 2;
      for (let k = 0; k < 4; k++) { const s = new THREE.Sprite(smoke); s.position.set(x, 3 + k * 0.7, 0); s.scale.set(1.6, 1.6, 1); g.add(s); puffs.push({ s, x, k }); }
      const sb = DS.shadowBlob(2.2, 2.2, 0.5); sb.position.x = x; g.add(sb);
    });
    g.userData = { kind: 'vents', need: 'lane', lanes,
      update: (dt, t) => puffs.forEach(p => { const ph = (t * 0.8 + p.k * 0.25) % 1; p.s.position.y = 3 + ph * 3.2; p.s.position.z = ph * 3; const sc = 1.2 + ph * 2.2; p.s.scale.set(sc, sc, 1); p.s.material.opacity = 0.55; }) };
    return g;
  };

  B.tentacle = function (li) {
    const g = new THREE.Group();
    const t = DS.Chars.tentacle(); t.position.x = LANES[li]; g.add(t);
    const sb = DS.shadowBlob(1.8, 1.8, 0.5); sb.position.x = LANES[li]; g.add(sb);
    g.userData = { kind: 'tentacle', need: 'slash', lanes: [li], cue: 'slash', tent: t,
      update: (dt, tt) => t.userData.update && t.userData.update(dt, tt) };
    return g;
  };

  // ---- SET PIECES ----
  // Smash wall: grid of blocks + crack decals; theme = 'forest' | 'castle' | 'train'
  B.wall = function (theme) {
    const g = new THREE.Group();
    const W = 9.4, H = 4.2, cols = 7, rows = 5;
    let blockMat, trimMat;
    if (theme === 'forest') { blockMat = mat('wallWood', () => DS.std(0x8a5a34, { map: T.wood(), roughness: 0.85 })); trimMat = mat('darkwood', () => DS.std(0x4a2e1d, { map: T.wood() })); }
    else if (theme === 'castle') { blockMat = mat('wallFusuma', () => new THREE.MeshStandardMaterial({ map: T.shoji(), emissive: DS.C(0xffa040), emissiveMap: T.shoji(), emissiveIntensity: 0.45, roughness: 0.7 })); trimMat = mat('redwood', () => DS.std(0x5a1f14, { map: T.wood(), roughness: 0.55 })); }
    else { blockMat = mat('flesh', () => new THREE.MeshStandardMaterial({ map: T.flesh(), emissive: DS.C(0x6a0a24), emissiveIntensity: 0.6, roughness: 0.45 })); trimMat = mat('iron', () => DS.std(0x2b2f36, { roughness: 0.5, metalness: 0.5 })); }
    const bw = W / cols, bh = H / rows;
    const bg = new THREE.BoxGeometry(bw * 0.98, bh * 0.98, 0.6);
    const blocks = new THREE.Group(); g.add(blocks);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const b = DS.mesh(bg, blockMat, -W / 2 + bw * (c + 0.5) + (r % 2 ? bw * 0.1 : 0), bh * (r + 0.5), (Math.random() - 0.5) * 0.08, blocks);
      b.userData.home = b.position.clone();
    }
    // posts + top beam
    [-W / 2 - 0.3, W / 2 + 0.3].forEach(x => DS.mesh(new THREE.BoxGeometry(0.6, H + 1.2, 0.8), trimMat, x, (H + 1.2) / 2, 0, g));
    DS.mesh(new THREE.BoxGeometry(W + 1.4, 0.5, 0.9), trimMat, 0, H + 0.6, 0, g);
    // talismans (forest/castle) or eyes (train)
    if (theme !== 'train') {
      const om = mat('ofuda', () => new THREE.MeshStandardMaterial({ map: T.ofuda(), roughness: 0.8, emissive: DS.C(0x442211), emissiveIntensity: 0.4 }));
      [-2.6, 0, 2.6].forEach(x => { const o = DS.mesh(new THREE.PlaneGeometry(0.5, 1.5), om, x, 2.2, 0.33, blocks, false); o.userData.home = o.position.clone(); });
    } else {
      const eyeW = mat('eyeWhite', () => DS.std(0xf2e8d0, { flatShading: false, roughness: 0.3 }));
      const eyeP = mat('eyeRed', () => DS.glow(0xff2a2a, 2));
      [[-2.5, 2.8], [1.2, 1.6], [2.9, 3.2], [-0.8, 1.1]].forEach(([x, y]) => {
        const e = DS.mesh(new THREE.SphereGeometry(0.35, 12, 10), eyeW, x, y, 0.3, blocks, false); e.userData.home = e.position.clone();
        const p = DS.mesh(new THREE.SphereGeometry(0.16, 10, 8), eyeP, x, y, 0.6, blocks, false); p.userData.home = p.position.clone();
      });
    }
    // crack decals
    const cm1 = new THREE.MeshBasicMaterial({ map: T.crack(1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const cm2 = new THREE.MeshBasicMaterial({ map: T.crack(2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const c1 = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), cm1); c1.position.set(0, 2.1, 0.36); c1.visible = false; c1.renderOrder = 5; g.add(c1);
    const c2 = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), cm2); c2.position.set(0, 2.1, 0.37); c2.visible = false; c2.renderOrder = 5; g.add(c2);
    g.add(DS.shadowBlob(W + 1, 1.6, 0.5));
    let shake = 0;
    g.userData = { kind: 'wall', need: 'stop', stop: 'wall', cue: 'smash', hits: 0, theme,
      update: (dt) => {
        if (shake > 0) { shake = Math.max(0, shake - dt * 2.5); blocks.position.x = (Math.random() - 0.5) * shake * 0.3; blocks.position.y = (Math.random() - 0.5) * shake * 0.15; }
      },
      hit: (fx, worldZ) => {
        const u = g.userData; u.hits++;
        shake = 0.6 + u.hits * 0.3;
        if (u.hits === 1) c1.visible = true;
        if (u.hits === 2) c2.visible = true;
        const colors = theme === 'forest' ? [0x8a5a34, 0x6b4226, 0xd9b27a] : theme === 'castle' ? [0xf6c679, 0x5a1f14, 0xfff1c9] : [0x9c2f45, 0xe06080, 0x5a0a1c];
        fx.debris({ pos: new THREE.Vector3(0, 2, worldZ + 0.5), n: 14, colors, size: [0.08, 0.22], speed: [2, 6], up: [1, 5], dir: new THREE.Vector3(0, 0, 4) });
        fx.sparks({ pos: new THREE.Vector3(0, 2.1, worldZ + 0.6), n: 30, colors: [0xffd27a, 0xff8a3a], speed: [2, 6], life: 0.6, gravity: 4 });
        if (u.hits >= 3) {
          u.broken = true; blocks.visible = false; c1.visible = c2.visible = false;
          fx.debris({ pos: new THREE.Vector3(0, 2, worldZ - 0.4), n: 80, colors, size: [0.14, 0.42], speed: [3, 9], up: [2, 8], spreadX: 9, spreadY: 4, dir: new THREE.Vector3(0, 0, -9), life: 2.0 });
          fx.sparks({ pos: new THREE.Vector3(0, 2, worldZ), n: 120, colors: theme === 'train' ? [0xff5a7a, 0xffc0cc] : [0xffd27a, 0xffffff, 0x7fd3ff], speed: [3, 12], spread: 4, life: 1.2, gravity: 3 });
          fx.ring(new THREE.Vector3(0, 2, worldZ + 0.5), theme === 'train' ? 0xff5a7a : 0x9fd8ff, 9, 0.6);
        }
      } };
    return g;
  };

  // Pose wall (castle): glowing paper screen with a silhouette hole
  B.posewall = function (pose) {
    const g = new THREE.Group();
    const texP = DS.cache('posewall_' + pose, () => DS.canvasTex(1024, 576, (c, w, h) => {
      const gr = c.createRadialGradient(w / 2, h * 0.55, 40, w / 2, h / 2, w * 0.6);
      gr.addColorStop(0, '#fff3c4'); gr.addColorStop(1, '#f0a347');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(70,30,10,0.85)';
      for (let x = 0; x <= w; x += w / 8) c.fillRect(x - 5, 0, 10, h);
      for (let y = 0; y <= h; y += h / 5) c.fillRect(0, y - 5, w, 10);
      // outline then cut
      DS.Fig.draw(c, pose, w / 2, h * 0.97, h * 0.86, { color: '#1a0a04', thick: 0.14 });
      c.globalCompositeOperation = 'destination-out';
      DS.Fig.draw(c, pose, w / 2, h * 0.97, h * 0.86, { color: '#000', thick: 0.1 });
      c.globalCompositeOperation = 'source-over';
    }, { wrap: false }));
    const pm = new THREE.MeshStandardMaterial({ map: texP, emissive: DS.C(0xffc070), emissiveMap: texP, emissiveIntensity: 0.9, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
    const paper = DS.mesh(new THREE.PlaneGeometry(9.6, 5.4), pm, 0, 2.7, 0, g, false);
    const frame = mat('redwood', () => DS.std(0x5a1f14, { map: T.wood(), roughness: 0.55 }));
    [-5, 5].forEach(x => DS.mesh(new THREE.BoxGeometry(0.4, 6.2, 0.5), frame, x, 3.1, 0, g));
    DS.mesh(new THREE.BoxGeometry(10.6, 0.45, 0.55), frame, 0, 5.6, 0, g);
    const glowBack = DS.halo(0xffb45a, 11, 0.35); glowBack.position.set(0, 2.7, -1.5); g.add(glowBack);
    g.add(DS.shadowBlob(10.4, 1.4, 0.4));
    g.userData = { kind: 'posewall', need: 'stop', stop: 'pose', pose, cue: pose,
      burst: (fx, worldZ) => {
        g.userData.broken = true; paper.visible = false;
        fx.debris({ pos: new THREE.Vector3(0, 2.7, worldZ), n: 140, colors: [0xfff1c9, 0xf6c679, 0xffe0a0], size: [0.18, 0.4], flat: true, speed: [2, 7], up: [1, 5], spreadX: 9, spreadY: 5, dir: new THREE.Vector3(0, 0, 5), gravity: 6, drag: 1.2, life: 2.6, spin: 16 });
        fx.sparks({ pos: new THREE.Vector3(0, 2.7, worldZ), n: 80, colors: [0xffd27a, 0xffffff], spread: 6, speed: [1, 5], life: 1.0, gravity: 1 });
      } };
    return g;
  };

  // Push cart with Nezuko's box (forest)
  B.cart = function (li) {
    const g = new THREE.Group();
    const cart = new THREE.Group(); cart.position.x = LANES[li]; g.add(cart);
    const wood = mat('cartWood', () => DS.std(0x9a6a3c, { map: T.wood(), roughness: 0.85 }));
    const dark = mat('darkwood', () => DS.std(0x4a2e1d, { map: T.wood() }));
    DS.mesh(new THREE.BoxGeometry(1.9, 0.18, 2.6), wood, 0, 0.75, 0, cart);
    [[-0.95, 0], [0.95, 0]].forEach(([x]) => DS.mesh(new THREE.BoxGeometry(0.1, 0.45, 2.6), dark, x, 1.05, 0, cart));
    DS.mesh(new THREE.BoxGeometry(1.9, 0.45, 0.1), dark, 0, 1.05, -1.3, cart);
    // handles toward player (+z)
    [-0.6, 0.6].forEach(x => { const h = DS.mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), dark, x, 1.0, 1.8, cart); h.rotation.x = Math.PI / 2 - 0.25; });
    DS.mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), dark, 0, 1.15, 2.4, cart).rotation.z = Math.PI / 2;
    // wheels
    const wheels = [];
    const wm = mat('wheel', () => DS.std(0x3a2a1c));
    [[-1.02, 0.8], [1.02, 0.8], [-1.02, -0.8], [1.02, -0.8]].forEach(([x, z]) => { const w = DS.mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 12), wm, x, 0.42, z, cart); w.rotation.z = Math.PI / 2; wheels.push(w); });
    // Nezuko's box (wooden box with straps + bamboo-ish trim)
    const boxWood = mat('boxWood', () => DS.std(0xc49a6c, { map: T.wood(), roughness: 0.8 }));
    const strap = mat('strap', () => DS.std(0x2a2020));
    const box = new THREE.Group(); box.position.set(0, 0.84, 0.1); cart.add(box);
    DS.mesh(new THREE.BoxGeometry(1.0, 1.35, 0.8), boxWood, 0, 0.68, 0, box);
    DS.mesh(new THREE.BoxGeometry(1.08, 0.14, 0.88), dark, 0, 1.4, 0, box);
    DS.mesh(new THREE.BoxGeometry(1.08, 0.1, 0.88), dark, 0, 0.05, 0, box);
    [-0.25, 0.25].forEach(x => DS.mesh(new THREE.BoxGeometry(0.07, 1.36, 0.84), strap, x, 0.68, 0.01, box));
    const leaf = mat('asanoha', () => DS.glow(0xff7eb6, 0.5));
    DS.mesh(new THREE.CircleGeometry(0.18, 6), leaf, 0, 0.8, 0.41, box, false);
    // lanterns + shadow
    const lamp = DS.halo(0xffb347, 2, 0.7); lamp.position.set(0.8, 1.5, 1.1); cart.add(lamp);
    const sb = DS.shadowBlob(2.6, 3.2, 0.55); cart.add(sb);
    g.userData = { kind: 'cart', need: 'stop', stop: 'cart', cue: 'push', lanes: [li], cart, wheels, pushed: 0 };
    return g;
  };

  // ---------------------------------------------------------------- manager
  DS.Obstacles = {
    create(scene, fx) {
      const mgr = { list: [], level: null, cuesEnabled: true };
      let events = [];

      function pick(kind, world, blockLanes, ev) {
        if (kind === 'jump') return world === 'forest' ? B.log() : world === 'castle' ? B.tatami() : B.ridge();
        if (kind === 'duck') return world === 'forest' ? B.rope() : world === 'castle' ? B.beam() : B.bridge();
        if (kind === 'left' || kind === 'right') return world === 'forest' ? B.demons(blockLanes) : world === 'castle' ? B.doors(blockLanes) : B.vents(blockLanes);
        if (kind === 'wall') return B.wall(world);
        if (kind === 'pose') return B.posewall(ev.val);
        if (kind === 'cart') return B.cart(ev.lane);
        if (kind === 'slash') return B.tentacle(ev.lane);
      }

      mgr.startLevel = function (level, startZ) {
        mgr.clear();
        mgr.level = level;
        events = [];
        let li = 1; // expected lane
        level.seq.forEach(([t, kind, val], i) => {
          const ev = { i, t, kind, val, z: startZ - t * level.speed, built: false, done: false };
          if (kind === 'left' || kind === 'right') {
            let target = kind === 'left' ? li - 1 : li + 1;
            if (target < 0 || target > 2) { target = kind === 'left' ? li + 1 : li - 1; ev.kind = kind === 'left' ? 'right' : 'left'; }
            ev.block = [0, 1, 2].filter(x => x !== target);
            ev.dir = ev.kind; li = target;
          }
          if (kind === 'slash' || kind === 'cart') ev.lane = li;
          events.push(ev);
        });
        mgr.events = events;
      };

      mgr.clear = function () {
        mgr.list.forEach(o => { scene.remove(o.group); });
        mgr.list = []; events = []; mgr.events = [];
      };

      // player: {x,y(feet),z,ducking,li, speed}; api: callbacks {onHit(obs), onStop(obs), onCue(ev), onResolve(obs)}
      mgr.update = function (dt, time, player, api) {
        // build ahead
        for (const ev of events) {
          if (!ev.built && ev.z > player.z - 190) {
            const g = pick(ev.kind, mgr.level.world, ev.block, ev);
            g.position.z = ev.z; scene.add(g);
            ev.built = true; mgr.list.push({ ev, group: g, u: g.userData });
          }
        }
        for (let i = mgr.list.length - 1; i >= 0; i--) {
          const o = mgr.list[i], ev = o.ev, u = o.u;
          const dist = player.z - o.group.position.z; // >0 = ahead of player
          if (u.update) u.update(dt, time, { dist });
          // cues
          if (!ev.cued && mgr.level.speed > 0 && dist < mgr.level.speed * DS.CONFIG.cueLead + (u.need === 'stop' ? 5 : 0) && dist > 0) {
            ev.cued = true; api.onCue(ev, u);
          }
          // stop set pieces
          if (u.need === 'stop' && !u.broken && !u.pushedDone) {
            const stopZ = o.group.position.z + (u.stop === 'cart' ? 4.2 : 5);
            if (player.z <= stopZ + 0.01 && !o.stopped) { o.stopped = true; api.onStop(o); }
            if (o.stopped && player.z < stopZ) player.z = stopZ;
          }
          // crossing check
          if (!ev.done && dist < -0.2) {
            ev.done = true;
            let ok = true;
            if (u.need === 'jump') ok = player.y > 0.62;
            else if (u.need === 'duck') ok = player.ducking;
            else if (u.need === 'lane') ok = !(u.lanes.some(li => Math.abs(player.x - LANES[li]) < 1.25));
            else if (u.need === 'slash') ok = !!u.cut || Math.abs(player.x - LANES[u.lanes[0]]) > 1.25;
            if (!ok) api.onHit(o); else api.onPass(o);
          }
          if (dist < -25) { scene.remove(o.group); mgr.list.splice(i, 1); }
        }
      };

      // nearest un-cut tentacle ahead within range in (approximately) the player's lane
      mgr.trySlash = function (player) {
        let best = null, bd = 1e9;
        for (const o of mgr.list) {
          if (o.u.need !== 'slash' || o.u.cut) continue;
          const dist = player.z - o.group.position.z;
          if (dist < -0.5 || dist > 10) continue;
          if (Math.abs(player.x - LANES[o.u.lanes[0]]) > 1.4) continue;
          if (dist < bd) { bd = dist; best = o; }
        }
        if (best) { best.u.cut = true; best.u.tent.userData.slash && best.u.tent.userData.slash(best.ev.val || 'right'); }
        return best;
      };

      mgr.stopped = function () { return mgr.list.find(o => o.stopped && o.u.need === 'stop' && !o.u.broken && !o.u.pushedDone); };
      mgr.nextEvent = function (player) { return events.find(e => !e.done && e.z < player.z + 0.5); };
      return mgr;
    }
  };
})(window.DS);

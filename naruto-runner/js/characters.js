// characters.js - DEMON SLAYER: INFINITY CASTLE RUN (fan-made)
// Original low-poly stylized fan-art characters built from primitives, animated procedurally.
// Three.js r128 (global THREE), classic script. Depends on util.js (window.DS).
// API: DS.Chars.katana(), demon(v), tentacle(), boss(), hero(name), crow()
(function (DS) {
  'use strict';
  const PI = Math.PI, TAU = Math.PI * 2;
  const sin = Math.sin, cos = Math.cos, abs = Math.abs, max = Math.max, min = Math.min;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const sm = (v) => DS.smooth(clamp01(v));
  const easeOut = (v) => { v = clamp01(v); return 1 - (1 - v) * (1 - v) * (1 - v); };
  const UP = new THREE.Vector3(0, 1, 0);

  // ---------------------------------------------------------------- caches
  function G(key, make) { return DS.cache('chG:' + key, () => { const g = make(); g.userData.shared = true; return g; }); }
  function M(key, make) { return DS.cache('chM:' + key, make); }
  function T(key, w, h, draw, opts) { return DS.cache('chT:' + key, () => DS.canvasTex(w, h, draw, opts)); }

  const box = (w, h, d) => G('box' + w + '|' + h + '|' + d, () => new THREE.BoxGeometry(w, h, d));
  const sph = (r, ws = 10, hs = 8) => G('sph' + r + '|' + ws + '|' + hs, () => new THREE.SphereGeometry(r, ws, hs));
  const cone = (r, h, s = 6) => G('cone' + r + '|' + h + '|' + s, () => new THREE.ConeGeometry(r, h, s));
  const cyl = (rt, rb, h, s = 10, open = false) => G('cyl' + rt + '|' + rb + '|' + h + '|' + s + '|' + open,
    () => new THREE.CylinderGeometry(rt, rb, h, s, 1, open));
  // limb segment hanging from its pivot: top at y=0, bottom at y=-len
  const seg = (r1, r2, len, s = 8) => G('seg' + r1 + '|' + r2 + '|' + len + '|' + s, () => {
    const g = new THREE.CylinderGeometry(r1, r2, len, s); g.translate(0, -len / 2, 0); return g;
  });
  // segment rising from its pivot: bottom at y=0, top at y=len
  const segUp = (rb, rt, len, s = 9) => G('segU' + rb + '|' + rt + '|' + len + '|' + s, () => {
    const g = new THREE.CylinderGeometry(rt, rb, len, s); g.translate(0, len / 2, 0); return g;
  });
  const torus = (r, t, rs = 6, ts = 16, arc = TAU) => G('tor' + r + '|' + t + '|' + rs + '|' + ts + '|' + arc,
    () => new THREE.TorusGeometry(r, t, rs, ts, arc));
  const plane = (w, h) => G('pl' + w + '|' + h, () => new THREE.PlaneGeometry(w, h));

  function grp(parent, x = 0, y = 0, z = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g;
  }
  const mesh = DS.mesh;

  // ---------------------------------------------------------------- canvas textures (cached)
  const texChecker = () => T('checker', 128, 128, (g) => {
    const s = 16;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      g.fillStyle = (x + y) % 2 ? '#141619' : '#1d8a5c'; g.fillRect(x * s, y * s, s, s);
    }
    g.globalAlpha = 0.07;
    for (let i = 0; i < 128; i += 2) { g.fillStyle = i % 4 ? '#ffffff' : '#000000'; g.fillRect(0, i, 128, 1); }
    g.globalAlpha = 1;
  });

  const texAsanoha = () => T('asanoha', 256, 256, (g, w, h) => {
    g.fillStyle = '#f3a2bf'; g.fillRect(0, 0, w, h);
    const s = 64, th = s * Math.sqrt(3) / 2;
    g.save(); g.scale(1, h / (th * 4));
    g.strokeStyle = '#c85a82'; g.lineWidth = 2.2; g.lineJoin = 'round';
    const tri = (ax, ay, bx, by, cx, cy) => {
      const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3;
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(cx, cy); g.closePath();
      g.moveTo(mx, my); g.lineTo(ax, ay); g.moveTo(mx, my); g.lineTo(bx, by); g.moveTo(mx, my); g.lineTo(cx, cy);
      g.stroke();
    };
    for (let r = -1; r <= 4; r++) for (let c = -1; c <= 5; c++) {
      const ox = c * s + ((r & 1) ? s / 2 : 0), y0 = r * th, y1 = y0 + th;
      tri(ox, y1, ox + s, y1, ox + s / 2, y0);
      tri(ox + s / 2, y0, ox + 1.5 * s, y0, ox + s, y1);
    }
    g.restore();
  });

  const texZenitsu = () => T('zenitsu', 128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#ffd23c'); gr.addColorStop(1, '#f07a18');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const s = 32;
    for (let r = 0; r < 4; r++) for (let c = -1; c <= 4; c++) {
      const ox = c * s + ((r & 1) ? s / 2 : 0), y = r * 32;
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.beginPath(); g.moveTo(ox + 5, y + 27); g.lineTo(ox + s - 5, y + 27); g.lineTo(ox + s / 2, y + 5); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,190,60,0.9)';
      g.beginPath(); g.moveTo(ox + 11, y + 23); g.lineTo(ox + s - 11, y + 23); g.lineTo(ox + s / 2, y + 12); g.closePath(); g.fill();
    }
  });

  const texTattoo = () => T('tattoo', 256, 256, (g, w, h) => {
    g.fillStyle = '#efb0a6'; g.fillRect(0, 0, w, h);
    const rnd = DS.rng(7);
    g.strokeStyle = '#1e2d7a'; g.lineCap = 'round';
    for (let y = 12; y < h; y += 28) {
      g.lineWidth = 5 + rnd() * 3;
      const ph = rnd() * TAU;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const yy = y + sin(x / w * TAU * 2 + ph) * 2.5;
        if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
      }
      g.stroke();
      // short forked accents
      g.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        const x0 = rnd() * w;
        g.beginPath(); g.moveTo(x0, y + 3); g.lineTo(x0 + 10, y + 11); g.stroke();
      }
    }
  });

  const texFlesh = () => T('flesh', 256, 256, (g, w, h) => {
    g.fillStyle = '#cf5268'; g.fillRect(0, 0, w, h);
    const rnd = DS.rng(11);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = 'rgba(255,170,180,' + (0.1 + rnd() * 0.18) + ')';
      const x = rnd() * w, y = rnd() * h, r = 4 + rnd() * 12;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(120,20,45,0.75)'; g.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      g.lineWidth = 1.5 + rnd() * 3;
      const x = rnd() * w, y = rnd() * h;
      for (let o = -w; o <= w; o += w) {
        g.beginPath(); g.moveTo(x + o, y);
        g.bezierCurveTo(x + o + 30 * (rnd() - 0.5), y + 40, x + o + 40 * (rnd() - 0.5), y + 80, x + o + 20 * (rnd() - 0.5), y + 120);
        g.stroke();
      }
    }
  });

  const texTrail = () => T('trail', 256, 64, (g, w, h) => {
    const gv = g.createLinearGradient(0, 0, 0, h);
    gv.addColorStop(0, 'rgba(255,255,255,1)');
    gv.addColorStop(0.14, 'rgba(205,240,255,1)');
    gv.addColorStop(0.38, 'rgba(70,160,255,0.9)');
    gv.addColorStop(0.72, 'rgba(25,80,210,0.35)');
    gv.addColorStop(1, 'rgba(0,30,120,0)');
    g.fillStyle = gv; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2.5;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = h * (0.26 + k * 0.17) + sin(x * 0.07 + k * 2.1) * 4.5;
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
    g.lineWidth = 2;
    for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(30 + i * 34, 16, 7, PI * 0.2, PI * 1.6); g.stroke(); }
    g.globalCompositeOperation = 'destination-in';
    const gh = g.createLinearGradient(0, 0, w, 0);
    gh.addColorStop(0, 'rgba(0,0,0,0)'); gh.addColorStop(0.35, 'rgba(0,0,0,0.45)');
    gh.addColorStop(0.86, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0.85)');
    g.fillStyle = gh; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
  }, { wrap: false });

  const texSpiral = () => T('spiral', 128, 64, (g, w, h) => {
    const gv = g.createLinearGradient(0, 0, 0, h);
    gv.addColorStop(0, 'rgba(255,255,255,0.95)');
    gv.addColorStop(0.2, 'rgba(150,215,255,0.95)');
    gv.addColorStop(0.55, 'rgba(40,120,255,0.75)');
    gv.addColorStop(1, 'rgba(0,40,160,0)');
    g.fillStyle = gv; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 3;
    for (let k = 0; k < 2; k++) {
      g.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = h * (0.3 + k * 0.25) + sin(x / w * TAU * 2 + k) * 6;
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
  });

  const texTorn = () => T('torn', 128, 128, (g, w, h) => {
    g.fillStyle = '#2a2331'; g.fillRect(0, 0, w, h);
    const rnd = DS.rng(3);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.3)' : 'rgba(130,95,140,0.14)';
      g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 5, 1 + rnd() * 3);
    }
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) g.lineTo(x, h - 8 - rnd() * 40);
    g.lineTo(w, h); g.closePath(); g.fill();
    for (let i = 0; i < 5; i++) {
      g.beginPath(); g.ellipse(rnd() * w, 30 + rnd() * 50, 3 + rnd() * 5, 5 + rnd() * 9, rnd(), 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  });

  const texWrap = () => T('wrap', 64, 128, (g, w, h) => {
    g.fillStyle = '#0f0f14'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4c5266';
    for (let y = 0; y <= h; y += 32) for (let x = 0; x <= w; x += 32) {
      g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 11, y + 16); g.lineTo(x, y + 28); g.lineTo(x - 11, y + 16); g.closePath(); g.fill();
    }
  });

  const texTsuba = () => T('tsuba', 64, 64, (g, w, h) => {
    g.fillStyle = '#1b1c22'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#050507';
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU, cx = 32 + cos(a) * 18, cy = 32 + sin(a) * 18;
      g.beginPath();
      for (let k = 0; k < 6; k++) { const b = k / 6 * TAU; const px = cx + cos(b) * 6, py = cy + sin(b) * 6; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
      g.closePath(); g.fill();
    }
    g.fillRect(29, 24, 6, 16);
  }, { wrap: false });

  const texHanafuda = () => T('hanafuda', 32, 64, (g, w, h) => {
    g.fillStyle = '#f7f3ea'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d0202a'; g.beginPath(); g.arc(16, 20, 10, 0, TAU); g.fill();
    g.fillStyle = '#20242c'; for (let i = 0; i < 3; i++) g.fillRect(4, 38 + i * 7, 24, 3);
  }, { wrap: false });

  function texGrad(key, top, bottom, stop) {
    return T('grad' + key, 16, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, top); gr.addColorStop(stop, top); gr.addColorStop(1, bottom);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
  }

  const texSash = () => T('sash', 64, 64, (g, w, h) => {
    g.fillStyle = '#eef2f8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2f63c8'; g.fillRect(0, 8, w, 7); g.fillRect(0, 49, w, 7);
    g.fillStyle = '#9bbcf0'; g.fillRect(0, 29, w, 5);
  });

  const texSnowflake = () => T('snowflake', 512, 512, (g) => {
    g.translate(256, 256);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 250);
    gr.addColorStop(0, 'rgba(255,120,210,0)');
    gr.addColorStop(0.55, 'rgba(255,110,200,0.14)');
    gr.addColorStop(0.8, 'rgba(120,230,255,0.45)');
    gr.addColorStop(0.86, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.9, 'rgba(120,230,255,0.45)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 250, 0, TAU); g.fill();
    g.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      g.save(); g.rotate(i * TAU / 12);
      g.strokeStyle = (i & 1) ? 'rgba(130,235,255,0.95)' : 'rgba(255,140,215,0.95)';
      g.lineWidth = (i & 1) ? 5 : 7;
      g.beginPath(); g.moveTo(34, 0); g.lineTo(212, 0);
      for (let k = 0; k < 3; k++) {
        const r = 85 + k * 42, b = 30 - k * 6;
        g.moveTo(r, 0); g.lineTo(r + b, b); g.moveTo(r, 0); g.lineTo(r + b, -b);
      }
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath(); g.moveTo(206, 0); g.lineTo(222, -7); g.lineTo(238, 0); g.lineTo(222, 7); g.closePath(); g.fill();
      g.restore();
    }
    g.strokeStyle = 'rgba(255,200,240,0.9)'; g.lineWidth = 4;
    g.beginPath(); g.arc(0, 0, 58, 0, TAU); g.stroke();
  }, { wrap: false });

  const texFlake = () => T('flake', 32, 32, (g) => {
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(6, 10); g.lineTo(22, 4); g.lineTo(28, 20); g.lineTo(12, 28); g.closePath(); g.fill();
  }, { wrap: false });

  function texEye(key, iris, dark) {
    return T('eye' + key, 64, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = dark ? '#1a0f24' : '#ffffff';
      g.beginPath(); g.ellipse(32, 34, 26, 20, 0, 0, TAU); g.fill();
      const gr = g.createLinearGradient(0, 14, 0, 56);
      gr.addColorStop(0, dark ? '#7a4a00' : '#141018'); gr.addColorStop(0.45, iris); gr.addColorStop(1, iris);
      g.fillStyle = gr; g.beginPath(); g.ellipse(32, 35, 14, 18, 0, 0, TAU); g.fill();
      g.fillStyle = dark ? '#3a1600' : '#0c0a10';
      g.beginPath(); g.ellipse(32, 36, dark ? 3 : 5, 8, 0, 0, TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(38, 27, 4.5, 0, TAU); g.fill();
      g.strokeStyle = '#0b0b10'; g.lineWidth = 5;
      g.beginPath(); g.ellipse(32, 34, 27, 21, 0, PI * 1.05, PI * 1.95); g.stroke();
    }, { wrap: false });
  }
  const eyeMat = (key, iris, dark) => M('eye' + key, () => new THREE.MeshBasicMaterial({
    map: texEye(key, iris, dark), alphaTest: 0.35, side: THREE.DoubleSide
  }));

  // ---------------------------------------------------------------- particle burst (per instance, fixed size, no leaks)
  const _bc = new THREE.Color();
  function Burst(n, o) {
    this.n = n; this.additive = !!o.additive;
    this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3); this.base = new Float32Array(n * 3);
    this.age = new Float32Array(n); this.life = new Float32Array(n);
    for (let i = 0; i < n; i++) this.pos[i * 3 + 1] = -1e4;
    const geo = new THREE.BufferGeometry();
    this.pa = new THREE.BufferAttribute(this.pos, 3); this.pa.setUsage(THREE.DynamicDrawUsage);
    this.ca = new THREE.BufferAttribute(this.col, 3); this.ca.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.pa); geo.setAttribute('color', this.ca);
    this.mat = new THREE.PointsMaterial({
      size: o.size || 0.1, map: o.flake ? texFlake() : DS.glowTex(), vertexColors: true,
      transparent: true, depthWrite: false, sizeAttenuation: true,
      blending: this.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    if (!this.additive) this.mat.alphaTest = 0.05;
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false; this.points.visible = false; this.points.renderOrder = 6;
    this.c1 = DS.C(o.color || '#ffffff'); this.c2 = DS.C(o.color2 || o.color || '#ffffff');
    this.gravity = o.gravity !== undefined ? o.gravity : -3;
    this.drag = o.drag !== undefined ? o.drag : 1.5;
    this.cursor = 0; this.active = false;
  }
  // init(pos, vel, o, k, count) writes position/velocity for particle offset o
  Burst.prototype.emit = function (count, life, init) {
    for (let k = 0; k < count; k++) {
      const i = this.cursor; this.cursor = (this.cursor + 1) % this.n;
      const o = i * 3;
      init(this.pos, this.vel, o, k, count);
      _bc.copy(this.c1).lerp(this.c2, Math.random());
      this.base[o] = _bc.r; this.base[o + 1] = _bc.g; this.base[o + 2] = _bc.b;
      this.age[i] = 0; this.life[i] = life * (0.7 + Math.random() * 0.5);
    }
    this.points.visible = true; this.active = true;
  };
  Burst.prototype.update = function (dt) {
    if (!this.active) return;
    const dr = Math.exp(-this.drag * dt), gv = this.gravity * dt;
    let any = false, maxF = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      const o = i * 3;
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) {
        this.life[i] = 0; this.pos[o + 1] = -1e4; this.col[o] = this.col[o + 1] = this.col[o + 2] = 0; continue;
      }
      any = true;
      this.vel[o] *= dr; this.vel[o + 1] = this.vel[o + 1] * dr + gv; this.vel[o + 2] *= dr;
      this.pos[o] += this.vel[o] * dt; this.pos[o + 1] += this.vel[o + 1] * dt; this.pos[o + 2] += this.vel[o + 2] * dt;
      const f = 1 - this.age[i] / this.life[i];
      if (f > maxF) maxF = f;
      const k = this.additive ? f : 1;
      this.col[o] = this.base[o] * k; this.col[o + 1] = this.base[o + 1] * k; this.col[o + 2] = this.base[o + 2] * k;
    }
    if (!this.additive) this.mat.opacity = min(1, maxF * 1.6);
    this.pa.needsUpdate = true; this.ca.needsUpdate = true;
    if (!any) { this.active = false; this.points.visible = false; }
  };
  Burst.prototype.clear = function () {
    for (let i = 0; i < this.n; i++) { this.life[i] = 0; this.pos[i * 3 + 1] = -1e4; }
    this.pa.needsUpdate = true; this.active = false; this.points.visible = false;
  };

  function dirSign(dir) {
    if (typeof dir === 'number') return Math.sign(dir);
    if (dir === 'left') return -1;
    if (dir === 'right') return 1;
    if (dir && typeof dir === 'object') return Math.sign(dir.x || 0);
    return 0;
  }
  const rand = (a, b) => a + Math.random() * (b - a);

  // ================================================================ KATANA (FPP view model)
  function arcGeo(L, rIn, rOut, N) {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = PI / 2 + L / 2 - t * L;
      pos.push(cos(a) * rIn, sin(a) * rIn, 0, cos(a) * rOut, sin(a) * rOut, 0);
      uv.push(t, 0, t, 1);
      if (i < N) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }
  const ARC_L = 2.6, ARC_IN = 0.68, ARC_OUT = 1.0;

  // swing keyframes: [dx,dy,dz, rx,ry,rz] windup W and end E; trail: [cx,cy,rotZ,flip]
  const SW = {
    right: { W: [-0.55, 0.2, 0.05, -0.6, 0, 1.2], E: [0.15, -0.15, -0.1, -1.1, 0, -1.6], tr: [-0.1, 0.0, -0.25, 1] },
    left: { W: [0.1, 0.15, 0.05, -0.6, 0, -1.0], E: [-0.7, -0.15, -0.1, -1.1, 0, 1.9], tr: [-0.2, 0.0, 0.25, -1] },
    down: { W: [-0.25, 0.3, 0.1, 0.5, 0, 0.1], E: [-0.3, -0.25, -0.15, -1.6, 0, 0.15], tr: [-0.85, 0.05, -PI / 2, 1] },
    xa: { W: [-0.5, 0.35, 0.05, -0.5, 0, 1.0], E: [0.1, -0.25, -0.1, -1.2, 0, -2.0], tr: [-0.1, 0.05, -0.6, 1] },
    xb: { W: [0.15, 0.35, 0.05, -0.5, 0, -0.9], E: [-0.65, -0.25, -0.1, -1.2, 0, 2.2], tr: [-0.2, 0.05, 0.6, -1] }
  };
  const REST_P = [0.45, -0.42, -0.8], REST_R = [-0.35, 0, 0.6];

  function katana() {
    const root = new THREE.Group(); root.name = 'katana';
    const hold = grp(root);
    const grip = grp(hold, REST_P[0], REST_P[1], REST_P[2]);
    const skin = DS.std('#f1c7a0', { roughness: 0.7 });
    const black = DS.std('#0d0e12', { metalness: 0.35, roughness: 0.32 });
    const edge = new THREE.MeshStandardMaterial({ color: DS.C('#9fd2ff'), emissive: DS.C('#4aa3ff'), emissiveIntensity: 0.9, metalness: 0.4, roughness: 0.2 });
    const wrapM = DS.std('#ffffff', { map: texWrap() });
    const tsubaM = DS.std('#ffffff', { map: texTsuba(), metalness: 0.3, roughness: 0.45 });
    const bronze = DS.std('#6e5a36', { metalness: 0.4, roughness: 0.4 });
    const nc = (geo, mat, x, y, z, p) => mesh(geo, mat, x, y, z, p, false);

    // handle, pommel, tsuba
    nc(new THREE.CylinderGeometry(0.019, 0.021, 0.27, 8), wrapM, 0, -0.01, 0, grip);
    nc(new THREE.CylinderGeometry(0.023, 0.021, 0.025, 8), black, 0, -0.155, 0, grip);
    nc(new THREE.CylinderGeometry(0.058, 0.058, 0.012, 20), tsubaM, 0, 0.135, 0, grip);
    const tr = nc(new THREE.TorusGeometry(0.056, 0.007, 6, 24), black, 0, 0.135, 0, grip); tr.rotation.x = PI / 2;
    nc(new THREE.BoxGeometry(0.03, 0.03, 0.02), bronze, 0, 0.155, 0, grip);
    // blade: 3 segments with slight curve
    let parent = grip, y0 = 0.17;
    const widths = [0.036, 0.033, 0.029];
    for (let i = 0; i < 3; i++) {
      const s = grp(parent, 0, y0, 0); s.rotation.z = i ? -0.035 : 0;
      const w = widths[i];
      nc(new THREE.BoxGeometry(w, 0.285, 0.009), black, 0, 0.14, 0, s);
      nc(new THREE.BoxGeometry(0.006, 0.285, 0.01), edge, w / 2 + 0.002, 0.14, 0, s);
      parent = s; y0 = 0.28;
    }
    const tip = nc(new THREE.CylinderGeometry(0, 0.021, 0.13, 4), black, 0, 0.345, 0, parent);
    tip.rotation.y = PI / 4; tip.scale.z = 0.25;
    // hand gripping the handle
    const hand = grp(grip, 0, -0.02, 0);
    nc(new THREE.BoxGeometry(0.075, 0.11, 0.07), skin, -0.03, 0, 0, hand);
    for (let i = 0; i < 4; i++) {
      const f = nc(new THREE.BoxGeometry(0.034, 0.024, 0.06), skin, 0.012, 0.04 - i * 0.027, 0.022, hand);
      f.rotation.y = 0.35;
    }
    const th = nc(new THREE.BoxGeometry(0.024, 0.07, 0.026), skin, -0.005, 0.05, 0.035, hand); th.rotation.z = -0.3;
    // sleeve rig (stretched between fixed anchor and wrist every frame)
    const uni = DS.std('#15161b');
    const hao = DS.std('#ffffff', { map: texChecker(), side: THREE.DoubleSide });
    const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
    const unitCyl2 = new THREE.CylinderGeometry(1, 1.35, 1, 12, 1, true);
    const forearm = nc(new THREE.CylinderGeometry(1, 1.1, 1, 8), skin, 0, 0, 0, hold);
    const sleeve = nc(unitCyl, uni, 0, 0, 0, hold);
    const haori = nc(unitCyl2, hao, 0, 0, 0, hold);
    const cuff = nc(new THREE.TorusGeometry(1, 0.12, 6, 16), uni, 0, 0, 0, hold);
    const ANCHOR = new THREE.Vector3(0.95, -1.05, -0.05);
    const _w = new THREE.Vector3(), _d = new THREE.Vector3(), _a = new THREE.Vector3(), _q = new THREE.Quaternion(), _qx = new THREE.Quaternion(), _xa = new THREE.Vector3(1, 0, 0);
    function place(m, a, b, r, t0, t1) {
      _d.subVectors(b, a); const len = _d.length();
      _a.copy(a).addScaledVector(_d, (t0 + t1) / 2);
      m.position.copy(_a); m.quaternion.setFromUnitVectors(UP, _d.multiplyScalar(1 / len));
      m.scale.set(r, len * (t1 - t0), r);
    }

    // trails
    const trailGeo = arcGeo(ARC_L, ARC_IN, ARC_OUT, 40);
    const baseTrailMat = new THREE.MeshBasicMaterial({ map: texTrail(), transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, opacity: 0 });
    const trails = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(trailGeo, baseTrailMat.clone());
      m.visible = false; m.renderOrder = 20; m.frustumCulled = false; root.add(m);
      trails.push({ m, t: 9, rot: 0, flip: 1 });
    }
    let trailIdx = 0;
    const drops = new Burst(140, { additive: true, color: '#e6f6ff', color2: '#3d8dff', size: 0.045, gravity: -2.2, drag: 1.4 });
    drops.points.material.depthTest = false; root.add(drops.points);
    let _tr = null;
    const dropInit = (p, v, o) => {
      const a = PI / 2 + ARC_L / 2 - Math.random() * ARC_L, r = rand(ARC_IN, ARC_OUT * 1.05) * 0.9;
      let x = cos(a) * r * _tr.flip, y = sin(a) * r;
      const c = cos(_tr.rot), s = sin(_tr.rot);
      const px = x * c - y * s, py = x * s + y * c;
      p[o] = _tr.m.position.x + px; p[o + 1] = _tr.m.position.y + py; p[o + 2] = _tr.m.position.z + rand(-0.1, 0.1);
      v[o] = px * rand(0.6, 1.6); v[o + 1] = py * rand(0.6, 1.6) + 0.3; v[o + 2] = rand(-0.4, 0.2);
    };
    function spawnTrail(cfg) {
      const T0 = trails[trailIdx]; trailIdx = (trailIdx + 1) % trails.length;
      T0.t = 0; T0.rot = cfg[2]; T0.flip = cfg[3];
      T0.m.position.set(cfg[0], cfg[1], -1.4);
      T0.m.visible = true;
      _tr = T0; drops.emit(26, 0.55, dropInit);
    }

    // spiral (final blow)
    const SPN = 140;
    const spGeo = (function () {
      const pos = [], uv = [], idx = [];
      for (let i = 0; i <= SPN; i++) {
        const t = i / SPN, a = t * TAU * 2.2, r = 0.35 + 1.15 * t, w = 0.18 + 0.32 * sin(PI * min(1, t * 1.3));
        const cz = -1.2 - 4.8 * t;
        pos.push(cos(a) * (r - w), sin(a) * (r - w) + 0.05, cz, cos(a) * (r + w), sin(a) * (r + w) + 0.05, cz);
        uv.push(t * 6, 0, t * 6, 1);
        if (i < SPN) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); return g;
    })();
    const spMat = new THREE.MeshBasicMaterial({ map: texSpiral(), transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, opacity: 0 });
    const spiral = new THREE.Mesh(spGeo, spMat); spiral.visible = false; spiral.frustumCulled = false; spiral.renderOrder = 21; root.add(spiral);
    const dragonHead = DS.halo('#bfe8ff', 1.1, 1); dragonHead.material.depthTest = false; dragonHead.visible = false; dragonHead.renderOrder = 22; root.add(dragonHead);
    const dragonCore = DS.halo('#ffffff', 0.45, 1); dragonCore.material.depthTest = false; dragonHead.add(dragonCore);
    let spT = 9, spHead = 0;
    const spInit = (p, v, o) => {
      const t = spHead, a = t * TAU * 2.2 + spiral.rotation.z, r = 0.35 + 1.15 * t;
      p[o] = cos(a) * r + rand(-0.15, 0.15); p[o + 1] = sin(a) * r + 0.05 + rand(-0.15, 0.15); p[o + 2] = -1.2 - 4.8 * t;
      v[o] = cos(a) * rand(0.5, 2); v[o + 1] = sin(a) * rand(0.5, 2) + 0.5; v[o + 2] = rand(-0.5, 0.5);
    };

    // pose state
    const pose = new Float32Array(6), from = new Float32Array(6);
    let sw = null, swT = 0, queue = null, fb = false;
    let vis = 1, visTarget = 1;
    function startSwing(key) { from.set(pose); sw = SW[key]; swT = 0; sw._spawned = false; }

    root.userData.slash = function (dir) {
      if (fb) return;
      if (dir === 'x') { startSwing('xa'); queue = 'xb'; }
      else { startSwing(SW[dir] ? dir : 'right'); queue = null; }
    };
    root.userData.finalBlow = function () {
      from.set(pose); fb = true; swT = 0; sw = null; queue = null;
      spT = 0; spiral.visible = true; spGeo.setDrawRange(0, 0); dragonHead.visible = true;
    };
    root.userData.setVisible = function (b) { visTarget = b ? 1 : 0; };
    root.userData.isBusy = () => !!sw || fb;

    root.userData.update = function (dt, time, bob) {
      // slide in/out
      if (vis !== visTarget) { vis += (visTarget > vis ? 1 : -1) * dt / 0.3; vis = clamp01(vis); }
      hold.visible = vis > 0.001;
      // swing
      if (fb) {
        swT += dt;
        const t = swT;
        if (t < 0.15) {
          const k = sm(t / 0.15);
          pose[0] = from[0] + (-0.2 - from[0]) * k; pose[1] = from[1] + (0.35 - from[1]) * k; pose[2] = from[2] + (0.1 - from[2]) * k;
          pose[3] = from[3] + (0.6 - from[3]) * k; pose[4] = 0; pose[5] = from[5] + (0 - from[5]) * k;
        } else if (t < 0.6) {
          const k = easeOut((t - 0.15) / 0.45), a = k * TAU;
          pose[0] = -0.2 + sin(a) * 0.3; pose[1] = 0.35 * cos(a) - 0.1 * k; pose[2] = -0.2 * k + 0.1 * (1 - k);
          pose[3] = 0.6 - 1.8 * min(1, k * 3); pose[5] = -a;
        } else {
          const k = sm((t - 0.6) / 0.3);
          pose[0] = -0.2 * (1 - k); pose[1] = -0.1 * (1 - k); pose[2] = -0.2 * (1 - k); pose[3] = -1.2 * (1 - k); pose[5] = 0;
          if (t >= 0.9) { fb = false; pose.fill(0); }
        }
      } else if (sw) {
        swT += dt;
        const t = swT, W = sw.W, E = sw.E;
        if (t < 0.08) { const k = sm(t / 0.08); for (let i = 0; i < 6; i++) pose[i] = from[i] + (W[i] - from[i]) * k; }
        else if (t < 0.23) {
          if (!sw._spawned) { sw._spawned = true; spawnTrail(sw.tr); }
          const k = easeOut((t - 0.08) / 0.15); for (let i = 0; i < 6; i++) pose[i] = W[i] + (E[i] - W[i]) * k;
          if (queue && t > 0.2) { const q = queue; queue = null; startSwing(q); }
        } else if (t < 0.35) { const k = sm((t - 0.23) / 0.12); for (let i = 0; i < 6; i++) pose[i] = E[i] * (1 - k); }
        else { sw = null; pose.fill(0); }
      }
      // apply
      const bx = bob ? bob.x || 0 : 0, by = bob ? bob.y || 0 : 0;
      const sway = sin(time * 1.3) * 0.012, sway2 = sin(time * 0.9 + 1) * 0.01;
      const hide = 1 - DS.smooth(vis);
      grip.position.set(REST_P[0] + pose[0] + sway + bx * 0.6 + hide * 0.3, REST_P[1] + pose[1] + sway2 + by * 0.6 - hide * 0.7, REST_P[2] + pose[2]);
      grip.rotation.set(REST_R[0] + pose[3] + sway2 * 2, REST_R[1] + pose[4], REST_R[2] + pose[5] + sway * 2 - hide * 0.6);
      // arm: wrist point slightly below grip along its axis
      _w.set(0, -0.07, 0).applyEuler(grip.rotation).add(grip.position);
      place(forearm, _w, ANCHOR, 0.042, 0, 0.18);
      place(sleeve, _w, ANCHOR, 0.056, 0.1, 0.7);
      place(haori, _w, ANCHOR, 0.1, 0.2, 1.0);
      _a.subVectors(ANCHOR, _w).normalize();
      cuff.position.copy(_w).addScaledVector(_a, 0.2 * _w.distanceTo(ANCHOR) * 0 + 0.1);
      cuff.quaternion.setFromUnitVectors(UP, _a); _qx.setFromAxisAngle(_xa, PI / 2); cuff.quaternion.multiply(_qx);
      cuff.scale.setScalar(0.058);
      // trails
      for (let i = 0; i < trails.length; i++) {
        const T0 = trails[i];
        if (!T0.m.visible) continue;
        T0.t += dt;
        const t = T0.t, e = easeOut(t / 0.12);
        T0.m.material.opacity = t < 0.05 ? t / 0.05 : max(0, 1 - (t - 0.05) / 0.35);
        T0.m.rotation.z = T0.rot + 0.55 * (1 - e) * T0.flip;
        const s = 0.9 + 0.12 * e;
        T0.m.scale.set(s * T0.flip, s, 1);
        if (t > 0.4) T0.m.visible = false;
      }
      // spiral
      if (spT < 1.2) {
        spT += dt;
        const rev = clamp01((spT - 0.1) / 0.45);
        spHead = rev;
        spGeo.setDrawRange(0, Math.floor(rev * SPN) * 6);
        spiral.rotation.z -= dt * 2.2;
        spMat.opacity = spT < 0.15 ? spT / 0.15 : spT < 0.6 ? 1 : max(0, 1 - (spT - 0.6) / 0.35);
        const a = rev * TAU * 2.2 + spiral.rotation.z, r = 0.35 + 1.15 * rev;
        dragonHead.position.set(cos(a) * r, sin(a) * r + 0.05, -1.2 - 4.8 * rev);
        dragonHead.material.opacity = spMat.opacity;
        dragonCore.material.opacity = spMat.opacity;
        if (rev > 0 && rev < 1) drops.emit(3, 0.6, spInit);
        if (spT >= 1.0) { spiral.visible = false; dragonHead.visible = false; spT = 9; }
      }
      drops.update(dt);
    };
    root.userData.update(0, 0);
    return root;
  }

  // ================================================================ LESSER DEMON
  const DEMON_PAL = [
    { skin: '#7c6d8c', eye: '#ffd23a' },
    { skin: '#6f8a56', eye: '#ff3b2f' },
    { skin: '#5d5272', eye: '#ffb02a' }
  ];
  function demonMats(v) {
    return M('demon' + v, () => ({
      skin: DS.std(DEMON_PAL[v].skin, { roughness: 0.75 }),
      dark: DS.std('#2a2331'),
      cloth: DS.std('#ffffff', { map: texTorn(), alphaTest: 0.5, side: THREE.DoubleSide }),
      horn: DS.std('#d8ccb0', { roughness: 0.5 }),
      claw: DS.std('#1a1418', { roughness: 0.4 }),
      eye: DS.glow(DEMON_PAL[v].eye, 3),
      mouth: DS.std('#3a0a12'),
      teeth: DS.std('#f1ead8', { roughness: 0.4 })
    }));
  }
  // arm: returns {sh, el, hand}
  function demonArm(parent, m, x, y, side, r, l1, l2, clawLen) {
    const sh = grp(parent, x, y, 0);
    mesh(sph(r * 1.25, 8, 6), m.skin, 0, 0, 0, sh);
    mesh(seg(r, r * 0.8, l1, 7), m.skin, 0, 0, 0, sh);
    const el = grp(sh, 0, -l1, 0);
    mesh(seg(r * 0.8, r * 0.62, l2, 7), m.skin, 0, 0, 0, el);
    const hand = grp(el, 0, -l2, 0);
    mesh(box(r * 1.6, r * 1.7, r * 0.9), m.skin, 0, -r * 0.6, 0, hand);
    for (let i = 0; i < 4; i++) {
      const c = mesh(cone(0.02, clawLen, 5), m.claw, (i - 1.5) * r * 0.45, -r * 1.4 - clawLen / 2, 0.02, hand);
      c.rotation.x = PI + 0.25; c.rotation.z = (i - 1.5) * 0.08;
    }
    sh.rotation.z = side * 0.12;
    return { sh, el, hand };
  }
  function demonLeg(parent, m, x, l1, l2, r) {
    const hip = grp(parent, x, 0, 0);
    mesh(seg(r, r * 0.75, l1, 7), m.skin, 0, 0, 0, hip);
    const kn = grp(hip, 0, -l1, 0);
    mesh(sph(r * 0.8, 7, 5), m.skin, 0, 0, 0, kn);
    mesh(seg(r * 0.75, r * 0.55, l2, 7), m.skin, 0, 0, 0, kn);
    const ft = mesh(box(r * 1.5, 0.08, 0.3), m.skin, 0, -l2 - 0.03, 0.07, kn);
    for (let i = 0; i < 3; i++) { const c = mesh(cone(0.022, 0.09, 4), m.claw, (i - 1) * r * 0.45, -l2 - 0.05, 0.25, kn); c.rotation.x = PI / 2; }
    return { hip, kn, ft };
  }
  function demonHead(parent, m, y, r, horns, v) {
    const neck = grp(parent, 0, y, 0);
    mesh(seg(r * 0.45, r * 0.5, 0.14, 6), m.skin, 0, 0.14, 0, neck);
    const head = grp(neck, 0, 0.12, 0);
    const sk = mesh(sph(r, 9, 7), m.skin, 0, r * 0.9, 0, head); sk.scale.set(0.9, 1.08, 1);
    const brow = mesh(box(r * 1.6, r * 0.25, r * 0.4), m.skin, 0, r * 1.05, r * 0.72, head); brow.rotation.x = 0.3;
    for (let s = -1; s <= 1; s += 2) mesh(sph(r * 0.16, 6, 4), m.eye, s * r * 0.38, r * 0.88, r * 0.86, head);
    const halo = DS.halo(DEMON_PAL[v].eye, r * 3.2, 0.75); halo.position.set(0, r * 0.9, r * 1.0); head.add(halo);
    const jaw = grp(head, 0, r * 0.45, r * 0.2);
    mesh(box(r * 1.2, r * 0.32, r * 0.9), m.skin, 0, -r * 0.1, r * 0.35, jaw);
    mesh(box(r * 1.0, r * 0.12, r * 0.2), m.mouth, 0, r * 0.08, r * 0.75, jaw);
    for (let i = 0; i < 5; i++) { const t = mesh(cone(r * 0.07, r * 0.2, 4), m.teeth, (i - 2) * r * 0.2, r * 0.18, r * 0.78, jaw); }
    if (horns === 2) {
      for (let s = -1; s <= 1; s += 2) {
        const h1 = grp(head, s * r * 0.55, r * 1.55, 0); h1.rotation.z = -s * 0.7; h1.rotation.x = -0.2;
        mesh(cone(r * 0.28, r * 1.3, 6), m.horn, 0, r * 0.6, 0, h1);
        const h2 = grp(h1, 0, r * 1.1, 0); h2.rotation.z = s * 0.9;
        mesh(cone(r * 0.16, r * 0.9, 5), m.horn, 0, r * 0.4, 0, h2);
      }
    } else if (horns === 1) {
      const h1 = mesh(cone(r * 0.25, r * 1.2, 6), m.horn, 0, r * 2.1, r * 0.2, head); h1.rotation.x = -0.35;
      for (let s = -1; s <= 1; s += 2) { const n = mesh(cone(r * 0.12, r * 0.4, 5), m.horn, s * r * 0.6, r * 1.6, 0, head); n.rotation.z = -s * 0.6; }
    }
    return { neck, head, jaw };
  }

  function demon(variant) {
    const v = ((variant | 0) % 3 + 3) % 3;
    const m = demonMats(v);
    const root = new THREE.Group(); root.name = 'demon' + v;
    const body = grp(root);
    const P = { arms: [] };
    if (v === 0) { // tall horned
      const hips = grp(body, 0, 1.15, 0); P.hips = hips;
      P.legs = [demonLeg(hips, m, 0.14, 0.55, 0.52, 0.11), demonLeg(hips, m, -0.14, 0.55, 0.52, 0.11)];
      mesh(box(0.36, 0.2, 0.24), m.dark, 0, 0.02, 0, hips);
      const robe = mesh(cyl(0.26, 0.36, 0.62, 10, true), m.cloth, 0, -0.26, 0, hips);
      const torso = grp(hips, 0, 0.08, 0); P.torso = torso;
      const ch = mesh(segUp(0.2, 0.32, 0.74, 8), m.skin, 0, 0, 0, torso); ch.scale.z = 0.72;
      for (let i = 0; i < 3; i++) mesh(box(0.34 - i * 0.04, 0.03, 0.05), m.dark, 0, 0.36 + i * 0.1, 0.2, torso);
      const scarf = mesh(cyl(0.3, 0.36, 0.26, 10, true), m.cloth, 0, 0.62, 0, torso); scarf.rotation.y = 0.8;
      Object.assign(P, demonHead(torso, m, 0.74, 0.19, 2, v));
      P.arms.push(demonArm(torso, m, 0.36, 0.68, 1, 0.07, 0.5, 0.48, 0.22));
      P.arms.push(demonArm(torso, m, -0.36, 0.68, -1, 0.07, 0.5, 0.48, 0.22));
    } else if (v === 1) { // hunched multi-arm
      const hips = grp(body, 0, 1.0, 0); P.hips = hips;
      P.legs = [demonLeg(hips, m, 0.17, 0.5, 0.47, 0.12), demonLeg(hips, m, -0.17, 0.5, 0.47, 0.12)];
      P.legs[0].hip.rotation.z = 0.15; P.legs[1].hip.rotation.z = -0.15;
      P.legs[0].kn.rotation.z = -0.15; P.legs[1].kn.rotation.z = 0.15;
      mesh(cyl(0.3, 0.4, 0.55, 10, true), m.cloth, 0, -0.18, 0, hips);
      const torso = grp(hips, 0, 0.05, 0); torso.rotation.x = 0.55; P.torso = torso;
      const ch = mesh(segUp(0.24, 0.36, 0.7, 8), m.skin, 0, 0, 0, torso); ch.scale.z = 0.8;
      const hump = mesh(sph(0.3, 8, 6), m.skin, 0, 0.55, -0.16, torso); hump.scale.set(1.1, 0.9, 0.9);
      for (let i = 0; i < 4; i++) { const sp = mesh(cone(0.05, 0.22, 5), m.horn, 0, 0.35 + i * 0.13, -0.3 - (i === 1 || i === 2 ? 0.08 : 0), torso); sp.rotation.x = -1.1; }
      Object.assign(P, demonHead(torso, m, 0.66, 0.2, 1, v));
      P.neck.rotation.x = -0.35;
      P.arms.push(demonArm(torso, m, 0.4, 0.6, 1, 0.075, 0.46, 0.46, 0.24));
      P.arms.push(demonArm(torso, m, -0.4, 0.6, -1, 0.075, 0.46, 0.46, 0.24));
      P.arms.push(demonArm(torso, m, 0.3, 0.3, 1, 0.055, 0.3, 0.32, 0.16));
      P.arms.push(demonArm(torso, m, -0.3, 0.3, -1, 0.055, 0.3, 0.32, 0.16));
      for (let i = 0; i < 4; i++) { P.arms[i].sh.rotation.x = -0.55 - (i > 1 ? 0.5 : 0.1); P.arms[i].el.rotation.x = -0.5; }
    } else { // crawler with big jaw
      body.scale.setScalar(1.22);
      const hips = grp(body, 0, 0.82, 0); P.hips = hips;
      P.legs = [demonLeg(hips, m, 0.2, 0.5, 0.5, 0.12), demonLeg(hips, m, -0.2, 0.5, 0.5, 0.12)];
      for (let i = 0; i < 2; i++) { P.legs[i].hip.rotation.x = -0.9; P.legs[i].kn.rotation.x = 1.4; P.legs[i].hip.rotation.z = i ? -0.25 : 0.25; }
      mesh(cyl(0.3, 0.38, 0.4, 10, true), m.cloth, 0, -0.1, 0, hips);
      const torso = grp(hips, 0, 0.04, 0); torso.rotation.x = 0.85; P.torso = torso;
      const ch = mesh(segUp(0.26, 0.38, 0.72, 8), m.skin, 0, 0, 0, torso); ch.scale.z = 0.78;
      for (let i = 0; i < 5; i++) { const sp = mesh(cone(0.06, 0.3 - abs(i - 2) * 0.04, 5), m.horn, 0, 0.1 + i * 0.15, -0.3, torso); sp.rotation.x = -1.0; }
      const H = demonHead(torso, m, 0.66, 0.26, 0, v);
      Object.assign(P, H);
      P.neck.rotation.x = -0.75;
      // oversized jaw with teeth rows
      const bigJaw = grp(P.head, 0, 0.12, 0.08); P.jaw = bigJaw;
      mesh(box(0.42, 0.14, 0.48), m.skin, 0, -0.06, 0.2, bigJaw);
      mesh(box(0.34, 0.05, 0.4), m.mouth, 0, 0.02, 0.2, bigJaw);
      for (let i = 0; i < 7; i++) {
        const t = mesh(cone(0.028, 0.11, 4), m.teeth, (i - 3) * 0.055, 0.07, 0.4 - abs(i - 3) * 0.03, bigJaw);
        if (i % 2) t.scale.y = 0.7;
      }
      for (let i = 0; i < 6; i++) { const t = mesh(cone(0.026, 0.1, 4), m.teeth, (i - 2.5) * 0.06, 0.15, 0.3, P.head); t.rotation.x = PI; }
      P.arms.push(demonArm(torso, m, 0.4, 0.58, 1, 0.085, 0.62, 0.62, 0.22));
      P.arms.push(demonArm(torso, m, -0.4, 0.58, -1, 0.085, 0.62, 0.62, 0.22));
      for (let i = 0; i < 2; i++) { P.arms[i].sh.rotation.x = -1.35; P.arms[i].el.rotation.x = -0.25; }
    }
    const shadow = DS.shadowBlob(1.4, 1.2, 0.45); root.add(shadow);

    const ash = new Burst(70, { color: '#2a2230', color2: '#5b4a57', size: 0.09, gravity: 0.6, drag: 1.2, flake: true });
    const emb = new Burst(50, { additive: true, color: '#ff6a1f', color2: '#ffd070', size: 0.07, gravity: 1.2, drag: 1.0 });
    root.add(ash.points); root.add(emb.points);
    const seed = Math.random() * 100;
    const baseArmX = P.arms.map((a) => a.sh.rotation.x);
    let kT = -1, kvx = 0, kvy = 0, kvz = 0, ks = 0;
    root.userData.done = false;
    const ashInit = (p, vv, o) => {
      const s = body.scale.y;
      p[o] = body.position.x + rand(-0.45, 0.45); p[o + 1] = body.position.y + rand(0.2, 2.2) * max(0.3, s); p[o + 2] = body.position.z + rand(-0.3, 0.3);
      vv[o] = rand(-0.8, 0.8) + kvx * 0.2; vv[o + 1] = rand(0.3, 1.6); vv[o + 2] = rand(-0.8, 0.5) + kvz * 0.15;
    };

    root.userData.knock = function (dir) {
      if (kT >= 0) return;
      ks = dirSign(dir); kT = 0;
      kvx = ks * 2.6; kvy = 2.6; kvz = -5.2;
      ash.emit(28, 0.6, ashInit); emb.emit(18, 0.5, ashInit);
    };
    root.userData.reset = function () {
      kT = -1; root.userData.done = false; root.visible = true;
      body.position.set(0, 0, 0); body.rotation.set(0, 0, 0); body.visible = true;
      body.scale.setScalar(v === 2 ? 1.22 : 1); shadow.visible = true; ash.clear(); emb.clear();
    };
    root.userData.update = function (dt, time) {
      const t = time + seed;
      if (kT >= 0) {
        kT += dt;
        kvy -= 9 * dt;
        body.position.x += kvx * dt; body.position.y = max(0, body.position.y + kvy * dt); body.position.z += kvz * dt;
        body.rotation.x -= 3.5 * dt; body.rotation.z -= ks * 2.5 * dt;
        const s = 1 - sm((kT - 0.12) / 0.55);
        body.scale.setScalar(max(0.001, s) * (v === 2 ? 1.22 : 1));
        shadow.visible = false;
        if (kT < 0.55) { ash.emit(2, 0.35, ashInit); emb.emit(1, 0.35, ashInit); }
        if (kT > 0.67) body.visible = false;
        ash.update(dt); emb.update(dt);
        if (kT >= 0.85 && !root.userData.done) { root.userData.done = true; root.visible = false; }
        return;
      }
      // idle
      P.torso.scale.set(1 + sin(t * 2.2) * 0.02, 1 + sin(t * 2.2) * 0.03, 1);
      P.head.rotation.z = sin(t * 0.9) * 0.16;
      P.head.rotation.x = sin(t * 0.7 + 1) * 0.08;
      for (let i = 0; i < P.arms.length; i++) {
        const a = P.arms[i];
        const tw = Math.pow(abs(sin(t * 1.7 + i * 1.3)), 8);
        a.hand.rotation.x = sin(t * 11 + i) * 0.15 * tw - 0.1;
        a.sh.rotation.x = baseArmX[i] + sin(t * 1.4 + i) * 0.07;
      }
      if (v === 2) P.jaw.rotation.x = 0.2 + 0.25 * max(0, sin(t * 2.6));
      else P.jaw.rotation.x = 0.1 + 0.1 * max(0, sin(t * 1.9));
      P.hips.position.y += 0;
      ash.update(dt); emb.update(dt);
    };
    return root;
  }

  // ================================================================ FLESH TENTACLE
  function tentacle() {
    const m = M('tentacle', () => ({
      flesh: DS.std('#ffffff', { map: texFlesh(), roughness: 0.55 }),
      dark: DS.std('#7a1a2c', { roughness: 0.6 }),
      cut: DS.std('#9b1a2a', { emissive: DS.C('#5a0010'), emissiveIntensity: 0.6 }),
      scl: DS.std('#f4e6c8', { roughness: 0.3 }),
      iris: DS.glow('#ff2d4a', 2.5),
      pup: DS.std('#120308'),
      teeth: DS.std('#f3ecd8')
    }));
    const root = new THREE.Group(); root.name = 'tentacle';
    const stem = grp(root);
    const N = 8, L = 0.4, CUT = 4;
    const mound = mesh(sph(0.62, 10, 6), m.flesh, 0, 0, 0, stem); mound.scale.set(1, 0.35, 0.9);
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + 0.4, r = mesh(cone(0.12, 0.5, 6), m.flesh, cos(a) * 0.42, 0.06, sin(a) * 0.38, stem);
      r.rotation.set(sin(a) * 1.3, 0, -cos(a) * 1.3);
    }
    const segs = [], meshes = [];
    let parent = stem;
    for (let i = 0; i < N; i++) {
      const rb = 0.52 - i * 0.045, rt = 0.52 - (i + 1) * 0.045;
      const g = grp(parent, 0, i === 0 ? 0.08 : L, 0);
      const mm = mesh(segUp(rb, rt, L + 0.06, 10), m.flesh, 0, 0, 0, g); meshes.push(mm);
      mesh(sph(rb * 1.02, 10, 6), m.flesh, 0, 0, 0, g);
      if (i === 2 || i === 4 || i === 6) { // eye nub
        const a = i * 1.7, r = rb * 0.92;
        const e = grp(g, sin(a) * r, L * 0.5, cos(a) * r); e.rotation.y = a;
        mesh(sph(0.1, 8, 6), m.scl, 0, 0, 0, e);
        mesh(sph(0.055, 8, 6), m.iris, 0, 0, 0.065, e);
        mesh(sph(0.025, 6, 4), m.pup, 0, 0, 0.11, e);
      }
      if (i === 1 || i === 3 || i === 5) { // mouth nub
        const a = i * 1.7 + 2.4, r = rb * 0.95;
        const mo = grp(g, sin(a) * r, L * 0.5, cos(a) * r); mo.rotation.y = a;
        mesh(torus(0.08, 0.035, 6, 12), m.dark, 0, 0, 0, mo);
        mesh(sph(0.06, 6, 4), m.pup, 0, 0, -0.01, mo);
        for (let k = 0; k < 4; k++) { const tt = mesh(cone(0.015, 0.05, 4), m.teeth, (k - 1.5) * 0.03, 0.045, 0.02, mo); tt.rotation.x = PI; }
      }
      segs.push(g); parent = g;
    }
    // tip: bulb with claws + eye
    const tip = grp(parent, 0, L, 0);
    mesh(sph(0.22, 9, 7), m.flesh, 0, 0.1, 0, tip);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * TAU, f = grp(tip, sin(a) * 0.16, 0.15, cos(a) * 0.16); f.rotation.set(cos(a) * 0.7, 0, -sin(a) * 0.7);
      mesh(segUp(0.06, 0.03, 0.3, 6), m.flesh, 0, 0, 0, f);
      const c = mesh(cone(0.03, 0.14, 5), m.pup, 0, 0.36, 0.02, f); c.rotation.x = 0.4;
    }
    mesh(sph(0.1, 8, 6), m.scl, 0, 0.2, 0.15, tip); mesh(sph(0.06, 8, 6), m.iris, 0, 0.21, 0.22, tip);
    const halo = DS.halo('#ff3050', 0.6, 0.6); halo.position.set(0, 0.2, 0.3); tip.add(halo);
    // cut caps
    const capLow = mesh(cyl(0.34, 0.34, 0.02, 10), m.cut, 0, L + 0.03, 0, segs[CUT - 1]); capLow.visible = false;
    const capHigh = mesh(cyl(0.34, 0.34, 0.02, 10), m.cut, 0, 0.01, 0, segs[CUT]); capHigh.visible = false;
    const shadow = DS.shadowBlob(1.5, 1.5, 0.45); root.add(shadow);

    const ash = new Burst(80, { color: '#3a1418', color2: '#7a2a34', size: 0.1, gravity: 0.5, drag: 1.2, flake: true });
    const emb = new Burst(60, { additive: true, color: '#ff3a20', color2: '#ffb050', size: 0.08, gravity: 1.2, drag: 1.0 });
    root.add(ash.points); root.add(emb.points);
    const top = segs[CUT], seed = Math.random() * 50;
    let cT = -1, tvx = 0, tvy = 0, tvz = 0, ts = 0;
    root.userData.done = false;
    const lowInit = (p, v, o) => {
      const s = stem.scale.y;
      p[o] = rand(-0.4, 0.4); p[o + 1] = rand(0.05, 1.7) * s; p[o + 2] = rand(-0.4, 0.4);
      v[o] = rand(-0.7, 0.7); v[o + 1] = rand(0.4, 1.6); v[o + 2] = rand(-0.7, 0.7);
    };
    const topInit = (p, v, o) => {
      p[o] = top.position.x + rand(-0.35, 0.35); p[o + 1] = top.position.y + rand(0, 1.3) * top.scale.y; p[o + 2] = top.position.z + rand(-0.35, 0.35);
      v[o] = tvx * 0.3 + rand(-0.6, 0.6); v[o + 1] = rand(0.2, 1.4); v[o + 2] = rand(-0.6, 0.6);
    };
    root.userData.slash = function (dir) {
      if (cT >= 0) return;
      root.updateMatrixWorld(true);
      root.attach(top);
      ts = dirSign(dir); if (dir === 'down' || !ts) ts = Math.random() < 0.5 ? -1 : 1;
      tvx = ts * 2.4; tvy = 3.6; tvz = -1.2;
      capLow.visible = capHigh.visible = true;
      cT = 0;
      ash.emit(24, 0.55, lowInit); ash.emit(20, 0.55, topInit); emb.emit(24, 0.5, lowInit);
    };
    root.userData.reset = function () {
      if (top.parent !== segs[CUT - 1]) segs[CUT - 1].add(top);
      top.position.set(0, L, 0); top.rotation.set(0, 0, 0); top.scale.set(1, 1, 1);
      stem.scale.set(1, 1, 1); stem.visible = true; top.visible = true;
      capLow.visible = capHigh.visible = false; shadow.visible = true;
      cT = -1; root.userData.done = false; root.visible = true; ash.clear(); emb.clear();
    };
    root.userData.update = function (dt, time) {
      const t = time + seed;
      const amp = cT >= 0 ? 0.4 : 1;
      for (let i = 0; i < N; i++) {
        if (cT >= 0 && i >= CUT) break;
        const g = segs[i];
        g.rotation.z = sin(t * 1.3 + i * 0.45) * 0.09 * amp;
        g.rotation.x = sin(t * 1.1 + i * 0.6 + 1) * 0.07 * amp;
        const pl = 1 + 0.06 * sin(t * 4 - i * 0.8);
        meshes[i].scale.set(pl, 1, pl);
      }
      if (cT >= 0) {
        cT += dt;
        tvy -= 9 * dt;
        top.position.x += tvx * dt; top.position.y += tvy * dt; top.position.z += tvz * dt;
        top.rotation.z -= ts * 4 * dt; top.rotation.x -= 2 * dt;
        const s = max(0.001, 1 - sm((cT - 0.15) / 0.6));
        top.scale.setScalar(s); stem.scale.set(s, s, s); shadow.visible = s > 0.3;
        if (cT < 0.5) { ash.emit(2, 0.35, lowInit); emb.emit(2, 0.35, topInit); }
        if (cT > 0.75) { stem.visible = false; top.visible = false; }
        if (cT >= 0.85 && !root.userData.done) { root.userData.done = true; root.visible = false; }
      }
      ash.update(dt); emb.update(dt);
    };
    return root;
  }

  // ================================================================ UPPER-MOON BOSS
  function boss() {
    const S = 3.4 / 1.9;
    const skin = DS.std('#ffffff', { map: texTattoo(), roughness: 0.62, emissive: DS.C('#ffffff'), emissiveIntensity: 0 });
    const pants = DS.std('#1c2342', { emissive: DS.C('#ffffff'), emissiveIntensity: 0 });
    const hair = DS.std('#8a1f5a', { roughness: 0.6, emissive: DS.C('#ffffff'), emissiveIntensity: 0 });
    const sash = DS.std('#ffffff', { map: texSash(), emissive: DS.C('#ffffff'), emissiveIntensity: 0 });
    const white = DS.std('#e8edf5', { emissive: DS.C('#ffffff'), emissiveIntensity: 0 });
    const lips = DS.std('#5a2238', { emissive: DS.C('#ffffff'), emissiveIntensity: 0 });
    const mats = [skin, pants, hair, sash, white, lips];
    const eyeM = new THREE.MeshBasicMaterial({ map: texEye('boss', '#ffd84a', true), alphaTest: 0.35, side: THREE.DoubleSide, transparent: false });

    const root = new THREE.Group(); root.name = 'boss';
    const body = grp(root); body.scale.setScalar(S);
    const hips = grp(body, 0, 0.98, 0);
    mesh(box(0.34, 0.2, 0.24), pants, 0, -0.02, 0, hips);
    const sashM = mesh(cyl(0.2, 0.2, 0.1, 12), sash, 0, 0.08, 0, hips); sashM.scale.z = 0.8;
    const knot = mesh(box(0.08, 0.2, 0.03), sash, 0.06, -0.06, 0.16, hips); knot.rotation.z = 0.15;
    const legs = [];
    for (let s = -1; s <= 1; s += 2) {
      const hp = grp(hips, s * 0.12, -0.04, 0);
      mesh(seg(0.14, 0.15, 0.47, 9), pants, 0, 0, 0, hp);
      const kn = grp(hp, 0, -0.47, 0);
      mesh(sph(0.145, 8, 6), pants, 0, 0, 0, kn);
      mesh(seg(0.15, 0.175, 0.4, 9), pants, 0, 0, 0, kn);
      mesh(cyl(0.06, 0.065, 0.05, 8), white, 0, -0.43, 0, kn);
      mesh(box(0.1, 0.07, 0.22), skin, 0, -0.47, 0.05, kn);
      legs.push({ hp, kn });
    }
    const spine = grp(hips, 0, 0.1, 0);
    const waist = mesh(segUp(0.17, 0.21, 0.26, 9), skin, 0, 0, 0, spine); waist.scale.z = 0.78;
    for (let r = 0; r < 3; r++) for (let s = -1; s <= 1; s += 2) mesh(box(0.07, 0.06, 0.03), skin, s * 0.045, 0.05 + r * 0.07, 0.15, spine);
    const chest = grp(spine, 0, 0.25, 0);
    const chM = mesh(segUp(0.23, 0.36, 0.36, 10), skin, 0, 0, 0, chest); chM.scale.z = 0.7;
    for (let s = -1; s <= 1; s += 2) {
      const pec = mesh(sph(0.135, 9, 7), skin, s * 0.11, 0.24, 0.13, chest); pec.scale.set(1.1, 0.8, 0.6);
      const trap = mesh(sph(0.1, 7, 5), skin, s * 0.16, 0.36, -0.02, chest); trap.scale.set(1.3, 0.6, 1);
    }
    mesh(cyl(0.07, 0.08, 0.12, 8), skin, 0, 0.42, 0, chest);
    const head = grp(chest, 0, 0.46, 0);
    const hd = mesh(sph(0.13, 12, 10), skin, 0, 0.12, 0, head); hd.scale.set(0.9, 1.1, 1);
    const jaw = mesh(box(0.16, 0.08, 0.13), skin, 0, 0.03, 0.03, head);
    for (let s = -1; s <= 1; s += 2) {
      const e = mesh(plane(0.06, 0.05), eyeM, s * 0.047, 0.14, 0.118, head, false); e.rotation.y = s * 0.25;
      const br = mesh(box(0.06, 0.012, 0.02), hair, s * 0.047, 0.175, 0.118, head); br.rotation.z = -s * 0.3;
    }
    mesh(box(0.05, 0.01, 0.01), lips, 0, 0.06, 0.1, head);
    const eyeHalo = DS.halo('#ffd84a', 0.28, 0.6); eyeHalo.position.set(0, 0.14, 0.16); head.add(eyeHalo);
    const cap = mesh(G('bossCap', () => new THREE.SphereGeometry(0.138, 12, 8, 0, TAU, 0, PI * 0.55)), hair, 0, 0.14, -0.005, head);
    cap.scale.set(0.95, 1.1, 1.05);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU, up = i % 3 === 0 ? 0.3 : 0.9;
      const sp = mesh(cone(0.04, 0.16, 5), hair, sin(a) * 0.09, 0.22 + (i % 2) * 0.03, cos(a) * 0.09 - 0.02, head);
      sp.rotation.set(cos(a) * up, 0, -sin(a) * up);
      if (cos(a) > 0.6) { sp.rotation.x = 0.9; sp.position.y = 0.23; }
    }
    const arms = [];
    for (let s = -1; s <= 1; s += 2) {
      const sh = grp(chest, s * 0.4, 0.29, 0);
      mesh(sph(0.12, 8, 6), skin, 0, 0, 0, sh);
      mesh(seg(0.09, 0.075, 0.32, 8), skin, 0, 0, 0, sh);
      const el = grp(sh, 0, -0.32, 0);
      mesh(seg(0.078, 0.062, 0.28, 8), skin, 0, 0, 0, el);
      mesh(cyl(0.066, 0.066, 0.04, 8), white, 0, -0.26, 0, el);
      const fist = mesh(box(0.12, 0.12, 0.13), skin, 0, -0.33, 0.01, el);
      arms.push({ sh, el, fist });
    }
    // aura
    const auraMat = new THREE.MeshBasicMaterial({ map: texSnowflake(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.75, side: THREE.DoubleSide });
    const aura = new THREE.Mesh(plane(3.6, 3.6), auraMat); aura.position.set(0, 2.3, -0.7); aura.renderOrder = 3; root.add(aura);
    const auraHalo = DS.halo('#ff7ad0', 3.2, 0.35); auraHalo.position.set(0, 2.3, -0.75); root.add(auraHalo);
    const shadow = DS.shadowBlob(1.8, 1.4, 0.5); root.add(shadow);
    const emb = new Burst(220, { additive: true, color: '#ff6a1a', color2: '#ffd27a', size: 0.12, gravity: 1.8, drag: 0.8 });
    const ash = new Burst(90, { color: '#261c22', color2: '#5a4048', size: 0.13, gravity: 1.2, drag: 0.8, flake: true });
    root.add(emb.points); root.add(ash.points);
    const dieInit = (p, v, o) => {
      p[o] = rand(-0.7, 0.7); p[o + 1] = rand(0.1, 2.6) * body.scale.y / S; p[o + 2] = rand(-0.4, 0.5);
      v[o] = rand(-0.4, 0.4); v[o + 1] = rand(0.8, 2.4); v[o + 2] = rand(-0.4, 0.4);
    };

    // joint targets: 0 hipsY 1 spineX 2 spineY 3 headX 4 sLx 5 sLz 6 eLx 7 sRx 8 sRz 9 eRx 10 lLx 11 kLx 12 lRx 13 kRx 14 bodyZ 15 lLz 16 lRz
    const NJ = 17, cur = new Float32Array(NJ), tgt = new Float32Array(NJ);
    const IDLE = [0.95, 0.08, 0.2, 0, -1.0, 0.25, -1.3, -0.5, -0.3, -2.1, -0.35, 0.45, 0.25, 0.35, 0, 0.12, -0.12];
    cur.set(IDLE);
    // arms: index 0 = s=-1 (character's right, -X), 1 = s=+1 (left, +X)
    const aR = arms[0], aL = arms[1], lR = legs[0], lL = legs[1];
    let state = 'idle', sT = 0, flash = 0, auraS = 1, dead = false;
    root.userData.done = false;
    root.userData.state = 'idle';
    function setState(s) {
      if (dead && s !== 'reset') return;
      state = s; sT = 0; root.userData.state = s;
      if (s === 'hit') flash = 0.15;
      if (s === 'die') {
        dead = true;
        for (let i = 0; i < mats.length; i++) { mats[i].transparent = true; mats[i].needsUpdate = true; }
      }
    }
    root.userData.setState = setState;
    root.userData.reset = function () {
      dead = false; root.userData.done = false; body.visible = true; body.scale.setScalar(S);
      for (let i = 0; i < mats.length; i++) { mats[i].transparent = false; mats[i].opacity = 1; mats[i].emissiveIntensity = 0; mats[i].needsUpdate = true; }
      aura.visible = auraHalo.visible = true; auraMat.opacity = 0.75; shadow.visible = true;
      emb.clear(); ash.clear(); cur.set(IDLE); setState('idle');
    };

    root.userData.update = function (dt, time) {
      sT += dt;
      tgt.set(IDLE);
      let k = 14, shake = 0, auraT = 1, glow = 0, glowHex = 0;
      const bounce = abs(sin(time * 4.5));
      tgt[0] = 0.95 - bounce * 0.035;
      tgt[3] = sin(time * 1.1) * 0.05;
      if (state === 'punch') {
        k = 30;
        if (sT < 0.12) { tgt[2] = -0.35; tgt[7] = -0.3; tgt[8] = -0.35; tgt[9] = -2.2; tgt[14] = -0.1; }
        else if (sT < 0.28) { k = 45; tgt[2] = 0.45; tgt[7] = -1.55; tgt[8] = 0.05; tgt[9] = -0.05; tgt[14] = 0.35; tgt[1] = 0.2; tgt[10] = -0.6; tgt[11] = 0.6; }
        else if (sT >= 0.5) setState('idle');
      } else if (state === 'hit') {
        k = 30;
        tgt[1] = -0.35; tgt[3] = -0.3; tgt[14] = -0.3; tgt[4] = -0.4; tgt[7] = -0.3; tgt[5] = 0.6; tgt[8] = -0.6;
        if (sT >= 0.4) setState('idle');
      } else if (state === 'enrage') {
        k = 8;
        tgt[1] = -0.15; tgt[3] = -0.25; tgt[4] = -0.2; tgt[5] = 1.25; tgt[6] = -0.4; tgt[7] = -0.2; tgt[8] = -1.25; tgt[9] = -0.4;
        tgt[0] = 0.92; shake = 0.012; auraT = 1.6; glow = 0.25 + 0.15 * sin(time * 10); glowHex = 1;
      } else if (state === 'die') {
        k = 5;
        tgt[0] = 0.56; tgt[1] = 0.4; tgt[2] = 0; tgt[3] = 0.45; tgt[4] = -0.2; tgt[5] = 0.15; tgt[6] = -0.2; tgt[7] = -0.2; tgt[8] = -0.15; tgt[9] = -0.2;
        tgt[10] = -1.5; tgt[11] = 1.55; tgt[12] = 0.25; tgt[13] = 1.85; tgt[15] = 0.1; tgt[16] = -0.1; tgt[14] = 0;
        auraT = max(0, 1 - sT / 0.8);
        const burn = clamp01((sT - 0.6) / 0.9);
        glow = burn * 1.2; glowHex = 2;
        const fade = 1 - sm((sT - 1.2) / 1.3);
        for (let i = 0; i < mats.length; i++) mats[i].opacity = fade;
        eyeM.opacity = fade;
        if (sT > 0.5 && sT < 2.3) { emb.emit(4, 1.2, dieInit); if (Math.random() < 0.5) ash.emit(1, 1.3, dieInit); }
        if (sT > 1.4) body.scale.set(S * (1 - 0.15 * (sT - 1.4)), S * max(0.05, 1 - 0.5 * (sT - 1.4)), S);
        if (sT > 2.5 && body.visible) { body.visible = false; shadow.visible = false; eyeHalo.visible = false; }
        if (sT > 3.4 && !root.userData.done) root.userData.done = true;
      } else {
        tgt[4] += sin(time * 2.2) * 0.06; tgt[7] += sin(time * 2.2 + 1) * 0.06;
      }
      const d = DS.damp(k, dt);
      for (let i = 0; i < NJ; i++) cur[i] += (tgt[i] - cur[i]) * d;
      hips.position.y = cur[0] + (shake ? (Math.random() - 0.5) * shake : 0);
      spine.rotation.x = cur[1]; spine.rotation.y = cur[2];
      head.rotation.x = cur[3];
      aL.sh.rotation.set(cur[4], 0, cur[5]); aL.el.rotation.x = cur[6];
      aR.sh.rotation.set(cur[7], 0, cur[8]); aR.el.rotation.x = cur[9];
      lL.hp.rotation.set(cur[10], 0, cur[15]); lL.kn.rotation.x = cur[11];
      lR.hp.rotation.set(cur[12], 0, cur[16]); lR.kn.rotation.x = cur[13];
      body.position.z = cur[14] * S * 0.5;
      // emissive: flash white on hit, red pulse on enrage, orange burn on die
      if (flash > 0) flash = max(0, flash - dt);
      const fl = flash > 0 ? 1.4 * (flash / 0.15) : 0;
      for (let i = 0; i < mats.length; i++) {
        const mm = mats[i];
        if (fl > 0) mm.emissive.setRGB(1, 1, 1);
        else if (glowHex === 1) mm.emissive.setRGB(1, 0.15, 0.3);
        else if (glowHex === 2) mm.emissive.setRGB(1, 0.35, 0.05);
        mm.emissiveIntensity = fl > 0 ? fl : glow;
      }
      // aura
      auraS += (auraT - auraS) * DS.damp(4, dt);
      aura.visible = auraHalo.visible = auraS > 0.02;
      aura.scale.setScalar(max(0.001, auraS) * (1 + 0.04 * sin(time * 3)));
      aura.rotation.z = time * 0.25;
      auraMat.opacity = 0.75 * min(1, auraS);
      auraHalo.material.opacity = 0.35 * min(1, auraS) * (state === 'enrage' ? 1.6 : 1);
      auraHalo.scale.setScalar(3.2 * max(0.001, auraS));
      emb.update(dt); ash.update(dt);
    };
    root.userData.update(0.016, 0);
    return root;
  }

  // ================================================================ HEROES
  const heroGeo = {
    haori: () => G('haoriBody', () => new THREE.CylinderGeometry(0.235, 0.31, 0.86, 14, 1, true, 0.38, TAU - 0.76)),
    sleeve: () => G('haoriSleeve', () => { const g = new THREE.CylinderGeometry(0.09, 0.13, 0.3, 10, 1, true); g.translate(0, -0.15, 0); return g; })
  };
  function heroMats(name) {
    return M('hero' + name, () => {
      const o = {
        skin: DS.std('#f3cfae', { roughness: 0.7 }),
        uni: DS.std('#1b1d26'),
        white: DS.std('#eef0f2'),
        dark: DS.std('#101014'),
        mouth: DS.std('#6a2a2a')
      };
      if (name === 'tanjiro') {
        o.haori = DS.std('#ffffff', { map: texChecker(), side: THREE.DoubleSide });
        o.hair = DS.std('#ffffff', { map: texGrad('tan', '#3e1612', '#8a2c20', 0.45) });
        o.eye = eyeMat('tan', '#b3322a');
        o.scar = DS.std('#b8323a');
        o.card = DS.std('#ffffff', { map: texHanafuda() });
      } else if (name === 'nezuko') {
        o.kimono = DS.std('#ffffff', { map: texAsanoha(), side: THREE.DoubleSide });
        o.haori = DS.std('#6b3f2a', { side: THREE.DoubleSide });
        o.hair = DS.std('#ffffff', { map: texGrad('nez', '#141016', '#e8762a', 0.72) });
        o.hairTop = DS.std('#141016');
        o.eye = eyeMat('nez', '#ff69a6');
        o.ribbon = DS.std('#ff7fb0');
        o.bamboo = DS.std('#b7b068', { roughness: 0.5 });
        o.node = DS.std('#7c7a3a');
        o.obi = DS.std('#5a2a24');
      } else if (name === 'zenitsu') {
        o.haori = DS.std('#ffffff', { map: texZenitsu(), side: THREE.DoubleSide });
        o.hair = DS.std('#ffffff', { map: texGrad('zen', '#f07a18', '#ffd23c', 0.35) });
        o.eye = eyeMat('zen', '#e0a21a');
      } else if (name === 'naruto') {
        o.uni = DS.std('#f27a1a');                         // orange jumpsuit
        o.accent = DS.std('#22407e');                      // blue accents
        o.hair = DS.std('#ffffff', { map: texGrad('nrt', '#e8b820', '#ffe14a', 0.4) });  // blonde
        o.eye = eyeMat('nrt', '#3a86d8');                  // blue eyes
        o.band = DS.std('#22407e');                        // headband cloth
        o.plate = DS.std('#b9c4cf', { metalness: 0.75, roughness: 0.3 });
        o.whisker = DS.std('#7a4a30');
      } else if (name === 'sasuke') {
        o.uni = DS.std('#2b3450');                          // navy
        o.accent = DS.std('#141821');
        o.hair = DS.std('#ffffff', { map: texGrad('sas', '#14141c', '#3a3a4c', 0.5) });
        o.eye = eyeMat('sas', '#c02020');                  // sharingan red
        o.band = DS.std('#2b3450');
        o.plate = DS.std('#b9c4cf', { metalness: 0.75, roughness: 0.3 });
      } else if (name === 'sakura') {
        o.uni = DS.std('#d0405e');                          // red
        o.accent = DS.std('#8a2440');
        o.hair = DS.std('#ffffff', { map: texGrad('sak', '#ff9db6', '#ffc2d2', 0.4) });  // pink
        o.eye = eyeMat('sak', '#3aa06a');                  // green eyes
        o.band = DS.std('#d0405e');
        o.plate = DS.std('#b9c4cf', { metalness: 0.75, roughness: 0.3 });
      } else {
        o.boar = DS.std('#766960', { roughness: 0.9 });
        o.snout = DS.std('#b28e80');
        o.tusk = DS.std('#f2ecdf', { roughness: 0.4 });
        o.fur = DS.std('#5b4e45', { roughness: 1 });
        o.pants = DS.std('#3a3f4e');
        o.blade = DS.std('#8a9cb4', { metalness: 0.45, roughness: 0.35 });
        o.beye = DS.std('#1b2436', { emissive: DS.C('#4a6aa0'), emissiveIntensity: 0.4 });
      }
      return o;
    });
  }

  function hero(name) {
    name = (name || 'naruto').toLowerCase();
    if (['tanjiro', 'nezuko', 'zenitsu', 'inosuke', 'naruto', 'sasuke', 'sakura', 'kakashi'].indexOf(name) < 0) name = 'naruto';
    const m = heroMats(name);
    const root = new THREE.Group(); root.name = 'hero_' + name;
    const yaw = grp(root);
    const body = grp(yaw);
    const hips = grp(body, 0, 0.86, 0);
    const isNez = name === 'nezuko', isIno = name === 'inosuke';
    const legMat = isIno ? m.pants : isNez ? m.skin : m.uni;
    const topMat = isIno ? m.skin : isNez ? m.kimono : m.uni;
    const armMat = isIno ? m.skin : isNez ? m.kimono : m.uni;
    mesh(box(0.3, 0.16, 0.2), isNez ? m.kimono : legMat, 0, 0, 0, hips);
    // legs
    const legs = [];
    for (let s = 1; s >= -1; s -= 2) {
      const hp = grp(hips, s * 0.095, -0.04, 0);
      mesh(seg(isIno ? 0.1 : 0.085, 0.072, 0.42, 8), legMat, 0, 0, 0, hp);
      const kn = grp(hp, 0, -0.42, 0);
      mesh(seg(0.072, 0.055, 0.36, 8), isNez ? m.skin : legMat, 0, 0, 0, kn);
      if (!isNez && !isIno) mesh(seg(0.066, 0.06, 0.14, 8), m.white, 0, -0.2, 0, kn);
      mesh(box(0.1, 0.07, 0.22), isNez ? m.dark : m.dark, 0, -0.39, 0.04, kn);
      legs.push({ hp, kn });
    }
    // torso
    const torso = grp(hips, 0, 0.06, 0);
    const tm = mesh(segUp(0.165, 0.2, 0.44, 10), topMat, 0, 0, 0, torso); tm.scale.z = 0.75;
    if (isIno) {
      for (let s = -1; s <= 1; s += 2) { const pc = mesh(sph(0.09, 8, 6), m.skin, s * 0.085, 0.33, 0.1, torso); pc.scale.set(1.1, 0.75, 0.6); }
      for (let r = 0; r < 2; r++) for (let s = -1; s <= 1; s += 2) mesh(box(0.06, 0.05, 0.03), m.skin, s * 0.035, 0.12 + r * 0.07, 0.125, torso);
      // fur belt / skirt
      mesh(cyl(0.2, 0.2, 0.08, 12), m.fur, 0, 0, 0, torso);
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU, c = mesh(cone(0.05, 0.2, 4), m.fur, sin(a) * 0.19, -0.1, cos(a) * 0.16, torso);
        c.rotation.set(PI + cos(a) * 0.3, 0, sin(a) * 0.3);
      }
    } else if (isNez) {
      mesh(cyl(0.19, 0.2, 0.12, 12), m.obi, 0, 0.1, 0, torso);
      mesh(cyl(0.2, 0.3, 0.5, 12, true), m.kimono, 0, -0.26, 0, hips);
    } else {
      mesh(cyl(0.185, 0.19, 0.06, 12), m.white, 0, 0.06, 0, torso);
      for (let i = 0; i < 3; i++) mesh(box(0.025, 0.025, 0.02), m.white, 0, 0.2 + i * 0.08, 0.15, torso);
    }
    if (m.haori) {
      const h = mesh(heroGeo.haori(), m.haori, 0, 0.02, 0, torso); h.scale.z = 0.82;
    }
    // head
    const neck = grp(torso, 0, 0.46, 0);
    mesh(cyl(0.05, 0.055, 0.08, 8), m.skin, 0, 0.02, 0, neck);
    const head = grp(neck, 0, 0.06, 0);
    const R = 0.2;
    const hd = mesh(sph(R, 14, 12), isIno ? m.boar : m.skin, 0, R, 0, head);
    if (isIno) {
      hd.scale.set(1, 1.02, 1.12);
      const sn = mesh(cyl(0.085, 0.1, 0.16, 10), m.boar, 0, 0.13, 0.22, head); sn.rotation.x = PI / 2;
      const nose = mesh(cyl(0.09, 0.09, 0.02, 10), m.snout, 0, 0.13, 0.305, head); nose.rotation.x = PI / 2;
      for (let s = -1; s <= 1; s += 2) {
        mesh(sph(0.018, 6, 4), m.dark, s * 0.035, 0.13, 0.315, head);
        const tk = mesh(cone(0.025, 0.14, 5), m.tusk, s * 0.1, 0.12, 0.2, head); tk.rotation.set(0.3, 0, -s * 0.5);
        const ear = mesh(cone(0.06, 0.14, 4), m.boar, s * 0.15, 0.38, -0.02, head); ear.rotation.z = -s * 0.7;
        mesh(sph(0.03, 7, 5), m.beye, s * 0.09, 0.26, 0.17, head);
      }
      for (let i = 0; i < 5; i++) { const t = mesh(cone(0.04, 0.22, 4), m.dark, (i - 2) * 0.05, 0.3 - abs(i - 2) * 0.04, -0.2, head); t.rotation.x = -2.2; }
    } else {
      // eyes, mouth
      for (let s = -1; s <= 1; s += 2) { const e = mesh(plane(0.085, 0.085), m.eye, s * 0.075, R * 0.95, R * 0.93, head, false); e.rotation.y = s * 0.35; }
      mesh(box(0.04, 0.01, 0.01), m.mouth, 0, R * 0.58, R * 0.96, head);
      // hair cap
      const capGeo = G('heroCap', () => new THREE.SphereGeometry(R * 1.06, 14, 10, 0, TAU, 0, PI * 0.5));
      const hm = m.hairTop || m.hair;
      const cap = mesh(capGeo, hm, 0, R * 1.02, -0.01, head); cap.rotation.x = -0.25;
      const back = mesh(G('heroCapBack', () => new THREE.SphereGeometry(R * 1.07, 12, 8, PI * 0.6, PI * 0.8, 0, PI * 0.72)), hm, 0, R, -0.005, head);
      back.rotation.y = PI * 0.0;
      if (name === 'tanjiro' || name === 'zenitsu' || name === 'naruto' || name === 'sasuke') {
        const n = (name === 'zenitsu' || name === 'naruto') ? 22 : 18;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU, front = cos(a) > 0.55;
          const sp = mesh(cone(0.055, front ? 0.14 : 0.2, 5), m.hair, sin(a) * 0.15, R * 1.35 + (front ? -0.02 : 0), cos(a) * 0.15 - 0.02, head);
          const tilt = front ? 1.9 : 1.2;
          sp.rotation.set(cos(a) * tilt, 0, -sin(a) * tilt);
        }
        for (let i = 0; i < 5; i++) { const b = mesh(cone(0.04, 0.12, 4), m.hair, (i - 2) * 0.06, R * 1.55, R * 0.62, head); b.rotation.x = 2.3; }
      }
      // Naruto/ninja headband + whisker cheeks
      if (name === 'naruto' || name === 'sasuke' || name === 'sakura') {
        const band = mesh(cyl(R * 1.09, R * 1.09, 0.09, 16, true), m.band, 0, R * 1.16, 0, head);
        const plate = mesh(box(0.14, 0.075, 0.02), m.plate, 0, R * 1.16, R * 1.02, head);
        // leaf swirl notch on plate
        mesh(box(0.02, 0.05, 0.005), m.dark, 0, R * 1.16, R * 1.03, head);
        // headband tails at back
        for (let s = -1; s <= 1; s += 2) { const t = mesh(box(0.05, 0.28, 0.02), m.band, s * 0.05, R * 0.85, -R * 1.02, head); t.rotation.x = 0.3; }
        if (name === 'naruto' && m.whisker) {
          for (let s = -1; s <= 1; s += 2) for (let w = 0; w < 3; w++)
            mesh(box(0.06, 0.008, 0.006), m.whisker, s * 0.13, R * 0.72 + (w - 1) * 0.045, R * 0.92, head);
        }
      }
      if (name === 'tanjiro') {
        const sc = mesh(box(0.05, 0.03, 0.01), m.scar, 0.07, R * 1.35, R * 0.86, head); sc.rotation.set(-0.5, 0.35, 0.3);
        for (let s = -1; s <= 1; s += 2) mesh(box(0.035, 0.065, 0.006), m.card, s * R * 0.98, R * 0.52, 0.02, head);
      }
      if (isNez) {
        for (let i = 0; i < 6; i++) { const b = mesh(cone(0.045, 0.15, 4), m.hairTop, (i - 2.5) * 0.055, R * 1.5, R * 0.66, head); b.rotation.x = 2.5; }
        const lh = mesh(box(0.4, 0.95, 0.12), m.hair, 0, -0.18, -0.16, head); lh.rotation.x = 0.08;
        for (let s = -1; s <= 1; s += 2) { const sl = mesh(box(0.08, 0.45, 0.1), m.hair, s * 0.19, 0.05, 0.02, head); }
        const rb = grp(head, 0.1, R * 1.55, -0.12);
        for (let s = -1; s <= 1; s += 2) { const w = mesh(box(0.1, 0.06, 0.03), m.ribbon, s * 0.06, 0, 0, rb); w.rotation.z = s * 0.35; }
        mesh(box(0.035, 0.04, 0.035), m.ribbon, 0, 0, 0, rb);
        const mz = mesh(cyl(0.028, 0.028, 0.2, 8), m.bamboo, 0, R * 0.58, R * 0.98, head); mz.rotation.z = PI / 2;
        for (let s = -1; s <= 1; s += 2) { const nd = mesh(cyl(0.031, 0.031, 0.012, 8), m.node, s * 0.05, R * 0.58, R * 0.98, head); nd.rotation.z = PI / 2; }
        for (let s = -1; s <= 1; s += 2) { const cd = mesh(box(0.008, 0.008, 0.2), m.dark, s * R * 0.92, R * 0.62, R * 0.4, head); cd.rotation.y = -s * 0.5; }
      }
    }
    // arms
    const arms = [];
    for (let s = 1; s >= -1; s -= 2) {
      const sh = grp(torso, s * 0.235, 0.4, 0);
      mesh(sph(0.07, 8, 6), armMat, 0, 0, 0, sh);
      mesh(seg(0.062, 0.052, 0.28, 8), armMat, 0, 0, 0, sh);
      if (m.haori) mesh(heroGeo.sleeve(), m.haori, 0, 0.02, 0, sh);
      const el = grp(sh, 0, -0.28, 0);
      mesh(seg(0.052, 0.042, 0.24, 8), isIno ? m.skin : isNez ? m.kimono : m.uni, 0, 0, 0, el);
      const hand = grp(el, 0, -0.27, 0);
      mesh(sph(0.055, 8, 6), m.skin, 0, 0, 0, hand);
      arms.push({ sh, el, hand });
    }
    // props
    if (name === 'tanjiro' || name === 'zenitsu') {
      const kt = grp(torso, 0.2, 0.02, -0.05); kt.rotation.set(1.25, 0, 0.12);
      mesh(cyl(0.022, 0.02, 0.75, 8), m.dark, 0, -0.1, 0, kt);
      mesh(cyl(0.05, 0.05, 0.012, 12), m.dark, 0, 0.28, 0, kt);
      mesh(cyl(0.018, 0.018, 0.2, 8), name === 'zenitsu' ? m.white : m.uni, 0, 0.39, 0, kt);
    }
    if (isIno) {
      for (let i = 0; i < 2; i++) {
        const sw = grp(arms[i].hand, 0, -0.02, 0.02); sw.rotation.x = 1.9;
        mesh(cyl(0.022, 0.022, 0.16, 6), m.dark, 0, 0.02, 0, sw);
        mesh(box(0.07, 0.62, 0.014), m.blade, 0, 0.42, 0, sw);
        for (let k = 0; k < 6; k++) {
          const sd = (k & 1) ? 1 : -1;
          const t = mesh(cone(0.022, 0.06, 3), m.blade, sd * 0.04, 0.18 + k * 0.08, 0, sw); t.rotation.z = -sd * PI / 2;
        }
      }
    }
    const shadow = DS.shadowBlob(0.8, 0.8, 0.45); root.add(shadow);

    // joints: 0 bodyY 1 torsoX 2 sLx 3 sLz 4 eLx 5 sRx 6 sRz 7 eRx 8 lLx 9 kLx 10 lRx 11 kRx 12 headX
    const NJ = 13, cur = new Float32Array(NJ), tgt = new Float32Array(NJ);
    const aL = arms[0], aR = arms[1], lL = legs[0], lR = legs[1];
    let state = 'idle', faceT = 0, seed = Math.random() * 10;
    root.userData.state = 'idle';
    root.userData.face = function (dir) { faceT = dir === -1 ? PI : 0; };
    root.userData.setState = function (s) {
      state = s; root.userData.state = s;
      root.userData.face(s === 'run' ? -1 : 1);
    };
    root.userData.update = function (dt, time) {
      const t = time + seed;
      tgt.fill(0);
      tgt[3] = 0.12; tgt[6] = -0.12; tgt[4] = -0.15; tgt[7] = -0.15;
      let k = 18;
      if (state === 'run') {
        const ph = time * 11 + seed;
        const sp = sin(ph);
        tgt[0] = abs(sp) * 0.07; tgt[1] = 0.2;
        tgt[8] = -sp * 0.85; tgt[10] = sp * 0.85;
        tgt[9] = 0.3 + 0.9 * max(0, sin(ph + PI * 0.9)); tgt[11] = 0.3 + 0.9 * max(0, sin(ph - PI * 0.1));
        tgt[2] = sp * 0.9; tgt[5] = -sp * 0.9; tgt[4] = -1.2; tgt[7] = -1.2;
        tgt[12] = -0.12;
        if (isIno) { tgt[2] = 0.7 + sp * 0.3; tgt[5] = 0.7 - sp * 0.3; tgt[3] = 0.5; tgt[6] = -0.5; tgt[4] = -0.2; tgt[7] = -0.2; }
        k = 30;
      } else if (state === 'cheer') {
        const jp = abs(sin(t * 5.5));
        tgt[0] = jp * 0.32;
        tgt[8] = -0.35 * jp; tgt[10] = -0.35 * jp; tgt[9] = 0.7 * jp; tgt[11] = 0.7 * jp;
        tgt[3] = 2.3 + 0.45 * sin(t * 7); tgt[6] = -(2.3 + 0.45 * sin(t * 7 + PI));
        tgt[4] = -0.3; tgt[7] = -0.3; tgt[12] = -0.2; tgt[1] = -0.08;
        k = 22;
      } else {
        const br = sin(t * 2);
        tgt[0] = br * 0.008; tgt[1] = br * 0.02; tgt[2] = br * 0.04; tgt[5] = -br * 0.04; tgt[12] = sin(t * 0.8) * 0.05;
      }
      const d = DS.damp(k, dt);
      for (let i = 0; i < NJ; i++) cur[i] += (tgt[i] - cur[i]) * d;
      body.position.y = cur[0];
      torso.rotation.x = cur[1];
      aL.sh.rotation.set(cur[2], 0, cur[3]); aL.el.rotation.x = cur[4];
      aR.sh.rotation.set(cur[5], 0, cur[6]); aR.el.rotation.x = cur[7];
      lL.hp.rotation.x = cur[8]; lL.kn.rotation.x = cur[9];
      lR.hp.rotation.x = cur[10]; lR.kn.rotation.x = cur[11];
      head.rotation.x = cur[12];
      yaw.rotation.y += (faceT - yaw.rotation.y) * DS.damp(10, dt);
      shadow.scale.setScalar(1 - cur[0] * 1.2);
    };
    root.userData.update(0.016, 0);
    return root;
  }

  // ================================================================ KASUGAI CROW
  function crow() {
    const m = M('crow', () => ({
      body: DS.std('#15151d', { roughness: 0.5, metalness: 0.1 }),
      wing: DS.std('#1b1b26', { roughness: 0.55, side: THREE.DoubleSide }),
      beak: DS.std('#3d3d44', { roughness: 0.4 }),
      eye: DS.glow('#ffb640', 1.5)
    }));
    const root = new THREE.Group(); root.name = 'crow';
    const body = grp(root);
    const tb = mesh(sph(0.12, 10, 8), m.body, 0, 0, 0, body); tb.scale.set(0.85, 0.75, 1.5);
    mesh(sph(0.08, 10, 8), m.body, 0, 0.05, 0.17, body);
    const bk = mesh(cone(0.028, 0.1, 5), m.beak, 0, 0.04, 0.27, body); bk.rotation.x = PI / 2;
    for (let s = -1; s <= 1; s += 2) mesh(sph(0.013, 6, 4), m.eye, s * 0.05, 0.07, 0.22, body, false);
    for (let i = -1; i <= 1; i++) { const tf = mesh(box(0.07, 0.012, 0.2), m.wing, i * 0.05, -0.01, -0.24, body); tf.rotation.y = i * 0.3; }
    const wings = [];
    for (let s = -1; s <= 1; s += 2) {
      const w = grp(body, s * 0.07, 0.04, 0.02);
      mesh(box(0.26, 0.02, 0.2), m.wing, s * 0.13, 0, 0, w);
      const o = grp(w, s * 0.26, 0, 0);
      mesh(box(0.22, 0.015, 0.17), m.wing, s * 0.11, 0, -0.01, o);
      for (let k = 0; k < 4; k++) {
        const f = mesh(box(0.16, 0.01, 0.04), m.wing, s * (0.26 + 0.02 * k), 0, 0.05 - k * 0.045, o);
        f.rotation.y = -s * (0.15 + k * 0.12);
      }
      wings.push({ w, o, s });
    }
    const seed = Math.random() * 10;
    root.userData.update = function (dt, time) {
      const t = time * 9 + seed;
      for (let i = 0; i < 2; i++) {
        const W = wings[i];
        W.w.rotation.z = W.s * (sin(t) * 0.75 + 0.15);
        W.o.rotation.z = W.s * sin(t - 0.7) * 0.45;
      }
      body.position.y = sin(t + PI / 2) * 0.04;
      body.rotation.x = sin(t) * 0.05;
    };
    return root;
  }

  DS.Chars = { katana, demon, tentacle, boss, hero, crow, Burst };
})(window.DS);

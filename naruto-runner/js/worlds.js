// =====================================================================
// worlds.js - DEMON SLAYER: INFINITY CASTLE RUN (fan-made warm-up)
// Geometry / materials / particles for the 4 worlds + lighting presets.
// main.js owns renderer, sky dome, fog, lights and camera, and applies presets.
// Player runs toward -Z, feet at y=0, eye 1.7. The running corridor
// x in [-3.8, 3.8], y in [0, 5.5] is kept completely clear of scenery.
// Three.js r128, classic script, global THREE + DS (util.js).
// =====================================================================
(function (DS) {
  'use strict';

  const SEG = 30, TAU = Math.PI * 2, HP = Math.PI / 2, PI = Math.PI;
  const JP = '"Yu Mincho","YuMincho","Hiragino Mincho ProN","MS Mincho","Noto Serif JP","Noto Serif CJK JP",serif';

  // ------------------------------------------------------------ scratch (no per-frame allocs)
  const _o = new THREE.Object3D();
  _o.rotation.order = 'YXZ'; // tilt in local frame, then yaw
  const _zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const _white = new THREE.Color(1, 1, 1);
  const _dummyMat = new THREE.MeshBasicMaterial();

  // ------------------------------------------------------------ module RNG (allocation free)
  let _rs = 1;
  const seed = (s) => { _rs = (s >>> 0) || 1; };
  function rnd() {
    _rs = (_rs + 0x6D2B79F5) | 0;
    let t = Math.imul(_rs ^ (_rs >>> 15), 1 | _rs);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const rr = (a, b) => a + (b - a) * rnd();
  const chance = (p) => rnd() < p;
  const pick = (a) => a[Math.min(a.length - 1, (rnd() * a.length) | 0)];
  const zSeed = (z, salt) => (Math.imul(Math.round(z) | 0, 73856093) ^ Math.imul(salt, 19349663) ^ 0x5bd1e995) >>> 0;
  const wrap = (v, lo, span) => lo + ((((v - lo) % span) + span) % span);
  const frac = (v) => v - Math.floor(v);
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  function setO(x, y, z, rx, ry, rz, sx, sy, sz) {
    _o.position.set(x, y, z);
    _o.rotation.set(rx || 0, ry || 0, rz || 0);
    const X = sx == null ? 1 : sx;
    _o.scale.set(X, sy == null ? X : sy, sz == null ? X : sz);
    _o.updateMatrix();
    return _o.matrix;
  }

  // ------------------------------------------------------------ presets (colors as sRGB hex numbers)
  const PRESETS = {
    forest: {
      skyTop: 0x2a6fd6, skyMid: 0x8fd0ff, skyHorizon: 0xffe3c4, fog: 0xdcecf7, fogNear: 60, fogFar: 240,
      hemiSky: 0xbfe3ff, hemiGround: 0x6b8f4e, hemiInt: 0.65, key: 0xfff1d6, keyInt: 2.0, keyDir: [-25, 55, -40],
      rim: 0x9fd4ff, rimInt: 0.35, exposure: 1.0, moon: false, moonDir: nrm([0.25, 0.4, -1]), moonColor: 0xfff6e0, sunMode: true
    },
    castle: {
      skyTop: 0x1a0606, skyMid: 0x3a0d10, skyHorizon: 0x5a1c16, fog: 0x2b0d0b, fogNear: 25, fogFar: 120,
      hemiSky: 0xffcf9a, hemiGround: 0x2a0a08, hemiInt: 0.6, key: 0xffb070, keyInt: 1.4, keyDir: [10, 30, -10],
      rim: 0xff5a3c, rimInt: 0.4, exposure: 1.05, moon: false, moonDir: nrm([0, 0.3, -1]), moonColor: 0xffffff, sunMode: false
    },
    train: {
      skyTop: 0x060b1f, skyMid: 0x1b2455, skyHorizon: 0x4a5a9a, fog: 0x1c2448, fogNear: 50, fogFar: 220,
      hemiSky: 0x9fb4ff, hemiGround: 0x101226, hemiInt: 0.5, key: 0xc8d6ff, keyInt: 1.7, keyDir: [-30, 50, -20],
      rim: 0x7fd3ff, rimInt: 0.4, exposure: 1.1, moon: true, moonDir: nrm([-0.35, 0.3, -1]), moonColor: 0xfffbe8, sunMode: false
    },
    arena: {
      skyTop: 0x07020d, skyMid: 0x1e0826, skyHorizon: 0x4a1036, fog: 0x240a24, fogNear: 30, fogFar: 150,
      hemiSky: 0xff9ad5, hemiGround: 0x12040e, hemiInt: 0.55, key: 0xffd0e8, keyInt: 1.3, keyDir: [5, 30, 10],
      rim: 0x63e6ff, rimInt: 0.6, exposure: 1.1, moon: false, moonDir: nrm([0, 0.3, -1]), moonColor: 0xffffff, sunMode: false
    },
    dawn: {
      skyTop: 0x3d6fb6, skyMid: 0xf7a6b6, skyHorizon: 0xffd27a, fog: 0xf3b98f, fogNear: 60, fogFar: 240,
      hemiSky: 0xffe0c0, hemiGround: 0x5a4a6a, hemiInt: 0.8, key: 0xffd7a0, keyInt: 2.4, keyDir: [20, 20, -60],
      rim: 0xff9ad5, rimInt: 0.4, exposure: 1.0, moon: true, moonDir: nrm([0, 0.12, -1]), moonColor: 0xffe7b0, sunMode: true
    }
  };

  // ============================================================ geometry merging
  function Merger() { this.p = []; this.n = []; this.u = []; this.c = []; }
  Merger.prototype.addM = function (geo, m, color) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(m);
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color;
    const c = color == null ? _white : (color.isColor ? color : DS.C(color));
    for (let i = 0; i < P.count; i++) {
      this.p.push(P.getX(i), P.getY(i), P.getZ(i));
      if (N) this.n.push(N.getX(i), N.getY(i), N.getZ(i)); else this.n.push(0, 1, 0);
      if (U) this.u.push(U.getX(i), U.getY(i)); else this.u.push(0, 0);
      if (C && color == null) this.c.push(C.getX(i), C.getY(i), C.getZ(i)); else this.c.push(c.r, c.g, c.b);
    }
    g.dispose();
    return this;
  };
  Merger.prototype.add = function (geo, x, y, z, rx, ry, rz, sx, sy, sz, color) {
    return this.addM(geo, setO(x || 0, y || 0, z || 0, rx, ry, rz, sx, sy, sz), color);
  };
  // tapered cylinder between two points (uses DS.limb)
  Merger.prototype.limb = function (ax, ay, az, bx, by, bz, r1, r2, color, seg) {
    const l = DS.limb(new THREE.Vector3(ax, ay, az), new THREE.Vector3(bx, by, bz), r1, r2, _dummyMat, seg || 6);
    l.updateMatrix();
    this.addM(l.geometry, l.matrix, color);
    l.geometry.dispose();
    return this;
  };
  Merger.prototype.build = function () {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    g.userData.shared = true;
    return g;
  };
  function planarUV(geo, su, sv) {
    const P = geo.attributes.position, U = geo.attributes.uv;
    for (let i = 0; i < P.count; i++) U.setXY(i, (P.getX(i) + P.getY(i)) * su, P.getZ(i) * sv);
    U.needsUpdate = true;
    return geo;
  }
  function remapUV(geo, u0, u1, v0, v1) {
    const U = geo.attributes.uv;
    for (let i = 0; i < U.count; i++) U.setXY(i, u0 + U.getX(i) * (u1 - u0), v0 + U.getY(i) * (v1 - v0));
    U.needsUpdate = true;
    return geo;
  }

  // ============================================================ pooled instancing
  // Slots are grouped per segment: segment s owns [s*per, (s+1)*per)
  function Inst(parent, geo, mat, per, nSeg, cast, tint) {
    this.per = per; this.base = 0; this.k = 0;
    const n = per * (nSeg || 1);
    const m = this.mesh = new THREE.InstancedMesh(geo, mat, n);
    m.frustumCulled = false; m.castShadow = !!cast; m.receiveShadow = true;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < n; i++) { m.setMatrixAt(i, _zero); if (tint) m.setColorAt(i, _white); }
    parent.add(m);
  }
  Inst.prototype.begin = function (s) { this.base = s * this.per; this.k = 0; return this; };
  Inst.prototype.put = function (x, y, z, rx, ry, rz, sx, sy, sz) {
    if (this.k >= this.per) return -1;
    const i = this.base + this.k++;
    this.mesh.setMatrixAt(i, setO(x, y, z, rx, ry, rz, sx, sy, sz));
    return i;
  };
  Inst.prototype.at = function (i, x, y, z, rx, ry, rz, sx, sy, sz) { this.mesh.setMatrixAt(i, setO(x, y, z, rx, ry, rz, sx, sy, sz)); };
  Inst.prototype.hide = function (i) { this.mesh.setMatrixAt(i, _zero); };
  Inst.prototype.tint = function (i, c) {
    if (i < 0 || !this.mesh.instanceColor) return;
    this.mesh.setColorAt(i, c); this.mesh.instanceColor.needsUpdate = true;
  };
  Inst.prototype.end = function () {
    for (let k = this.k; k < this.per; k++) this.mesh.setMatrixAt(this.base + k, _zero);
    this.mesh.instanceMatrix.needsUpdate = true;
  };
  Inst.prototype.dirty = function () { this.mesh.instanceMatrix.needsUpdate = true; };

  // Halo sprites (fake bloom) sharing one material, pooled per segment
  function HaloSet(parent, color, size, per, nSeg, opacity, noFog) {
    this.per = per; this.base = 0; this.k = 0; this.size = size; this.list = [];
    const n = per * (nSeg || 1);
    const proto = DS.halo(color, size, opacity == null ? 0.9 : opacity);
    if (noFog) proto.material.fog = false;
    for (let i = 0; i < n; i++) {
      const s = i === 0 ? proto : new THREE.Sprite(proto.material);
      s.scale.set(size, size, 1); s.visible = false; parent.add(s); this.list.push(s);
    }
  }
  HaloSet.prototype.begin = Inst.prototype.begin;
  HaloSet.prototype.put = function (x, y, z, sc) {
    if (this.k >= this.per) return -1;
    const i = this.base + this.k++, s = this.list[i], z2 = this.size * (sc || 1);
    s.position.set(x, y, z); s.scale.set(z2, z2, 1); s.visible = true;
    return i;
  };
  HaloSet.prototype.end = function () { for (let k = this.k; k < this.per; k++) this.list[this.base + k].visible = false; };

  // Slowly drifting / spinning objects (Escher void). Drives one or more Inst with identical transforms.
  function FloatSet(insts, per, nSeg) {
    this.insts = insts; this.per = per; this.base = 0; this.k = 0;
    this.n = per * (nSeg || 1);
    this.d = new Float32Array(this.n * 12);
  }
  FloatSet.prototype.begin = Inst.prototype.begin;
  FloatSet.prototype.put = function (x, y, z, rx, ry, rz, s, spx, spy, bob) {
    if (this.k >= this.per) return -1;
    const i = this.base + this.k++, o = i * 12, d = this.d;
    d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = rx; d[o + 4] = ry; d[o + 5] = rz;
    d[o + 6] = s; d[o + 7] = spx; d[o + 8] = spy; d[o + 9] = bob; d[o + 10] = rnd() * TAU; d[o + 11] = 1;
    return i;
  };
  FloatSet.prototype.end = function () {
    for (let k = this.k; k < this.per; k++) {
      const i = this.base + k; this.d[i * 12 + 11] = 0;
      for (let m = 0; m < this.insts.length; m++) this.insts[m].hide(i);
    }
    for (let m = 0; m < this.insts.length; m++) this.insts[m].dirty();
  };
  FloatSet.prototype.update = function (t, pts) {
    const d = this.d, L = this.insts.length;
    for (let i = 0; i < this.n; i++) {
      const o = i * 12;
      if (!d[o + 11]) { if (pts) pts.pos[i * 3 + 1] = -1e4; continue; }
      const y = d[o + 1] + Math.sin(t * 0.4 + d[o + 10]) * d[o + 9];
      setO(d[o], y, d[o + 2], d[o + 3] + t * d[o + 7], d[o + 4] + t * d[o + 8], d[o + 5], d[o + 6]);
      for (let m = 0; m < L; m++) this.insts[m].mesh.setMatrixAt(i, _o.matrix);
      if (pts) { pts.pos[i * 3] = d[o]; pts.pos[i * 3 + 1] = y; pts.pos[i * 3 + 2] = d[o + 2]; }
    }
    for (let m = 0; m < L; m++) this.insts[m].dirty();
    if (pts) pts.flag();
  };

  // World-space particle cloud
  function makePoints(parent, n, map, size, o) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const pa = new THREE.BufferAttribute(pos, 3); pa.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', pa);
    let col = null, ca = null;
    if (o.colors) { col = new Float32Array(n * 3).fill(1); ca = new THREE.BufferAttribute(col, 3); ca.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('color', ca); }
    const mat = new THREE.PointsMaterial({
      map, size, sizeAttenuation: true, transparent: true, depthWrite: false,
      vertexColors: !!o.colors, color: o.color != null ? DS.C(o.color) : new THREE.Color(1, 1, 1),
      opacity: o.opacity != null ? o.opacity : 1,
      blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    if (o.fog === false) mat.fog = false;
    if (o.alphaTest) mat.alphaTest = o.alphaTest;
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false; pts.renderOrder = o.order || 2;
    parent.add(pts);
    return { pts, geo, pos, col, n, mat, flag() { pa.needsUpdate = true; }, flagC() { if (ca) ca.needsUpdate = true; } };
  }
  function setCol(arr, i, c, k) { arr[i * 3] = c.r * k; arr[i * 3 + 1] = c.g * k; arr[i * 3 + 2] = c.b * k; }

  // ============================================================ canvas texture library (built once, cached)
  function rrect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  function specks(g, w, h, n, R, rgb, a0, a1, s0, s1) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = 'rgba(' + rgb[(R() * rgb.length) | 0] + ',' + (a0 + R() * (a1 - a0)).toFixed(3) + ')';
      const s = s0 + R() * (s1 - s0);
      g.fillRect(R() * w, R() * h, s, s);
    }
  }
  function woodBand(g, x, y, w, h, tone, R) {
    g.fillStyle = tone; g.fillRect(x, y, w, h);
    for (let k = 0; k < Math.max(3, h / 4); k++) {
      g.fillStyle = R() < 0.7 ? 'rgba(0,0,0,' + (0.1 + R() * 0.2).toFixed(2) + ')' : 'rgba(255,200,150,0.06)';
      g.fillRect(x, y + R() * h, w, 1 + R());
    }
  }
  const TX = {};

  function pathStone(g, x, y, w, h, tone, sd) {
    const R = DS.rng(sd);
    const j = 2.5 + R() * 2.5, r = 6 + R() * 8;
    g.save();
    rrect(g, x + j, y + j, w - 2 * j, h - 2 * j, r);
    g.fillStyle = tone; g.fill();
    g.clip();
    const gr = g.createLinearGradient(x, y, x + w * 0.6, y + h);
    gr.addColorStop(0, 'rgba(255,244,236,0.13)'); gr.addColorStop(1, 'rgba(0,0,0,0.24)');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    for (let i = 0; i < 50; i++) { g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.14)'; g.fillRect(x + R() * w, y + R() * h, 2, 2); }
    if (R() < 0.3) { for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(90,130,80,0.35)'; g.beginPath(); g.arc(x + R() * w, y + h - j - R() * 12, 1 + R() * 3, 0, TAU); g.fill(); } }
    if (R() < 0.28) {
      g.strokeStyle = 'rgba(20,16,24,0.7)'; g.lineWidth = 1.5; g.beginPath();
      let cx = x + w * (0.2 + R() * 0.6), cy = y + j; g.moveTo(cx, cy);
      for (let k = 0; k < 4; k++) { cx += (R() - 0.5) * 18; cy += h / 4; g.lineTo(cx, cy); }
      g.stroke();
    }
    g.lineWidth = 3;
    g.translate(2, 2); rrect(g, x + j, y + j, w - 2 * j, h - 2 * j, r); g.strokeStyle = 'rgba(255,240,228,0.24)'; g.stroke();
    g.translate(-4, -4); rrect(g, x + j, y + j, w - 2 * j, h - 2 * j, r); g.strokeStyle = 'rgba(0,0,0,0.55)'; g.stroke();
    g.restore();
  }
  TX.path = () => DS.cache('w.path', () => DS.canvasTex(512, 512, (g, w, h) => {
    const R = DS.rng(101);
    const tones = ['#6f6b7d', '#625e71', '#79758c', '#58586c', '#6c667a', '#817c93', '#5d5768', '#6a7180', '#747089', '#66607a'];
    const rows = 8, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -R() * 90;
      while (x < w) {
        const sw = 64 + R() * 86, tone = tones[(R() * tones.length) | 0], sd = (R() * 1e9) | 0;
        pathStone(g, x, r * rh, sw, rh, tone, sd);
        if (x < 0) pathStone(g, x + w, r * rh, sw, rh, tone, sd);
        if (x + sw > w) pathStone(g, x - w, r * rh, sw, rh, tone, sd);
        x += sw;
      }
    }
    // moss + packed earth BEHIND the stones (only shows in joints)
    g.globalCompositeOperation = 'destination-over';
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = 'rgba(' + ((50 + R() * 30) | 0) + ',' + ((84 + R() * 50) | 0) + ',' + ((52 + R() * 25) | 0) + ',' + (0.5 + R() * 0.5).toFixed(2) + ')';
      g.beginPath(); g.arc(R() * w, R() * h, 2 + R() * 5, 0, TAU); g.fill();
    }
    specks(g, w, h, 4000, R, ['70,60,70', '40,36,44', '96,84,90'], 0.3, 0.7, 1, 3);
    g.fillStyle = '#2b2630'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
  }, { repeat: [2, 90] }));

  TX.moss = () => DS.cache('w.moss', () => DS.canvasTex(256, 256, (g, w, h) => {
    const R = DS.rng(33);
    g.fillStyle = '#2b4431'; g.fillRect(0, 0, w, h);
    specks(g, w, h, 5000, R, ['58,92,60', '36,60,40', '74,110,70', '30,44,34'], 0.3, 0.8, 1, 3);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = 'rgba(' + ((90 + R() * 40) | 0) + ',' + ((130 + R() * 40) | 0) + ',' + ((80 + R() * 30) | 0) + ',0.35)';
      g.beginPath(); g.arc(R() * w, R() * h, 3 + R() * 9, 0, TAU); g.fill();
    }
    for (let i = 0; i < 50; i++) { g.fillStyle = i % 2 ? 'rgba(200,160,240,0.55)' : 'rgba(240,170,220,0.5)'; g.beginPath(); g.arc(R() * w, R() * h, 1.5 + R() * 2, 0, TAU); g.fill(); }
  }));

  TX.petal = () => DS.cache('w.petal', () => DS.canvasTex(64, 64, (g) => {
    g.translate(32, 32); g.rotate(0.5);
    const gr = g.createRadialGradient(0, 4, 2, 0, 0, 26);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.92)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 11, 24, 0, 0, TAU); g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.moveTo(0, -15); g.lineTo(-5, -27); g.lineTo(5, -27); g.closePath(); g.fill();
  }, { wrap: false }));

  TX.puff = () => DS.cache('w.puff', () => DS.canvasTex(128, 128, (g) => {
    const R = DS.rng(5);
    for (let i = 0; i < 10; i++) {
      const x = 64 + (R() - 0.5) * 32, y = 64 + (R() - 0.5) * 32, r = 20 + R() * 24;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.42)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    }
  }, { wrap: false }));

  TX.fadeV = () => DS.cache('w.fadeV', () => DS.canvasTex(4, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, { wrap: false }));

  // ---- castle
  function board(g, x, y, w, h, tone, sd) {
    const R = DS.rng(sd);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = tone; g.fillRect(x, y, w, h);
    const gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0.18)'); gr.addColorStop(0.5, 'rgba(255,220,180,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0.22)');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    for (let k = 0; k < 16; k++) {
      const gx = x + R() * w, amp = 1 + R() * 4, f = 0.006 + R() * 0.02, ph = R() * 6;
      g.strokeStyle = R() < 0.7 ? 'rgba(20,8,4,' + (0.15 + R() * 0.2).toFixed(2) + ')' : 'rgba(255,200,150,' + (0.04 + R() * 0.05).toFixed(2) + ')';
      g.lineWidth = 0.8 + R() * 1.6; g.beginPath();
      for (let yy = 0; yy <= h; yy += 12) { const xx = gx + Math.sin((y + yy) * f + ph) * amp; if (yy === 0) g.moveTo(xx, y + yy); else g.lineTo(xx, y + yy); }
      g.stroke();
    }
    if (R() < 0.35) {
      const kx = x + w * (0.3 + R() * 0.4), ky = y + R() * h;
      g.fillStyle = 'rgba(25,10,5,0.55)'; g.beginPath(); g.ellipse(kx, ky, 5 + R() * 5, 9 + R() * 8, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(25,10,5,0.3)'; g.lineWidth = 1; g.beginPath(); g.ellipse(kx, ky, 11, 20, 0, 0, TAU); g.stroke();
    }
    g.restore();
    g.fillStyle = 'rgba(10,4,2,0.85)'; g.fillRect(x, y, 2, h); g.fillRect(x, y, w, 3);
    g.fillStyle = 'rgba(255,210,170,0.10)'; g.fillRect(x + 2, y + 3, 1, h - 3);
  }
  TX.planks = () => DS.cache('w.planks', () => DS.canvasTex(512, 1024, (g, w, h) => {
    const R = DS.rng(77);
    const tones = ['#5a3321', '#4d2b1b', '#63392a', '#553020', '#48281a', '#6b3f2b', '#512d1d'];
    const cols = 6, pw = w / cols;
    for (let c = 0; c < cols; c++) {
      let y = -R() * 500;
      while (y < h) {
        const len = 260 + R() * 460, tone = tones[(R() * tones.length) | 0], sd = (R() * 1e9) | 0;
        board(g, c * pw, y, pw, len, tone, sd);
        if (y + len > h) board(g, c * pw, y - h, pw, len, tone, sd);
        if (y < 0) board(g, c * pw, y + h, pw, len, tone, sd);
        y += len;
      }
    }
  }, { repeat: [11 / 2.4, 60] }));

  TX.ceil = () => DS.cache('w.ceil', () => DS.canvasTex(256, 256, (g, w, h) => {
    const R = DS.rng(41);
    g.fillStyle = '#1f110a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      woodBand(g, i * 128 + 10, j * 128 + 10, 108, 108, j % 2 ? '#2e1a10' : '#321c11', R);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3; g.strokeRect(i * 128 + 12, j * 128 + 12, 104, 104);
    }
    g.fillStyle = '#40261a';
    for (const p of [0, 128]) { g.fillRect(p - 5, 0, 10, h); g.fillRect(0, p - 5, w, 10); g.fillRect(p + w - 5, 0, 10, h); g.fillRect(0, p + h - 5, w, 10); }
  }, { repeat: [11 / 1.5, 240] }));

  // bay: 3 m wide x 7.25 m tall (y 0.25..7.5)
  TX.shoji = () => DS.cache('w.shoji', () => DS.canvasTex(256, 640, (g, w, h) => {
    const R = DS.rng(21);
    const Y = (m) => (7.5 - m) / 7.25 * h;
    const pg = g.createLinearGradient(0, 0, 0, h);
    pg.addColorStop(0, '#f1d9a8'); pg.addColorStop(0.5, '#fbeccb'); pg.addColorStop(1, '#efd3a0');
    g.fillStyle = pg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.strokeStyle = 'rgba(190,150,95,' + (0.05 + R() * 0.1).toFixed(2) + ')'; g.lineWidth = 0.6; const x = R() * w, y = R() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 14, y + (R() - 0.5) * 14); g.stroke(); }
    const wood = '#3a2215', dark = '#24130a';
    const t1 = Y(6.25);
    // transom (ramma) lattice
    g.save(); g.beginPath(); g.rect(0, 0, w, t1); g.clip();
    g.strokeStyle = wood; g.lineWidth = 5;
    for (let d = -t1; d < w + t1; d += 30) {
      g.beginPath(); g.moveTo(d, 0); g.lineTo(d + t1, t1); g.stroke();
      g.beginPath(); g.moveTo(d, t1); g.lineTo(d + t1, 0); g.stroke();
    }
    g.fillStyle = wood; for (let x = 0; x <= w; x += 64) g.fillRect(x - 3, 0, 6, t1);
    g.restore();
    g.fillStyle = dark; g.fillRect(0, 0, w, 7); g.fillRect(0, 0, 7, t1); g.fillRect(w - 7, 0, 7, t1);
    // nageshi band
    const s0 = Y(5.95), s1 = Y(0.9);
    woodBand(g, 0, t1, w, s0 - t1, '#3b2013', R);
    // shoji panels
    for (let p = 0; p < 2; p++) {
      const x0 = p * w / 2, pw = w / 2;
      for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) {
        const a = R();
        if (a < 0.35) { g.fillStyle = a < 0.08 ? 'rgba(150,100,50,0.10)' : 'rgba(255,238,200,0.22)'; g.fillRect(x0 + c * pw / 3, s0 + r * (s1 - s0) / 7, pw / 3, (s1 - s0) / 7); }
      }
      g.fillStyle = wood;
      for (let c = 1; c < 3; c++) g.fillRect(x0 + c * pw / 3 - 1.5, s0, 3, s1 - s0);
      for (let r = 1; r < 7; r++) g.fillRect(x0, s0 + r * (s1 - s0) / 7 - 1.5, pw, 3);
      g.fillStyle = dark;
      g.fillRect(x0, s0, pw, 7); g.fillRect(x0, s1 - 7, pw, 7); g.fillRect(x0, s0, 7, s1 - s0); g.fillRect(x0 + pw - 7, s0, 7, s1 - s0);
    }
    // kick board (koshi-ita)
    woodBand(g, 0, s1, w, h - s1, '#33190e', R);
    g.fillStyle = dark; g.fillRect(w / 2 - 3, s1, 6, h - s1); g.fillRect(0, h - 6, w, 6);
  }));

  // fusuma pair: 3 m x 5.66 m, gold leaf + wave & mountain painting
  TX.fusuma = () => DS.cache('w.fusuma', () => DS.canvasTex(512, 620, (g, w, h) => {
    const R = DS.rng(55);
    g.fillStyle = '#b8914a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 52) for (let x = 0; x < w; x += 52) {
      g.fillStyle = 'rgba(' + ((230 + R() * 25) | 0) + ',' + ((190 + R() * 30) | 0) + ',' + ((110 + R() * 30) | 0) + ',' + (0.25 + R() * 0.3).toFixed(2) + ')';
      g.fillRect(x + 1, y + 1, 51, 51);
    }
    // mountain
    g.fillStyle = '#23305e'; g.beginPath(); g.moveTo(170, 300); g.lineTo(330, 80); g.lineTo(356, 92); g.lineTo(512, 290); g.lineTo(512, 320); g.lineTo(170, 320); g.fill();
    g.fillStyle = '#f2ecdc'; g.beginPath(); g.moveTo(292, 132); g.lineTo(330, 80); g.lineTo(356, 92); g.lineTo(392, 138); g.lineTo(366, 128); g.lineTo(346, 146); g.lineTo(322, 126); g.closePath(); g.fill();
    // gold cloud bands
    for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(255,236,190,0.55)'; rrect(g, R() * 360, 170 + i * 45 + R() * 20, 120 + R() * 140, 22, 11); g.fill(); }
    // great wave
    g.fillStyle = '#1b2c63';
    g.beginPath(); g.moveTo(0, h); g.lineTo(0, 470);
    g.bezierCurveTo(60, 430, 120, 360, 200, 330);
    g.bezierCurveTo(260, 305, 330, 318, 340, 362);
    g.bezierCurveTo(310, 346, 278, 360, 270, 394);
    g.bezierCurveTo(305, 425, 370, 470, 512, 470);
    g.lineTo(512, h); g.closePath(); g.fill();
    g.strokeStyle = '#5a7cc4'; g.lineWidth = 5;
    for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(10, 490 + k * 30); g.bezierCurveTo(120, 430 + k * 30, 200, 400 + k * 30, 260, 420 + k * 26); g.stroke(); }
    g.fillStyle = '#f4efe2';
    for (let i = 0; i < 18; i++) { const t = i / 17, x = 170 + t * 175, y = 338 - Math.sin(t * PI) * 26 + (R() - 0.5) * 6; g.beginPath(); g.arc(x, y, 6 + R() * 6, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(244,239,226,0.8)'; g.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const x = R() * w, y = 520 + R() * 90; g.beginPath(); g.arc(x, y, 12 + R() * 10, PI * 1.1, PI * 1.9); g.stroke(); }
    // lacquer frames + pulls
    for (let p = 0; p < 2; p++) {
      const x0 = p * 256;
      g.strokeStyle = '#140c0a'; g.lineWidth = 14; g.strokeRect(x0 + 7, 7, 242, h - 14);
      const hx = p === 0 ? x0 + 222 : x0 + 34;
      g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(hx, h * 0.52, 12, 0, TAU); g.fill();
      g.strokeStyle = '#e0bb6a'; g.lineWidth = 3; g.stroke();
    }
  }));

  TX.chochin = () => DS.cache('w.chochin', () => DS.canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#6e0f0c'); gr.addColorStop(0.22, '#d63a22'); gr.addColorStop(0.5, '#ff8a45'); gr.addColorStop(0.78, '#d63a22'); gr.addColorStop(1, '#6e0f0c');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 12) { g.fillStyle = 'rgba(70,8,4,0.45)'; g.fillRect(0, y, w, 2); }
    g.fillStyle = '#140807'; g.fillRect(0, 0, w, 20); g.fillRect(0, h - 20, w, 20);
    g.fillStyle = 'rgba(25,6,4,0.92)'; g.font = '900 100px ' + JP; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.save(); g.scale(0.5, 1); g.fillText('鬼', 128, 132); g.fillText('滅', 384, 132); g.restore();
  }));

  TX.tatami = () => DS.cache('w.tatami', () => DS.canvasTex(512, 512, (g, w, h) => {
    const R = DS.rng(66);
    for (let m = 0; m < 2; m++) {
      const x0 = m * 256;
      const gr = g.createLinearGradient(x0, 0, x0 + 256, h);
      gr.addColorStop(0, '#bdb26c'); gr.addColorStop(1, '#a89c58');
      g.fillStyle = gr; g.fillRect(x0, 0, 256, h);
      for (let y = 0; y < h; y += 4) { g.fillStyle = (y / 4) % 2 ? 'rgba(90,80,30,0.2)' : 'rgba(255,250,200,0.10)'; g.fillRect(x0, y, 256, 2); }
      specks(g, w, h, 300, R, ['80,70,30', '255,250,210'], 0.05, 0.15, 1, 2);
      g.fillStyle = '#1a2033'; g.fillRect(x0, 0, 16, h); g.fillRect(x0 + 240, 0, 16, h);
      g.fillStyle = 'rgba(200,170,90,0.6)';
      for (let y = 6; y < h; y += 14) { g.fillRect(x0 + 6, y, 4, 4); g.fillRect(x0 + 246, y, 4, 4); }
      g.fillStyle = 'rgba(60,50,20,0.55)'; g.fillRect(x0, 0, 256, 3);
    }
  }, { repeat: [16 / 1.8, 30 / 1.8] }));
  TX.tatamiB = () => DS.cache('w.tatamiB', () => { const t = TX.tatami().clone(); t.needsUpdate = true; t.repeat.set(2.3, 2.3); return t; });

  function drawBannerBase(g, w, h, bg, edge, R) {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.04)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    specks(g, w, h, 2500, R, ['255,255,255', '0,0,0'], 0.02, 0.07, 1, 3);
    g.strokeStyle = edge; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24);
    g.lineWidth = 2; g.strokeRect(22, 22, w - 44, h - 44);
  }
  function brushChars(g, chars, x, y0, step, font, color, R) {
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < chars.length; i++) {
      const y = y0 + i * step;
      g.save(); g.translate(x, y); g.rotate((R() - 0.5) * 0.08);
      g.fillStyle = color; g.globalAlpha = 0.25; g.fillText(chars[i], 3, 4);
      g.globalAlpha = 1; g.fillText(chars[i], 0, 0);
      g.restore();
    }
    g.fillStyle = color;
    for (let i = 0; i < 36; i++) { g.globalAlpha = 0.5 + R() * 0.5; g.beginPath(); g.arc(x + (R() - 0.5) * 190, y0 - step * 0.4 + R() * step * chars.length, 1 + R() * 3.5, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  }
  function seal(g, x, y, s, ch) {
    g.fillStyle = '#b3141a'; g.fillRect(x - s / 2, y - s / 2, s, s);
    g.fillStyle = '#fff4e8'; g.font = '900 ' + ((s * 0.62) | 0) + 'px ' + JP; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x, y + 2);
  }
  // 288x944 == 1.1 m x 3.6 m hanging banner
  TX.banner = (v) => DS.cache('w.banner' + v, () => DS.canvasTex(288, 944, (g, w, h) => {
    const R = DS.rng(500 + v);
    if (v === 0) { drawBannerBase(g, w, h, '#efe4c9', 'rgba(40,30,20,0.8)', R); brushChars(g, ['無', '限', '城'], w / 2, 200, 255, '900 200px ' + JP, '#141010', R); seal(g, w / 2 + 70, 870, 46, '印'); }
    else if (v === 1) { drawBannerBase(g, w, h, '#1b2152', 'rgba(220,190,120,0.85)', R); brushChars(g, ['鬼', '滅'], w / 2, 250, 330, '900 230px ' + JP, '#f2f2f2', R); seal(g, w / 2, 850, 52, '柱'); }
    else if (v === 2) { drawBannerBase(g, w, h, '#141014', 'rgba(232,182,74,0.9)', R); brushChars(g, ['炎'], w / 2, 270, 0, '900 250px ' + JP, '#ff9a3a', R); brushChars(g, ['心', 'を', '燃', 'や', 'せ'], w / 2, 520, 78, '900 64px ' + JP, '#e8b64a', R); }
    else {
      // in-world branding banner
      drawBannerBase(g, w, h, '#8e0f14', 'rgba(255,215,140,0.9)', R);
      g.font = '900 90px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const L = 'SUBSCRIBE';
      for (let i = 0; i < L.length; i++) {
        const y = 88 + i * 96;
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillText(L[i], w / 2 + 4, y + 5);
        g.fillStyle = '#ffffff'; g.fillText(L[i], w / 2, y);
      }
    }
  }));

  TX.plaque = () => DS.cache('w.plaque', () => DS.canvasTex(512, 200, (g, w, h) => {
    g.fillStyle = '#120a08'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9b25a'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
    g.lineWidth = 2; g.strokeRect(26, 26, w - 52, h - 52);
    g.fillStyle = '#b3261e'; for (const [x, y] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) g.fillRect(x - 12, y - 12, 24, 24);
    const gr = g.createLinearGradient(0, 40, 0, 160); gr.addColorStop(0, '#fff0b8'); gr.addColorStop(1, '#c8912e');
    g.fillStyle = gr; g.shadowColor = '#ffcf6a'; g.shadowBlur = 12;
    g.font = '900 124px ' + JP; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('無', 176, 104); g.fillText('限', 336, 104);
  }, { wrap: false }));

  // ---- train
  function rivet(g, x, y) {
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(x + 1, y + 1, 2.6, 0, TAU); g.fill();
    g.fillStyle = '#5d6669'; g.beginPath(); g.arc(x, y, 2.2, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x - 1, y - 1, 1, 1);
  }
  TX.roof = () => DS.cache('w.roof', () => DS.canvasTex(512, 512, (g, w, h) => {
    const R = DS.rng(313);
    g.fillStyle = '#262d2e'; g.fillRect(0, 0, w, h);
    for (let c = 0; c < 2; c++) for (let r = 0; r < 4; r++) { g.fillStyle = 'rgba(' + (R() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (0.02 + R() * 0.05).toFixed(3) + ')'; g.fillRect(c * 256, r * 128, 256, 128); }
    specks(g, w, h, 6000, R, ['0,0,0', '255,255,255', '90,60,40'], 0.03, 0.12, 1, 3);
    for (let i = 0; i < 80; i++) {
      const x = R() * w, y = R() * h, l = 40 + R() * 180, sw = 2 + R() * 5, a = (0.06 + R() * 0.1).toFixed(2);
      g.fillStyle = 'rgba(0,0,0,' + a + ')'; g.fillRect(x, y, sw, l); if (y + l > h) g.fillRect(x, y - h, sw, l);
    }
    for (let i = 0; i < 25; i++) { g.fillStyle = 'rgba(130,64,30,' + (0.08 + R() * 0.1).toFixed(2) + ')'; g.beginPath(); g.arc(R() * w, R() * h, 3 + R() * 10, 0, TAU); g.fill(); }
    for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(200,210,210,0.05)'; g.fillRect(96 + R() * 320, R() * h, 10 + R() * 30, 3 + R() * 6); }
    for (let r = 0; r < 4; r++) {
      const y = r * 128;
      g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(0, y, w, 3); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, y + 3, w, 1);
      for (let x = 8; x < w; x += 16) rivet(g, x, y + 9);
    }
    for (const x of [0, 256]) { g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(x, 0, 3, h); for (let y = 8; y < h; y += 16) rivet(g, x + 9, y); }
  }, { repeat: [2, 5.5] }));

  function drawPaddy(g, w, h, rough) {
    const R = DS.rng(909);
    const xs = [0, 140 + R() * 40, 290 + R() * 40, 410 + R() * 40, w];
    const ys = [0, 110 + R() * 40, 250 + R() * 40, 380 + R() * 40, h];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1];
      const r1 = R(), r2 = R(), r3 = R();
      const dry = r1 < 0.22, rice = !dry && r2 < 0.6;
      if (rough) g.fillStyle = dry ? '#d8d8d8' : '#1e1e1e';
      else if (dry) g.fillStyle = '#1f2419';
      else {
        const gr = g.createLinearGradient(x0, y0, x1, y1);
        gr.addColorStop(0, 'rgb(' + ((14 + r3 * 10) | 0) + ',' + ((22 + r3 * 12) | 0) + ',' + ((48 + r3 * 22) | 0) + ')'); gr.addColorStop(1, '#0a1128');
        g.fillStyle = gr;
      }
      g.fillRect(x0, y0, x1 - x0, y1 - y0);
      if (rice || dry) {
        g.fillStyle = rough ? '#9a9a9a' : (dry ? 'rgba(62,66,42,0.85)' : 'rgba(52,88,48,0.9)');
        for (let yy = y0 + 8; yy < y1 - 5; yy += 9) for (let xx = x0 + 8; xx < x1 - 5; xx += 9) g.fillRect(xx, yy, dry ? 6 : 3, dry ? 1.5 : 3);
      }
    }
    const dike = (x, y, ww, hh) => {
      g.fillStyle = rough ? '#f0f0f0' : '#24261b'; g.fillRect(x, y, ww, hh);
      if (!rough) { g.fillStyle = 'rgba(92,94,66,0.6)'; g.fillRect(x, y, ww, 2); }
    };
    for (const x of xs) dike(x - 6, 0, 12, h);
    for (const y of ys) dike(0, y - 6, w, 12);
  }
  TX.paddy = () => DS.cache('w.paddy', () => DS.canvasTex(512, 512, (g, w, h) => drawPaddy(g, w, h, false), { repeat: [28, 28] }));
  TX.paddyR = () => DS.cache('w.paddyR', () => DS.canvasTex(512, 512, (g, w, h) => drawPaddy(g, w, h, true), { repeat: [28, 28], srgb: false }));

  TX.river = () => DS.cache('w.river', () => DS.canvasTex(256, 256, (g, w, h) => {
    const R = DS.rng(71);
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#0e1734'); gr.addColorStop(0.5, '#1d3170'); gr.addColorStop(1, '#0e1734');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) { g.fillStyle = 'rgba(210,228,255,' + (0.25 + R() * 0.65).toFixed(2) + ')'; g.fillRect(30 + R() * (w - 60), R() * h, 5 + R() * 16, 1.5); }
  }, { repeat: [1, 700 / 12] }));

  TX.glint = () => DS.cache('w.glint', () => DS.canvasTex(64, 512, (g, w, h) => {
    const R = DS.rng(8);
    for (let y = 0; y < h; y += 3) {
      const t = y / h, env = Math.pow(Math.sin(t * PI), 1.4);
      const a = env * (0.25 + 0.75 * R()), hw = 4 + (0.4 + 0.6 * t) * 24 * R();
      g.fillStyle = 'rgba(255,248,225,' + a.toFixed(3) + ')'; g.fillRect(32 - hw, y, hw * 2, 2);
    }
  }, { wrap: false }));

  // ---- arena
  TX.compass = () => DS.cache('w.compass', () => DS.canvasTex(1024, 1024, (g) => {
    const R0 = 470;
    g.translate(512, 512); g.lineCap = 'round'; g.lineJoin = 'round';
    const glow = (col, lw, blur) => { g.strokeStyle = col; g.lineWidth = lw; g.shadowColor = col; g.shadowBlur = blur; };
    const cg = g.createRadialGradient(0, 0, 0, 0, 0, R0);
    cg.addColorStop(0, 'rgba(255,120,210,0.5)'); cg.addColorStop(0.35, 'rgba(255,90,200,0.16)'); cg.addColorStop(1, 'rgba(99,230,255,0)');
    g.fillStyle = cg; g.beginPath(); g.arc(0, 0, R0, 0, TAU); g.fill();
    glow('#63e6ff', 7, 20); g.beginPath(); g.arc(0, 0, R0, 0, TAU); g.stroke();
    glow('#9ff3ff', 3, 10); g.beginPath(); g.arc(0, 0, R0 - 30, 0, TAU); g.stroke();
    g.beginPath(); g.arc(0, 0, R0 * 0.36, 0, TAU); g.stroke();
    for (let i = 0; i < 72; i++) {
      const a = i / 72 * TAU, l = i % 6 === 0 ? 24 : 11, s = Math.sin(a), c = -Math.cos(a);
      g.beginPath(); g.moveTo(s * (R0 - 3), c * (R0 - 3)); g.lineTo(s * (R0 - 3 - l), c * (R0 - 3 - l)); g.stroke();
    }
    for (let i = 0; i < 12; i++) {
      g.save(); g.rotate(i / 12 * TAU);
      const major = i % 3 === 0, L = major ? R0 - 46 : R0 * 0.7;
      glow('#ff6fd0', major ? 10 : 6, 24);
      g.beginPath(); g.moveTo(0, -R0 * 0.1); g.lineTo(0, -L);
      for (let b = 1; b <= 3; b++) {
        const y = -L * (0.28 + b * 0.17), bl = L * (0.2 - b * 0.035);
        g.moveTo(0, y); g.lineTo(-bl, y - bl); g.moveTo(0, y); g.lineTo(bl, y - bl);
      }
      g.stroke();
      glow('#ffffff', 3, 8); g.beginPath(); g.moveTo(0, -R0 * 0.1); g.lineTo(0, -L); g.stroke();
      const tl = major ? 44 : 26, tw = major ? 16 : 10;
      g.fillStyle = major ? '#c8faff' : '#ffd6f2'; g.shadowColor = major ? '#63e6ff' : '#ff6fd0'; g.shadowBlur = 24;
      g.beginPath(); g.moveTo(0, -L - tl); g.lineTo(tw, -L); g.lineTo(0, -L + tl * 0.6); g.lineTo(-tw, -L); g.closePath(); g.fill();
      g.restore();
    }
    glow('#63e6ff', 4, 14);
    for (let k = 0; k < 2; k++) {
      g.beginPath();
      for (let j = 0; j <= 3; j++) { const a = j / 3 * TAU + k * PI / 3, px = Math.sin(a) * R0 * 0.3, py = -Math.cos(a) * R0 * 0.3; if (j) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
    }
    g.shadowBlur = 0;
    const c2 = g.createRadialGradient(0, 0, 0, 0, 0, 80);
    c2.addColorStop(0, 'rgba(255,255,255,0.95)'); c2.addColorStop(0.4, 'rgba(255,120,220,0.6)'); c2.addColorStop(1, 'rgba(255,120,220,0)');
    g.fillStyle = c2; g.beginPath(); g.arc(0, 0, 80, 0, TAU); g.fill();
  }, { wrap: false }));

  TX.ring = () => DS.cache('w.ring', () => DS.canvasTex(1024, 1024, (g) => {
    g.translate(512, 512); g.lineCap = 'round';
    g.shadowColor = '#63e6ff'; g.shadowBlur = 16; g.strokeStyle = '#63e6ff'; g.lineWidth = 4;
    g.beginPath(); g.arc(0, 0, 494, 0, TAU); g.stroke();
    g.setLineDash([26, 14]); g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 466, 0, TAU); g.stroke(); g.setLineDash([]);
    g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 402, 0, TAU); g.stroke();
    for (let i = 0; i < 24; i++) {
      g.save(); g.rotate(i / 24 * TAU); g.translate(0, -434);
      g.beginPath();
      const k = i % 4;
      if (k === 0) { g.moveTo(0, -14); g.lineTo(12, 10); g.lineTo(-12, 10); g.closePath(); }
      else if (k === 1) { g.moveTo(-12, 0); g.lineTo(12, 0); g.moveTo(0, -14); g.lineTo(0, 14); }
      else if (k === 2) { g.moveTo(0, -15); g.lineTo(10, 0); g.lineTo(0, 15); g.lineTo(-10, 0); g.closePath(); }
      else { g.arc(0, 0, 9, 0, TAU); g.moveTo(0, -18); g.lineTo(0, 18); }
      g.stroke(); g.restore();
    }
    g.shadowColor = '#ff6fd0'; g.fillStyle = '#ff8fdc';
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU; g.beginPath(); g.arc(Math.sin(a) * 434, -Math.cos(a) * 434, 7, 0, TAU); g.fill(); }
  }, { wrap: false }));

  // ============================================================ shared primitive geometry
  const G = {};
  function initG() {
    if (G.box) return;
    G.box = new THREE.BoxGeometry(1, 1, 1);
    G.cyl4 = new THREE.CylinderGeometry(1, 1, 1, 4);
    G.cyl6 = new THREE.CylinderGeometry(1, 1, 1, 6);
    G.cyl8 = new THREE.CylinderGeometry(1, 1, 1, 8);
    G.cyl12 = new THREE.CylinderGeometry(1, 1, 1, 12);
    G.cone4 = new THREE.ConeGeometry(1, 1, 4);
    G.cone5o = new THREE.ConeGeometry(1, 1, 5, 1, true);
    G.cone6 = new THREE.ConeGeometry(1, 1, 6);
    G.ico0 = new THREE.IcosahedronGeometry(1, 0);
    G.ico1 = new THREE.IcosahedronGeometry(1, 1);
    G.dode = new THREE.DodecahedronGeometry(1, 0);
    G.sph = new THREE.SphereGeometry(1, 8, 6);
  }

  // ---- forest props
  const LEAF = ['#29432f', '#2f4a36', '#253c2c', '#34503d', '#2d3f45'];
  const FLOW = [['#ff9ec4', '#ffd6e8'], ['#ff85b0', '#ffe0ee'], ['#f7a8cf', '#ffdff0'], ['#ffb0d0', '#fff0f7'], ['#ff9ec4', '#ffe6f2']];
  const BARK = ['#3a2a2e', '#45312f', '#302329'];
  function addRaceme(m, px, top, pz, L, f) {
    const h1 = L * 0.62, r1 = rr(0.18, 0.27);
    m.add(G.cone5o, px, top - h1 / 2, pz, PI, rnd() * 3, 0, r1, h1, r1, f[0]);
    const h2 = L * 0.5, r2 = r1 * 0.62;
    m.add(G.cone5o, px, top - L * 0.5 - h2 / 2, pz, PI, rnd() * 3, 0, r2, h2, r2, f[1]);
  }
  // Wisteria tree. Bounds: drops within r<=3.6 of origin, nothing below y 5.8 beyond r 2.6.
  function geoWisteria(sd) {
    seed(sd);
    const m = new Merger();
    let x = 0, z = 0, y = -0.2, r = 0.44;
    for (let i = 0; i < 6; i++) {
      const nx = x + rr(-0.18, 0.18), nz = z + rr(-0.18, 0.18), ny = y + 1.0;
      m.limb(x, y, z, nx, ny, nz, r, r * 0.88, pick(BARK), 7);
      x = nx; z = nz; y = ny; r *= 0.88;
    }
    const tops = [];
    const nb = 4;
    for (let b = 0; b < nb; b++) {
      const a = b / nb * TAU + rr(-0.4, 0.4), d = rr(1.2, 1.9);
      const bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d, by = rr(6.6, 7.2);
      m.limb(x, y - 0.5, z, bx, by, bz, 0.2, 0.09, pick(BARK), 5);
      tops.push(bx, by, bz);
    }
    for (let b = 0; b < nb; b++) m.add(G.ico1, tops[b * 3], tops[b * 3 + 1] + 0.25, tops[b * 3 + 2], rr(0, 1), rr(0, 3), 0, rr(1.4, 1.8), rr(0.75, 0.9), rr(1.4, 1.8), pick(LEAF));
    m.add(G.ico1, x, 7.6, z, 0, rr(0, 3), 0, 1.8, 0.95, 1.8, pick(LEAF));
    for (let i = 0; i < 12; i++) {
      const b = (rnd() * nb) | 0, a = rnd() * TAU, f = pick(FLOW);
      m.add(G.ico0, tops[b * 3] + Math.cos(a) * 1.2, tops[b * 3 + 1] + rr(0.3, 0.9), tops[b * 3 + 2] + Math.sin(a) * 1.2, rnd(), rnd() * 3, 0, rr(0.45, 0.7), rr(0.35, 0.5), rr(0.45, 0.7), f[rnd() < 0.5 ? 0 : 1]);
    }
    for (let i = 0; i < 36; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * 2.5;
      addRaceme(m, x + Math.cos(a) * d, rr(6.0, 6.5), z + Math.sin(a) * d, rr(0.9, 1.9), pick(FLOW));
    }
    return m.build();
  }
  // Wisteria pergola arch spanning the track: posts at x=+-5, top y~8.1, clear below y 5.75 for |x|<4.1
  function geoArch(sd) {
    seed(sd);
    const m = new Merger();
    const ax = (t) => 5 * Math.cos(t), ay = (t) => 5.0 + 3.1 * Math.sin(t);
    for (let s = -1; s <= 1; s += 2) for (let zi = -1; zi <= 1; zi += 2) {
      const zz = zi * 1.0;
      let px = s * 5, pz = zz, py = 0;
      for (let k = 0; k < 5; k++) {
        const ny = py + 1.0, nx = s * 5 + Math.sin(k * 1.3 + zz) * 0.16, nz = zz + Math.cos(k * 1.1 + zz) * 0.16;
        m.limb(px, py, pz, nx, ny, nz, 0.27 - k * 0.02, 0.25 - k * 0.02, pick(BARK), 6);
        px = nx; py = ny; pz = nz;
      }
      m.limb(px, py, pz, s * 5, 5.0, zz, 0.18, 0.17, pick(BARK), 6);
    }
    const NA = 14;
    for (let zi = -1; zi <= 1; zi += 2) for (let k = 0; k < NA; k++) {
      const a0 = k / NA * PI, a1 = (k + 1) / NA * PI;
      m.limb(ax(a0), ay(a0), zi * 1.0, ax(a1), ay(a1), zi * 1.0, 0.17, 0.17, '#3b2a2a', 6);
    }
    for (let k = 1; k < NA; k++) { const a = k / NA * PI; m.limb(ax(a), ay(a) + 0.1, -1.35, ax(a), ay(a) + 0.1, 1.35, 0.07, 0.07, '#4a3530', 4); }
    for (let k = 0; k <= 22; k++) {
      const a = rr(0.35, PI - 0.35);
      if (ay(a) < 6.0) continue;
      m.add(G.ico1, ax(a), ay(a) + 0.35, rr(-0.7, 0.7), rnd(), rnd() * 3, 0, rr(0.9, 1.3), 0.6, rr(1.1, 1.5), pick(LEAF));
    }
    for (let k = 0; k < 16; k++) { const a = rr(0.3, PI - 0.3), f = pick(FLOW); m.add(G.ico0, ax(a), ay(a) + rr(0.6, 0.9), rr(-1.1, 1.1), rnd(), rnd() * 3, 0, rr(0.35, 0.55), 0.35, rr(0.35, 0.55), f[0]); }
    for (let i = 0; i < 80; i++) {
      const a = rr(0.1, PI - 0.1), x = ax(a), y = ay(a) - 0.05;
      let L = rr(0.8, 1.7);
      if (Math.abs(x) < 4.1) L = Math.min(L, y - 5.8);
      if (L < 0.35) continue;
      addRaceme(m, x, y, rr(-1.4, 1.4), L, pick(FLOW));
    }
    return m.build();
  }
  function geoToro() {
    const m = new Merger(), a = '#8d8a99', b = '#77738a', c = '#6a6679', moss = '#56705a';
    m.add(G.cyl6, 0, 0.12, 0, 0, 0, 0, 0.6, 0.24, 0.6, b);
    m.add(G.cyl6, 0, 0.3, 0, 0, 0.3, 0, 0.42, 0.14, 0.42, moss);
    m.add(G.cyl8, 0, 0.9, 0, 0, 0, 0, 0.19, 1.1, 0.19, a);
    m.add(G.cyl8, 0, 1.3, 0, 0, 0, 0, 0.23, 0.08, 0.23, c);
    m.add(G.cyl6, 0, 1.5, 0, 0, 0.26, 0, 0.5, 0.16, 0.5, c);
    for (let px = -1; px <= 1; px += 2) for (let pz = -1; pz <= 1; pz += 2) m.add(G.box, px * 0.23, 1.8, pz * 0.23, 0, 0, 0, 0.1, 0.44, 0.1, a);
    m.add(G.cyl6, 0, 2.06, 0, 0, 0.26, 0, 0.62, 0.08, 0.62, c);
    m.add(G.cone6, 0, 2.33, 0, 0, 0.26, 0, 0.8, 0.46, 0.8, b);
    m.add(G.cone6, 0, 2.3, 0, 0, 0.8, 0, 0.72, 0.4, 0.72, moss);
    m.add(G.sph, 0, 2.62, 0, 0, 0, 0, 0.12, 0.12, 0.12, a);
    m.add(G.cone6, 0, 2.8, 0, 0, 0, 0, 0.07, 0.22, 0.07, a);
    return m.build();
  }
  function geoToroCore() { return new Merger().add(G.box, 0, 1.8, 0, 0, 0, 0, 0.38, 0.4, 0.38).build(); }
  function geoBamboo(sd) {
    seed(sd);
    const m = new Merger();
    for (let i = 0; i < 8; i++) {
      const a = rnd() * TAU, d = rr(0, 1.3), x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = rr(6.5, 10.5), r = rr(0.06, 0.1), lx = rr(-0.5, 0.5), lz = rr(-0.5, 0.5);
      m.limb(x, 0, z, x + lx, h, z + lz, r, r * 0.8, pick(['#4f7a45', '#5d8a4e', '#44703f', '#6b9152']), 6);
      for (let y = 1.1; y < h - 0.3; y += rr(0.9, 1.3)) { const t = y / h; m.add(G.cyl6, x + lx * t, y, z + lz * t, 0, 0, 0, r * 1.3, 0.05, r * 1.3, '#7ea266'); }
      for (let k = 0; k < 10; k++) {
        const t = rr(0.55, 1), ang = rnd() * TAU;
        m.add(G.cone4, x + lx * t + Math.cos(ang) * 0.35, h * t, z + lz * t + Math.sin(ang) * 0.35, rr(1.2, 2.0), ang, 0, 0.09, 0.8, 0.03, pick(['#2f5a34', '#3c6b3a', '#355f33']));
      }
    }
    return m.build();
  }
  function geoGrass(sd) {
    seed(sd);
    const m = new Merger();
    for (let i = 0; i < 9; i++) { const a = rnd() * TAU, d = rr(0, 0.25); m.add(G.cone4, Math.cos(a) * d, 0.22, Math.sin(a) * d, rr(-0.35, 0.35), rnd() * TAU, 0, 0.05, rr(0.35, 0.6), 0.015, pick(['#3c5f3a', '#4d7045', '#2f4c33', '#58784a'])); }
    for (let i = 0; i < 3; i++) m.add(G.ico0, rr(-0.2, 0.2), rr(0.35, 0.5), rr(-0.2, 0.2), 0, 0, 0, 0.05, 0.05, 0.05, pick(['#c9a8ff', '#f0b8e6']));
    return m.build();
  }
  function geoRock() { return new Merger().add(G.dode, 0, 0.3, 0, 0, 0, 0, 1, 0.72, 1).build(); }
  function geoMountains(sd, R0, n, h0, h1, cols) {
    seed(sd);
    const m = new Merger();
    for (let i = 0; i < n; i++) {
      const a = (i + rr(-0.3, 0.3)) / n * TAU, R = R0 + rr(-18, 18), h = rr(h0, h1), rad = h * rr(0.9, 1.5);
      m.add(G.cone6, Math.sin(a) * R, h / 2 - 3, Math.cos(a) * R, 0, rnd() * TAU, 0, rad, h, rad, pick(cols));
      if (chance(0.6)) { const h2 = h * rr(0.5, 0.75), a2 = a + rr(-0.05, 0.05), R2 = R - rr(5, 15); m.add(G.cone6, Math.sin(a2) * R2, h2 / 2 - 3, Math.cos(a2) * R2, 0, rnd() * TAU, 0, h2 * 1.2, h2, h2 * 1.2, pick(cols)); }
    }
    return m.build();
  }
  function geoPagoda() {
    const m = new Merger(), wall = '#1d1830', roof = '#15111f', win = new Merger();
    m.add(G.cone6, 0, 6, 0, 0, 0.3, 0, 20, 16, 20, '#1b1a2e');
    let y = 12.5;
    for (let i = 0; i < 5; i++) {
      const w = 7 - i * 1.0;
      m.add(G.box, 0, y + 1.3, 0, 0, 0, 0, w, 2.6, w, wall);
      m.add(G.cone4, 0, y + 3.0, 0, 0, PI / 4, 0, w * 0.98, 1.4, w * 0.98, roof);
      for (let k = 0; k < 4; k++) { const a = k * HP; win.add(G.box, Math.sin(a) * w * 0.5, y + 1.2, Math.cos(a) * w * 0.5, 0, a, 0, w * 0.35, 0.7, 0.1); }
      y += 3.4;
    }
    m.limb(0, y, 0, 0, y + 6, 0, 0.3, 0.08, '#2a2238', 5);
    for (let k = 0; k < 5; k++) m.add(G.cyl8, 0, y + 1 + k * 0.8, 0, 0, 0, 0, 0.5 - k * 0.05, 0.12, 0.5 - k * 0.05, '#2a2238');
    return { body: m.build(), win: win.build() };
  }
  function geoCrow() {
    const m = new Merger(), c = '#16141d';
    m.add(G.sph, 0, 0, 0, 0, 0, 0, 0.17, 0.15, 0.38, c);
    m.add(G.sph, 0, 0.08, -0.36, 0, 0, 0, 0.12, 0.11, 0.13, c);
    m.add(G.cone4, 0, 0.06, -0.53, -HP, 0, 0, 0.04, 0.14, 0.04, '#3a3530');
    m.add(G.box, 0, 0.02, 0.42, 0.1, 0, 0, 0.2, 0.03, 0.3, c);
    return m.build();
  }
  function geoWing(s) {
    const m = new Merger(), c = '#1b1824';
    m.add(G.box, s * 0.38, 0, 0, 0, 0, 0, 0.76, 0.02, 0.3, c);
    m.add(G.box, s * 0.9, 0, 0.05, 0, s * 0.25, 0, 0.4, 0.015, 0.2, c);
    return m.build();
  }
  // Hanging paper lantern: origin = pivot (ceiling attach), body center at y=-L
  function geoChochin(L) {
    const body = new Merger().add(new THREE.SphereGeometry(0.36, 14, 10), 0, -L, 0, 0, 0, 0, 1, 1.25, 1).build();
    const hw = new Merger(), k = '#1a0e0a';
    hw.add(G.cyl8, 0, -L + 0.47, 0, 0, 0, 0, 0.2, 0.09, 0.2, k);
    hw.add(G.cyl8, 0, -L - 0.47, 0, 0, 0, 0, 0.2, 0.09, 0.2, k);
    hw.add(G.cyl8, 0, -L - 0.57, 0, 0, 0, 0, 0.05, 0.12, 0.05, '#c9a052');
    if (L > 0.6) hw.add(G.cyl4, 0, -(L - 0.5) / 2, 0, 0, 0, 0, 0.018, L - 0.5, 0.018, '#2b1a12');
    return { body, hw: hw.build() };
  }
  const chochinGeo = (L) => DS.cache('w.geo.chochin' + L, () => geoChochin(L));

  // ---- castle props
  function geoCastleFrame() {
    const m = new Merger(), post = '#3b2013', rail = '#2a160d', beam = '#231209';
    for (let z = 60; z >= -300; z -= 3) {
      for (let s = -1; s <= 1; s += 2) m.add(G.box, s * 5.5, 3.75, z, 0, 0, 0, 0.3, 7.5, 0.3, post);
      m.add(G.box, 0, 7.34, z, 0, 0, 0, 11, 0.3, 0.26, beam);
    }
    for (let s = -1; s <= 1; s += 2) {
      m.add(G.box, s * 5.52, 0.13, -120, 0, 0, 0, 0.36, 0.26, 360, rail);
      m.add(G.box, s * 5.5, 6.1, -120, 0, 0, 0, 0.38, 0.3, 360, rail);
      m.add(G.box, s * 5.5, 7.4, -120, 0, 0, 0, 0.4, 0.2, 360, rail);
      m.add(G.box, s * 3.0, 7.38, -120, 0, 0, 0, 0.24, 0.22, 360, beam);
    }
    return m.build();
  }
  function geoRailing() {
    const m = new Merger(), lac = '#7a1f16', gold = '#c9a052';
    m.add(G.box, 0, 1.0, 0, 0, 0, 0, 0.12, 0.1, 2.72, lac);
    m.add(G.box, 0, 0.45, 0, 0, 0, 0, 0.09, 0.08, 2.72, lac);
    for (let z = -0.9; z <= 0.91; z += 0.9) m.add(G.box, 0, 0.5, z, 0, 0, 0, 0.08, 1.0, 0.08, lac);
    for (let s = -1; s <= 1; s += 2) m.add(G.sph, 0, 1.1, s * 1.28, 0, 0, 0, 0.09, 0.12, 0.09, gold);
    return m.build();
  }
  function geoAlcove() {
    const m = new Merger(), wood = '#3a2015';
    m.add(G.box, 7.25, -0.04, 0, 0, 0, 0, 3.5, 0.08, 2.72, '#4a2a1b');
    m.add(G.box, 7.25, 5.98, 0, 0, 0, 0, 3.5, 0.1, 2.72, '#24130b');
    for (let s = -1; s <= 1; s += 2) {
      m.add(G.box, 7.25, 2.97, s * 1.4, 0, 0, 0, 3.5, 5.95, 0.08, wood);
      m.add(G.box, 8.95, 2.97, s * 1.3, 0, 0, 0, 0.2, 5.95, 0.2, '#2a160d');
    }
    return m.build();
  }
  function geoDeepShoji() {
    const p = remapUV(new THREE.PlaneGeometry(2.72, 5.7), 0, 1, 0, 5.7 / 7.25);
    const g = new Merger().add(p, 9.0, 0.25 + 2.85, 0, 0, -HP, 0).build();
    p.dispose();
    return g;
  }
  function geoTorii() {
    const m = new Merger(), red = '#b3261e', blk = '#1a1010';
    for (let s = -1; s <= 1; s += 2) {
      m.limb(s * 5, 0, 0, s * 5, 7.0, 0, 0.3, 0.26, red, 10);
      m.add(G.cyl12, s * 5, 0.35, 0, 0, 0, 0, 0.36, 0.7, 0.36, blk);
      m.add(G.box, s * 6.25, 7.1, 0, 0, 0, s * 0.18, 0.9, 0.2, 0.5, blk);
    }
    m.add(G.box, 0, 5.9, 0, 0, 0, 0, 11.6, 0.3, 0.26, red);
    m.add(G.box, 0, 6.8, 0, 0, 0, 0, 12.0, 0.22, 0.42, red);
    m.add(G.box, 0, 7.02, 0, 0, 0, 0, 12.4, 0.24, 0.52, blk);
    m.add(G.box, 0, 6.47, -0.06, 0, 0, 0, 2.25, 0.98, 0.1, blk);
    return m.build();
  }
  function geoRods() {
    const m = new Merger(), k = '#1a0f0a';
    m.add(G.cyl6, 0, 6.72, 0, 0, 0, HP, 0.045, 1.3, 0.045, k);
    m.add(G.cyl6, 0, 3.08, 0, 0, 0, HP, 0.055, 1.3, 0.055, k);
    for (let s = -1; s <= 1; s += 2) {
      m.add(G.box, s * 0.5, 7.08, 0, 0, 0, 0, 0.015, 0.72, 0.015, '#caa46a');
      m.add(G.sph, s * 0.68, 6.72, 0, 0, 0, 0, 0.07, 0.07, 0.07, '#c9a052');
      m.add(G.sph, s * 0.68, 3.08, 0, 0, 0, 0, 0.08, 0.08, 0.08, '#c9a052');
    }
    return m.build();
  }
  function geoRoom() {
    const w = new Merger(), dk = '#2a160d';
    w.add(G.box, 0, -0.15, 0, 0, 0, 0, 6.4, 0.3, 6.4, '#9c9357');
    for (let i = -1; i <= 1; i++) w.add(G.box, i * 1.6, 0.01, 0, 0, 0, 0, 0.06, 0.03, 6.2, '#1c2030');
    for (let x = -1; x <= 1; x += 2) for (let z = -1; z <= 1; z += 2) w.add(G.box, x * 3.05, 1.6, z * 3.05, 0, 0, 0, 0.22, 3.2, 0.22, dk);
    for (let s = -1; s <= 1; s += 2) { w.add(G.box, 0, 3.25, s * 3.05, 0, 0, 0, 6.4, 0.22, 0.22, dk); w.add(G.box, s * 3.05, 3.25, 0, 0, 0, 0, 0.22, 0.22, 6.4, dk); }
    w.add(new THREE.ConeGeometry(5, 1.6, 4), 0, 4.15, 0, 0, PI / 4, 0, 1, 1, 1, '#1b1420');
    w.add(G.box, 0, 0.9, 3.05, 0, 0, 0, 5.9, 0.08, 0.1, '#7a1f16');
    const pg = remapUV(new THREE.PlaneGeometry(5.9, 3.0), 0, 1, 0.09, 0.72);
    const p = new Merger();
    p.add(pg, 0, 1.6, -3.05);
    p.add(pg, -3.05, 1.6, 0, 0, HP, 0);
    p.add(pg, 3.05, 1.6, 0, 0, -HP, 0);
    pg.dispose();
    return { wood: w.build(), paper: p.build() };
  }
  function geoStairs() {
    const m = new Merger();
    for (let i = 0; i < 14; i++) m.add(G.box, 0, i * 0.32 + 0.16 - 2.2, -i * 0.42 + 2.9, 0, 0, 0, 1.8, 0.32, 0.46, i % 2 ? '#5a3321' : '#4d2b1b');
    for (let s = -1; s <= 1; s += 2) m.limb(s * 0.95, -2.2, 3.1, s * 0.95, 14 * 0.32 - 2.2, -14 * 0.42 + 2.9, 0.1, 0.1, '#7a1c14', 5);
    m.add(G.box, 0, 14 * 0.32 - 2.3, -14 * 0.42 + 1.9, 0, 0, 0, 2.4, 0.2, 2.4, '#3b2013');
    return m.build();
  }
  function geoBeam() {
    const m = new Merger();
    m.add(G.box, 0, 0, 0, 0, 0, 0, 0.9, 0.9, 40, '#6e1a14');
    for (let s = -1; s <= 1; s += 2) m.add(G.box, 0, 0, s * 20, 0, 0, 0, 1.1, 1.1, 0.8, '#140b08');
    for (let k = -2; k <= 2; k++) m.add(G.box, 0, 0, k * 7, 0, 0, 0, 1.0, 1.0, 0.3, '#c9a052');
    return m.build();
  }

  // ---- train props
  function geoCar() {
    const m = new Merger(), body = '#1e3a2f', stripe = '#c9a052', roofc = '#1c2224', under = '#141414';
    m.add(new THREE.CylinderGeometry(0.6, 0.6, 22, 8, 1, true, HP, HP), 4.0, -0.6, 0, HP, 0, 0, 1, 1, 1, roofc);
    m.add(new THREE.CylinderGeometry(0.6, 0.6, 22, 8, 1, true, PI, HP), -4.0, -0.6, 0, HP, 0, 0, 1, 1, 1, roofc);
    m.add(G.box, 0, -2.3, 0, 0, 0, 0, 9.2, 3.4, 22, body);
    for (let s = -1; s <= 1; s += 2) {
      m.add(G.box, s * 4.61, -1.02, 0, 0, 0, 0, 0.04, 0.08, 22, stripe);
      m.add(G.box, s * 4.61, -3.3, 0, 0, 0, 0, 0.04, 0.1, 22, stripe);
      m.add(G.box, s * 4.605, -1.9, 0, 0, 0, 0, 0.03, 1.1, 20.6, '#101a15');
      for (let k = 0; k < 5; k++) {
        const z = -8.8 + k * 4.4;
        m.add(G.cyl8, s * 4.12, 0.06, z, 0, 0, 0, 0.11, 0.2, 0.11, '#2c3436');
        m.add(G.cyl8, s * 4.12, 0.19, z, 0, 0, 0, 0.19, 0.06, 0.19, '#394244');
      }
    }
    m.add(G.box, 0, -4.25, 0, 0, 0, 0, 7.6, 0.5, 21, under);
    for (let bz = -7.5; bz <= 7.5; bz += 15) {
      m.add(G.box, 0, -4.7, bz, 0, 0, 0, 6.6, 0.6, 3.4, '#1a1a1c');
      for (let wz = -1.1; wz <= 1.1; wz += 2.2) for (let s = -1; s <= 1; s += 2) m.add(G.cyl12, s * 3.0, -5.05, bz + wz, 0, 0, HP, 0.5, 0.25, 0.5, '#2a2a2e');
    }
    // flush coupling / bellows in the 1 m gap ahead of the car
    m.add(G.box, 0, -0.035, -11.5, 0, 0, 0, 7.8, 0.06, 1.04, '#0d0d0f');
    for (let k = 0; k < 4; k++) m.add(G.box, 0, -0.012, -11.14 - k * 0.24, 0, 0, 0, 7.8, 0.03, 0.06, '#262629');
    m.add(G.box, 0, -2.0, -11.5, 0, 0, 0, 7.4, 3.8, 1.0, '#0c0c0e');
    return m.build();
  }
  function geoRoofDeck() { const p = new THREE.PlaneGeometry(8.0, 22).rotateX(-HP); const g = new Merger().add(p, 0, 0, 0).build(); p.dispose(); return g; }
  function geoCarWin() {
    const m = new Merger();
    for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 10; k++) m.add(G.box, s * 4.62, -1.9, -9.9 + k * 2.2, 0, 0, 0, 0.04, 0.75, 1.3);
    return m.build();
  }
  function geoCarLamps() {
    const m = new Merger();
    for (let s = -1; s <= 1; s += 2) m.add(G.box, s * 4.35, -0.32, 11.02, 0, 0, 0, 0.18, 0.18, 0.06);
    return m.build();
  }
  function geoPole() {
    const m = new Merger(), wood = '#2b2420';
    m.limb(0, -5.8, 0, 0, 7.0, 0, 0.16, 0.12, wood, 6);
    m.add(G.box, 0, 6.3, 0, 0, 0, 0, 2.0, 0.14, 0.14, wood);
    for (let ix = -0.8; ix <= 0.81; ix += 0.8) {
      m.add(G.cyl6, ix, 6.48, 0, 0, 0, 0, 0.05, 0.22, 0.05, '#a8b0b8');
      const pts = [];
      for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector3(ix, 6.56 - Math.sin(t * PI) * 1.1, -20 * t)); }
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.025, 3, false);
      m.add(tube, 0, 0, 0, 0, 0, 0, 1, 1, 1, '#15151a');
      tube.dispose();
    }
    return m.build();
  }
  function geoFieldTree() {
    const m = new Merger();
    m.limb(0, 0, 0, 0, 2.2, 0, 0.18, 0.12, '#2a2320', 5);
    m.add(G.ico0, 0, 3.2, 0, 0, 0.4, 0, 1.6, 1.8, 1.6, '#1d3327');
    m.add(G.ico0, 0.4, 4.3, 0.2, 0, 1, 0, 1.1, 1.3, 1.1, '#24402f');
    return m.build();
  }
  function geoHouse() {
    const m = new Merger();
    m.add(G.box, 0, 1.3, 0, 0, 0, 0, 4.2, 2.6, 3.2, '#3a3242');
    m.add(G.box, 0, 2.6, 0, 0, 0, PI / 4, 1.6, 1.6, 3.1, '#3a3242');
    for (let s = -1; s <= 1; s += 2) m.add(G.box, s * 1.15, 3.05, 0, 0, 0, -s * 0.55, 2.7, 0.16, 3.8, '#221c2c');
    return m.build();
  }
  function geoHouseWin() {
    const m = new Merger();
    for (let s = -1; s <= 1; s += 2) for (let z = -1; z <= 1; z += 2) m.add(G.box, s * 1.0, 1.4, z * 1.62, 0, 0, 0, 0.6, 0.5, 0.06);
    m.add(G.box, 2.12, 1.4, 0, 0, 0, 0, 0.06, 0.5, 0.8);
    return m.build();
  }

  // ---- arena props
  const PILLARS = [[-7.4, 5.4], [7.4, 5.4], [-7.4, -21.4], [7.4, -21.4]];
  function geoArenaStatic() {
    const m = new Merger(), trim = '#3a1f12', lac = '#8a1f18', dk = '#2a150d';
    m.add(G.box, 0, -0.76, -8, 0, 0, 0, 16.8, 1.5, 30.8, dk);
    m.add(G.box, 0, -0.32, -8, 0, 0, 0, 17.1, 0.34, 31.1, lac);
    for (let s = -1; s <= 1; s += 2) m.add(G.box, s * 8.15, 0.07, -8, 0, 0, 0, 0.3, 0.14, 30.6, trim);
    m.add(G.box, 0, 0.07, 7.15, 0, 0, 0, 16.6, 0.14, 0.3, trim);
    m.add(G.box, 0, 0.07, -23.15, 0, 0, 0, 16.6, 0.14, 0.3, trim);
    for (let sx = -1; sx <= 1; sx += 2) for (let sz = 0; sz < 2; sz++) {
      const z = sz ? -20 : 4;
      m.limb(sx * 7, -1.4, z, sx * 3, -42, -8 + (sz ? -6 : 6), 0.65, 0.35, dk, 6);
    }
    m.limb(-6, -8, 4, 6, -8, -20, 0.3, 0.3, lac, 5);
    m.limb(6, -8, 4, -6, -8, -20, 0.3, 0.3, lac, 5);
    m.add(G.box, 0, -26, -8, 0.2, 0.3, 0.1, 9, 0.8, 12, '#241208');
    for (let i = 0; i < PILLARS.length; i++) {
      const px = PILLARS[i][0], pz = PILLARS[i][1], sg = Math.sign(px);
      m.add(G.cyl8, px, 5, pz, 0, 0, 0, 0.42, 10, 0.42, '#9b2019');
      m.add(G.box, px, 0.4, pz, 0, 0, 0, 1.1, 0.8, 1.1, '#140b08');
      m.add(G.box, px, 10.1, pz, 0, 0, 0, 1.2, 0.3, 1.2, '#140b08');
      m.add(G.cyl8, px, 9.4, pz, 0, 0, 0, 0.5, 0.25, 0.5, '#c9a052');
      m.add(G.box, px - sg * 0.7, 7.62, pz, 0, 0, 0, 1.5, 0.18, 0.18, '#140b08');
    }
    return m.build();
  }

  // ============================================================ materials (built once, shared)
  function vcEmissive(sh) {
    sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;');
  }
  function makeMaterials() {
    const M = {};
    const add = THREE.AdditiveBlending;
    M.vc = DS.std('#ffffff', { vertexColors: true, roughness: 0.85 });
    M.flower = DS.std('#ffffff', { vertexColors: true, roughness: 0.7, emissive: DS.C('#ffffff'), emissiveIntensity: 0.26 });
    M.flower.onBeforeCompile = vcEmissive;
    M.flower.customProgramCacheKey = () => 'ds-vc-emissive';
    M.terrain = DS.std('#ffffff', { vertexColors: true, roughness: 0.95 });
    M.mount = DS.std('#ffffff', { vertexColors: true, roughness: 1 });
    M.toroGlow = DS.glow('#ffb347', 2.4);
    M.warmGlow = DS.glow('#ffc070', 1.6);
    M.redGlow = DS.glow('#ff3b2f', 2.6);
    M.farGlow = DS.glow('#ffb45a', 2.6); M.farGlow.fog = false;
    M.crow = DS.std('#16141d', { roughness: 0.5 });
    const pt = TX.path();
    M.path = DS.std('#ffffff', { map: pt, bumpMap: pt, bumpScale: 0.04, roughness: 0.9, flatShading: false });
    M.curb = DS.std('#ffffff', { map: TX.moss(), roughness: 1, flatShading: false });
    const ch = TX.chochin();
    M.chochin = new THREE.MeshStandardMaterial({ map: ch, emissive: DS.C('#ff7a40'), emissiveMap: ch, emissiveIntensity: 1.7, roughness: 0.55 });
    M.floor = DS.std('#ffffff', { map: TX.planks(), roughness: 0.35, metalness: 0, flatShading: false });
    M.ceil = DS.std('#ffffff', { map: TX.ceil(), roughness: 0.8, flatShading: false });
    const sh = TX.shoji();
    M.shoji = DS.std('#ffffff', { map: sh, emissive: DS.C('#ffb468'), emissiveMap: sh, emissiveIntensity: 0.45, roughness: 0.9, flatShading: false });
    M.shojiDS = M.shoji.clone(); M.shojiDS.side = THREE.DoubleSide;
    const fu = TX.fusuma();
    M.fusuma = DS.std('#ffffff', { map: fu, emissive: DS.C('#ffd9a0'), emissiveMap: fu, emissiveIntensity: 0.12, roughness: 0.45, metalness: 0.15, flatShading: false });
    M.banner = [0, 1, 2, 3].map((v) => { const t = TX.banner(v); return DS.std('#ffffff', { map: t, emissive: DS.C('#ffffff'), emissiveMap: t, emissiveIntensity: 0.2, roughness: 0.85, flatShading: false }); });
    const pq = TX.plaque();
    M.plaque = DS.std('#ffffff', { map: pq, emissive: DS.C('#ffe0a0'), emissiveMap: pq, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.3, flatShading: false });
    M.tatami = DS.std('#ffffff', { map: TX.tatami(), roughness: 0.85, flatShading: false });
    M.tatamiB = DS.std('#ffffff', { map: TX.tatamiB(), roughness: 0.85 });
    M.glint = new THREE.MeshBasicMaterial({ map: DS.glowTex(), color: DS.C('#ff9a50'), transparent: true, opacity: 0.3, blending: add, depthWrite: false });
    M.roof = DS.std('#ffffff', { map: TX.roof(), vertexColors: true, roughness: 0.55, metalness: 0.25, flatShading: false });
    M.paddy = DS.std('#ffffff', { map: TX.paddy(), roughnessMap: TX.paddyR(), roughness: 1, metalness: 0, flatShading: false });
    const rv = TX.river();
    M.river = DS.std('#ffffff', { map: rv, emissive: DS.C('#9ab8ff'), emissiveMap: rv, emissiveIntensity: 0.5, roughness: 0.15, flatShading: false });
    M.moonGlint = new THREE.MeshBasicMaterial({ map: TX.glint(), color: DS.C('#fff1c8'), transparent: true, opacity: 0.5, blending: add, depthWrite: false, fog: false });
    M.compass = new THREE.MeshBasicMaterial({ map: TX.compass(), transparent: true, blending: add, depthWrite: false });
    M.ring = new THREE.MeshBasicMaterial({ map: TX.ring(), transparent: true, blending: add, depthWrite: false, opacity: 0.8 });
    M.aura = new THREE.MeshBasicMaterial({ map: TX.fadeV(), color: DS.C('#ff5fc8'), transparent: true, opacity: 0.16, blending: add, depthWrite: false, side: THREE.DoubleSide });
    return M;
  }

  // ============================================================ world helpers
  function newRoot(scene, name) {
    const r = new THREE.Group();
    r.name = 'world-' + name; r.userData.name = name; r.visible = false;
    scene.add(r);
    return r;
  }
  function mkWorld(name, root, N) { return { name, root, N, segZ: new Array(N).fill(0), front: 0, lastPz: 0 }; }
  // move segments that fell behind the player to the front (most-behind first, sequential order)
  function recycle(W, pz, fill, len, behind) {
    for (let guard = 0; guard < W.N; guard++) {
      let idx = -1, best = -Infinity;
      for (let i = 0; i < W.N; i++) { const z = W.segZ[i]; if (z > pz + behind && z > best) { best = z; idx = i; } }
      if (idx < 0) return;
      W.front -= len; W.segZ[idx] = W.front; fill(idx);
    }
  }
  const K60 = TAU / 60;
  // forest terrain height: flat near the track, rising hills, periodic in z (60 m) so the snapped mesh tiles
  function terrainH(ax, z) {
    const d = Math.max(0, ax - 4.6);
    let h = d < 3 ? -0.05 + d * 0.02 : 0.01 + (d - 3) * 0.09;
    if (d > 22) h += Math.pow((d - 22) / 40, 2) * 6;
    const u = sstep(3.5, 16, d);
    if (u > 0) h += u * (Math.sin(z * K60 * 2 + ax * 0.13) * 1.1 + Math.cos(z * K60 * 3 - ax * 0.07) * 0.8 + Math.sin(z * K60 + ax * 0.31) * 0.6);
    return h;
  }
  function terrainGeo() {
    const m = new Merger();
    const cA = DS.C('#223a2d'), cB = DS.C('#2b4533'), cP = DS.C('#4b3b72'), cH = DS.C('#272a4a'), tmp = new THREE.Color();
    for (let s = -1; s <= 1; s += 2) {
      const p = new THREE.PlaneGeometry(116, 360, 46, 90).rotateX(-HP);
      const P = p.attributes.position, col = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i) + s * 62.6, z = P.getZ(i) - 120, ax = Math.abs(x), d = ax - 4.6;
        P.setXYZ(i, x, terrainH(ax, z), z);
        const n = 0.5 + 0.5 * Math.sin(z * K60 * 5 + ax * 0.45) * Math.cos(z * K60 * 2 - ax * 0.21);
        tmp.copy(cA).lerp(cB, n);
        if (d < 10 && n > 0.6) tmp.lerp(cP, Math.min(1, (n - 0.6) * 3) * (1 - d / 10));
        tmp.lerp(cH, sstep(12, 60, d));
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
      }
      p.setAttribute('color', new THREE.BufferAttribute(col, 3));
      m.addM(p, new THREE.Matrix4(), null);
      p.dispose();
    }
    return m.build();
  }

  // ============================================================ WORLD 1: WISTERIA FOREST
  function buildForest(scene, M) {
    const root = newRoot(scene, 'forest');
    const N = 8;
    const W = mkWorld('forest', root, N);
    W.nextArch = 0;

    // L1 track: long strips snapped to 60 m (texture periods divide 60)
    const track = new THREE.Group(); track.name = 'forest-track'; root.add(track);
    const pg = new THREE.PlaneGeometry(8.5, 360, 1, 1).rotateX(-HP); pg.translate(0, 0, -120);
    DS.mesh(pg, M.path, 0, 0, 0, track, false);
    const cm = new Merger();
    for (let s = -1; s <= 1; s += 2) { cm.add(G.box, s * 4.5, 0.07, -120, 0, 0, 0, 0.6, 0.24, 360); cm.add(G.box, s * 4.28, 0.03, -120, 0, 0, 0, 0.2, 0.12, 360); }
    DS.mesh(planarUV(cm.build(), 0.6, 0.5), M.curb, 0, 0, 0, track, false);
    DS.mesh(DS.cache('w.geo.terrain', terrainGeo), M.terrain, 0, 0, 0, track, false);

    // L2/L3 pooled props
    const tA = DS.cache('w.geo.wisA', () => geoWisteria(11)), tB = DS.cache('w.geo.wisB', () => geoWisteria(29));
    const nearA = new Inst(root, tA, M.flower, 6, N, true), nearB = new Inst(root, tB, M.flower, 6, N, true);
    const farA = new Inst(root, tA, M.flower, 8, N, false), farB = new Inst(root, tB, M.flower, 8, N, false);
    const arch = new Inst(root, geoArch(5), M.flower, 1, N, true);
    const chA = chochinGeo(1.0);
    const archLamp = new Inst(root, chA.body, M.chochin, 1, N, false), archLampHw = new Inst(root, chA.hw, M.vc, 1, N, false);
    const archHalo = new HaloSet(root, 0xff8a4a, 3.4, 1, N, 0.8);
    const toroG = DS.cache('w.geo.toro', geoToro), toroCG = DS.cache('w.geo.toroCore', geoToroCore);
    const toro = new Inst(root, toroG, M.vc, 4, N, true), toroCore = new Inst(root, toroCG, M.toroGlow, 4, N, false);
    const toroHalo = new HaloSet(root, 0xffb347, 3, 4, N, 0.85);
    const bamboo = new Inst(root, geoBamboo(3), M.vc, 4, N, false, true);
    const rocks = new Inst(root, geoRock(), M.vc, 8, N, true, true);
    const grass = new Inst(root, geoGrass(9), M.vc, 36, N, false, true);
    const sb = DS.shadowBlob(1, 1, 0.55);
    const blobs = new Inst(root, sb.geometry, sb.material, 8, N, false);
    blobs.mesh.receiveShadow = false; blobs.mesh.renderOrder = 1;
    const parts = [nearA, nearB, farA, farB, arch, archLamp, archLampHw, archHalo, toro, toroCore, toroHalo, bamboo, rocks, grass, blobs];
    const bambooT = ['#ffffff', '#e6f0d8', '#f4ffe8'].map(DS.C);
    const rockT = ['#6d6a7a', '#5d5b6b', '#4f5a55', '#77748a', '#585f66'].map(DS.C);
    const grassT = ['#ffffff', '#d8e8c8', '#b8e0a8', '#e8f0d8'].map(DS.C);

    // L4/L5 far layer follows the player
    const far = new THREE.Group(); far.name = 'forest-far'; root.add(far);
    const mt1 = DS.cache('w.geo.mt1', () => geoMountains(71, 150, 44, 26, 58, ['#5a7a8a', '#4a6a7a', '#3a5a6a', '#4a6a7a']));
    const mt2 = DS.cache('w.geo.mt2', () => geoMountains(72, 212, 40, 45, 95, ['#6a8a9a', '#5a7a8a', '#7a9aaa']));
    DS.mesh(mt1, M.mount, 0, 0, 0, far, false).receiveShadow = false;
    DS.mesh(mt2, M.mount, 0, 0, 0, far, false).receiveShadow = false;
    const pag = DS.cache('w.geo.pagoda', geoPagoda);
    const pagoda = new THREE.Group(); pagoda.position.set(-46, -4, -160); pagoda.scale.setScalar(1.4); far.add(pagoda);
    DS.mesh(pag.body, M.vc, 0, 0, 0, pagoda, false).receiveShadow = false;
    DS.mesh(pag.win, M.farGlow, 0, 0, 0, pagoda, false).receiveShadow = false;
    const pHalo = DS.halo(0xffa850, 34, 0.28); pHalo.material.fog = false; pHalo.position.set(0, 22, 0); pagoda.add(pHalo);

    // life: petals, fireflies, kasugai crows
    const PET = 1600;
    const pet = makePoints(root, PET, TX.petal(), 0.2, { colors: true, opacity: 0.95, alphaTest: 0.05 });
    const petV = new Float32Array(PET * 4);
    const petC = ['#ff9ec4', '#ffd0e4', '#ffb8d8', '#ffe0ee', '#ff9ec4'].map(DS.C);
    seed(4242);
    for (let i = 0; i < PET; i++) {
      setCol(pet.col, i, pick(petC), 1);
      petV[i * 4] = rr(0.5, 1.2); petV[i * 4 + 1] = rr(1.2, 3.2); petV[i * 4 + 2] = rr(0, TAU); petV[i * 4 + 3] = rr(0.3, 1.1);
    }
    pet.flagC();
    const FF = 160;
    const ff = makePoints(root, FF, DS.glowTex(), 0.42, { colors: true, additive: true });
    const ffV = new Float32Array(FF * 4), ffC = DS.C('#d8ff8a');
    for (let i = 0; i < FF; i++) { ffV[i * 4] = rr(0, TAU); ffV[i * 4 + 1] = rr(1.5, 3.5); ffV[i * 4 + 2] = rr(0, 3.6); ffV[i * 4 + 3] = chance(0.5) ? -1 : 1; }

    const crowG = DS.cache('w.geo.crow', geoCrow), wingR = DS.cache('w.geo.wingR', () => geoWing(1)), wingL = DS.cache('w.geo.wingL', () => geoWing(-1));
    const crows = [];
    for (let c = 0; c < 3; c++) {
      const g = new THREE.Group(); root.add(g);
      const b = new THREE.Mesh(crowG, M.crow), wl = new THREE.Mesh(wingL, M.crow), wr = new THREE.Mesh(wingR, M.crow);
      wl.position.set(-0.1, 0.05, -0.05); wr.position.set(0.1, 0.05, -0.05);
      g.add(b, wl, wr); g.scale.setScalar(1.7);
      crows.push({ g, wl, wr, r: 9 + c * 3.5, w: (c === 1 ? -1 : 1) * (0.42 + c * 0.1), ph: c * 2.1, h: 13 + c * 2.2, yaw: 0 });
    }

    function fill(i) {
      const zc = W.segZ[i];
      seed(zSeed(zc, 11));
      for (let k = 0; k < parts.length; k++) parts[k].begin(i);
      if (W.nextArch >= zc - 15) {
        W.nextArch = zc - (chance(0.5) ? 60 : 90);
        arch.put(0, 0, zc); archLamp.put(0, 8.0, zc); archLampHw.put(0, 8.0, zc); archHalo.put(0, 7.0, zc);
        blobs.put(-5, 0.03, zc, -HP, 0, 0, 2.6, 3.4, 1); blobs.put(5, 0.03, zc, -HP, 0, 0, 2.6, 3.4, 1);
      }
      for (let s = -1; s <= 1; s += 2) {
        for (let k = 0; k < 2; k++) {
          const z = zc + 7.5 - k * 15, x = s * 5.35, ry = rr(-0.25, 0.25);
          toro.put(x, 0, z, 0, ry, 0); toroCore.put(x, 0, z, 0, ry, 0); toroHalo.put(x, 1.8, z);
          blobs.put(x, 0.03, z, -HP, 0, 0, 1.9, 1.9, 1);
        }
        for (let k = 0; k < 3; k++) {
          const z = zc + 15 - (k + rr(0.15, 0.85)) * 10, ax = rr(8.2, 11.5), sc = rr(0.9, 1.15);
          (chance(0.5) ? nearA : nearB).put(s * ax, terrainH(ax, z) - 0.15, z, 0, rnd() * TAU, 0, sc, sc * rr(0.94, 1.08), sc);
        }
        for (let k = 0; k < 4; k++) {
          const z = zc + rr(-15, 15), ax = rr(14, 44), sc = rr(1.0, 1.55);
          (chance(0.5) ? farA : farB).put(s * ax, terrainH(ax, z) - 0.2, z, 0, rnd() * TAU, 0, sc);
        }
        for (let k = 0; k < 2; k++) {
          if (!chance(0.7)) continue;
          const z = zc + rr(-14, 14), ax = rr(12.5, 30);
          bamboo.tint(bamboo.put(s * ax, terrainH(ax, z) - 0.1, z, 0, rnd() * TAU, 0, rr(0.8, 1.2)), pick(bambooT));
        }
        for (let k = 0; k < 4; k++) {
          const z = zc + rr(-15, 15), ax = rr(5.8, 24), sc = ax < 9 ? rr(0.25, 0.55) : rr(0.4, 1.3);
          rocks.tint(rocks.put(s * ax, terrainH(ax, z) - 0.1 * sc, z, rr(-0.3, 0.3), rnd() * TAU, rr(-0.3, 0.3), sc * rr(0.9, 1.5), sc, sc * rr(0.9, 1.4)), pick(rockT));
        }
        for (let k = 0; k < 18; k++) {
          const ax = k < 10 ? rr(4.85, 7.6) : rr(7.6, 20), z = zc + rr(-15, 15);
          grass.tint(grass.put(s * ax, terrainH(ax, z), z, 0, rnd() * TAU, 0, rr(0.7, 1.4)), pick(grassT));
        }
      }
      for (let k = 0; k < parts.length; k++) parts[k].end();
    }

    W.layout = function (pz) {
      W.lastPz = pz; W.nextArch = pz - 40;
      const base = Math.round(pz / SEG) * SEG;
      for (let i = 0; i < N; i++) { W.segZ[i] = base + 15 - i * SEG; fill(i); }
      W.front = W.segZ[N - 1];
      seed(zSeed(pz, 99));
      for (let i = 0; i < PET; i++) { pet.pos[i * 3] = rr(-22, 22); pet.pos[i * 3 + 1] = rr(0, 16); pet.pos[i * 3 + 2] = pz + rr(-70, 12); }
      for (let i = 0; i < FF; i++) { ff.pos[i * 3] = ffV[i * 4 + 3] * rr(5, 18); ff.pos[i * 3 + 2] = pz + rr(-60, 10); }
      for (let c = 0; c < crows.length; c++) crows[c].g.position.set(0, crows[c].h, pz - 42);
      W.update(0, pz, 0);
    };

    W.update = function (dt, pz, t) {
      if (Math.abs(pz - W.lastPz) > 80) { W.layout(pz); return; }
      W.lastPz = pz;
      recycle(W, pz, fill, SEG, 30);
      track.position.z = Math.round(pz / 60) * 60;
      far.position.z = pz;
      // petals: fall + flutter + drift, wrapped around the player
      const p = pet.pos;
      for (let i = 0; i < PET; i++) {
        const j = i * 3, v = i * 4;
        let y = p[j + 1] - petV[v] * dt;
        if (y < 0) y += 16;
        p[j + 1] = y;
        p[j] = wrap(p[j] + (0.35 + Math.sin(t * petV[v + 1] + petV[v + 2]) * petV[v + 3]) * dt, -22, 44);
        p[j + 2] = wrap(p[j + 2] + Math.cos(t * petV[v + 1] * 0.7 + petV[v + 2]) * 0.4 * dt, pz - 70, 82);
      }
      pet.flag();
      // fireflies: side verges only (never in the lanes, so they don't read as pickups)
      const q = ff.pos;
      for (let i = 0; i < FF; i++) {
        const j = i * 3, v = i * 4, s = ffV[v + 3];
        q[j] = s * wrap(Math.abs(q[j]) + Math.sin(t * 0.6 + ffV[v]) * 0.5 * dt, 5, 13);
        q[j + 1] = 0.6 + ffV[v + 2] + Math.sin(t * 0.8 + ffV[v] * 2) * 0.5;
        q[j + 2] = wrap(q[j + 2] + Math.cos(t * 0.5 + ffV[v]) * 0.5 * dt, pz - 60, 70);
        const k = Math.max(0, Math.sin(t * ffV[v + 1] + ffV[v]));
        setCol(ff.col, i, ffC, 0.12 + 0.88 * k * k);
      }
      ff.flag(); ff.flagC();
      // kasugai crows circling ahead
      for (let c = 0; c < crows.length; c++) {
        const cr = crows[c], a = t * cr.w + cr.ph;
        const x = Math.cos(a) * cr.r, z = pz - 42 + Math.sin(a) * cr.r * 0.6, y = cr.h + Math.sin(t * 0.7 + cr.ph) * 1.2;
        const dx = x - cr.g.position.x, dz = z - cr.g.position.z;
        if (dx * dx + dz * dz > 1e-6) cr.yaw = Math.atan2(-dx, -dz);
        cr.g.position.set(x, y, z);
        cr.g.rotation.set(0, cr.yaw, -Math.cos(a) * 0.35 * Math.sign(cr.w));
        const flap = Math.sin(t * 8 + cr.ph) * (0.45 + 0.35 * Math.sin(t * 0.5 + cr.ph));
        cr.wr.rotation.z = flap; cr.wl.rotation.z = -flap;
      }
    };
    W.pose = () => ({ pos: new THREE.Vector3(1.2, 2.5, W.lastPz + 4), look: new THREE.Vector3(-0.8, 3.6, W.lastPz - 40) });
    return W;
  }

  // ============================================================ WORLD 2: INFINITY CASTLE CORRIDOR
  function buildCastle(scene, M) {
    const root = newRoot(scene, 'castle');
    const N = 7;
    const W = mkWorld('castle', root, N);
    W.bay = [{ open: 0, cool: 3 }, { open: 0, cool: 3 }];

    // static corridor shell snapped to 60 m
    const stat = new THREE.Group(); stat.name = 'castle-shell'; root.add(stat);
    const fg = new THREE.PlaneGeometry(11, 360).rotateX(-HP); fg.translate(0, 0, -120);
    DS.mesh(fg, M.floor, 0, 0, 0, stat, false);
    const cg = new THREE.PlaneGeometry(11, 360).rotateX(HP); cg.translate(0, 7.5, -120);
    DS.mesh(cg, M.ceil, 0, 0, 0, stat, false);
    DS.mesh(DS.cache('w.geo.castleFrame', geoCastleFrame), M.vc, 0, 0, 0, stat, false);

    // walls & rhythm
    const shoji = new Inst(root, new THREE.PlaneGeometry(2.72, 7.25), M.shoji, 20, N, false);
    const rail = new Inst(root, geoRailing(), M.vc, 20, N, false);
    const fusGL = remapUV(new THREE.PlaneGeometry(1.36, 5.66), 0, 0.5, 0, 1), fusGR = remapUV(new THREE.PlaneGeometry(1.36, 5.66), 0.5, 1, 0, 1);
    const fusL = new Inst(root, fusGL, M.fusuma, 4, N, false), fusR = new Inst(root, fusGR, M.fusuma, 4, N, false);
    const alcove = new Inst(root, geoAlcove(), M.vc, 4, N, false), deep = new Inst(root, geoDeepShoji(), M.shoji, 4, N, false);
    const torii = new Inst(root, geoTorii(), M.vc, 1, N, true);
    const plaque = new Inst(root, new THREE.PlaneGeometry(2.0, 0.78).translate(0, 0, 0.005), M.plaque, 1, N, false);
    const bannerG = new THREE.PlaneGeometry(1.1, 3.6);
    const banners = [0, 1, 2, 3].map((v) => new Inst(root, bannerG, M.banner[v], 2, N, false));
    const rods = new Inst(root, geoRods(), M.vc, 2, N, false);
    const LC = 1.35, chC = chochinGeo(LC);
    const lampB = new Inst(root, chC.body, M.chochin, 6, N, false), lampH = new Inst(root, chC.hw, M.vc, 6, N, false);
    const lampHalo = new HaloSet(root, 0xff8a4a, 2.8, 6, N, 0.75);
    const glint = new Inst(root, new THREE.PlaneGeometry(1, 1), M.glint, 6, N, false);
    glint.mesh.receiveShadow = false; glint.mesh.renderOrder = 1;

    // Escher void beyond the open bays
    const room = DS.cache('w.geo.room', geoRoom), stairG = DS.cache('w.geo.stairs', geoStairs), beamG = DS.cache('w.geo.beam', geoBeam);
    const platG = DS.cache('w.geo.plat', () => new THREE.BoxGeometry(4.2, 0.35, 4.2));
    const vRoomW = new Inst(root, room.wood, M.vc, 2, N, false), vRoomP = new Inst(root, room.paper, M.shojiDS, 2, N, false);
    const vStair = new Inst(root, stairG, M.vc, 2, N, false), vPlat = new Inst(root, platG, M.tatamiB, 2, N, false), vBeam = new Inst(root, beamG, M.vc, 2, N, false);
    const vLamp = new Inst(root, chochinGeo(0).body, M.chochin, 4, N, false);
    const fRooms = new FloatSet([vRoomW, vRoomP], 2, N), fStairs = new FloatSet([vStair], 2, N), fPlats = new FloatSet([vPlat], 2, N), fBeams = new FloatSet([vBeam], 2, N), fLamps = new FloatSet([vLamp], 4, N);
    const vGlow = makePoints(root, 4 * N, DS.glowTex(), 3.4, { color: '#ff9a4a', additive: true, opacity: 0.85 });
    const floats = [fRooms, fStairs, fPlats, fBeams, fLamps];
    const parts = [shoji, rail, fusL, fusR, alcove, deep, torii, plaque, rods, lampB, lampH, lampHalo, glint].concat(banners, floats);

    // per-slot animation state
    const NL = 6 * N, lx = new Float32Array(NL), lz = new Float32Array(NL), lph = new Float32Array(NL), lon = new Uint8Array(NL);
    const NF = 4 * N, fz = new Float32Array(NF), fsd = new Float32Array(NF), fmode = new Uint8Array(NF), fst = new Float32Array(NF), fon = new Uint8Array(NF);

    // embers / dust motes
    const NE = 450;
    const emb = makePoints(root, NE, DS.glowTex(), 0.09, { color: '#ffb070', additive: true, opacity: 0.7 });
    const embV = new Float32Array(NE * 2);
    seed(777);
    for (let i = 0; i < NE; i++) { embV[i * 2] = rr(0.15, 0.5); embV[i * 2 + 1] = rr(0, TAU); }

    const orient = () => pick([0, 0, PI, HP, -HP]) + rr(-0.25, 0.25);
    function fill(i) {
      const zc = W.segZ[i];
      seed(zSeed(zc, 22));
      for (let k = 0; k < parts.length; k++) parts[k].begin(i);
      torii.put(0, 0, zc); plaque.put(0, 6.47, zc);
      let nb = 0;
      for (let si = 0; si < 2; si++) {
        const s = si ? 1 : -1, st = W.bay[si], ry = s > 0 ? -HP : HP;
        for (let j = 0; j < 10; j++) {
          const zb = zc + 13.5 - j * 3;
          let type = 0;
          if (st.open > 0) { type = 1; st.open--; if (!st.open) st.cool = 3 + ((rnd() * 6) | 0); }
          else if (st.cool > 0) { st.cool--; if (chance(0.1)) type = 2; }
          else if (chance(0.2)) { type = 1; st.open = 2 + ((rnd() * 4) | 0); }
          else if (chance(0.12)) type = 2;
          if (type === 2 && fusL.k >= fusL.per) type = 0;
          if (type === 0) shoji.put(s * 5.5, 3.875, zb, 0, ry, 0);
          else if (type === 1) rail.put(s * 5.45, 0, zb);
          else {
            const idx = fusL.base + fusL.k;
            fz[idx] = zb; fsd[idx] = s; fmode[idx] = chance(0.55) ? 0 : 1; fst[idx] = fmode[idx]; fon[idx] = 1;
            const o = fst[idx], x = s * (5.46 - o * 0.06);
            fusL.put(x, 3.12, zb + 0.68 + o * 1.3, 0, ry, 0); fusR.put(x, 3.12, zb - 0.68 - o * 1.3, 0, ry, 0);
            alcove.put(0, 0, zb, 0, s > 0 ? 0 : PI, 0); deep.put(0, 0, zb, 0, s > 0 ? 0 : PI, 0);
          }
          if (nb < 2 && type !== 2 && Math.abs(zb - zc) > 2 && chance(0.1)) {
            const v = chance(0.3) ? 3 : ((rnd() * 3) | 0);
            if (banners[v].put(s * 4.72, 4.9, zb) >= 0) { rods.put(s * 4.72, 0, zb); nb++; }
          }
        }
        for (let zl = Math.ceil((zc - 15) / 12) * 12; zl < zc + 15; zl += 12) {
          const idx = lampB.put(s * 3.6, 7.5, zl); lampH.put(s * 3.6, 7.5, zl);
          if (idx >= 0) { lx[idx] = s * 3.6; lz[idx] = zl; lph[idx] = rnd() * TAU; lon[idx] = 1; }
          lampHalo.put(s * 3.6, 7.5 - LC, zl);
          glint.put(s * 3.3, 0.012, zl + 1.8, -HP, 0, 0, 1.2, 5.5, 1);
        }
        // void set pieces (outside the walls, |x| >= 12)
        fRooms.put(s * rr(16, 34), rr(-16, 20), zc + rr(-14, 14), orient(), rnd() * TAU, orient(), rr(0.9, 1.5), rr(-0.05, 0.05), rr(-0.08, 0.08), rr(0.3, 1.2));
        fStairs.put(s * rr(15, 32), rr(-14, 18), zc + rr(-14, 14), orient(), rnd() * TAU, orient(), rr(1.0, 1.8), rr(-0.06, 0.06), rr(-0.1, 0.1), rr(0.3, 1.0));
        fPlats.put(s * rr(14, 30), rr(-12, 16), zc + rr(-14, 14), chance(0.4) ? PI : rr(-0.4, 0.4), rnd() * TAU, rr(-0.4, 0.4), rr(0.9, 1.6), 0, rr(-0.12, 0.12), rr(0.4, 1.4));
        fBeams.put(s * rr(13, 30), rr(-20, 24), zc + rr(-12, 12), rr(-1.2, 1.2), rr(-0.3, 0.3), 0, 1, rr(-0.02, 0.02), 0, rr(0.2, 0.8));
        for (let k = 0; k < 2; k++) fLamps.put(s * rr(9, 28), rr(-8, 14), zc + rr(-15, 15), 0, rnd() * TAU, 0, rr(1.2, 2.2), 0, rr(-0.3, 0.3), rr(0.3, 0.8));
      }
      for (let k = lampB.k; k < lampB.per; k++) lon[lampB.base + k] = 0;
      for (let k = fusL.k; k < fusL.per; k++) fon[fusL.base + k] = 0;
      for (let k = 0; k < parts.length; k++) parts[k].end();
    }

    W.layout = function (pz) {
      W.lastPz = pz;
      W.bay[0].open = W.bay[1].open = 0; W.bay[0].cool = W.bay[1].cool = 3;
      const base = Math.round(pz / SEG) * SEG;
      for (let i = 0; i < N; i++) { W.segZ[i] = base + 15 - i * SEG; fill(i); }
      W.front = W.segZ[N - 1];
      seed(zSeed(pz, 98));
      for (let i = 0; i < NE; i++) { emb.pos[i * 3] = rr(-5.2, 5.2); emb.pos[i * 3 + 1] = rr(0.3, 7.2); emb.pos[i * 3 + 2] = pz + rr(-80, 8); }
      W.update(0, pz, 0);
    };

    W.update = function (dt, pz, t) {
      if (Math.abs(pz - W.lastPz) > 80) { W.layout(pz); return; }
      W.lastPz = pz;
      recycle(W, pz, fill, SEG, 30);
      stat.position.z = Math.round(pz / 60) * 60;
      // lantern sway (pivot at ceiling)
      for (let i = 0; i < NL; i++) {
        if (!lon[i]) continue;
        const ax = Math.sin(t * 1.6 + lph[i]) * 0.07, az = Math.sin(t * 1.1 + lph[i] * 1.7) * 0.05;
        const m = setO(lx[i], 7.5, lz[i], ax, 0, az);
        lampB.mesh.setMatrixAt(i, m); lampH.mesh.setMatrixAt(i, m);
        lampHalo.list[i].position.set(lx[i] + Math.sin(az) * LC, 7.5 - LC * Math.cos(az) * Math.cos(ax), lz[i] - LC * Math.cos(az) * Math.sin(ax));
      }
      lampB.dirty(); lampH.dirty();
      // sliding fusuma: some glide open as you approach, some slam shut
      for (let i = 0; i < NF; i++) {
        if (!fon[i]) continue;
        const dist = pz - fz[i];
        const target = fmode[i] === 0 ? (dist < 40 ? 1 : 0) : (dist < 16 ? 0 : 1);
        fst[i] += (target - fst[i]) * DS.damp(fmode[i] === 0 ? 2.5 : 9, dt);
        const o = DS.smooth(Math.min(1, Math.max(0, fst[i]))), s = fsd[i], x = s * (5.46 - o * 0.06), ry = s > 0 ? -HP : HP;
        fusL.at(i, x, 3.12, fz[i] + 0.68 + o * 1.3, 0, ry, 0);
        fusR.at(i, x, 3.12, fz[i] - 0.68 - o * 1.3, 0, ry, 0);
      }
      fusL.dirty(); fusR.dirty();
      for (let k = 0; k < 4; k++) floats[k].update(t, null);
      fLamps.update(t, vGlow);
      // embers
      const p = emb.pos;
      for (let i = 0; i < NE; i++) {
        const j = i * 3;
        p[j + 1] += embV[i * 2] * dt; if (p[j + 1] > 7.3) p[j + 1] -= 7.0;
        p[j] = wrap(p[j] + Math.sin(t * 0.9 + embV[i * 2 + 1]) * 0.3 * dt, -5.3, 10.6);
        p[j + 2] = wrap(p[j + 2], pz - 80, 88);
      }
      emb.flag();
      M.shoji.emissiveIntensity = 0.45 + Math.sin(t * 2.3) * 0.025 + Math.sin(t * 5.7) * 0.015;
    };
    W.pose = () => ({ pos: new THREE.Vector3(-1.4, 2.0, W.lastPz + 3), look: new THREE.Vector3(2.2, 2.9, W.lastPz - 30) });
    return W;
  }

  // ============================================================ WORLD 3: NIGHT TRAIN ROOFTOP
  function buildTrain(scene, M) {
    const root = newRoot(scene, 'train');
    const NC = 11, CL = 23;          // 22 m cars + 1 m coupling gap
    const W = mkWorld('train', root, NC);
    W.S = 0; W.V = 34;               // train speed relative to the ground (scenery scroll)

    const roof = new Inst(root, DS.cache('w.geo.roof', geoRoofDeck), M.roof, 1, NC, false, true);
    const body = new Inst(root, DS.cache('w.geo.car', geoCar), M.vc, 1, NC, false);
    const wins = new Inst(root, geoCarWin(), M.warmGlow, 1, NC, false);
    const lamps = new Inst(root, geoCarLamps(), M.redGlow, 1, NC, false);
    const lampHalo = new HaloSet(root, 0xff4a3a, 1.5, 2, NC, 0.85);
    const carParts = [roof, body, wins, lamps, lampHalo];
    const tints = ['#ffffff', '#f0f4ff', '#fff2ea', '#eef8f0'].map(DS.C);
    function fillCar(i) {
      const z = W.segZ[i];
      seed(zSeed(z, 33));
      for (let k = 0; k < carParts.length; k++) carParts[k].begin(i);
      roof.tint(roof.put(0, 0, z), pick(tints));
      body.put(0, 0, z); wins.put(0, 0, z); lamps.put(0, 0, z);
      lampHalo.put(-4.35, -0.32, z + 11.1); lampHalo.put(4.35, -0.32, z + 11.1);
      for (let k = 0; k < carParts.length; k++) carParts[k].end();
    }

    // ground (ground-frame texture scroll), river, moon glint
    const TILE = 25;
    const ground = DS.mesh(new THREE.PlaneGeometry(700, 700).rotateX(-HP), M.paddy, 0, -5.8, 0, root, false);
    const river = DS.mesh(new THREE.PlaneGeometry(18, 700).rotateX(-HP), M.river, -72, -5.72, 0, root, false);
    const md = nrm([-0.35, 0, -1]);
    const moonGlint = new THREE.Mesh(new THREE.PlaneGeometry(9, 170).rotateX(-HP), M.moonGlint);
    moonGlint.rotation.y = Math.atan2(-md[0], -md[2]); moonGlint.renderOrder = 1; root.add(moonGlint);

    // moving scenery (positions = ground coordinate + scroll S, wrapped around the player)
    const NP = 28, poles = new Inst(root, DS.cache('w.geo.pole', geoPole), M.vc, NP, 1, false);
    const NT = 60, trees = new Inst(root, geoFieldTree(), M.vc, NT, 1, false, true);
    const tg = new Float32Array(NT * 4);
    const treeT = ['#ffffff', '#d8e6ff', '#e6ffe8'].map(DS.C);
    seed(606);
    for (let i = 0; i < NT; i++) { tg[i * 4] = rr(0, 560); tg[i * 4 + 1] = (chance(0.5) ? -1 : 1) * rr(19, 95); tg[i * 4 + 2] = rr(0.8, 1.7); tg[i * 4 + 3] = rnd() * TAU; trees.tint(i, pick(treeT)); }
    const NH = 32, houses = new Inst(root, geoHouse(), M.vc, NH, 1, false), hwin = new Inst(root, geoHouseWin(), M.warmGlow, NH, 1, false);
    const hg = new Float32Array(NH * 5);
    for (let v = 0; v < 4; v++) {
      const gv = v * 300 + rr(0, 120), side = chance(0.5) ? -1 : 1, cx = rr(38, 95);
      for (let k = 0; k < 8; k++) { const i = v * 8 + k; hg[i * 5] = gv; hg[i * 5 + 1] = rr(-22, 22); hg[i * 5 + 2] = side * (cx + rr(-14, 14)); hg[i * 5 + 3] = rnd() * TAU; hg[i * 5 + 4] = rr(0.8, 1.3); }
    }
    const vGlow = makePoints(root, NH, DS.glowTex(), 3.2, { color: '#ffb35a', additive: true, opacity: 0.85 });
    const far = new THREE.Group(); far.name = 'train-far'; root.add(far);
    const mt1 = DS.cache('w.geo.mt1', () => geoMountains(71, 150, 44, 26, 58, ['#5a7a8a', '#4a6a7a', '#3a5a6a', '#4a6a7a']));
    const mt2 = DS.cache('w.geo.mt2', () => geoMountains(72, 212, 40, 45, 95, ['#6a8a9a', '#5a7a8a', '#7a9aaa']));
    DS.mesh(mt1, M.mount, 0, 0, 0, far, false).receiveShadow = false;
    DS.mesh(mt2, M.mount, 0, 0, 0, far, false).receiveShadow = false;
    far.position.y = -5.8;

    // smoke trail from the unseen locomotive, embers, wind streaks, wheel sparks
    const NSm = 80, smoke = makePoints(root, NSm, TX.puff(), 9, { color: '#8d93ad', opacity: 0.26, order: 3 });
    const smV = new Float32Array(NSm * 2);
    const NEm = 60, emb = makePoints(root, NEm, DS.glowTex(), 0.18, { color: '#ffa04a', additive: true });
    const NS = 120, sPos = new Float32Array(NS * 6), sCol = new Float32Array(NS * 6), sV = new Float32Array(NS * 2);
    const sGeo = new THREE.BufferGeometry();
    const sPa = new THREE.BufferAttribute(sPos, 3); sPa.setUsage(THREE.DynamicDrawUsage);
    sGeo.setAttribute('position', sPa); sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
    const streaks = new THREE.LineSegments(sGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    streaks.frustumCulled = false; root.add(streaks);
    const sc0 = DS.C('#9fc8ff');
    for (let i = 0; i < NS; i++) setCol(sCol, i * 2, sc0, 0.9);
    const NSp = 160, spk = makePoints(root, NSp, DS.glowTex(), 0.16, { colors: true, additive: true });
    const spV = new Float32Array(NSp * 5), spC = DS.C('#ffb347');

    function spawnSpark(i, pz) {
      const s = chance(0.5) ? -1 : 1, j = i * 3, v = i * 5;
      spk.pos[j] = s * 4.5; spk.pos[j + 1] = -3.3; spk.pos[j + 2] = pz + rr(-45, 6);
      spV[v] = s * rr(3, 9); spV[v + 1] = rr(5, 11); spV[v + 2] = rr(4, 16); spV[v + 3] = rr(0.4, 1.1); spV[v + 4] = spV[v + 3];
    }
    function placeStreak(i, pz, zz) {
      let x, y;
      do { x = (chance(0.5) ? -1 : 1) * rr(2.5, 14); y = rr(-3, 9); } while (Math.abs(x) < 4.6 && y < 3.6);
      sPos[i * 6] = sPos[i * 6 + 3] = x; sPos[i * 6 + 1] = sPos[i * 6 + 4] = y;
      sPos[i * 6 + 2] = zz; sV[i * 2] = rr(2, 6); sV[i * 2 + 1] = rr(0, 12);
    }

    W.layout = function (pz) {
      W.lastPz = pz;
      const base = Math.round(pz / CL) * CL;
      for (let i = 0; i < NC; i++) { W.segZ[i] = base + 12 - i * CL; fillCar(i); }
      W.front = W.segZ[NC - 1];
      seed(zSeed(pz, 97));
      for (let i = 0; i < NSm; i++) { smoke.pos[i * 3] = rr(-7, 7); smoke.pos[i * 3 + 1] = rr(7.5, 13); smoke.pos[i * 3 + 2] = pz + rr(-200, 20); smV[i * 2] = rr(16, 24); smV[i * 2 + 1] = rr(-0.8, 0.8); }
      for (let i = 0; i < NEm; i++) { emb.pos[i * 3] = rr(-8, 8); emb.pos[i * 3 + 1] = rr(6, 14); emb.pos[i * 3 + 2] = pz + rr(-200, 20); }
      for (let i = 0; i < NS; i++) placeStreak(i, pz, pz + rr(-130, 10));
      for (let i = 0; i < NSp; i++) { spawnSpark(i, pz); spV[i * 5 + 3] = rr(0, 1); }
      W.update(0, pz, 0);
    };

    W.update = function (dt, pz, t) {
      if (Math.abs(pz - W.lastPz) > 80) { W.layout(pz); return; }
      W.lastPz = pz;
      recycle(W, pz, fillCar, CL, 34);
      W.S = (W.S + W.V * dt) % 8400;       // 8400 = LCM of all scenery periods / tiles
      const S = W.S;
      ground.position.z = pz - 150;
      M.paddy.map.offset.y = frac((S - ground.position.z) / TILE);
      river.position.z = pz - 150;
      M.river.map.offset.y = frac((S + t * 1.5 - river.position.z) / 12);
      moonGlint.position.set(md[0] * 112, -5.7, pz + md[2] * 112);
      M.moonGlint.opacity = 0.42 + Math.sin(t * 3.1) * 0.06 + Math.sin(t * 7.3) * 0.04;
      far.position.z = pz;
      for (let i = 0; i < NP; i++) {
        const s = i < NP / 2 ? -1 : 1, g = -(i % (NP / 2)) * 20;
        poles.at(i, s * 9, -5.8, wrap(g + S, pz - 245, 280), 0, s < 0 ? PI : 0, 0);
      }
      poles.dirty();
      for (let i = 0; i < NT; i++) { const x = tg[i * 4 + 1]; trees.at(i, x, -5.8, wrap(tg[i * 4] + S, pz - 500, 560), 0, tg[i * 4 + 3], 0, tg[i * 4 + 2]); }
      trees.dirty();
      for (let i = 0; i < NH; i++) {
        const o = i * 5, z = wrap(hg[o] + S, pz - 1100, 1200) + hg[o + 1], x = hg[o + 2], sc = hg[o + 4];
        houses.at(i, x, -5.8, z, 0, hg[o + 3], 0, sc); hwin.at(i, x, -5.8, z, 0, hg[o + 3], 0, sc);
        vGlow.pos[i * 3] = x; vGlow.pos[i * 3 + 1] = -5.8 + 1.8 * sc; vGlow.pos[i * 3 + 2] = z;
      }
      houses.dirty(); hwin.dirty(); vGlow.flag();
      // smoke & embers stream back overhead
      for (let i = 0; i < NSm; i++) {
        const j = i * 3;
        smoke.pos[j] += smV[i * 2 + 1] * dt; smoke.pos[j + 1] += 0.35 * dt;
        if (smoke.pos[j + 1] > 15) smoke.pos[j + 1] = 7.5;
        smoke.pos[j + 2] = wrap(smoke.pos[j + 2] + smV[i * 2] * dt, pz - 200, 220);
      }
      smoke.flag();
      for (let i = 0; i < NEm; i++) {
        const j = i * 3;
        emb.pos[j] += Math.sin(t * 2 + i) * 0.8 * dt; emb.pos[j + 1] += Math.cos(t * 1.7 + i) * 0.4 * dt;
        emb.pos[j + 2] = wrap(emb.pos[j + 2] + (22 + (i % 7)) * dt, pz - 200, 220);
      }
      emb.flag();
      // wind streaks (head bright, tail dark -> additive fade)
      for (let i = 0; i < NS; i++) {
        let z = sPos[i * 6 + 2] + (W.V + 8) * dt;
        if (z > pz + 12) { placeStreak(i, pz, z - 140); z = sPos[i * 6 + 2]; }
        sPos[i * 6 + 2] = z; sPos[i * 6 + 5] = z - sV[i * 2];
      }
      sPa.needsUpdate = true;
      // wheel sparks
      const sp = spk.pos;
      for (let i = 0; i < NSp; i++) {
        const j = i * 3, v = i * 5;
        spV[v + 3] -= dt;
        if (spV[v + 3] <= 0) spawnSpark(i, pz);
        spV[v + 1] -= 18 * dt;
        sp[j] += spV[v] * dt; sp[j + 1] += spV[v + 1] * dt; sp[j + 2] += spV[v + 2] * dt;
        setCol(spk.col, i, spC, Math.max(0, spV[v + 3] / spV[v + 4]));
      }
      spk.flag(); spk.flagC();
    };
    W.pose = () => ({ pos: new THREE.Vector3(-2.6, 3.4, W.lastPz + 6), look: new THREE.Vector3(0.5, 0.5, W.lastPz - 40) });
    return W;
  }

  // ============================================================ WORLD 4: UPPER MOON ARENA (static, built around playerZ)
  function buildArena(scene, M) {
    const root = newRoot(scene, 'arena');
    const W = { name: 'arena', root, lastPz: 0 };

    DS.mesh(DS.cache('w.geo.arena', geoArenaStatic), M.vc, 0, 0, 0, root, true);
    const top = new THREE.PlaneGeometry(16, 30).rotateX(-HP); top.translate(0, 0.002, -8);
    DS.mesh(top, M.tatami, 0, 0, 0, root, false);
    const compass = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 10.5), M.compass);
    compass.rotation.x = -HP; compass.position.set(0, 0.03, -14); compass.renderOrder = 3; root.add(compass);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), M.ring);
    ring.rotation.x = -HP; ring.position.set(0, 0.036, -14); ring.renderOrder = 3; root.add(ring);
    const aura = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.6, 7, 28, 1, true), M.aura);
    aura.position.set(0, 3.5, -14); aura.renderOrder = 4; root.add(aura);

    // pillar lanterns + stone lanterns along the edges
    const LA = 1.2, chA = chochinGeo(LA);
    const pl = new Inst(root, chA.body, M.chochin, 4, 1, false), plH = new Inst(root, chA.hw, M.vc, 4, 1, false);
    const plHalo = new HaloSet(root, 0xff8a4a, 3.4, 4, 1, 0.8);
    const plX = new Float32Array(4), plZ = new Float32Array(4);
    plHalo.begin(0);
    for (let i = 0; i < 4; i++) { plX[i] = PILLARS[i][0] - Math.sign(PILLARS[i][0]) * 1.3; plZ[i] = PILLARS[i][1]; plHalo.put(plX[i], 7.55 - LA, plZ[i]); }
    plHalo.end();
    const toro = new Inst(root, DS.cache('w.geo.toro', geoToro), M.vc, 6, 1, true), toroC = new Inst(root, DS.cache('w.geo.toroCore', geoToroCore), M.toroGlow, 6, 1, false);
    const toroHalo = new HaloSet(root, 0xffb347, 3, 6, 1, 0.85);
    toro.begin(0); toroC.begin(0); toroHalo.begin(0);
    for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 3; k++) { const z = -1 - k * 7; toro.put(s * 7.3, 0, z, 0, 0.3 * s, 0, 0.9); toroC.put(s * 7.3, 0, z, 0, 0.3 * s, 0, 0.9); toroHalo.put(s * 7.3, 1.62, z); }
    toro.end(); toroC.end(); toroHalo.end();

    // the void: rotating group of walls, floating rooms/stairs, lantern constellations
    const vg = new THREE.Group(); vg.name = 'arena-void'; root.add(vg);
    const wallI = new Inst(vg, new THREE.PlaneGeometry(2.72, 7.25), M.shojiDS, 90, 1, false);
    seed(1313);
    wallI.begin(0);
    for (let lvl = 0; lvl < 5; lvl++) for (let k = 0; k < 18; k++) {
      if (!chance(0.62)) continue;
      const a = (k + rr(-0.2, 0.2)) / 18 * TAU, R = rr(70, 86), sc = rr(1.6, 2.3);
      wallI.put(Math.sin(a) * R, -40 + lvl * 21 + rr(-4, 4), -8 + Math.cos(a) * R, rr(-0.2, 0.2), a + PI, rr(-0.15, 0.15), sc);
    }
    wallI.end();
    const room = DS.cache('w.geo.room', geoRoom);
    const aRW = new Inst(vg, room.wood, M.vc, 5, 1, false), aRP = new Inst(vg, room.paper, M.shojiDS, 5, 1, false);
    const aSt = new Inst(vg, DS.cache('w.geo.stairs', geoStairs), M.vc, 5, 1, false);
    const aPl = new Inst(vg, DS.cache('w.geo.plat', () => new THREE.BoxGeometry(4.2, 0.35, 4.2)), M.tatamiB, 5, 1, false);
    const aBm = new Inst(vg, DS.cache('w.geo.beam', geoBeam), M.vc, 4, 1, false);
    const fR = new FloatSet([aRW, aRP], 5, 1), fS = new FloatSet([aSt], 5, 1), fP = new FloatSet([aPl], 5, 1), fB = new FloatSet([aBm], 4, 1);
    const aFloats = [fR, fS, fP, fB];
    const polar = (r0, r1) => { const a = rnd() * TAU, R = rr(r0, r1); return [Math.sin(a) * R, -8 + Math.cos(a) * R]; };
    for (let k = 0; k < 4; k++) aFloats[k].begin(0);
    for (let k = 0; k < 5; k++) {
      let p = polar(26, 60); fR.put(p[0], rr(-22, 24), p[1], pick([0, PI, HP]) + rr(-0.3, 0.3), rnd() * TAU, pick([0, HP]) + rr(-0.3, 0.3), rr(1, 1.6), rr(-0.04, 0.04), rr(-0.07, 0.07), rr(0.5, 1.5));
      p = polar(24, 58); fS.put(p[0], rr(-20, 22), p[1], pick([0, PI, -HP]) + rr(-0.3, 0.3), rnd() * TAU, rr(-0.5, 0.5), rr(1.2, 2), rr(-0.05, 0.05), rr(-0.09, 0.09), rr(0.5, 1.2));
      p = polar(22, 55); fP.put(p[0], rr(-18, 18), p[1], chance(0.5) ? PI : 0, rnd() * TAU, rr(-0.3, 0.3), rr(1, 1.8), 0, rr(-0.1, 0.1), rr(0.6, 1.6));
      if (k < 4) { p = polar(30, 60); fB.put(p[0], rr(-25, 25), p[1], rr(-1.3, 1.3), rnd() * TAU, 0, 1, rr(-0.02, 0.02), rr(-0.03, 0.03), rr(0.3, 1)); }
    }
    for (let k = 0; k < 4; k++) aFloats[k].end();
    const NCn = 500, cons = makePoints(vg, NCn, DS.glowTex(), 1.4, { colors: true, additive: true });
    const cc = ['#ffb35a', '#ff8a4a', '#ff9ad5', '#ffd08a'].map(DS.C);
    for (let i = 0; i < NCn; i++) {
      const a = rnd() * TAU, R = rr(28, 115), y = rr(-40, 50);
      cons.pos[i * 3] = Math.sin(a) * R; cons.pos[i * 3 + 1] = y; cons.pos[i * 3 + 2] = -8 + Math.cos(a) * R;
      setCol(cons.col, i, pick(cc), rr(0.4, 1));
    }
    cons.flag(); cons.flagC();
    const NLn = 24, vl = new Inst(vg, chochinGeo(0).body, M.chochin, NLn, 1, false);
    const vlG = makePoints(vg, NLn, DS.glowTex(), 3.6, { color: '#ff9a4a', additive: true, opacity: 0.85 });
    vl.begin(0);
    for (let i = 0; i < NLn; i++) {
      const p = polar(16, 45), y = rr(-6, 14), sc = rr(1.4, 2.4);
      vl.put(p[0], y, p[1], 0, rnd() * TAU, 0, sc);
      vlG.pos[i * 3] = p[0]; vlG.pos[i * 3 + 1] = y; vlG.pos[i * 3 + 2] = p[1];
    }
    vl.end(); vlG.flag();

    // rising embers + falling ash (root-local; the player stands still)
    const NE = 300, emb = makePoints(root, NE, DS.glowTex(), 0.16, { colors: true, additive: true });
    const NA = 350, ash = makePoints(root, NA, TX.petal(), 0.11, { color: '#8a8090', opacity: 0.8 });
    const eV = new Float32Array(NE * 2), aV = new Float32Array(NA * 2);
    const ec = ['#ff6fd0', '#ff9a4a', '#ffd08a', '#63e6ff'].map(DS.C);
    for (let i = 0; i < NE; i++) {
      emb.pos[i * 3] = rr(-22, 22); emb.pos[i * 3 + 1] = rr(-3, 18); emb.pos[i * 3 + 2] = rr(-45, 10);
      eV[i * 2] = rr(0.8, 2.0); eV[i * 2 + 1] = rr(0, TAU); setCol(emb.col, i, pick(ec), rr(0.5, 1));
    }
    emb.flagC();
    for (let i = 0; i < NA; i++) { ash.pos[i * 3] = rr(-22, 22); ash.pos[i * 3 + 1] = rr(-3, 18); ash.pos[i * 3 + 2] = rr(-45, 10); aV[i * 2] = rr(0.4, 1.0); aV[i * 2 + 1] = rr(0, TAU); }

    W.layout = function (pz) { W.lastPz = pz; root.position.set(0, 0, pz); W.update(0, pz, 0); };
    W.update = function (dt, pz, t) {
      compass.rotation.z += dt * 0.25; ring.rotation.z -= dt * 0.12;
      M.compass.opacity = 0.8 + 0.2 * Math.sin(t * 2.4);
      M.ring.opacity = 0.62 + 0.22 * Math.sin(t * 1.7 + 1);
      M.aura.opacity = 0.13 + 0.05 * Math.sin(t * 2.4);
      vg.rotation.y += dt * 0.012;
      for (let k = 0; k < 4; k++) aFloats[k].update(t, null);
      for (let i = 0; i < 4; i++) {
        const ax = Math.sin(t * 1.4 + i) * 0.06, az = Math.sin(t * 1.05 + i * 1.7) * 0.05;
        const m = setO(plX[i], 7.55, plZ[i], ax, 0, az);
        pl.mesh.setMatrixAt(i, m); plH.mesh.setMatrixAt(i, m);
        plHalo.list[i].position.set(plX[i] + Math.sin(az) * LA, 7.55 - LA * Math.cos(az) * Math.cos(ax), plZ[i] - LA * Math.cos(az) * Math.sin(ax));
      }
      pl.dirty(); plH.dirty();
      for (let i = 0; i < NE; i++) {
        const j = i * 3;
        let y = emb.pos[j + 1] + eV[i * 2] * dt; if (y > 18) y -= 21;
        emb.pos[j + 1] = y; emb.pos[j] += Math.sin(t * 1.3 + eV[i * 2 + 1]) * 0.5 * dt;
      }
      emb.flag();
      for (let i = 0; i < NA; i++) {
        const j = i * 3;
        let y = ash.pos[j + 1] - aV[i * 2] * dt; if (y < -3) y += 21;
        ash.pos[j + 1] = y; ash.pos[j] += Math.sin(t * 0.9 + aV[i * 2 + 1]) * 0.6 * dt; ash.pos[j + 2] += Math.cos(t * 0.7 + aV[i * 2 + 1]) * 0.3 * dt;
      }
      ash.flag();
    };
    W.pose = () => ({ pos: new THREE.Vector3(0, 3.2, W.lastPz + 5.5), look: new THREE.Vector3(0, 1.3, W.lastPz - 14) });
    return W;
  }

  // ============================================================ public API
  DS.Worlds = {
    create(scene, renderer) {
      if (renderer && renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
        DS.maxAniso = Math.max(DS.maxAniso || 1, Math.min(16, renderer.capabilities.getMaxAnisotropy()));
      }
      initG();
      const M = makeMaterials();
      const worlds = {
        forest: buildForest(scene, M),
        castle: buildCastle(scene, M),
        train: buildTrain(scene, M),
        arena: buildArena(scene, M)
      };
      let current = null;
      const wm = {
        names: ['forest', 'castle', 'train', 'arena'],
        arenaCenterZ: 0,
        materials: M,
        setWorld(name, playerZ) {
          const w = worlds[name];
          if (!w) { console.warn('[worlds] unknown world:', name); return; }
          const pz = playerZ || 0;
          for (const k in worlds) worlds[k].root.visible = (k === name);
          current = name;
          w.layout(pz);
          if (name === 'arena') wm.arenaCenterZ = pz - 14;
        },
        getPreset(name) { return PRESETS[name] || PRESETS.forest; },
        update(dt, playerZ, time) {
          const w = worlds[current];
          if (!w) return;
          w.update(Math.min(Math.max(dt || 0, 0), 0.1), playerZ || 0, time || 0);
        },
        snapshotPose(name) { return (worlds[name] || worlds.forest).pose(); },
        getCurrent() { return current; },
        // optional: precompile every world's shaders once (avoids first-switch hitch)
        warmup(camera) {
          if (!renderer || !camera) return;
          const vis = {};
          for (const k in worlds) { vis[k] = worlds[k].root.visible; worlds[k].root.visible = true; }
          try { renderer.compile(scene, camera); } catch (e) { console.error('[worlds] warmup', e); }
          for (const k in worlds) worlds[k].root.visible = vis[k];
        }
      };
      return wm;
    }
  };
})(window.DS);

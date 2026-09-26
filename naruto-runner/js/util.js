// Shared helpers for DEMON SLAYER: INFINITY CASTLE RUN (fan-made)
// Global namespace
window.DS = window.DS || {};

(function (DS) {
  // Author colors in sRGB hex, convert to linear (renderer uses sRGB output + ACES)
  DS.C = (hex) => new THREE.Color(hex).convertSRGBToLinear();
  // Frame-rate independent smoothing factor
  DS.damp = (k, dt) => 1 - Math.exp(-k * dt);
  DS.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  DS.lerp = (a, b, t) => a + (b - a) * t;
  DS.smooth = (t) => t * t * (3 - 2 * t);

  // Deterministic RNG (mulberry32). Use DS.rng(seed) -> function returning [0,1)
  DS.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Lanes: player runs toward -Z. Track corridor x in [-4, 4] must stay clear for obstacles.
  DS.LANES = [-2.4, 0, 2.4];
  DS.EYE = 1.7;

  DS.maxAniso = 8; // set by main.js from renderer capabilities

  // Canvas texture helper. draw(ctx, w, h). opts: {repeat:[x,y], srgb:true, wrap:true, nearest:false}
  DS.canvasTex = function (w, h, draw, opts = {}) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    if (opts.srgb !== false) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = DS.maxAniso;
    if (opts.wrap !== false) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    return t;
  };

  // Simple cache: DS.cache('key', () => create())
  const _cache = new Map();
  DS.cache = (key, make) => { if (!_cache.has(key)) _cache.set(key, make()); return _cache.get(key); };

  // Radial glow texture (white core -> transparent), cached
  DS.glowTex = () => DS.cache('glowTex', () => DS.canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    gr.addColorStop(0.6, 'rgba(255,255,255,0.12)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, { wrap: false }));

  // Additive halo sprite (fake bloom). color: hex (sRGB), size: world units
  DS.halo = function (color, size, opacity = 0.9) {
    const m = new THREE.SpriteMaterial({
      map: DS.glowTex(), color: DS.C(color), transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const s = new THREE.Sprite(m);
    s.scale.set(size, size, 1);
    return s;
  };

  // Soft contact shadow blob under objects
  DS.shadowBlob = function (w, d, opacity = 0.5) {
    const tex = DS.cache('shadowTex', () => DS.canvasTex(128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      gr.addColorStop(0, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    }, { wrap: false, srgb: false }));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.02; m.renderOrder = 1;
    return m;
  };

  // Standard material helper (flat-shaded stylized look by default)
  DS.std = function (hex, o = {}) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color: DS.C(hex), roughness: 0.8, metalness: 0.0, flatShading: true
    }, o));
  };
  DS.glow = function (hex, intensity = 2) {
    return new THREE.MeshStandardMaterial({ color: DS.C(hex), emissive: DS.C(hex), emissiveIntensity: intensity, roughness: 0.6 });
  };

  // Mesh helper: DS.mesh(geo, mat, x,y,z, parent) with shadows
  DS.mesh = function (geo, mat, x = 0, y = 0, z = 0, parent = null, cast = true) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  };

  // Cylinder between two points (limbs, ropes)
  const _up = new THREE.Vector3(0, 1, 0);
  DS.limb = function (a, b, r1, r2, mat, seg = 7) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, seg), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(_up, dir.normalize());
    m.castShadow = true;
    return m;
  };

  // Dispose a group (geometries/materials that are NOT marked shared via userData.shared)
  DS.disposeTree = function (obj) {
    obj.traverse((o) => {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    });
  };
})(window.DS);

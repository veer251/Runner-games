// DEMON SLAYER: INFINITY CASTLE RUN (fan-made) — main game: renderer, sky/lighting, player, input, level flow.
(function (DS) {
  const LANES = DS.LANES;
  const qs = new URLSearchParams(location.search);

  // ================================================================ renderer / scene
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('game').appendChild(renderer.domElement);
  DS.maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.08, 700);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  // ================================================================ cinematic post-processing
  const usePP = !qs.has('nopp') && !!THREE.EffectComposer;
  let composer = null, ssaoPass = null, bloomPass = null, smaaPass = null;
  let ppFailed = false;
  function renderScene() {
    if (composer && !ppFailed) {
      try { composer.render(); return; }
      catch (e) { console.error('post-processing failed, falling back:', e); ppFailed = true; }
    }
    renderer.render(scene, camera);
  }
  if (usePP) {
    composer = new THREE.EffectComposer(renderer);
    composer.setPixelRatio(Math.min(devicePixelRatio, 2));
    composer.addPass(new THREE.RenderPass(scene, camera));
    // soft glow on bright/emissive
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.55, 0.82);
    composer.addPass(bloomPass);
    // color grade + vignette (cinematic pop)
    const GradeShader = {
      uniforms: { tDiffuse: { value: null }, contrast: { value: 1.09 }, saturation: { value: 1.14 }, vigStrength: { value: 0.28 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: [
        'uniform sampler2D tDiffuse; uniform float contrast, saturation, vigStrength; varying vec2 vUv;',
        'void main(){',
        '  vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb;',
        '  col = (col - 0.5) * contrast + 0.5;',
        '  float l = dot(col, vec3(0.299,0.587,0.114)); col = mix(vec3(l), col, saturation);',
        '  float d = length(vUv - 0.5); float vg = smoothstep(0.85, 0.35, d);',
        '  col *= mix(1.0 - vigStrength, 1.0, vg);',
        '  gl_FragColor = vec4(clamp(col,0.0,1.0), c.a);',
        '}'
      ].join('\n')
    };
    composer.addPass(new THREE.ShaderPass(GradeShader));
  }

  // ---------------- sky dome (tone-mapped so it matches fog) ----------------
  const skyU = {
    top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, horizon: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(0, 0.3, -1).normalize() }, sunCol: { value: new THREE.Color() },
    sunMode: { value: 0 }, moonOn: { value: 1 }, time: { value: 0 }
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top, mid, horizon, sunDir, sunCol; uniform float sunMode, moonOn, time; varying vec3 vDir;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.2, 1.0);
        vec3 col = mix(horizon, mid, smoothstep(0.0, 0.28, h));
        col = mix(col, top, smoothstep(0.28, 0.95, h));
        // stars (night only)
        vec3 sp = floor(d * 380.0);
        float st = step(0.9975, hash(sp)) * smoothstep(0.08, 0.5, h) * (1.0 - sunMode);
        col += vec3(st) * (0.6 + 0.4 * sin(time * 2.0 + hash(sp) * 30.0));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        if (moonOn > 0.5) {
          float disc = smoothstep(0.99955 - sunMode * 0.0006, 0.99975 - sunMode * 0.0006, s);
          col = mix(col, sunCol * (1.6 + sunMode), disc);
          col += sunCol * (pow(s, 90.0) * 0.55 + pow(s, 12.0) * 0.14 * (1.0 + sunMode * 1.5));
        }
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 40, 20), skyMat);
  sky.renderOrder = -1000; scene.add(sky);
  const moonHalo = DS.halo(0xfff6e0, 170, 0.5); moonHalo.material.fog = false; moonHalo.renderOrder = -999; sky.add(moonHalo);
  const moonHalo2 = DS.halo(0xfff6e0, 60, 0.7); moonHalo2.material.fog = false; moonHalo2.renderOrder = -998; sky.add(moonHalo2);

  scene.fog = new THREE.Fog(0x000000, 50, 200);

  // ---------------- lights (fixed count) ----------------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 160 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  const rim = new THREE.DirectionalLight(0xffffff, 0.4);
  scene.add(hemi, key, key.target, rim);
  let keyOffset = new THREE.Vector3(-20, 40, -30);

  // ---------------- environment map from preset colors ----------------
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null;
  function buildEnv(p) {
    const es = new THREE.Scene();
    const t = DS.canvasTex(8, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, hex(p.skyTop)); gr.addColorStop(0.45, hex(p.skyMid)); gr.addColorStop(0.55, hex(p.skyHorizon)); gr.addColorStop(1, hex(p.hemiGround));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, { wrap: false });
    es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide })));
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex(p.key)).multiplyScalar(2) }));
    panel.position.set(-3, 6, -4); panel.lookAt(0, 0, 0); es.add(panel);
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(es, 0.04);
    scene.environment = envRT.texture;
    t.dispose();
  }
  const hex = (v) => typeof v === 'string' ? v : '#' + new THREE.Color(v).getHexString();

  // ---------------- presets (with blending for dawn) ----------------
  const cur = { top: new THREE.Color(), mid: new THREE.Color(), hor: new THREE.Color(), fog: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(), key: new THREE.Color(), rim: new THREE.Color(), moon: new THREE.Color(),
    fogNear: 50, fogFar: 200, hemiInt: 0.5, keyInt: 1.5, rimInt: 0.4, exposure: 1.1, sunMode: 0, moonOn: 1, moonDir: new THREE.Vector3(0, 0.3, -1) };
  let tgt = null, blendT = 0, blendDur = 0, from = null;
  function presetToState(p) {
    return { top: DS.C(p.skyTop), mid: DS.C(p.skyMid), hor: DS.C(p.skyHorizon), fog: DS.C(p.fog), hs: DS.C(p.hemiSky), hg: DS.C(p.hemiGround), key: DS.C(p.key), rim: DS.C(p.rim || p.key), moon: DS.C(p.moonColor || '#ffffff'),
      fogNear: p.fogNear, fogFar: p.fogFar, hemiInt: p.hemiInt, keyInt: p.keyInt, rimInt: p.rimInt ?? 0.3, exposure: p.exposure ?? 1.1,
      sunMode: p.sunMode ? 1 : 0, moonOn: p.moon ? 1 : 0, moonDir: new THREE.Vector3(...(p.moonDir || [0, 0.3, -1])).normalize(), keyDir: p.keyDir || [-20, 40, -30] };
  }
  function copyState(dst, s) {
    ['top', 'mid', 'hor', 'fog', 'hs', 'hg', 'key', 'rim', 'moon'].forEach(k => dst[k].copy(s[k]));
    ['fogNear', 'fogFar', 'hemiInt', 'keyInt', 'rimInt', 'exposure', 'sunMode', 'moonOn'].forEach(k => dst[k] = s[k]);
    dst.moonDir.copy(s.moonDir);
  }
  function snapshot() { const s = { moonDir: new THREE.Vector3() }; ['top', 'mid', 'hor', 'fog', 'hs', 'hg', 'key', 'rim', 'moon'].forEach(k => s[k] = cur[k].clone()); copyState(s, cur); return s; }
  function applyCur() {
    skyU.top.value.copy(cur.top); skyU.mid.value.copy(cur.mid); skyU.horizon.value.copy(cur.hor);
    skyU.sunCol.value.copy(cur.moon); skyU.sunDir.value.copy(cur.moonDir); skyU.sunMode.value = cur.sunMode; skyU.moonOn.value = cur.moonOn;
    scene.fog.color.copy(cur.fog); scene.fog.near = cur.fogNear; scene.fog.far = cur.fogFar;
    hemi.color.copy(cur.hs); hemi.groundColor.copy(cur.hg); hemi.intensity = cur.hemiInt;
    key.color.copy(cur.key); key.intensity = cur.keyInt; rim.color.copy(cur.rim); rim.intensity = cur.rimInt;
    renderer.toneMappingExposure = cur.exposure;
    moonHalo.visible = moonHalo2.visible = cur.moonOn > 0.5;
    moonHalo.position.copy(cur.moonDir).multiplyScalar(420); moonHalo2.position.copy(cur.moonDir).multiplyScalar(415);
    moonHalo.material.color.copy(cur.moon); moonHalo2.material.color.copy(cur.moon);
    moonHalo.material.opacity = 0.35 + cur.sunMode * 0.4; moonHalo.scale.setScalar(170 + cur.sunMode * 140);
  }
  function setPreset(name, dur = 0) {
    const p = worlds.getPreset(name); if (!p) return;
    const s = presetToState(p);
    // key light always comes from BEHIND the camera (+z) so obstacles facing the player are readable
    keyOffset.set(s.keyDir[0], Math.abs(s.keyDir[1]), Math.abs(s.keyDir[2]) + 10).normalize().multiplyScalar(60);
    if (dur <= 0) { copyState(cur, s); applyCur(); buildEnv(p); tgt = null; }
    else { from = snapshot(); tgt = s; blendT = 0; blendDur = dur; tgt._preset = p; }
  }
  function updateBlend(dt) {
    if (!tgt) return;
    blendT += dt; const k = DS.smooth(DS.clamp(blendT / blendDur, 0, 1));
    ['top', 'mid', 'hor', 'fog', 'hs', 'hg', 'key', 'rim', 'moon'].forEach(c => cur[c].copy(from[c]).lerp(tgt[c], k));
    ['fogNear', 'fogFar', 'hemiInt', 'keyInt', 'rimInt', 'exposure', 'sunMode', 'moonOn'].forEach(c => cur[c] = DS.lerp(from[c], tgt[c], k));
    cur.moonDir.copy(from.moonDir).lerp(tgt.moonDir, k).normalize();
    applyCur();
    if (k >= 1) { buildEnv(tgt._preset); tgt = null; }
  }

  // ================================================================ modules
  const worlds = DS.Worlds.create(scene, renderer);
  const fx = DS.FX.create(scene);
  const obstacles = DS.Obstacles.create(scene, fx);
  const boss = DS.Boss.create(scene, fx);
  DS.UI.init();

  const katana = DS.Chars.katana();
  katana.position.set(0.1, -0.07, -0.22); // smaller in view, lower-right
  camera.add(katana);
  // tone down the sunrise so it is not washed out
  const dawnP = worlds.getPreset('dawn'); if (dawnP) Object.assign(dawnP, { exposure: 0.82, hemiInt: 0.6, keyInt: 1.7, fogNear: 45, fogFar: 200 });
  katana.userData.setVisible && katana.userData.setVisible(false);
  katana.userData.update && katana.userData.update(1, 0, { x: 0, y: 0 });

  // flavor characters
  const runner = { obj: null, active: false };
  let heroes = [];

  // ================================================================ player
  const player = { x: 0, li: 1, y: 0, vy: 0, z: 0, duckT: 0, ducking: false, speed: 0, grounded: true,
    roll: 0, pitch: 0, bob: 0, trauma: 0, fovPunch: 0, eye: DS.EYE, stopped: false };
  const GRAV = 34, JUMP_V = 11.5;

  // ================================================================ game state
  const G = { state: 'loading', levelIdx: 0, level: null, t: 0, paused: false, hud: DS.CONFIG.showCues, muted: false,
    stopObj: null, stopKind: null, stopT: 0, poseStage: 0, shiftHeld: false, pushing: false, pushDist: 0, endT: 0, celebrateT: 0 };
  window.game = G; G.player = player; G.worlds = worlds; G.scene = scene; G.camera = camera;

  function startLevel(i) {
    const L = DS.LEVELS[i]; if (!L) return;
    G.levelIdx = i; G.level = L; G.t = 0; G.state = 'play'; G.endT = 0; G.celebrateT = 0;
    G.stopObj = null; G.stopKind = null; G.pushing = false;
    Object.assign(player, { x: 0, li: 1, y: 0, vy: 0, z: 0, duckT: 0, ducking: false, speed: L.speed * (DS.Settings.get('speed') || 1), grounded: true, roll: 0, pitch: 0, trauma: 0, fovPunch: 0, eye: DS.EYE });
    fx.clear(); boss.clear(); obstacles.clear();
    heroes.forEach(h => scene.remove(h)); heroes = [];
    worlds.setWorld(L.world, 0);
    setPreset(L.preset, 0);
    if (L.boss) boss.start(L, 0); else obstacles.startLevel(L, 0);
    katana.userData.setVisible && katana.userData.setVisible(!!L.katana); katana.userData.update && katana.userData.update(1, 0, { x: 0, y: 0 });
    DS.UI.hidePrompt(); DS.UI.setProgress(0); DS.UI.setHudVisible(G.hud);
    DS.Audio.setSection && DS.Audio.setSection(L.music);
    // runner ahead (flavor)
    if (runner.obj) { scene.remove(runner.obj); runner.obj = null; }
    const who = L.hero || 'naruto';
    if (who) {
      runner.obj = DS.Chars.hero(who); runner.obj.userData.setState && runner.obj.userData.setState('run');
      runner.obj.userData.face && runner.obj.userData.face(-1);
      runner.obj.position.set(0, 0, -8); scene.add(runner.obj); runner.active = true; runner.z = -8;
    }
    DS.UI.setFade(0, 0.8);
    snapPlayerCamera();
  }

  function endLevel() {
    if (G.state !== 'play') return;
    G.state = 'fading';
    DS.UI.setFade(1, DS.CONFIG.fadeBetweenLevels * 0.6);
    setTimeout(() => {
      const next = G.levelIdx + 1;
      if (next < DS.LEVELS.length) startLevel(next);
      else { G.state = 'menu'; document.getElementById('start').classList.add('show'); }
    }, DS.CONFIG.fadeBetweenLevels * 1000);
  }

  // ================================================================ input
  const keysDown = {};
  function action(k, down = true) {
    if (G.state !== 'play' || G.paused) return;
    const L = G.level;
    if (!down) { if (k === 'action') G.shiftHeld = false; return; }
    if (L.boss) {
      if (k === 'duck') { doDuck(); return; }
      if (k === 'left' || k === 'right' || k === 'action') {
        const r = boss.input(k, bossApi, G.t);
        const dir = r || (k === 'action' ? 'x' : k);
        katana.userData.slash && katana.userData.slash(dir === 'x' ? 'x' : dir);
        DS.Audio.sfx('slash');
        if (r) { player.trauma = Math.min(1, player.trauma + 0.18); player.fovPunch += 2; }
      }
      if (k === 'jump') doJump();
      return;
    }
    // set pieces
    if (G.stopObj && k === 'action') { stopAction(); return; }
    if (G.stopObj) return; // frozen at wall / pose / cart
    switch (k) {
      case 'left': if (player.li > 0) { player.li--; player.roll = 0.08; DS.Audio.cue('left'); DS.Audio.sfx('whoosh'); } break;
      case 'right': if (player.li < 2) { player.li++; player.roll = -0.08; DS.Audio.cue('right'); DS.Audio.sfx('whoosh'); } break;
      case 'jump': doJump(); break;
      case 'duck': doDuck(); break;
      case 'action':
        if (L.katana) {
          const o = obstacles.trySlash(player);
          const dir = o ? (o.ev.val || 'right') : (Math.random() < 0.5 ? 'left' : 'right');
          katana.userData.slash && katana.userData.slash(dir === 'x' ? 'x' : dir);
          DS.Audio.sfx('slash'); DS.Audio.cue('slash');
          if (o) {
            const p = new THREE.Vector3(o.group.position.x + LANES[o.u.lanes[0]], 1.8, o.group.position.z);
            fx.sparks({ pos: p, n: 60, colors: [0x3ad0ff, 0xffffff, 0xff5a7a], speed: [2, 8], life: 0.8 });
            fx.debris({ pos: p, n: 18, colors: [0x9c2f45, 0xe06080], size: [0.1, 0.25], speed: [2, 6], up: [2, 6] });
            DS.Audio.sfx('splat'); player.trauma = Math.min(1, player.trauma + 0.2); player.fovPunch += 3;
          }
        }
        break;
    }
  }
  function doJump() {
    if (!player.grounded) return;
    player.vy = JUMP_V; player.grounded = false; player.duckT = 0;
    DS.Audio.cue('jump'); DS.Audio.sfx('jump'); player.pitch = 0.05;
  }
  function doDuck() {
    player.duckT = 0.75;
    if (!player.grounded) player.vy = -18;
    DS.Audio.cue('duck');
  }

  const KEYMAP = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'jump', ArrowUp: 'jump', Space: 'jump',
    KeyS: 'duck', ArrowDown: 'duck', ShiftLeft: 'action', ShiftRight: 'action', KeyE: 'action', Enter: 'action' };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { }); else document.exitFullscreen(); return; }
    if (e.code === 'KeyM') { G.muted = !G.muted; DS.Audio.setMuted(G.muted); return; }
    if (e.code === 'KeyH') { G.hud = !G.hud; DS.UI.setHudVisible(G.hud); return; }
    if (e.code === 'KeyP' || e.code === 'Escape') { if (document.getElementById('settings').classList.contains('show')) { closeSettings(); return; } if (G.state === 'play') togglePause(); return; }
    if (/^Digit[1-4]$/.test(e.code)) { beginFrom(+e.code.slice(5) - 1); return; }
    const k = KEYMAP[e.code]; if (!k) return;
    e.preventDefault();
    if (keysDown[e.code]) return; // no auto-repeat
    keysDown[e.code] = true;
    if (k === 'action') G.shiftHeld = true;
    action(k, true);
  });
  window.addEventListener('keyup', (e) => { keysDown[e.code] = false; const k = KEYMAP[e.code]; if (k) action(k, false); if (k === 'action') G.shiftHeld = false; });
  // touch buttons + swipe
  document.querySelectorAll('#touch button').forEach(b => {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (b.dataset.k === 'action') G.shiftHeld = true; action(b.dataset.k, true); });
    b.addEventListener('pointerup', () => { if (b.dataset.k === 'action') G.shiftHeld = false; });
  });
  let sw = null;
  window.addEventListener('touchstart', (e) => { if (e.target.closest('#touch')) return; sw = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (!sw) return; const t = e.changedTouches[0]; const dx = t.clientX - sw.x, dy = t.clientY - sw.y; sw = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) { action('action'); setTimeout(() => G.shiftHeld = false, 300); return; }
    if (Math.abs(dx) > Math.abs(dy)) action(dx < 0 ? 'left' : 'right'); else action(dy < 0 ? 'jump' : 'duck');
  }, { passive: true });

  // ================================================================ set pieces
  const obsApi = {
    onCue(ev, u) {
      let icon = ev.kind, label = null, color = '#e2324a';
      if (ev.kind === 'left' || ev.kind === 'right') { icon = ev.dir; color = '#3ad0ff'; }
      else if (ev.kind === 'jump') color = '#35d07f';
      else if (ev.kind === 'duck') color = '#ffb020';
      else if (ev.kind === 'slash') { icon = 'slash'; color = '#3a8bff'; }
      else if (ev.kind === 'wall') { icon = 'smash'; color = '#ff4a3a'; }
      else if (ev.kind === 'cart') { icon = 'push'; color = '#ff9a3a'; }
      else if (ev.kind === 'pose') { icon = ev.val; label = 'POSE!'; color = '#ff5aa8'; }
      if (G.hud) DS.UI.showCue(icon, label, color);
    },
    onStop(o) {
      G.stopObj = o; G.stopKind = o.u.stop; G.stopT = 0; G.poseStage = 0;
      player.speed = 0;
      if (G.stopKind === 'wall') { DS.UI.showPrompt('punch', 'SMASH!', 'PRESS SHIFT', [0, 3]); }
      else if (G.stopKind === 'pose') { DS.UI.showPrompt(null, '3', 'HOLD THE POSE!'); DS.Audio.sfx('gong'); DS.Audio.cue('pose'); }
      else if (G.stopKind === 'cart') { DS.UI.showPrompt('run', 'PUSH!', 'HOLD SHIFT'); player.li = o.u.lanes[0]; }
    },
    onHit(o) { hitFeedback(); o.u.onHit && o.u.onHit(player.x < 0 ? 1 : -1); if (o.u.tent) { o.u.tent.userData.slash && o.u.tent.userData.slash('right'); } },
    onPass() { }
  };
  function hitFeedback() { DS.UI.damage(); DS.Audio.sfx('hit'); player.trauma = Math.min(1, player.trauma + 0.55); player.fovPunch -= 4; }

  function stopAction() {
    const o = G.stopObj; if (!o) return;
    if (G.stopKind === 'wall') {
      o.u.hit(fx, o.group.position.z);
      DS.Audio.sfx('hit'); DS.Audio.cue(o.u.hits >= 3 ? 'smash' : 'hit');
      player.trauma = Math.min(1, player.trauma + 0.3 + o.u.hits * 0.1); player.fovPunch += 2 + o.u.hits * 2; player.punchZ = -0.35;
      katana.visible && katana.userData.slash && katana.userData.slash(o.u.hits % 2 ? 'right' : 'left');
      DS.UI.showPrompt('punch', o.u.hits >= 3 ? 'BREAK!' : 'SMASH!', o.u.hits >= 3 ? '' : 'PRESS SHIFT', [o.u.hits, 3]);
      if (o.u.hits >= 3) { DS.UI.flashColor('#fff', 0.3, 0.7); releaseStop(0.35); player.fovPunch += 6; }
    } else if (G.stopKind === 'pose') {
      if (G.poseStage < 4) return; // countdown not finished
      burstPose(o);
    } else if (G.stopKind === 'cart') {
      if (!G.pushing) { G.pushing = true; DS.Audio.cue('push'); }
    }
  }
  function burstPose(o) {
    o.u.burst(fx, o.group.position.z); DS.Audio.sfx('paper'); DS.Audio.cue('smash');
    DS.UI.flashColor('#ffd27a', 0.35, 0.5); player.fovPunch += 6; player.trauma = Math.min(1, player.trauma + 0.3);
    releaseStop(0.2);
  }
  function releaseStop(delay) {
    const L = G.level;
    setTimeout(() => { DS.UI.hidePrompt(); }, delay * 1000);
    G.stopObj = null; G.stopKind = null; G.pushing = false;
    player.speed = L.speed * (DS.Settings.get('speed') || 1);
  }
  function updateStop(dt) {
    const o = G.stopObj; if (!o) return;
    G.stopT += dt;
    if (G.stopKind === 'pose') {
      // 3-2-1 countdown then "SHIFT!" (auto-burst after 4 s)
      const s = G.stopT;
      const stage = s < 1 ? 1 : s < 2 ? 2 : s < 3 ? 3 : 4;
      if (stage !== G.poseStage) {
        G.poseStage = stage;
        if (stage < 4) { DS.UI.showPrompt(null, String(4 - stage), 'HOLD THE POSE!'); DS.Audio.sfx('coin'); }
        else DS.UI.showPrompt(null, 'BREAK!', 'PRESS SHIFT');
      }
      if (s > 7 || (stage === 4 && DS.Settings.get('autoPose') && s > 3.3)) burstPose(o);
    } else if (G.stopKind === 'cart') {
      if (!G.pushing && G.shiftHeld) { G.pushing = true; DS.Audio.cue('push'); }
      if (G.pushing && G.shiftHeld) {
        const d = 10 * dt;
        o.group.position.z -= d; o.u.pushed += d;
        player.z = o.group.position.z + 4.2;
        o.u.wheels.forEach(w => w.rotation.x -= d / 0.42);
        player.bob += dt * 8;
        if (o.u.pushed > 26) {
          // cart rolls off the side and tips over
          o.u.pushedDone = true; const side = o.u.cart.position.x <= 0 ? -1 : 1;
          o.u.roll = { t: 0, side };
          o.u.update = (dt2) => { const r = o.u.roll; r.t += dt2; o.u.cart.position.x += side * 7 * dt2; o.u.cart.rotation.z = -side * Math.min(1.4, r.t * 2); o.u.cart.position.y = -Math.max(0, r.t - 0.4) * 6; };
          DS.Audio.sfx('land'); releaseStop(0.1);
        }
      }
    }
  }

  // ================================================================ boss api
  const bossApi = {
    onHit: hitFeedback,
    onFinalReady() { DS.UI.showPrompt('slash', 'FINAL BLOW!', 'PRESS SHIFT'); DS.Audio.sfx('roar'); DS.Audio.cue('finalblow'); },
    onFinal() {
      DS.UI.hidePrompt(); katana.userData.finalBlow && katana.userData.finalBlow();
      DS.Audio.sfx('final'); DS.Audio.cue('smash');
      DS.UI.flashColor('#fff', 0.9, 0.95); player.trauma = 1; player.fovPunch += 12;
      setTimeout(() => DS.Audio.sfx('burn'), 600);
    },
    onDawn() { setPreset('dawn', 3.5); },
    onCelebrate() {
      DS.UI.showBoss(false);
      katana.userData.setVisible && katana.userData.setVisible(false);
      const c = boss.celebrateSpot();
      ['naruto', 'sasuke', 'sakura', 'kakashi'].forEach((n, i) => {
        const h = DS.Chars.hero(n); h.position.set(-3 + i * 2, 0, c.z + (i % 2) * 0.6);
        h.userData.face && h.userData.face(1); h.userData.setState && h.userData.setState('cheer');
        scene.add(h); heroes.push(h);
      });
      DS.Audio.sfx('cheer');
      G.celebrateT = 0.001;
    }
  };

  // ================================================================ camera
  const _v = new THREE.Vector3();
  function snapPlayerCamera() {
    player.x = LANES[player.li];
    camera.position.set(player.x, player.eye, player.z);
    camera.rotation.set(0, 0, 0); camera.fov = 72; camera.updateProjectionMatrix();
  }
  function updatePlayer(dt) {
    const d = (k) => DS.damp(k, dt);
    // physics
    if (!player.grounded) {
      player.vy -= GRAV * dt; player.y += player.vy * dt;
      if (player.y <= 0) { player.y = 0; player.vy = 0; player.grounded = true; player.trauma = Math.min(1, player.trauma + 0.1); DS.Audio.sfx('land');
        fx.sparks({ pos: _v.set(player.x, 0.1, player.z - 0.8), n: 10, colors: [0xcfc6ff], speed: [0.5, 2], life: 0.5, gravity: 2 }); }
    }
    if (player.duckT > 0) player.duckT -= dt;
    player.ducking = player.duckT > 0;
    player.x += (LANES[player.li] - player.x) * d(14);
    // forward
    player.z -= player.speed * dt;
    // camera
    const eyeT = player.ducking ? 0.8 : DS.EYE;
    player.eye += (eyeT - player.eye) * d(16);
    const moving = player.speed > 0 || G.pushing;
    if (player.grounded && !player.ducking && moving) player.bob += dt * (player.speed || 8) * 0.62;
    const bobK = DS.Settings.get('bob') ? 1 : 0;
    const bobY = (player.grounded && !player.ducking && moving) ? Math.abs(Math.sin(player.bob)) * 0.07 * bobK : 0;
    const bobX = (player.grounded && moving) ? Math.cos(player.bob * 0.5) * 0.04 * bobK : 0;
    player.roll += (-(LANES[player.li] - player.x) * 0.05 - player.roll) * d(10);
    const pitchT = player.ducking ? -0.06 : (!player.grounded ? (player.vy / JUMP_V) * 0.05 : 0);
    player.pitch += (pitchT - player.pitch) * d(10);
    player.trauma = Math.max(0, player.trauma - dt * 1.6);
    const sh = player.trauma * player.trauma * (DS.Settings.get('shake') ?? 1);
    player.punchZ = (player.punchZ || 0) * Math.exp(-12 * dt);
    camera.position.set(player.x + bobX + (Math.random() - 0.5) * sh * 0.3, player.y + player.eye + bobY + (Math.random() - 0.5) * sh * 0.3, player.z + player.punchZ);
    camera.rotation.set(player.pitch + (Math.random() - 0.5) * sh * 0.03, 0, player.roll);
    const speedK = G.level && G.level.speed ? DS.clamp((player.speed - 10) / 8, 0, 1) : 0;
    const fovT = (DS.Settings.get('fov') || 72) + speedK * 8 + player.fovPunch;
    player.fovPunch *= Math.exp(-5 * dt);
    camera.fov += (fovT - camera.fov) * d(6); camera.updateProjectionMatrix();
    katana.userData.update && katana.userData.update(dt, clockT, { x: bobX, y: bobY });
    return speedK;
  }

  // ================================================================ loop
  const clock = new THREE.Clock();
  let clockT = 0;
  function frame() {
    requestAnimationFrame(frame);
    tick(Math.min(clock.getDelta(), 0.05));
  }
  // debug/test hooks: advance the simulation deterministically without rAF
  G.step = function (seconds, fps = 30) { const n = Math.round(seconds * fps); for (let i = 0; i < n; i++) tick(1 / fps, i < n - 1); renderScene(); return { t: +G.t.toFixed(2), z: +player.z.toFixed(1), state: G.state }; };
  G.press = (k) => action(k, true);
  G.start = (i) => beginFrom(i);
  G.release = (k) => action(k, false);
  G.hold = (v) => { G.shiftHeld = v; };
  function tick(dt, skipRender) {
    if (G.paused) dt = 0;
    clockT += dt; skyU.time.value = clockT;
    let speedK = 0;
    try {
      if (G.state === 'play' || G.state === 'fading') {
        const L = G.level;
        G.t += dt;
        updateStop(dt);
        speedK = updatePlayer(dt);
        if (!L.boss) {
          try { obstacles.update(dt, clockT, player, obsApi); } catch (e) { console.error(e); }
          const total = L.dur * L.speed;
          DS.UI.setProgress(-player.z / total);
          if (-player.z >= total + 6 && G.state === 'play') endLevel();
          // runner ahead: runs a bit, then sprints away
          if (runner.obj) {
            const rs = G.t < 4 ? L.speed : L.speed * 1.9;
            runner.z -= rs * dt; runner.obj.position.z = runner.z;
            runner.obj.userData.update && runner.obj.userData.update(dt, clockT);
            if (player.z - runner.z > 90) { scene.remove(runner.obj); runner.obj = null; }
          }
        } else {
          boss.update(dt, G.t, player, bossApi);
          DS.UI.setProgress(Math.min(1, G.t / L.finalBlowAt));
          heroes.forEach(h => h.userData.update && h.userData.update(dt, clockT));
          if (G.celebrateT > 0) {
            G.celebrateT += dt;
            if (Math.random() < dt * 20) fx.sparks({ pos: _v.set((Math.random() - 0.5) * 10, 5 + Math.random() * 2, player.z - 8 - Math.random() * 6), n: 6, colors: [0xff9ad5, 0xffe27a, 0x9fe8ff, 0xffffff], speed: [0.5, 2], life: 2.5, gravity: 1.5 });
            if (G.celebrateT > 11 && G.state === 'play') endLevel();
          }
        }
        worlds.update(dt, player.z, clockT);
        // shadow light follows the player
        key.position.set(player.x + keyOffset.x, keyOffset.y, player.z + keyOffset.z);
        key.target.position.set(player.x, 0, player.z - 18);
        rim.position.set(player.x + 20, 15, player.z + 20);
      } else {
        worlds.update(dt, player.z, clockT);
      }
      updateBlend(dt);
      fx.update(dt, camera);
      sky.position.copy(camera.position);
      DS.UI.update(dt, speedK);
    } catch (err) { console.error(err); }
    if (!skipRender) renderScene();
  }

  function beginFrom(i) {
    document.getElementById('start').classList.remove('show');
    DS.Audio.init();
    G.paused = false;
    DS.UI.setFade(1, 0.2);
    setTimeout(() => startLevel(i), 250);
  }

  // ---------------- menus (pause / settings) ----------------
  const $s = (id) => document.getElementById(id);
  let settingsReturn = 'start';
  function togglePause(force) {
    G.paused = force !== undefined ? force : !G.paused;
    $s('pause').classList.toggle('show', G.paused);
  }
  function openSettings(from) {
    settingsReturn = from; DS.Settings.render($s('settings-list'));
    $s(from).classList.remove('show'); $s('settings').classList.add('show');
  }
  function closeSettings() { $s('settings').classList.remove('show'); $s(settingsReturn).classList.add('show'); }
  function toMainMenu() {
    togglePause(false); G.state = 'menu'; obstacles.clear(); boss.clear(); fx.clear(); DS.UI.hidePrompt(); DS.UI.showBoss(false);
    heroes.forEach(h => scene.remove(h)); heroes = []; if (runner.obj) { scene.remove(runner.obj); runner.obj = null; }
    katana.userData.setVisible && katana.userData.setVisible(false);
    worlds.setWorld('forest', 0); setPreset('forest', 0); Object.assign(player, { z: 0, li: 1, y: 0, speed: 0 }); snapPlayerCamera();
    $s('start').classList.add('show');
  }
  document.querySelectorAll('[data-open="settings"]').forEach(b => b.addEventListener('click', () => openSettings(b.closest('.screen').id)));
  document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
    const a = b.dataset.act;
    if (a === 'resume') togglePause(false);
    else if (a === 'restart') { togglePause(false); beginFrom(G.levelIdx); }
    else if (a === 'menu') toMainMenu();
    else if (a === 'fullscreen') { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { }); else document.exitFullscreen(); }
    else if (a === 'close-settings') closeSettings();
    else if (a === 'reset-settings') DS.Settings.reset();
  }));
  document.querySelectorAll('#pause .levels button').forEach(b => b.addEventListener('click', () => { togglePause(false); beginFrom(+b.dataset.level); }));
  // apply settings that live in JS
  DS.Settings.onChange((v) => {
    renderer.setPixelRatio(v.quality === 'low' ? 1 : Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    key.castShadow = v.quality !== 'low';
    DS.Audio.setVolumes && DS.Audio.setVolumes(v.master, v.voice, v.sfx);
  });
  DS.Settings.apply();

  window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); if (composer) composer.setSize(innerWidth, innerHeight); if (ssaoPass) ssaoPass.setSize(innerWidth, innerHeight); if (bloomPass) bloomPass.setSize(innerWidth, innerHeight); if (smaaPass) smaaPass.setSize(innerWidth * Math.min(devicePixelRatio,2), innerHeight * Math.min(devicePixelRatio,2)); });
  document.getElementById('btn-play').addEventListener('click', () => beginFrom(0));
  document.querySelectorAll('#start .levels button').forEach(b => b.addEventListener('click', () => beginFrom(+b.dataset.level)));
  if (qs.has('rec')) document.body.classList.add('rec');

  // boot: show forest behind the start screen
  (async function boot() {
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { } }
    worlds.setWorld('forest', 0); setPreset('forest', 0);
    player.z = 0; player.li = 1; snapPlayerCamera();
    renderer.compile(scene, camera);
    document.getElementById('loading').classList.remove('show');
    DS.UI.setFade(0, 1.0);
    G.state = 'menu';
    if (qs.has('level')) beginFrom(+qs.get('level') - 1);
    frame();
  })();
})(window.DS);

// DOM UI: start/pause screens, fade, in-game HUD (cue icon, progress, prompts, boss bar, combo), flashes, speed lines.
(function (DS) {
  const $ = (id) => document.getElementById(id);
  const UI = {};

  UI.init = function () {
    UI.hud = $('hud');
    UI.progress = $('progress-fill');
    UI.cue = $('cue'); UI.cueCanvas = $('cue-canvas'); UI.cueLabel = $('cue-label');
    UI.prompt = $('prompt'); UI.promptFig = $('prompt-fig'); UI.promptText = $('prompt-text'); UI.promptSub = $('prompt-sub'); UI.pips = $('pips');
    UI.big = $('bigtext');
    UI.boss = $('bossbar'); UI.bossFill = $('boss-fill'); UI.combo = $('combo'); UI.comboNum = $('combo-num');
    UI.judge = $('judge');
    UI.flash = $('flash'); UI.vign = $('vignette'); UI.fade = $('fade');
    UI.lines = $('speedlines'); UI.lctx = UI.lines.getContext('2d');
    UI.lineData = []; for (let i = 0; i < 46; i++) UI.lineData.push({ a: Math.random() * Math.PI * 2, r: Math.random(), len: 0.08 + Math.random() * 0.14, w: 1 + Math.random() * 2.5, sp: 0.8 + Math.random() * 1.2 });
    window.addEventListener('resize', UI.resize); UI.resize();
  };
  UI.resize = function () { UI.lines.width = innerWidth; UI.lines.height = innerHeight; };

  UI.setHudVisible = (v) => { UI.hud.style.display = v ? '' : 'none'; };
  UI.setProgress = (k) => { UI.progress.style.width = (DS.clamp(k, 0, 1) * 100).toFixed(2) + '%'; };

  // ----- cue icon (top-center) -----
  let cueTimer = 0;
  const LABEL = { jump: 'JUMP!', duck: 'DUCK!', left: 'LEFT!', right: 'RIGHT!', slash: 'SLASH!', smash: 'SMASH!', push: 'PUSH!', pose: 'POSE!' };
  UI.showCue = function (icon, label, color) {
    const c = UI.cueCanvas, g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const fig = icon === 'smash' ? 'punch' : icon === 'push' ? 'run' : icon;
    DS.Fig.draw(g, fig, c.width / 2, c.height * 0.9, c.height * 0.72, { color: '#fff', glow: 'rgba(255,255,255,0.7)' });
    UI.cueLabel.textContent = label || LABEL[icon] || (DS.Fig.LABEL[icon] || icon).toUpperCase();
    UI.cue.style.setProperty('--cue', color || '#e2324a');
    UI.cue.classList.remove('show'); void UI.cue.offsetWidth; UI.cue.classList.add('show');
    cueTimer = 1.6;
  };

  // ----- center prompt for set pieces -----
  UI.showPrompt = function (fig, text, sub, pips) {
    const c = UI.promptFig, g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    if (fig) { DS.Fig.draw(g, fig, c.width / 2, c.height * 0.93, c.height * 0.8, { color: '#fff', glow: 'rgba(255,200,120,0.9)', outline: 'rgba(0,0,0,0.55)' }); c.style.display = ''; }
    else c.style.display = 'none';
    UI.promptText.textContent = text || '';
    UI.promptSub.textContent = sub || '';
    UI.pips.innerHTML = '';
    if (pips) for (let i = 0; i < pips[1]; i++) { const p = document.createElement('span'); if (i < pips[0]) p.className = 'on'; UI.pips.appendChild(p); }
    UI.prompt.classList.add('show');
  };
  UI.hidePrompt = () => UI.prompt.classList.remove('show');

  // big transient text (ROUND 1, 3-2-1, FINAL BLOW...)
  let bigTimer = 0;
  UI.bigText = function (txt, dur = 1.2, color = '#fff', size = 1) {
    UI.big.textContent = txt; UI.big.style.color = color; UI.big.style.setProperty('--s', size);
    UI.big.classList.remove('show'); void UI.big.offsetWidth; UI.big.classList.add('show');
    bigTimer = dur;
  };

  UI.judgeText = function (txt, color) {
    UI.judge.textContent = txt; UI.judge.style.color = color;
    UI.judge.classList.remove('show'); void UI.judge.offsetWidth; UI.judge.classList.add('show');
  };

  // ----- boss -----
  UI.showBoss = (v) => { UI.boss.classList.toggle('show', v); UI.combo.classList.toggle('show', v); };
  UI.setBossHP = (k) => { UI.bossFill.style.width = (DS.clamp(k, 0, 1) * 100) + '%'; };
  UI.setCombo = (n) => { UI.comboNum.textContent = n; UI.combo.classList.remove('pop'); void UI.combo.offsetWidth; UI.combo.classList.add('pop'); };

  // ----- flashes -----
  UI.flashColor = function (color, dur = 0.25, op = 0.6) {
    UI.flash.style.transition = 'none'; UI.flash.style.background = color; UI.flash.style.opacity = op;
    void UI.flash.offsetWidth; UI.flash.style.transition = `opacity ${dur}s ease-out`; UI.flash.style.opacity = 0;
  };
  UI.damage = function () {
    UI.vign.classList.remove('hit'); void UI.vign.offsetWidth; UI.vign.classList.add('hit');
  };
  UI.setFade = function (op, dur = 0.6) { UI.fade.style.transition = `opacity ${dur}s ease`; UI.fade.style.opacity = op; };

  // ----- per-frame -----
  UI.update = function (dt, speedK) {
    if (cueTimer > 0) { cueTimer -= dt; if (cueTimer <= 0) UI.cue.classList.remove('show'); }
    if (bigTimer > 0) { bigTimer -= dt; if (bigTimer <= 0) UI.big.classList.remove('show'); }
    // speed lines
    const g = UI.lctx, w = UI.lines.width, h = UI.lines.height;
    g.clearRect(0, 0, w, h);
    if (speedK > 0.02) {
      const cx = w / 2, cy = h * 0.46, R = Math.hypot(w, h) * 0.55;
      g.strokeStyle = '#fff'; g.lineCap = 'round';
      for (const L of UI.lineData) {
        L.r += dt * L.sp * (0.8 + speedK * 1.6);
        if (L.r > 1) { L.r = 0.35 + Math.random() * 0.2; L.a = Math.random() * Math.PI * 2; }
        const r1 = L.r * R, r2 = r1 + L.len * R * speedK;
        g.globalAlpha = Math.min(1, (L.r - 0.35) * 3) * 0.28 * speedK;
        g.lineWidth = L.w;
        g.beginPath(); g.moveTo(cx + Math.cos(L.a) * r1, cy + Math.sin(L.a) * r1);
        g.lineTo(cx + Math.cos(L.a) * r2, cy + Math.sin(L.a) * r2); g.stroke();
      }
      g.globalAlpha = 1;
    }
  };

  DS.UI = UI;
})(window.DS);

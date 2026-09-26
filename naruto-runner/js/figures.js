// Stick-figure silhouettes used by cards, cue icons and pose walls.
// Coordinates: x right, y up, feet at y=0, head top ~1.0 (figure height units).
(function (DS) {
  const base = {
    head: [0, 0.9], neck: [0, 0.78], hip: [0, 0.47],
    le: [-0.13, 0.62], lh: [-0.17, 0.47], re: [0.13, 0.62], rh: [0.17, 0.47],
    lk: [-0.07, 0.24], lf: [-0.09, 0.02], rk: [0.07, 0.24], rf: [0.09, 0.02]
  };
  const P = (o) => Object.assign({}, base, o);

  const POSES = {
    stand: P({}),
    wave: P({ re: [0.2, 0.84], rh: [0.28, 1.0], le: [-0.12, 0.62], lh: [-0.15, 0.47] }),
    run: P({ head: [0.04, 0.9], neck: [0.03, 0.78], hip: [0, 0.48],
      le: [-0.1, 0.66], lh: [0.02, 0.76], re: [0.12, 0.64], rh: [0.16, 0.5],
      lk: [0.12, 0.3], lf: [0.02, 0.14], rk: [-0.05, 0.25], rf: [-0.16, 0.03] }),
    jump: P({ head: [0, 0.98], neck: [0, 0.86], hip: [0, 0.55],
      le: [-0.17, 0.97], lh: [-0.26, 1.1], re: [0.17, 0.97], rh: [0.26, 1.1],
      lk: [-0.12, 0.38], lf: [-0.16, 0.22], rk: [0.12, 0.38], rf: [0.16, 0.22] }),
    duck: P({ head: [0, 0.66], neck: [0, 0.56], hip: [0, 0.32],
      le: [-0.12, 0.47], lh: [-0.1, 0.36], re: [0.12, 0.47], rh: [0.1, 0.36],
      lk: [-0.2, 0.2], lf: [-0.12, 0.02], rk: [0.2, 0.2], rf: [0.12, 0.02] }),
    left: P({ head: [-0.14, 0.88], neck: [-0.11, 0.77], hip: [-0.03, 0.46],
      le: [-0.25, 0.66], lh: [-0.36, 0.56], re: [0.02, 0.62], rh: [0.1, 0.5],
      lk: [-0.2, 0.24], lf: [-0.32, 0.02], rk: [0.06, 0.23], rf: [0.12, 0.02] }),
    right: null, // mirrored from left
    slash: P({ head: [-0.03, 0.9], neck: [-0.02, 0.78], hip: [0, 0.47],
      le: [0.1, 0.84], lh: [0.24, 0.98], re: [0.16, 0.8], rh: [0.28, 0.95],
      lk: [-0.12, 0.24], lf: [-0.18, 0.02], rk: [0.1, 0.24], rf: [0.16, 0.02], sword: true }),
    punch: P({ le: [-0.06, 0.66], lh: [0.02, 0.76], re: [0.24, 0.72], rh: [0.42, 0.74],
      lk: [-0.1, 0.24], lf: [-0.16, 0.02], rk: [0.1, 0.24], rf: [0.14, 0.02] }),
    // --- pose-wall poses ---
    tree: P({ le: [-0.11, 0.94], lh: [0, 1.06], re: [0.11, 0.94], rh: [0, 1.06],
      lk: [-0.22, 0.32], lf: [-0.02, 0.3], rk: [0.02, 0.24], rf: [0.02, 0.02] }),
    star: P({ le: [-0.2, 0.86], lh: [-0.36, 0.98], re: [0.2, 0.86], rh: [0.36, 0.98],
      lk: [-0.16, 0.24], lf: [-0.3, 0.02], rk: [0.16, 0.24], rf: [0.3, 0.02] }),
    tpose: P({ le: [-0.2, 0.77], lh: [-0.4, 0.77], re: [0.2, 0.77], rh: [0.4, 0.77] }),
    warrior: P({ head: [0, 0.8], neck: [0, 0.68], hip: [0, 0.37],
      le: [-0.2, 0.67], lh: [-0.4, 0.67], re: [0.2, 0.67], rh: [0.4, 0.67],
      lk: [-0.26, 0.2], lf: [-0.28, 0.02], rk: [0.16, 0.18], rf: [0.36, 0.02] }),
    kick: P({ head: [-0.06, 0.9], neck: [-0.05, 0.78], hip: [-0.02, 0.47],
      le: [-0.22, 0.74], lh: [-0.38, 0.8], re: [0.1, 0.84], rh: [0.2, 0.96],
      lk: [-0.06, 0.24], lf: [-0.08, 0.02], rk: [0.2, 0.46], rf: [0.42, 0.56] }),
    crane: P({ le: [-0.22, 0.88], lh: [-0.36, 0.84], re: [0.22, 0.88], rh: [0.36, 0.84],
      lk: [-0.16, 0.42], lf: [-0.1, 0.2], rk: [0.02, 0.24], rf: [0.02, 0.02] }),
    sidebend: P({ head: [0.12, 0.9], neck: [0.08, 0.79], hip: [0, 0.47],
      le: [0.02, 0.96], lh: [0.18, 1.06], re: [0.2, 0.9], rh: [0.3, 1.0],
      lk: [-0.08, 0.24], lf: [-0.12, 0.02], rk: [0.08, 0.24], rf: [0.12, 0.02] }),
    xarms: P({ le: [0.06, 0.8], lh: [0.2, 0.96], re: [-0.06, 0.8], rh: [-0.2, 0.96],
      lk: [-0.1, 0.24], lf: [-0.16, 0.02], rk: [0.1, 0.24], rf: [0.16, 0.02] })
  };
  // mirror
  const mirror = (p) => {
    const m = {};
    const sw = { le: 're', lh: 'rh', re: 'le', rh: 'lh', lk: 'rk', lf: 'rf', rk: 'lk', rf: 'lf' };
    for (const k in p) {
      if (k === 'sword') { m.sword = p.sword; continue; }
      const src = p[k];
      const key = sw[k] || k;
      m[key] = [-src[0], src[1]];
    }
    return m;
  };
  POSES.right = mirror(POSES.left);

  // draw figure: ctx, pose name, center x, ground y (canvas px), height px, style
  function draw(ctx, name, cx, gy, h, style = {}) {
    const p = POSES[name] || POSES.stand;
    const X = (v) => cx + v[0] * h, Y = (v) => gy - v[1] * h;
    const lw = (style.thick || 0.085) * h;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const seg = (a, b) => { ctx.beginPath(); ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)); ctx.stroke(); };
    const body = () => {
      // torso
      ctx.lineWidth = lw * 1.5; seg(p.neck, p.hip);
      ctx.lineWidth = lw;
      seg(p.neck, p.le); seg(p.le, p.lh); seg(p.neck, p.re); seg(p.re, p.rh);
      seg(p.hip, p.lk); seg(p.lk, p.lf); seg(p.hip, p.rk); seg(p.rk, p.rf);
      if (p.sword) { // katana line from hands
        ctx.lineWidth = lw * 0.45;
        const hx = (p.lh[0] + p.rh[0]) / 2, hy = (p.lh[1] + p.rh[1]) / 2;
        seg([hx, hy], [hx - 0.32, hy + 0.28]);
      }
      ctx.beginPath(); ctx.arc(X(p.head), Y(p.head), h * 0.085, 0, Math.PI * 2); ctx.fill();
    };
    if (style.glow) { ctx.shadowColor = style.glow; ctx.shadowBlur = h * 0.08; }
    if (style.outline) { // outline pass
      ctx.strokeStyle = style.outline; ctx.fillStyle = style.outline;
      const s = lw; const oldLw = ctx.lineWidth;
      ctx.save(); ctx.translate(0, 0);
      const extra = style.outlineW || h * 0.035;
      const draw2 = () => {
        ctx.lineWidth = lw * 1.5 + extra * 2; seg(p.neck, p.hip);
        ctx.lineWidth = lw + extra * 2;
        seg(p.neck, p.le); seg(p.le, p.lh); seg(p.neck, p.re); seg(p.re, p.rh);
        seg(p.hip, p.lk); seg(p.lk, p.lf); seg(p.hip, p.rk); seg(p.rk, p.rf);
        ctx.beginPath(); ctx.arc(X(p.head), Y(p.head), h * 0.085 + extra, 0, Math.PI * 2); ctx.fill();
      };
      draw2(); ctx.restore(); void s; void oldLw;
    }
    ctx.strokeStyle = style.color || '#fff'; ctx.fillStyle = style.color || '#fff';
    body();
    ctx.restore();
  }

  // returns a canvas element with the figure drawn (for DOM cards/icons)
  function canvas(name, size = 160, style = {}) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const g = c.getContext('2d');
    draw(g, name, size / 2, size * 0.93, size * 0.8, Object.assign({ color: '#fff', glow: 'rgba(255,255,255,0.6)' }, style));
    return c;
  }

  DS.Fig = { POSES, draw, canvas,
    WALL_POSES: ['tree', 'star', 'warrior', 'kick', 'tpose', 'crane', 'sidebend', 'xarms'],
    LABEL: { run: 'RUN', jump: 'JUMP', duck: 'DUCK', left: 'LEFT', right: 'RIGHT', slash: 'SLASH', punch: 'PUNCH',
      tree: 'TREE', star: 'STAR', warrior: 'WARRIOR', kick: 'KICK', tpose: 'T-POSE', crane: 'CRANE', sidebend: 'BEND', xarms: 'CROSS', wave: 'HELLO', pose: 'MIRROR ME' } };
})(window.DS);

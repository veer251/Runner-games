// Boss fight: rhythm notes fly from the Upper-Moon demon to the player.
// A/Left = slash LEFT orb, D/Right = slash RIGHT orb, Shift = cross slash (X), S/Down = duck under shockwave (D).
(function (DS) {
  DS.Boss = {
    create(scene, fx) {
      const B = { active: false };
      const orbGeo = new THREE.IcosahedronGeometry(0.34, 1);
      const orbMat = { L: DS.glow(0x3ad0ff, 2.2), R: DS.glow(0x3ad0ff, 2.2), X: DS.glow(0xff5aa8, 2.4) };
      const ringGeo = new THREE.TorusGeometry(1.0, 0.13, 8, 40);
      const waveMat = new THREE.MeshBasicMaterial({ color: DS.C(0xff3a6a), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
      const laneMat = new THREE.MeshBasicMaterial({ color: DS.C(0x3ad0ff), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
      let group, boss, notes = [], level, bossZ, playerZ, hp, hpMax, combo, lanesMesh = [];

      B.start = function (lvl, pz) {
        B.clear();
        level = lvl; playerZ = pz; bossZ = pz - 15;
        group = new THREE.Group(); scene.add(group);
        boss = DS.Chars.boss(); boss.position.set(0, 0, bossZ); group.add(boss);
        boss.userData.setState && boss.userData.setState('idle');
        // glowing note lanes on the floor from boss to player
        [-0.9, 0.9].forEach(x => {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 14), laneMat);
          m.rotation.x = -Math.PI / 2; m.position.set(x, 0.03, (bossZ + pz) / 2); group.add(m); lanesMesh.push(m);
        });
        notes = lvl.notes.map(([t, type]) => ({ t, type, spawned: false, done: false, mesh: null }));
        hpMax = notes.length + 1; hp = hpMax; combo = 0;
        B.active = true; B.finalReady = false; B.finalDone = false; B.dawned = false; B.celebrated = false;
        B.roundIdx = 0;
        DS.UI.showBoss(true); DS.UI.setBossHP(1); DS.UI.setCombo(0);
      };

      B.clear = function () {
        if (group) { scene.remove(group); group = null; }
        notes = []; lanesMesh = []; B.active = false; DS.UI && DS.UI.showBoss && DS.UI.showBoss(false);
      };

      function notePos(n, k, out) { // k: 0 at boss, 1 at hit point
        const side = n.type === 'L' ? -1 : n.type === 'R' ? 1 : 0;
        const x0 = side * 1.1, x1 = side * 0.85;
        out.set(DS.lerp(x0, x1, k), 1.9 + Math.sin(k * Math.PI) * 0.8 - k * 0.35, DS.lerp(bossZ + 1.2, playerZ - 1.6, k));
        return out;
      }
      const tmp = new THREE.Vector3();

      function spawn(n) {
        n.spawned = true;
        if (n.type === 'D') {
          const w = new THREE.Mesh(ringGeo, waveMat); w.rotation.x = 0; n.mesh = w; group.add(w);
          boss.userData.setState && boss.userData.setState('punch');
          DS.Audio.sfx('shockwave');
        } else if (n.type === 'X') {
          const g = new THREE.Group();
          const a = new THREE.Mesh(orbGeo, orbMat.X); a.position.x = -0.9; g.add(a);
          const b = new THREE.Mesh(orbGeo, orbMat.X); b.position.x = 0.9; g.add(b);
          const h1 = DS.halo(0xff5aa8, 1.6, 0.9); h1.position.x = -0.9; g.add(h1);
          const h2 = DS.halo(0xff5aa8, 1.6, 0.9); h2.position.x = 0.9; g.add(h2);
          n.mesh = g; group.add(g);
          boss.userData.setState && boss.userData.setState('punch');
        } else {
          const g = new THREE.Group();
          g.add(new THREE.Mesh(orbGeo, orbMat[n.type]));
          g.add(DS.halo(0x6fe0ff, 1.7, 0.9));
          n.mesh = g; group.add(g);
          boss.userData.setState && boss.userData.setState('punch');
        }
      }

      function resolve(n, good, api, label) {
        n.done = true;
        if (n.mesh) {
          const p = n.mesh.getWorldPosition(new THREE.Vector3());
          if (good) {
            fx.sparks({ pos: p, n: 50, colors: n.type === 'X' ? [0xff5aa8, 0xffffff] : [0x3ad0ff, 0xffffff, 0x9fe8ff], speed: [2, 7], life: 0.7, gravity: 2 });
            fx.ring(p, n.type === 'X' ? 0xff5aa8 : 0x6fe0ff, 3.5, 0.4);
          }
          group.remove(n.mesh); n.mesh = null;
        }
        if (good) {
          combo++; hp--; DS.UI.setCombo(combo); DS.UI.setBossHP(hp / hpMax);
          DS.UI.judgeText(label || 'PERFECT!', label === 'GOOD' ? '#9fe8ff' : '#ffe27a');
          boss.userData.setState && boss.userData.setState('hit');
        } else {
          combo = 0; DS.UI.setCombo(0); DS.UI.judgeText('MISS', '#ff5a6a'); api.onHit();
        }
      }

      // time = seconds since level start; player = {ducking}
      B.update = function (dt, time, player, api) {
        if (!B.active) return;
        boss.userData.update && boss.userData.update(dt, time);
        // rounds
        const rounds = level.rounds;
        if (B.roundIdx < rounds.length && time >= rounds[B.roundIdx][0]) {
          const r = rounds[B.roundIdx]; B.roundIdx++;
          DS.UI.bigText(r[1], 1.6, '#fff', 0.9); DS.Audio.sfx('gong');
          if (B.roundIdx === rounds.length) { boss.userData.setState && boss.userData.setState('enrage'); DS.Audio.sfx('roar'); }
        }
        const travel = level.travel;
        for (const n of notes) {
          if (n.done) continue;
          const start = n.t - travel;
          if (!n.spawned && time >= start) spawn(n);
          if (!n.spawned) continue;
          const k = DS.clamp((time - start) / travel, 0, 1.15);
          if (n.type === 'D') {
            n.mesh.position.set(0, 1.45, DS.lerp(bossZ + 1, playerZ - 0.5, Math.min(k, 1)));
            const s = 1 + k * 2.2; n.mesh.scale.set(s, s, 1);
            if (time >= n.t) { // arrival: must be ducking
              if (player.ducking) { resolve(n, true, api, 'DODGE!'); } else { resolve(n, false, api); }
            }
          } else {
            notePos(n, Math.min(k, 1.1), tmp); n.mesh.position.copy(tmp);
            n.mesh.rotation.y += dt * 4; n.mesh.rotation.x += dt * 3;
            if (time > n.t + 0.28) resolve(n, false, api);
          }
        }
        // final blow
        if (!B.finalReady && time >= level.finalBlowAt) {
          B.finalReady = true; B.finalAt = time;
          api.onFinalReady();
        }
        if (B.finalReady && !B.finalDone && time >= B.finalAt + 3.2) B.doFinal(api, time); // auto
        if (B.finalDone && !B.dawned && time >= B.finalTime + 1.2) { B.dawned = true; api.onDawn(); }
        if (B.finalDone && !B.celebrated && time >= B.finalTime + level.celebrateDelay) { B.celebrated = true; api.onCelebrate(); }
      };

      // input from player; returns true if consumed
      B.input = function (key, api, time) {
        if (!B.active) return false;
        if (B.finalReady && !B.finalDone) { if (key === 'action') { B.doFinal(api, time); return true; } return false; }
        const want = key === 'left' ? 'L' : key === 'right' ? 'R' : key === 'action' ? 'X' : null;
        if (!want) return false;
        let best = null, bd = 1e9;
        for (const n of notes) {
          if (n.done || !n.spawned || n.type === 'D') continue;
          const d = Math.abs(time - n.t);
          if (d < 0.42 && d < bd && (n.type === want || (want === 'X' && n.type !== 'D'))) { bd = d; best = n; }
        }
        if (best) {
          resolve(best, true, api, bd < 0.16 ? 'PERFECT!' : 'GOOD');
          return best.type === 'X' ? 'x' : best.type === 'L' ? 'left' : 'right';
        }
        return false;
      };

      B.doFinal = function (api, time) {
        B.finalDone = true; B.finalTime = time;
        hp = 0; DS.UI.setBossHP(0);
        api.onFinal();
        boss.userData.setState && boss.userData.setState('die');
        const p = new THREE.Vector3(0, 2, bossZ);
        fx.sparks({ pos: p, n: 300, colors: [0x3ad0ff, 0xffffff, 0x9fe8ff, 0xff5aa8], speed: [4, 14], spread: 2, life: 1.6, gravity: 1 });
        fx.ring(p, 0x9fe8ff, 14, 0.8); fx.ring(p, 0xffffff, 9, 0.5);
      };

      B.celebrateSpot = () => new THREE.Vector3(0, 0, bossZ + 3);
      return B;
    }
  };
})(window.DS);

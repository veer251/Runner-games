// Particle effects: tumbling debris (instanced), glowing sparks/ash/embers (points), shockwave rings.
(function (DS) {
  const MAX_D = 1400, MAX_G = 2500;

  DS.FX = {
    create(scene) {
      const fx = {};
      // ---------- debris (instanced boxes) ----------
      const dGeo = new THREE.BoxGeometry(1, 1, 1);
      const dMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0, flatShading: true });
      const dMesh = new THREE.InstancedMesh(dGeo, dMat, MAX_D);
      dMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      dMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_D * 3), 3);
      dMesh.castShadow = true; dMesh.frustumCulled = false; dMesh.count = MAX_D;
      scene.add(dMesh);
      const D = []; for (let i = 0; i < MAX_D; i++) D.push({ life: 0 });
      let dPtr = 0;
      const dummy = new THREE.Object3D(); const col = new THREE.Color();
      // hide all initially
      dummy.scale.set(0, 0, 0); dummy.updateMatrix();
      for (let i = 0; i < MAX_D; i++) dMesh.setMatrixAt(i, dummy.matrix);

      // ---------- glow points ----------
      const gGeo = new THREE.BufferGeometry();
      const gPos = new Float32Array(MAX_G * 3), gCol = new Float32Array(MAX_G * 3);
      gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3).setUsage(THREE.DynamicDrawUsage));
      gGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3).setUsage(THREE.DynamicDrawUsage));
      const gMat = new THREE.PointsMaterial({ size: 0.28, map: DS.glowTex(), vertexColors: true, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
      const gPts = new THREE.Points(gGeo, gMat); gPts.frustumCulled = false; scene.add(gPts);
      const G = []; for (let i = 0; i < MAX_G; i++) { G.push({ life: 0 }); gPos[i * 3 + 1] = -9999; }
      let gPtr = 0;

      // ---------- rings ----------
      const rings = [];
      const ringGeo = new THREE.RingGeometry(0.7, 1.0, 48);

      const rnd = Math.random;
      // opts: pos(Vector3), n, colors[hex], size[min,max], speed[min,max], up[min,max], dir(Vector3 bias), spread, gravity, life, spin
      fx.debris = function (o) {
        const n = o.n || 20;
        for (let k = 0; k < n; k++) {
          const p = D[dPtr]; const idx = dPtr; dPtr = (dPtr + 1) % MAX_D;
          p.idx = idx;
          p.x = o.pos.x + (rnd() - 0.5) * (o.spreadX ?? o.spread ?? 0.5);
          p.y = o.pos.y + (rnd() - 0.5) * (o.spreadY ?? o.spread ?? 0.5);
          p.z = o.pos.z + (rnd() - 0.5) * (o.spreadZ ?? 0.3);
          const sp = DS.lerp(o.speed?.[0] ?? 3, o.speed?.[1] ?? 9, rnd());
          const a = rnd() * Math.PI * 2;
          p.vx = Math.cos(a) * sp * 0.6 + (o.dir ? o.dir.x : 0);
          p.vy = DS.lerp(o.up?.[0] ?? 2, o.up?.[1] ?? 8, rnd()) + (o.dir ? o.dir.y : 0);
          p.vz = Math.sin(a) * sp * 0.6 + (o.dir ? o.dir.z : 0);
          p.rx = rnd() * 6; p.ry = rnd() * 6; p.rz = rnd() * 6;
          const spin = o.spin ?? 10;
          p.wx = (rnd() - 0.5) * spin; p.wy = (rnd() - 0.5) * spin; p.wz = (rnd() - 0.5) * spin;
          const s = DS.lerp(o.size?.[0] ?? 0.1, o.size?.[1] ?? 0.3, rnd());
          p.sx = s * (o.flat ? 1.6 : 1); p.sy = s * (o.flat ? 0.06 : 1); p.sz = s * (o.flat ? 1.2 : 1);
          p.g = o.gravity ?? 22; p.drag = o.drag ?? 0.2; p.life = p.max = (o.life ?? 1.6) * (0.7 + rnd() * 0.5);
          p.floor = o.floor ?? 0.05;
          const c = o.colors[(rnd() * o.colors.length) | 0];
          col.copy(DS.C(c)); dMesh.setColorAt(idx, col);
        }
        dMesh.instanceColor.needsUpdate = true;
      };

      // glowing sparks/embers: pos, n, colors, speed, up, gravity(neg = rise), life, spread
      fx.sparks = function (o) {
        const n = o.n || 30;
        for (let k = 0; k < n; k++) {
          const p = G[gPtr]; const idx = gPtr; gPtr = (gPtr + 1) % MAX_G;
          p.idx = idx;
          p.x = o.pos.x + (rnd() - 0.5) * (o.spreadX ?? o.spread ?? 0.4);
          p.y = o.pos.y + (rnd() - 0.5) * (o.spreadY ?? o.spread ?? 0.4);
          p.z = o.pos.z + (rnd() - 0.5) * (o.spreadZ ?? o.spread ?? 0.4);
          const sp = DS.lerp(o.speed?.[0] ?? 1, o.speed?.[1] ?? 6, rnd());
          const th = rnd() * Math.PI * 2, ph = rnd() * Math.PI;
          p.vx = Math.sin(ph) * Math.cos(th) * sp + (o.dir ? o.dir.x : 0);
          p.vy = Math.cos(ph) * sp + DS.lerp(o.up?.[0] ?? 0, o.up?.[1] ?? 3, rnd());
          p.vz = Math.sin(ph) * Math.sin(th) * sp + (o.dir ? o.dir.z : 0);
          p.g = o.gravity ?? 6; p.life = p.max = (o.life ?? 1.0) * (0.6 + rnd() * 0.7);
          const c = DS.C(o.colors[(rnd() * o.colors.length) | 0]);
          p.r = c.r; p.gg = c.g; p.b = c.b;
        }
      };

      fx.ring = function (pos, color, maxScale = 6, life = 0.6, faceCamera = true) {
        const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: DS.C(color), transparent: true,
          opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        m.position.copy(pos); if (!faceCamera) m.rotation.x = -Math.PI / 2;
        scene.add(m); rings.push({ m, t: 0, life, maxScale });
      };

      fx.update = function (dt, cam) {
        // debris
        let dirty = false;
        for (let i = 0; i < MAX_D; i++) {
          const p = D[i]; if (p.life <= 0) continue;
          dirty = true;
          p.life -= dt;
          p.vy -= p.g * dt;
          const dr = Math.exp(-p.drag * dt); p.vx *= dr; p.vz *= dr;
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          if (p.y < p.floor) { p.y = p.floor; p.vy *= -0.3; p.vx *= 0.7; p.vz *= 0.7; p.wx *= 0.6; p.wz *= 0.6; }
          p.rx += p.wx * dt; p.ry += p.wy * dt; p.rz += p.wz * dt;
          const k = p.life <= 0 ? 0 : Math.min(1, p.life / 0.35);
          dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(p.rx, p.ry, p.rz);
          dummy.scale.set(p.sx * k, p.sy * k, p.sz * k); dummy.updateMatrix();
          dMesh.setMatrixAt(p.idx, dummy.matrix);
        }
        if (dirty) dMesh.instanceMatrix.needsUpdate = true;
        // glow
        for (let i = 0; i < MAX_G; i++) {
          const p = G[i]; if (p.life <= 0) continue;
          p.life -= dt;
          const j = p.idx * 3;
          if (p.life <= 0) { gPos[j + 1] = -9999; continue; }
          p.vy -= p.g * dt; const dr = Math.exp(-1.2 * dt); p.vx *= dr; p.vz *= dr;
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          gPos[j] = p.x; gPos[j + 1] = p.y; gPos[j + 2] = p.z;
          const f = Math.min(1, p.life / p.max * 1.6);
          gCol[j] = p.r * f; gCol[j + 1] = p.gg * f; gCol[j + 2] = p.b * f;
        }
        gGeo.attributes.position.needsUpdate = true; gGeo.attributes.color.needsUpdate = true;
        // rings
        for (let i = rings.length - 1; i >= 0; i--) {
          const r = rings[i]; r.t += dt; const k = r.t / r.life;
          if (k >= 1) { scene.remove(r.m); r.m.material.dispose(); rings.splice(i, 1); continue; }
          const s = 0.3 + k * r.maxScale; r.m.scale.set(s, s, s);
          r.m.material.opacity = 0.9 * (1 - k);
          if (cam && r.m.rotation.x === 0) r.m.quaternion.copy(cam.quaternion);
        }
      };

      fx.clear = function () {
        D.forEach(p => { if (p.life > 0) { p.life = 0; dummy.scale.set(0, 0, 0); dummy.updateMatrix(); dMesh.setMatrixAt(p.idx, dummy.matrix); } });
        dMesh.instanceMatrix.needsUpdate = true;
        G.forEach(p => { if (p.life > 0) { p.life = 0; gPos[p.idx * 3 + 1] = -9999; } });
        gGeo.attributes.position.needsUpdate = true;
        rings.forEach(r => { scene.remove(r.m); r.m.material.dispose(); }); rings.length = 0;
      };
      return fx;
    }
  };
})(window.DS);

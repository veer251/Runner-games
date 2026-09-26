// ─── OBSTACLES — factory, pool, spawner, set pieces ──────────────────────────
'use strict';

const Obstacles = (() => {
  let scene, game;
  let active = [];       // active obstacles in world
  let pools = {};        // pooled meshes by type
  let sharedGeo = {}, sharedMat = {};
  let spawnZ = 0;        // next spawn position
  let lastPattern = -1;
  let setPieceCooldown = 0;
  let poseWallCooldown = 0;
  const LANES = [-2.6, 0, 2.6];

  function init(_scene, _game) {
    scene = _scene;
    game = _game;
    buildSharedAssets();
  }

  function C(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }

  function buildSharedAssets() {
    sharedGeo.box = new THREE.BoxGeometry(1,1,1);
    sharedGeo.cyl = new THREE.CylinderGeometry(1,1,1,8);
    sharedGeo.ico = new THREE.IcosahedronGeometry(1,1);
    sharedMat.shadow = new THREE.MeshBasicMaterial({
      map: Textures.getShadowBlob(), transparent:true, opacity:.6, depthWrite:false,
    });
  }

  function addContactShadow(group, w, d) {
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(w*1.3, d*1.3), sharedMat.shadow.clone());
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; sh.renderOrder=1;
    group.add(sh);
  }

  // ── Obstacle builders (themed per level) ─────────────────────────────────────
  function buildHurdle(lvl) {
    const g = new THREE.Group();
    const theme = lvl.scenery;
    let color = '#8a6030', h = 0.9;
    if(theme==='sandArena') color='#c8a050';
    else if(theme==='akatsukiHideout') color='#2a1a2a';
    else if(theme==='destroyedKonoha') color='#505050';
    else if(theme==='battlefield') color='#4a3a20';
    else if(theme==='valleyEnd') color='#2a3040';
    // low log/barrier
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,2.4,8),
      new THREE.MeshStandardMaterial({color:C(color),roughness:.85,flatShading:true}));
    bar.rotation.z=Math.PI/2; bar.position.y=0.4; bar.castShadow=true; g.add(bar);
    // end caps
    for(let s=-1;s<=1;s+=2){
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.6,6),
        new THREE.MeshStandardMaterial({color:C('#403020'),roughness:.8,flatShading:true}));
      cap.position.set(s*1.2,0.4,0); g.add(cap);
    }
    // upward chevron telegraph
    addChevron(g, 'up', '#ffd700');
    addContactShadow(g,2.4,0.7);
    g.userData = { action:'jump', hitH:1.0, hitW:0.9, hitD:0.7 };
    return g;
  }

  function buildOverheadBar(lvl) {
    const g = new THREE.Group();
    let color='#8a6030';
    if(lvl.scenery==='sandArena') color='#c8a050';
    else if(lvl.scenery==='akatsukiHideout') color='#2a1a2a';
    else if(lvl.scenery==='bridge') color='#506070';
    // horizontal beam at duck height
    const beam=new THREE.Mesh(new THREE.BoxGeometry(3,0.4,0.4),
      new THREE.MeshStandardMaterial({color:C(color),roughness:.8,flatShading:true}));
    beam.position.y=1.35; beam.castShadow=true; g.add(beam);
    // support posts
    for(let s=-1;s<=1;s+=2){
      const post=new THREE.Mesh(new THREE.BoxGeometry(0.2,3,0.2),
        new THREE.MeshStandardMaterial({color:C('#5a4020'),roughness:.8,flatShading:true}));
      post.position.set(s*1.4,1.5,0); post.castShadow=true; g.add(post);
    }
    addChevron(g,'down','#ff6b1a',1.35);
    addContactShadow(g,3,0.5);
    g.userData = { action:'duck', hitH:1.5, hitBottom:1.15, hitW:1.5, hitD:0.4, overhead:true };
    return g;
  }

  function buildBlocker(lvl) {
    const g = new THREE.Group();
    let color='#7a6040', accent='#cc2200';
    const theme = lvl.scenery;
    if(theme==='sandArena'){color='#c8a050';accent='#8a5020';}
    else if(theme==='akatsukiHideout'){color='#1a1015';accent='#cc0000';}
    else if(theme==='destroyedKonoha'){color='#404038';accent='#802010';}
    else if(theme==='battlefield'){color='#3a2a10';accent='#604020';}
    else if(theme==='forestDeath'){color='#2a1a0a';accent='#1a3010';}
    // tall pillar / crate blocking lane
    const body=new THREE.Mesh(new THREE.BoxGeometry(2.2,3.4,1.2),
      new THREE.MeshStandardMaterial({color:C(color),roughness:.85,flatShading:true}));
    body.position.y=1.7; body.castShadow=true; g.add(body);
    // accent trim
    const trim=new THREE.Mesh(new THREE.BoxGeometry(2.3,0.3,1.3),
      new THREE.MeshStandardMaterial({color:C(accent),roughness:.7,flatShading:true}));
    trim.position.y=2.6; g.add(trim);
    // detail bolts
    for(let bx=-1;bx<=1;bx+=2)for(let by=0;by<3;by++){
      const bolt=new THREE.Mesh(new THREE.SphereGeometry(0.08,6,4),
        new THREE.MeshStandardMaterial({color:C('#303030'),metalness:.5,roughness:.4}));
      bolt.position.set(bx*0.9,0.8+by*0.9,0.61); g.add(bolt);
    }
    addContactShadow(g,2.2,1.2);
    g.userData = { action:'dodge', hitH:3.4, hitW:1.05, hitD:1.2 };
    return g;
  }

  function buildMovingHazard(lvl) {
    const g = new THREE.Group();
    const theme=lvl.scenery;
    let mesh;
    if(theme==='forestDeath') {
      // giant snake segment
      const snakeMat=new THREE.MeshStandardMaterial({color:C('#4a6030'),roughness:.6,flatShading:true});
      for(let i=0;i<4;i++){
        const seg=new THREE.Mesh(new THREE.SphereGeometry(0.5-i*0.05,8,6),snakeMat);
        seg.position.set(0,0.5,i*0.6); seg.scale.z=1.4; g.add(seg);
      }
      const head=new THREE.Mesh(new THREE.ConeGeometry(0.5,1,8),snakeMat);
      head.rotation.x=-Math.PI/2; head.position.set(0,0.5,-0.6); g.add(head);
      // eyes
      for(let s=-1;s<=1;s+=2){
        const eye=new THREE.Mesh(new THREE.SphereGeometry(0.08,6,4),
          new THREE.MeshStandardMaterial({color:C('#ffdd00'),emissive:C('#ffaa00'),emissiveIntensity:.6}));
        eye.position.set(s*0.2,0.6,-0.7); g.add(eye);
      }
    } else {
      // rolling boulder (default moving hazard)
      const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(0.9,1),
        new THREE.MeshStandardMaterial({color:C('#5a4a30'),roughness:.9,flatShading:true}));
      rock.position.y=0.9; g.add(rock); g.userData.roller=rock;
    }
    addContactShadow(g,2,2);
    g.userData.action='dodge';
    g.userData.hitH=1.4; g.userData.hitW=0.9; g.userData.hitD=1.2;
    g.userData.moving=true;
    g.userData.moveSpeed=2.5;
    g.userData.moveDir=Math.random()<.5?-1:1;
    g.userData.laneRange=1;
    return g;
  }

  function buildSmashWall(lvl) {
    const g = new THREE.Group();
    // full-width sand/rock wall
    let color = lvl.scenery==='sandArena' ? '#c8a040' : '#7a6040';
    const wall=new THREE.Mesh(new THREE.BoxGeometry(8,4,1),
      new THREE.MeshStandardMaterial({color:C(color),roughness:.9,flatShading:true,map:Textures.get(lvl.trackTex)}));
    wall.position.y=2; wall.castShadow=true; g.add(wall);
    g.userData.wallMesh=wall;
    // crack decal plane (hidden initially)
    const crack=new THREE.Mesh(new THREE.PlaneGeometry(6,3.5),
      new THREE.MeshBasicMaterial({map:Textures.getCrackDecal(1),transparent:true,opacity:0,depthWrite:false}));
    crack.position.set(0,2,0.51); crack.renderOrder=999; g.add(crack);
    g.userData.crack=crack;
    // "smash" glow hint
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:Textures.getParticle('#ff6b1a'),transparent:true,opacity:.4,blending:THREE.AdditiveBlending,fog:false}));
    glow.scale.setScalar(3); glow.position.set(0,2,0.6); g.add(glow);
    g.userData.glow=glow;
    addContactShadow(g,8,1);
    g.userData.action='smash';
    g.userData.isSetPiece=true;
    g.userData.smashStage=0;
    g.userData.hitH=4; g.userData.hitW=4; g.userData.hitD=1;
    return g;
  }

  function buildPushCart(lvl) {
    const g = new THREE.Group();
    // cart body
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.2,2.4),
      new THREE.MeshStandardMaterial({color:C('#6a4a20'),roughness:.8,flatShading:true}));
    body.position.y=0.9; body.castShadow=true; g.add(body);
    // scroll cargo (naruto scroll)
    const scroll=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,2,12),
      new THREE.MeshStandardMaterial({color:C('#d0c0a0'),roughness:.7,flatShading:true}));
    scroll.rotation.z=Math.PI/2; scroll.position.y=1.8; g.add(scroll);
    const seal=new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.8),
      new THREE.MeshStandardMaterial({color:C('#cc2200'),side:THREE.DoubleSide}));
    seal.position.set(0,1.8,0); g.add(seal);
    // wheels
    g.userData.wheels=[];
    for(let sx=-1;sx<=1;sx+=2)for(let sz=-1;sz<=1;sz+=2){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.2,12),
        new THREE.MeshStandardMaterial({color:C('#302010'),roughness:.7,flatShading:true}));
      wheel.rotation.z=Math.PI/2; wheel.position.set(sx*0.9,0.4,sz*0.9); g.add(wheel);
      g.userData.wheels.push(wheel);
    }
    addContactShadow(g,2,2.4);
    g.userData.action='push';
    g.userData.isSetPiece=true;
    g.userData.pushDist=0;
    g.userData.hitH=2; g.userData.hitW=0.9; g.userData.hitD=1.2;
    return g;
  }

  function buildPoseWall(lvl, poseIdx) {
    const g = new THREE.Group();
    // yellow wall with silhouette cutout
    const wall=new THREE.Mesh(new THREE.BoxGeometry(8,4.5,0.3),
      new THREE.MeshStandardMaterial({color:C('#ffcc00'),roughness:.5,emissive:C('#886600'),emissiveIntensity:.2,flatShading:true}));
    wall.position.y=2.25; wall.castShadow=true; g.add(wall);
    // black silhouette (hand sign symbol)
    const pose = THEME.poses[poseIdx % THEME.poses.length];
    // use canvas to draw pose silhouette
    const cv=document.createElement('canvas'); cv.width=cv.height=256;
    const ctx=cv.getContext('2d');
    ctx.fillStyle='#111';
    ctx.font='140px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(pose.icon, 128, 140);
    const tex=new THREE.CanvasTexture(cv); tex.encoding=THREE.sRGBEncoding;
    const silh=new THREE.Mesh(new THREE.PlaneGeometry(3,3),
      new THREE.MeshBasicMaterial({map:tex,transparent:true}));
    silh.position.set(0,2.4,0.16); g.add(silh);
    addContactShadow(g,8,0.5);
    g.userData.action='pose';
    g.userData.isSetPiece=true;
    g.userData.poseIdx=poseIdx;
    g.userData.pose=pose;
    g.userData.hitH=4.5; g.userData.hitW=4; g.userData.hitD=0.3;
    g.userData.passable=true; // player passes through, just copies pose
    return g;
  }

  function buildFallingRock(lvl) {
    const g = new THREE.Group();
    const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,1),
      new THREE.MeshStandardMaterial({color:C('#403830'),roughness:.9,flatShading:true}));
    rock.position.y=1.2; rock.castShadow=true; g.add(rock); g.userData.rock=rock;
    // red ground telegraph marker
    const marker=new THREE.Mesh(new THREE.CircleGeometry(1.3,24),
      new THREE.MeshBasicMaterial({color:C('#ff0000'),transparent:true,opacity:.5,depthWrite:false}));
    marker.rotation.x=-Math.PI/2; marker.position.y=0.03; g.add(marker);
    g.userData.marker=marker;
    g.userData.action='dodge';
    g.userData.falling=true;
    g.userData.fallY=25;
    g.userData.fallDelay=0.8;
    g.userData.fallTimer=0;
    g.userData.hitH=2.4; g.userData.hitW=1.1; g.userData.hitD=1.1;
    rock.position.y=25;
    return g;
  }

  function buildMeteorShadow(lvl) {
    const g = new THREE.Group();
    // large red shadow circle telegraph
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.8,32),
      new THREE.MeshBasicMaterial({color:C('#ff0000'),transparent:true,opacity:.4,depthWrite:false}));
    shadow.rotation.x=-Math.PI/2; shadow.position.y=0.04; g.add(shadow);
    g.userData.shadowMarker=shadow;
    // meteor (starts high)
    const meteor=new THREE.Mesh(new THREE.IcosahedronGeometry(1.6,1),
      new THREE.MeshStandardMaterial({color:C('#402010'),emissive:C('#ff3000'),emissiveIntensity:.5,roughness:.8,flatShading:true}));
    meteor.position.y=40; g.add(meteor); g.userData.meteor=meteor;
    // fire trail sprite
    const trail=new THREE.Sprite(new THREE.SpriteMaterial({map:Textures.getParticle('#ff4000'),transparent:true,opacity:.7,blending:THREE.AdditiveBlending,fog:false}));
    trail.scale.setScalar(4); trail.position.y=40; g.add(trail); g.userData.trail=trail;
    g.userData.action='dodge';
    g.userData.meteorFall=true;
    g.userData.fallTimer=0;
    g.userData.fallDelay=1.0;
    g.userData.hitH=3; g.userData.hitW=1.6; g.userData.hitD=1.6;
    return g;
  }

  // ── Telegraph chevron ──────────────────────────────────────────────────────────
  function addChevron(g, dir, color, yBase=1.5) {
    const cv=document.createElement('canvas'); cv.width=cv.height=128;
    const ctx=cv.getContext('2d');
    ctx.strokeStyle=color; ctx.lineWidth=14; ctx.lineCap='round';
    if(dir==='up'){
      ctx.beginPath(); ctx.moveTo(30,80);ctx.lineTo(64,40);ctx.lineTo(98,80); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30,100);ctx.lineTo(64,60);ctx.lineTo(98,100); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(30,48);ctx.lineTo(64,88);ctx.lineTo(98,48); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30,28);ctx.lineTo(64,68);ctx.lineTo(98,28); ctx.stroke();
    }
    const tex=new THREE.CanvasTexture(cv);
    const chev=new THREE.Mesh(new THREE.PlaneGeometry(1,1),
      new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.9,depthWrite:false,fog:false}));
    chev.position.set(0, dir==='up'?1.8:0.5, 0.5);
    g.add(chev);
    g.userData.chevron=chev;
  }

  // ── Pool management ──────────────────────────────────────────────────────────
  function getFromPool(type, lvl, extra) {
    // Build fresh each spawn (pooling by type would need reset — keep simple & correct)
    let g;
    switch(type){
      case 'jump':  g=buildHurdle(lvl); break;
      case 'duck':  g=buildOverheadBar(lvl); break;
      case 'block': g=buildBlocker(lvl); break;
      case 'moving':g=buildMovingHazard(lvl); break;
      case 'smashWall': g=buildSmashWall(lvl); break;
      case 'pushCart':  g=buildPushCart(lvl); break;
      case 'poseWall':  g=buildPoseWall(lvl, extra||0); break;
      case 'fallingRock': g=buildFallingRock(lvl); break;
      case 'meteorShadow':g=buildMeteorShadow(lvl); break;
      default: g=buildHurdle(lvl);
    }
    return g;
  }

  // ── Spawner ──────────────────────────────────────────────────────────────────
  function reset(lvl, playerZ) {
    // clear all
    active.forEach(o => scene.remove(o.group));
    active = [];
    spawnZ = playerZ - 60;
    lastPattern = -1;
    setPieceCooldown = 60;    // wait before first set piece
    poseWallCooldown = 0;
    poseCounter = 0;
  }

  let poseCounter = 0;

  function spawnObstacle(type, lane, z, lvl, extra) {
    const g = getFromPool(type, lvl, extra);
    g.position.set(LANES[lane] || 0, 0, z);
    if(type==='smashWall'||type==='pushCart'||(type==='poseWall')) g.position.x=0; // full width
    scene.add(g);
    const obs = {
      group: g,
      type: type,
      lane: lane,
      z: z,
      action: g.userData.action,
      data: g.userData,
      hit: false,
      passed: false,
      done: false,
    };
    active.push(obs);
    return obs;
  }

  function spawnPattern(lvl, playerZ) {
    // choose a pattern (no repeat)
    const patterns = lvl.patterns;
    if(!patterns || patterns.length===0) return;
    let idx;
    do { idx = Math.floor(Math.random()*patterns.length); }
    while(idx===lastPattern && patterns.length>1);
    lastPattern = idx;
    const pat = patterns[idx];

    if(pat.setPiece) {
      // set piece
      if(setPieceCooldown<=0){
        spawnObstacle(pat.setPiece, 1, spawnZ, lvl);
        setPieceCooldown = 250 / (lvl.speedStart||16); // ~seconds
        spawnZ -= 45; // breathing room
        return;
      }
    }

    // spawn rows
    const rows = pat.rows;
    rows.forEach((row, ri) => {
      const rowZ = spawnZ - (ri * (pat.gap||0));
      // guarantee at least one free lane
      let free = row.some(cell => cell==='free');
      row.forEach((cell, lane) => {
        if(cell==='free') return;
        let type = cell;
        if(cell==='block' && !free && lane===1) return; // ensure path
        // occasionally make blockers into moving hazards
        if(cell==='block' && lvl.setPieces && lvl.setPieces.includes('movingSnake') && Math.random()<0.25) type='moving';
        if(cell==='block' && lvl.setPieces && lvl.setPieces.includes('movingCrow') && Math.random()<0.2) type='moving';
        spawnObstacle(type, lane, rowZ, lvl);
      });
    });
    spawnZ -= lvl.obstaclGap;
  }

  function spawnPoseWall(lvl) {
    spawnObstacle('poseWall', 1, spawnZ, lvl, poseCounter++);
    spawnZ -= lvl.obstaclGap + 15;
  }

  function spawnMeteorField(lvl, playerZ) {
    // for level 9 - spawn a row of shadow markers with one safe lane
    const safeLane = Math.floor(Math.random()*3);
    for(let l=0;l<3;l++){
      if(l===safeLane) continue;
      spawnObstacle('meteorShadow', l, spawnZ, lvl);
    }
    spawnZ -= lvl.obstaclGap;
  }

  // ── Update ─────────────────────────────────────────────────────────────────────
  function update(dt, playerZ, player, lvl) {
    setPieceCooldown -= dt;
    poseWallCooldown -= dt;

    // spawn ahead
    const spawnAhead = playerZ - (player.speed * 5.5);
    while(spawnZ > spawnAhead) {
      if(lvl.scenery==='trainingGround' && poseWallCooldown<=0 && Math.random()<0.4){
        spawnPoseWall(lvl);
        poseWallCooldown = 3;
      } else if(lvl.scenery==='battlefield' && Math.random()<0.35){
        spawnMeteorField(lvl, playerZ);
      } else {
        spawnPattern(lvl, playerZ);
      }
    }

    const t = performance.now()*0.001;

    // update active obstacles
    for(let i=active.length-1; i>=0; i--){
      const obs = active[i];
      const g = obs.group;

      // moving hazard
      if(obs.data.moving && !obs.hit) {
        const d=obs.data;
        g.position.x += d.moveSpeed * d.moveDir * dt;
        const limit = LANES[2];
        if(g.position.x > limit || g.position.x < LANES[0]) d.moveDir *= -1;
        obs.lane = g.position.x < -1.3 ? 0 : g.position.x > 1.3 ? 2 : 1;
        if(d.roller) d.roller.rotation.x += dt*4;
      }

      // falling rock
      if(obs.data.falling && !obs.hit) {
        const d=obs.data;
        // trigger fall when player within ~30m
        if(playerZ - g.position.z < 30 && d.fallTimer===0) d.fallTimer=0.001;
        if(d.fallTimer>0){
          d.fallTimer+=dt;
          if(d.fallTimer>d.fallDelay){
            d.rock.position.y = Math.max(1.2, d.rock.position.y - 30*dt);
            if(d.marker) d.marker.material.opacity = Math.max(0, d.marker.material.opacity - dt);
          }
        }
      }

      // meteor fall
      if(obs.data.meteorFall && !obs.hit) {
        const d=obs.data;
        if(playerZ - g.position.z < 35 && d.fallTimer===0) d.fallTimer=0.001;
        if(d.fallTimer>0){
          d.fallTimer+=dt;
          if(d.shadowMarker) d.shadowMarker.material.opacity=0.4+Math.sin(t*10)*0.2;
          if(d.fallTimer>d.fallDelay){
            const ny = Math.max(1.6, d.meteor.position.y - 40*dt);
            d.meteor.position.y = ny;
            d.trail.position.y = ny+1;
            d.meteor.rotation.x+=dt*3; d.meteor.rotation.y+=dt*2;
            if(ny<=1.7 && !d.landed){
              d.landed=true;
              if(window.FX) FX.impact(g.position.x, 0, g.position.z, '#ff4000');
              if(window.Audio) Audio.bossHit();
            }
          }
        }
      }

      // pulse smash wall glow
      if(obs.type==='smashWall' && obs.data.glow){
        obs.data.glow.material.opacity=0.3+Math.sin(t*4)*0.15;
      }

      // remove when far behind
      if(g.position.z - playerZ > 25) {
        scene.remove(g);
        disposeObstacle(g);
        active.splice(i,1);
      }
    }
  }

  function disposeObstacle(g){
    g.traverse(o=>{
      if(o.geometry) o.geometry.dispose();
      if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose&&m.dispose());else o.material.dispose&&o.material.dispose();}
    });
  }

  // ── Collision check ──────────────────────────────────────────────────────────
  // player: {x, feetY, ducking, jumping, lane, z, eye}
  function checkCollisions(player) {
    const results = [];
    for(const obs of active){
      if(obs.hit || obs.done) continue;
      const g = obs.group;
      const dz = Math.abs(g.position.z - player.z);
      if(dz > 1.2) continue;

      // pose wall — trigger when crossed (passable)
      if(obs.type==='poseWall'){
        if(!obs.triggered && g.position.z > player.z-1.5){
          obs.triggered=true;
          results.push({obs, kind:'pose'});
        }
        continue;
      }

      // set pieces (smash/push) — trigger stop zone
      if(obs.type==='smashWall' && !obs.done){
        if(g.position.z > player.z - 6 && !obs.stopTriggered){
          obs.stopTriggered=true;
          results.push({obs, kind:'smashStart'});
        }
        continue;
      }
      if(obs.type==='pushCart' && !obs.done){
        if(g.position.z > player.z - 4 && !obs.stopTriggered){
          obs.stopTriggered=true;
          results.push({obs, kind:'pushStart'});
        }
        continue;
      }

      // lane check for lane-based obstacles
      const dx = Math.abs(g.position.x - player.x);
      if(dx > 1.3) continue;

      // action-based collision
      const d = obs.data;
      let collided = false;
      const feetY = player.feetY;
      const headY = feetY + (player.ducking ? 0.9 : 1.8);

      if(d.overhead){
        // duck obstacle: hit if head above bottom of bar
        if(headY > d.hitBottom) collided = true;
      } else if(obs.action==='jump'){
        // low hurdle: hit if feet below top
        if(feetY < d.hitH) collided = true;
      } else if(obs.action==='dodge'){
        // blocker / moving / falling: hit if in lane & not cleared
        if(obs.data.falling && obs.data.rock && obs.data.rock.position.y>3) collided=false;
        else if(obs.data.meteorFall && obs.data.meteor && obs.data.meteor.position.y>3) collided=false;
        else if(feetY < d.hitH) collided = true;
      }

      if(collided){
        obs.hit = true;
        results.push({obs, kind:'hit'});
      }
    }
    return results;
  }

  function getActive(){ return active; }

  function removeObstacle(obs){
    const i = active.indexOf(obs);
    if(i>=0){ scene.remove(obs.group); disposeObstacle(obs.group); active.splice(i,1); }
  }

  return { init, reset, update, checkCollisions, getActive, removeObstacle, spawnObstacle, LANES };
})();

window.Obstacles = Obstacles;

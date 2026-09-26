// ─── MAIN — state machine, game loop, collisions, levels, set pieces, boss ───
'use strict';

(function(){
  let renderer, scene, camera, clock, composer, bloomPass;
  const STATE = { MENU:'MENU', INTRO:'INTRO', PLAYING:'PLAYING', PAUSED:'PAUSED',
                  SETPIECE:'SETPIECE', LEVEL_COMPLETE:'LEVEL_COMPLETE',
                  BOSS:'BOSS', GAMEOVER:'GAMEOVER', WIN:'WIN' };
  const G = {
    state: STATE.MENU,
    levelIdx: 0,
    lvl: null,
    levelTime: 0,
    levelProgress: 0,
    hits: 0,
    speed: 14,
    // set piece
    setPiece: null,
    setPieceState: null,
    // boss
    boss: null,
    bossHealth: 1,
    bossRound: 1,
    bossState: 'idle',
    bossTimer: 0,
    bossAttacks: [],
    invuln: 0,
  };

  function C(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init(){
    const canvas = document.getElementById('c');
    renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, 0.1, 500);
    scene.add(camera);
    clock = new THREE.Clock();

    // realistic HDRI image-based lighting
    setupEnvMap();
    setupComposer();

    Audio.init();
    World.init(scene, renderer, camera);
    Obstacles.init(scene, G);
    Characters.init(scene, camera);
    Player.init(camera);
    FX.init(scene, camera);
    UI.init();

    bindInput();
    bindButtons();
    window.addEventListener('resize', onResize);

    // expose for debug
    window.app = { G, jumpToLevel, STATE, debug:{
      jumpToLevel, spawn:(t)=>Obstacles.spawnObstacle(t, 1, Player.state.z-30, G.lvl),
    }};

    animate();
  }

  // per-level HDRI for realistic image-based lighting (loaded once, cached)
  const HDRI_BY_SCENE = {
    konoha:'venice_sunset_1k.hdr', forestDeath:'quarry_01_1k.hdr', treeWalking:'venice_sunset_1k.hdr',
    trainingGround:'venice_sunset_1k.hdr', sandArena:'venice_sunset_1k.hdr', akatsukiHideout:'quarry_01_1k.hdr',
    bridge:'quarry_01_1k.hdr', destroyedKonoha:'quarry_01_1k.hdr', battlefield:'quarry_01_1k.hdr', valleyEnd:'quarry_01_1k.hdr',
  };
  let pmremGen, hdriCache={};
  function setupEnvMap(){
    pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileEquirectangularShader();
    // fallback neutral env immediately
    const envScene = new THREE.Scene();
    const envSky = new THREE.Mesh(new THREE.SphereGeometry(10,32,16),
      new THREE.MeshBasicMaterial({side:THREE.BackSide, color:C('#88aadd')}));
    envScene.add(envSky);
    scene.environment = pmremGen.fromScene(envScene, 0.04).texture;
    loadHDRI('venice_sunset_1k.hdr'); // preload day
  }
  function loadHDRI(file){
    if(hdriCache[file]){ scene.environment = hdriCache[file]; return; }
    new THREE.RGBELoader().load('js/hdri/'+file, (hdr)=>{
      const env = pmremGen.fromEquirectangular(hdr).texture;
      hdr.dispose();
      hdriCache[file] = env;
      scene.environment = env;
    });
  }

  function setupComposer(){
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 0.28, 0.5, 0.9);
    composer.addPass(bloomPass);
  }

  function onResize(){
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if(composer) composer.setSize(innerWidth, innerHeight);
    FX.resizeSpeedLines();
  }

  // ── Level management ──────────────────────────────────────────────────────────
  function startLevel(idx){
    G.levelIdx = idx;
    G.lvl = THEME.levels[idx];
    G.levelTime = 0;
    G.levelProgress = 0;
    G.hits = 0;
    G.speed = G.lvl.speedStart;

    Player.reset(G.lvl.speedStart);
    Obstacles.reset(G.lvl, Player.state.z);
    FX.reset();
    if(HDRI_BY_SCENE[G.lvl.scenery]) loadHDRI(HDRI_BY_SCENE[G.lvl.scenery]);
    World.applyLevel(G.lvl, Player.state);
    Characters.clearBoss();
    Characters.spawnCompanions(G.lvl);
    UI.hideBossBar();
    UI.setGuide(guideForLevel(G.lvl));

    // intro card
    G.state = STATE.INTRO;
    UI.showLevelIntro(G.lvl, idx, ()=>{
      if(G.lvl.isBoss){ startBoss(); }
      else { G.state = STATE.PLAYING; }
    });
  }

  function guideForLevel(lvl){
    let g = 'W=Jump  S=Duck  A/D=Dodge';
    if(lvl.allowedMoves.includes('smash')) g+='  Shift=Smash';
    else if(lvl.allowedMoves.includes('push')) g+='  Shift=Push';
    else if(lvl.allowedMoves.includes('boss')) g+='  Shift=Rasengan';
    return g;
  }

  function jumpToLevel(n){ startLevel(Math.max(0,Math.min(THEME.levels.length-1,n))); }

  function completeLevel(){
    Audio.levelUp();
    const stars = G.hits===0 ? 3 : G.hits<=3 ? 2 : 1;
    // celebration
    FX.celebrate(Player.state.x, 1, Player.state.z-6);
    FX.flash('#ffffff', 0.6);
    const nextIdx = G.levelIdx+1;
    const nextName = nextIdx < THEME.levels.length ? THEME.levels[nextIdx].name : null;
    G.state = STATE.LEVEL_COMPLETE;
    setTimeout(()=>{
      if(G.state===STATE.LEVEL_COMPLETE) UI.showLevelComplete(stars, nextName);
    }, 1200);
  }

  function nextLevel(){
    UI.hideAll();
    const nextIdx = G.levelIdx+1;
    if(nextIdx >= THEME.levels.length){ winGame(); return; }
    startLevel(nextIdx);
  }

  function winGame(){
    G.state = STATE.WIN;
    FX.celebrate(Player.state.x, 1, Player.state.z-5);
    UI.show('winScreen');
  }

  function gameOver(){
    // Unlimited lives per house style — this is only for boss defeat scenario fallback
    G.state = STATE.GAMEOVER;
    UI.show('gameOverScreen');
  }

  // ── Boss fight ────────────────────────────────────────────────────────────────
  function startBoss(){
    G.state = STATE.BOSS;
    G.boss = Characters.spawnBoss();
    G.bossHealth = 1;
    G.bossRound = 1;
    G.bossState = 'attacking';
    G.bossTimer = 0;
    G.bossAttacks = [];
    UI.showBossBar(G.lvl.bossName);
    UI.updateBossBar(1, 'ROUND 1');
    UI.shout('SASUKE!');
  }

  function updateBoss(dt){
    G.bossTimer += dt;
    // world still scrolls slowly for effect
    G.speed = 12;
    Player.setSpeed(G.speed);

    // spawn attacks based on round
    const round = G.bossRound;
    if(G.bossState==='attacking'){
      // attack cadence
      if(G.bossTimer > 1.5){
        G.bossTimer = 0;
        spawnBossAttack(round);
      }
    }

    // update boss attacks (projectiles into lanes)
    for(let i=G.bossAttacks.length-1;i>=0;i--){
      const a=G.bossAttacks[i];
      a.timer+=dt;
      if(a.phase==='telegraph'){
        a.marker.material.opacity=0.4+Math.sin(a.timer*12)*0.2;
        if(a.timer>a.delay){
          a.phase='fire'; a.timer=0;
          scene.remove(a.marker);
        }
      } else if(a.phase==='fire'){
        a.mesh.visible=true;
        a.mesh.position.z += a.speed*dt;
        a.mesh.rotation.x+=dt*8; a.mesh.rotation.y+=dt*5;
        // hit check
        if(Math.abs(a.mesh.position.z - Player.state.z) < 1.2){
          const dx=Math.abs(a.mesh.position.x - Player.state.x);
          const feetY=Player.state.feetY;
          const headY=feetY+(Player.state.ducking?0.9:1.8);
          let hit=false;
          if(a.attackType==='low' && dx<1.2 && feetY<1.5) hit=true;       // must jump
          if(a.attackType==='high' && dx<1.2 && headY>1.2) hit=true;      // must duck
          if(a.attackType==='lane' && dx<1.2) hit=true;                   // must dodge
          if(hit && G.invuln<=0){ playerHit(); }
          if(a.mesh.position.z > Player.state.z){
            cleanupAttack(a); G.bossAttacks.splice(i,1);
          }
        }
        if(a.mesh.position.z > Player.state.z + 5){
          cleanupAttack(a); G.bossAttacks.splice(i,1);
        }
      }
    }

    // Round 3 = final blow (rapid punch)
    if(round===3 && G.bossState==='finalBlow'){
      // handled by shift key
    }
  }

  function spawnBossAttack(round){
    const boss=G.boss;
    if(!boss) return;
    const lane = Math.floor(Math.random()*3);
    let attackType, color, action;
    if(round===1){
      // Amaterasu black fire — dodge (lane)
      attackType='lane'; color='#1a1a1a'; action='dodge';
    } else if(round===2){
      // Susanoo arrows — duck or jump
      attackType = Math.random()<0.5 ? 'high' : 'low';
      color='#8040cc'; action = attackType==='high'?'duck':'jump';
    } else {
      attackType = ['lane','high','low'][Math.floor(Math.random()*3)];
      color='#ff2000'; action = attackType==='lane'?'dodge':attackType==='high'?'duck':'jump';
    }

    // telegraph marker on ground
    const marker=new THREE.Mesh(new THREE.CircleGeometry(1,24),
      new THREE.MeshBasicMaterial({color:C('#ff0000'),transparent:true,opacity:0.4,depthWrite:false}));
    marker.rotation.x=-Math.PI/2;
    marker.position.set(Obstacles.LANES[lane], 0.05, Player.state.z-8);
    scene.add(marker);

    // projectile
    let geo, y;
    if(attackType==='high'){ geo=new THREE.ConeGeometry(0.3,1.2,6); y=1.3; }
    else if(attackType==='low'){ geo=new THREE.SphereGeometry(0.5,8,6); y=0.5; }
    else { geo=new THREE.IcosahedronGeometry(0.6,1); y=1; }
    const mesh=new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color:C(color), emissive:C(color), emissiveIntensity:0.7, flatShading:true}));
    mesh.position.set(Obstacles.LANES[lane], y, boss.position.z);
    mesh.visible=false;
    scene.add(mesh);
    // glow
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:Textures.getParticle(color),transparent:true,opacity:0.6,blending:THREE.AdditiveBlending,fog:false}));
    glow.scale.setScalar(2); mesh.add(glow);

    G.bossAttacks.push({
      marker, mesh, lane, attackType, action,
      phase:'telegraph', timer:0, delay:0.8,
      speed: (Player.state.z - boss.position.z) / 1.2 * -1 + 8, // travels toward player
    });
    UI.showMoveCue(action);
    // telegraph the required move
  }

  function cleanupAttack(a){
    if(a.marker){ scene.remove(a.marker); a.marker.geometry.dispose(); a.marker.material.dispose(); }
    if(a.mesh){ scene.remove(a.mesh); a.mesh.geometry.dispose(); a.mesh.material.dispose(); }
  }

  function bossTakeDamage(amount){
    G.bossHealth = Math.max(0, G.bossHealth - amount);
    Audio.bossHit();
    Characters.punch();
    FX.flash('#ff3333', 0.3);
    Player.addTrauma(0.3);
    UI.updateBossBar(G.bossHealth, 'ROUND '+G.bossRound);

    // round transitions (integer thresholds — avoid float skip)
    if(G.bossHealth <= 0){
      finalBlow();
    } else if(G.bossRound===1 && G.bossHealth <= 0.66){
      G.bossRound=2; UI.updateBossBar(G.bossHealth,'ROUND 2'); UI.shout('ROUND 2!');
    } else if(G.bossRound===2 && G.bossHealth <= 0.33){
      G.bossRound=3; UI.updateBossBar(G.bossHealth,'FINAL ROUND'); UI.shout('MEGA PUNCH TIME!');
      G.bossState='finalBlow';
    }
  }

  function finalBlow(){
    G.bossState='defeated';
    Audio.finalBlow();
    FX.flash('#ffffff', 1);
    FX.chakraBurst(0, 1.5, G.boss.position.z);
    FX.shatter(0, 1.5, G.boss.position.z, '#8040cc');
    Player.addTrauma(0.7);
    Player.addFovPunch(10);
    UI.shout('RASENGAN!');
    UI.hideBossBar();
    // clear attacks
    G.bossAttacks.forEach(cleanupAttack); G.bossAttacks=[];
    setTimeout(()=>{ Characters.clearBoss(); completeLevel(); }, 1500);
  }

  // ── Set pieces (smash wall, push cart) ───────────────────────────────────────
  function startSmashWall(obs){
    G.state=STATE.SETPIECE;
    G.setPiece=obs;
    G.setPieceState={type:'smash', stage:0, cartPushed:0};
    Player.lock(true);
    Player.setSpeed(0);
    UI.setGuide('SMASH! Press SHIFT ×3');
    UI.shout('SMASH IT!');
  }
  function smashHit(){
    if(!G.setPiece) return;
    const st=G.setPieceState;
    st.stage++;
    const obs=G.setPiece;
    Characters.punch();
    Player.addPunchZ(-0.3);
    if(st.stage===1){
      obs.data.crack.material.map=Textures.getCrackDecal(1);
      obs.data.crack.material.opacity=0.9;
      Audio.smash1(); Player.addTrauma(0.3); Player.addFovPunch(3);
      FX.shockwave(obs.group.position.x, 2, obs.group.position.z+0.5,'#ff6b1a');
    } else if(st.stage===2){
      obs.data.crack.material.map=Textures.getCrackDecal(2);
      Audio.smash2(); Player.addTrauma(0.45); Player.addFovPunch(5);
      FX.shockwave(obs.group.position.x, 2, obs.group.position.z+0.5,'#ff9940');
    } else if(st.stage>=3){
      Audio.smash3(); Player.addTrauma(0.7); Player.addFovPunch(10);
      FX.shatter(obs.group.position.x, 2, obs.group.position.z, G.lvl.scenery==='sandArena'?'#c8a040':'#7a6040');
      FX.flash('#ffffff', 0.8);
      Obstacles.removeObstacle(obs);
      G.setPiece=null; G.setPieceState=null;
      endSetPiece();
    }
  }

  function startPushCart(obs){
    G.state=STATE.SETPIECE;
    G.setPiece=obs;
    G.setPieceState={type:'push', pushed:0, target:45, timer:0};
    Player.lock(true);
    UI.setGuide('HOLD SHIFT to push!');
    UI.shout('PUSH!');
    Audio.push();
  }
  function updatePushCart(dt, shiftHeld){
    if(!G.setPiece) return;
    const st=G.setPieceState;
    st.timer+=dt;
    if(shiftHeld){
      const pushSpd=10;
      st.pushed += pushSpd*dt;
      G.setPiece.group.position.z -= pushSpd*dt;
      Player.state.z -= pushSpd*dt;
      // wheels spin
      G.setPiece.data.wheels.forEach(w=>w.rotation.x -= pushSpd*dt/0.4);
      // camera bob from pushing
      Player.addTrauma(0.02);
      if(Math.random()<0.1) FX.dustPuff(G.setPiece.group.position.x+(Math.random()-.5)*1.5, 0, G.setPiece.group.position.z+1);
    }
    // done
    if(st.pushed >= st.target || st.timer > 12){
      Obstacles.removeObstacle(G.setPiece);
      G.setPiece=null; G.setPieceState=null;
      UI.shoutRandom('excellent');
      endSetPiece();
    }
  }

  function endSetPiece(){
    Player.lock(false);
    Player.setSpeed(G.speed);
    UI.setGuide(guideForLevel(G.lvl));
    if(G.lvl.isBoss) G.state=STATE.BOSS;
    else G.state=STATE.PLAYING;
  }

  // ── Player hit ────────────────────────────────────────────────────────────────
  function playerHit(){
    if(G.invuln>0) return;
    G.hits++;
    G.invuln=1.2;
    Audio.hit();
    Player.addTrauma(0.5);
    Player.addFovPunch(-4);
    FX.vignette(true);
    FX.flash('#ff2020', 0.5);
  }

  // ── Collision handling ────────────────────────────────────────────────────────
  function handleCollisions(){
    const results = Obstacles.checkCollisions(Player.state);
    for(const r of results){
      if(r.kind==='hit'){
        if(G.invuln<=0){
          playerHit();
          // knock obstacle away
          const g=r.obs.group;
          FX.impact(g.position.x, 0.5, g.position.z, '#cc4400');
        }
      } else if(r.kind==='pose'){
        UI.showPose(r.obs.data.pose);
        UI.shoutRandom('nice');
        Audio.jump();
      } else if(r.kind==='smashStart'){
        startSmashWall(r.obs);
      } else if(r.kind==='pushStart'){
        startPushCart(r.obs);
      }
    }
  }

  // ── Move cue prediction ──────────────────────────────────────────────────────
  let lastCueZ = 0;
  function updateMoveCues(){
    // find nearest upcoming obstacle ~1s ahead
    const lookAhead = Player.state.z - Player.state.speed*1.0;
    let nearest=null, nearestDz=999;
    for(const obs of Obstacles.getActive()){
      if(obs.passed || obs.hit) continue;
      const dz = obs.group.position.z - lookAhead;
      if(dz > -3 && dz < 6){
        const d = Math.abs(obs.group.position.z - lookAhead);
        if(d < nearestDz){ nearestDz=d; nearest=obs; }
      }
    }
    if(nearest && Math.abs(nearest.group.position.z - lastCueZ) > 3){
      let cue = nearest.action;
      if(cue==='dodge'){
        cue = nearest.group.position.x < 0 ? 'dodgeR' : 'dodgeL';
      }
      if(nearest.action!=='pose' && nearest.action!=='smash' && nearest.action!=='push'){
        UI.showMoveCue(cue);
        lastCueZ = nearest.group.position.z;
      }
    }
  }

  // ── Input ────────────────────────────────────────────────────────────────────
  let shiftHeld=false;
  let finalBlowPunches=0;
  function bindInput(){
    document.addEventListener('keydown', (e)=>{
      if(e.repeat && e.code!=='ShiftLeft' && e.code!=='ShiftRight') return;
      switch(e.code){
        case 'ArrowLeft': case 'KeyA': Player.moveLane(-1); break;
        case 'ArrowRight':case 'KeyD': Player.moveLane(1); break;
        case 'ArrowUp': case 'KeyW': case 'Space': Player.jump(); break;
        case 'ArrowDown':case 'KeyS': Player.duck(); break;
        case 'ShiftLeft':case 'ShiftRight': onShift(); shiftHeld=true; break;
        case 'KeyP': case 'Escape': togglePause(); break;
        case 'KeyM': Audio.toggleMute(); break;
      }
    });
    document.addEventListener('keyup',(e)=>{
      if(e.code==='ShiftLeft'||e.code==='ShiftRight') shiftHeld=false;
    });
  }

  function onShift(){
    if(G.state===STATE.SETPIECE && G.setPieceState){
      if(G.setPieceState.type==='smash') smashHit();
      // push handled by held state
    } else if(G.state===STATE.BOSS){
      if(G.bossState==='finalBlow'){
        // rapid punch to drain
        Characters.punch();
        Characters.showRasengan(1);
        Audio.chidori();
        bossTakeDamage(0.06);
        Player.addFovPunch(2);
        FX.chakraBurst(0,1.5,G.boss.position.z);
      } else {
        // normal jutsu attack — hit boss when close
        Characters.punch();
        Characters.showRasengan(1);
        Audio.rasengan();
        bossTakeDamage(0.04);
      }
      setTimeout(()=>Characters.showRasengan(0), 400);
    }
  }

  function bindButtons(){
    const bind=(id,fn)=>{ const el=document.getElementById(id); if(el) el.addEventListener('click',fn); };
    bind('playBtn', ()=>{ Audio.init(); UI.hideAll(); startLevel(0); });
    bind('resumeBtn', togglePause);
    bind('restartBtn', ()=>{ UI.hideAll(); startLevel(G.levelIdx); });
    bind('nextLevelBtn', nextLevel);
    bind('goRestartBtn', ()=>{ UI.hideAll(); startLevel(G.levelIdx); });
    bind('winRestartBtn', ()=>{ UI.hideAll(); startLevel(0); });
    bind('pauseTopBtn', togglePause);
    bind('muteBtn', ()=>{ const m=Audio.toggleMute(); document.getElementById('muteBtn').textContent=m?'🔇':'🔊'; });

    // mobile
    const mb=(id,down,up)=>{
      const el=document.getElementById(id); if(!el) return;
      el.addEventListener('pointerdown',(e)=>{e.preventDefault();down&&down();});
      if(up) el.addEventListener('pointerup',(e)=>{e.preventDefault();up();});
    };
    mb('mLeft', ()=>Player.moveLane(-1));
    mb('mRight',()=>Player.moveLane(1));
    mb('mJump', ()=>Player.jump());
    mb('mDuck', ()=>Player.duck());
    mb('mJutsu', ()=>{ onShift(); shiftHeld=true; }, ()=>{ shiftHeld=false; });

    // swipe
    let tsx=0,tsy=0;
    document.addEventListener('touchstart',(e)=>{const t=e.touches[0];tsx=t.clientX;tsy=t.clientY;},{passive:true});
    document.addEventListener('touchend',(e)=>{
      const t=e.changedTouches[0];const dx=t.clientX-tsx,dy=t.clientY-tsy;
      if(Math.abs(dx)>Math.abs(dy)){ if(Math.abs(dx)>30) Player.moveLane(dx>0?1:-1); }
      else { if(dy<-30) Player.jump(); else if(dy>30) Player.duck(); }
    },{passive:true});
  }

  function togglePause(){
    if(G.state===STATE.PLAYING||G.state===STATE.BOSS||G.state===STATE.SETPIECE){
      G._prevState=G.state; G.state=STATE.PAUSED; UI.show('pauseScreen');
    } else if(G.state===STATE.PAUSED){
      UI.hide('pauseScreen'); G.state=G._prevState||STATE.PLAYING;
    }
  }

  // ── Main loop ────────────────────────────────────────────────────────────────
  function animate(){
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    try {
      step(dt);
    } catch(e) {
      console.error('loop error:', e);
    }

    if(composer) composer.render();
    else renderer.render(scene, camera);
  }

  function step(dt){
    const s=G.state;

    if(s===STATE.PLAYING || s===STATE.BOSS || s===STATE.SETPIECE){
      // speed ramp
      if(s===STATE.PLAYING){
        G.levelTime += dt;
        G.levelProgress = Math.min(1, G.levelTime / G.lvl.duration);
        G.speed = G.lvl.speedStart + (G.lvl.speedEnd - G.lvl.speedStart) * G.levelProgress;
        Player.setSpeed(G.speed);
      }

      // invuln timer
      if(G.invuln>0) G.invuln-=dt;

      // update systems
      if(s!==STATE.SETPIECE){
        Player.update(dt, G.speed);
      } else {
        Player.update(dt, 0);
        if(G.setPieceState && G.setPieceState.type==='push') updatePushCart(dt, shiftHeld);
      }

      World.update(dt, Player.state.z);
      Characters.update(dt, Player.state);
      FX.update(dt);

      if(s===STATE.PLAYING){
        Obstacles.update(dt, Player.state.z, Player.state, G.lvl);
        handleCollisions();
        updateMoveCues();
        // level complete check
        if(G.levelProgress >= 1){ completeLevel(); }
      } else if(s===STATE.BOSS){
        updateBoss(dt);
      }

      // UI updates
      UI.updateHUD(G.levelIdx, G.levelProgress, G.speed);
      UI.updateMoveCue(dt);
      UI.updateShout(dt);
      UI.updatePose(dt);
      FX.updateSpeedLines(G.speed);

    } else if(s===STATE.INTRO || s===STATE.LEVEL_COMPLETE){
      // keep world & characters animating during cinematic
      World.update(dt, Player.state.z);
      Characters.update(dt, Player.state);
      FX.update(dt);
      UI.updateShout(dt);
    } else if(s===STATE.MENU){
      // idle camera drift on menu
      World.update(dt, Player.state.z);
      camera.position.set(Math.sin(clock.elapsedTime*0.2)*2, 2, 5);
      camera.lookAt(0,1.5,-10);
    }
  }

  // menu preview world
  window.addEventListener('DOMContentLoaded', ()=>{
    init();
    // load a preview world for menu
    G.lvl = THEME.levels[0];
    Player.reset(14);
    World.applyLevel(THEME.levels[0], Player.state);
    Characters.spawnCompanions(THEME.levels[0]);
  });

})();

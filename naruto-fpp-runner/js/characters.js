// ─── CHARACTERS — Naruto cast + FPP hands (procedural, no models) ────────────
'use strict';

const Characters = (() => {
  let scene, camera;
  let companions = [];
  let fppHands = null;
  let boss = null;
  let heroGLTF = null;       // preloaded realistic rigged model
  let heroReady = false;

  function C(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }

  function init(_scene, _camera){
    scene = _scene;
    camera = _camera;
    buildFppHands();
    preloadHeroModel();
  }

  // Preload the realistic rigged character once
  function preloadHeroModel(){
    new THREE.GLTFLoader().load('js/models/soldier.glb', (gltf)=>{
      heroGLTF = gltf;
      heroReady = true;
    });
  }

  // Ninja re-theme presets (applied to the realistic rigged model)
  const NINJA_THEMES = {
    naruto: { body:'#ff7a1a', legs:'#20386a', accent:'#20386a', hair:'#ffd21a', band:'#20386a' },
    sakura: { body:'#d5486a', legs:'#7a2a44', accent:'#7a2a44', hair:'#ff9db0', band:'#c02040' },
    sasuke: { body:'#33405c', legs:'#1a1c26', accent:'#1a1c26', hair:'#20222c', band:'#33405c' },
    iruka:  { body:'#2f6a3e', legs:'#1a3a2a', accent:'#1a3a2a', hair:'#3a2818', band:'#204030' },
  };

  // Build a realistic rigged ninja companion from the loaded model
  function makeRealNinja(themeName){
    if(!heroReady) return null;
    const theme = NINJA_THEMES[themeName] || NINJA_THEMES.naruto;
    const g = new THREE.Group();
    const model = THREE.SkeletonUtils.clone(heroGLTF.scene);
    // re-theme materials (clone so instances differ)
    let idx=0;
    model.traverse(o=>{
      if(o.isMesh){
        o.castShadow=true; o.receiveShadow=true;
        o.material=o.material.clone();
        // tint: torso/upper = body color, lower = legs color
        const col = (o.name && /leg|pant|boot|lower/i.test(o.name)) ? theme.legs : theme.body;
        o.material.color = C(col);
        o.material.envMapIntensity = 1.0;
        o.material.metalness = 0.0;
        o.material.roughness = 0.85;
        idx++;
      }
    });
    g.add(model);
    // add spiky hair + headband on top (approx head height for this model ~1.7)
    const hairMat=new THREE.MeshStandardMaterial({color:C(theme.hair),roughness:0.8});
    const headY = 1.62;
    for(let i=0;i<14;i++){
      const a=(i/14)*Math.PI*2;
      const spike=new THREE.Mesh(new THREE.ConeGeometry(0.035,0.14,4),hairMat);
      spike.position.set(Math.cos(a)*0.1, headY+0.06, Math.sin(a)*0.09);
      spike.rotation.z=-Math.cos(a)*0.8; spike.rotation.x=Math.sin(a)*0.8;
      spike.castShadow=true; model.getObjectByProperty('type','Bone'); g.add(spike);
    }
    // headband
    const band=new THREE.Mesh(new THREE.CylinderGeometry(0.115,0.115,0.05,14,1,true),
      new THREE.MeshStandardMaterial({color:C(theme.band),roughness:0.5,metalness:0.1,side:THREE.DoubleSide}));
    band.position.y=headY; g.add(band);
    const plate=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.015,12),
      new THREE.MeshStandardMaterial({color:C('#b8c4d0'),metalness:0.7,roughness:0.35}));
    plate.rotation.x=Math.PI/2; plate.position.set(0,headY,0.11); g.add(plate);

    // animation
    const mixer=new THREE.AnimationMixer(model);
    const clips=heroGLTF.animations;
    const run=clips.find(c=>/run/i.test(c.name))||clips.find(c=>/walk/i.test(c.name))||clips[0];
    if(run) mixer.clipAction(run).play();
    g.userData.mixer=mixer;
    return g;
  }

  // ── Generic stylized ninja builder ────────────────────────────────────────────
  // opts: { bodyColor, hairColor, accentColor, headband, scale }
  function buildNinja(opts){
    const g = new THREE.Group();
    const s = opts.scale || 1;
    const skinMat = new THREE.MeshStandardMaterial({color:C('#f0c090'),roughness:.7,flatShading:true});
    const bodyMat = new THREE.MeshStandardMaterial({color:C(opts.bodyColor||'#ff6b1a'),roughness:.7,flatShading:true});
    const accentMat= new THREE.MeshStandardMaterial({color:C(opts.accentColor||'#1a3a8b'),roughness:.7,flatShading:true});
    const hairMat = new THREE.MeshStandardMaterial({color:C(opts.hairColor||'#ffd020'),roughness:.8,flatShading:true});

    // torso
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32,0.5,4,8), bodyMat);
    torso.position.y=1.15; torso.castShadow=true; g.add(torso);
    // jacket accent stripe
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(0.66,0.15,0.45), accentMat);
    stripe.position.y=1.25; g.add(stripe);
    // head
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.28,10,8), skinMat);
    head.position.y=1.75; head.castShadow=true; g.add(head);
    // hair (spiky)
    const hairBase=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6), hairMat);
    hairBase.position.y=1.82; hairBase.scale.y=0.7; g.add(hairBase);
    for(let i=0;i<8;i++){
      const spike=new THREE.Mesh(new THREE.ConeGeometry(0.08,0.25,4), hairMat);
      const a=i/8*Math.PI*2;
      spike.position.set(Math.cos(a)*0.22,1.98,Math.sin(a)*0.22);
      spike.rotation.z=Math.cos(a)*0.4; spike.rotation.x=-Math.sin(a)*0.4;
      g.add(spike);
    }
    // headband
    if(opts.headband!==false){
      const band=new THREE.Mesh(new THREE.CylinderGeometry(0.29,0.29,0.12,10,1,true),
        new THREE.MeshStandardMaterial({color:C('#1a3050'),roughness:.6,flatShading:true,side:THREE.DoubleSide}));
      band.position.y=1.92; g.add(band);
      const plate=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.1),
        new THREE.MeshStandardMaterial({map:Textures.getHeadbandSpiral(),roughness:.4,metalness:.3}));
      plate.position.set(0,1.92,0.29); g.add(plate);
    }
    // eyes
    for(let sx=-1;sx<=1;sx+=2){
      const eye=new THREE.Mesh(new THREE.SphereGeometry(0.05,6,4),
        new THREE.MeshStandardMaterial({color:C('#3060a0'),emissive:C('#102040'),emissiveIntensity:.2}));
      eye.position.set(sx*0.11,1.76,0.25); g.add(eye);
    }
    // arms (pivot at shoulder)
    g.userData.arms=[];
    for(let sx=-1;sx<=1;sx+=2){
      const armPivot=new THREE.Group();
      armPivot.position.set(sx*0.36,1.4,0);
      const arm=new THREE.Mesh(new THREE.CapsuleGeometry(0.1,0.5,4,6), bodyMat);
      arm.position.y=-0.3; arm.castShadow=true; armPivot.add(arm);
      const hand=new THREE.Mesh(new THREE.SphereGeometry(0.11,6,5), skinMat);
      hand.position.y=-0.6; armPivot.add(hand);
      g.add(armPivot);
      g.userData.arms.push({pivot:armPivot, side:sx});
    }
    // legs (pivot at hip)
    g.userData.legs=[];
    for(let sx=-1;sx<=1;sx+=2){
      const legPivot=new THREE.Group();
      legPivot.position.set(sx*0.16,0.85,0);
      const leg=new THREE.Mesh(new THREE.CapsuleGeometry(0.12,0.55,4,6), accentMat);
      leg.position.y=-0.35; leg.castShadow=true; legPivot.add(leg);
      const foot=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.1,0.3),
        new THREE.MeshStandardMaterial({color:C('#202020'),roughness:.8,flatShading:true}));
      foot.position.set(0,-0.68,0.08); legPivot.add(foot);
      g.add(legPivot);
      g.userData.legs.push({pivot:legPivot, side:sx});
    }
    g.scale.setScalar(s);
    return g;
  }

  // ── Specific characters ──────────────────────────────────────────────────────
  function makeNaruto(){ return buildNinja({bodyColor:'#ff6b1a',accentColor:'#1a3a8b',hairColor:'#ffd020'}); }
  function makeSakura(){ return buildNinja({bodyColor:'#cc3355',accentColor:'#992244',hairColor:'#ff9db0'}); }
  function makeSasuke(){ return buildNinja({bodyColor:'#2a3a5a',accentColor:'#1a1a2a',hairColor:'#202028'}); }
  function makeIruka(){ return buildNinja({bodyColor:'#2a5a3a',accentColor:'#1a3a2a',hairColor:'#3a2818'}); }

  // ── FPP hands (Naruto's — orange sleeves + chakra) ───────────────────────────
  function buildFppHands(){
    fppHands = new THREE.Group();
    const sleeveMat=new THREE.MeshStandardMaterial({color:C('#ff6b1a'),roughness:.7,flatShading:true});
    const handMat=new THREE.MeshStandardMaterial({color:C('#f0c090'),roughness:.7,flatShading:true});
    fppHands.userData.hands=[];
    for(let sx=-1;sx<=1;sx+=2){
      const handGroup=new THREE.Group();
      const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(0.07,0.3,4,6), sleeveMat);
      sleeve.rotation.x=Math.PI/2.5; sleeve.position.z=-0.12; handGroup.add(sleeve);
      // blue wrist wrap
      const wrap=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,0.09,8),
        new THREE.MeshStandardMaterial({color:C('#1a3a8b'),roughness:.6,flatShading:true}));
      wrap.rotation.x=Math.PI/2.5; wrap.position.set(0,0.04,0.02); handGroup.add(wrap);
      // fist
      const fist=new THREE.Mesh(new THREE.SphereGeometry(0.082,7,6), handMat);
      fist.position.set(0,0.1,0.12); fist.scale.set(1,0.9,1.1); handGroup.add(fist);
      // knuckles
      for(let k=0;k<3;k++){
        const kn=new THREE.Mesh(new THREE.SphereGeometry(0.026,5,4), handMat);
        kn.position.set(-0.04+k*0.04,0.15,0.18); handGroup.add(kn);
      }
      handGroup.position.set(sx*0.32,-0.42,-0.85);
      fppHands.add(handGroup);
      fppHands.userData.hands.push({group:handGroup, side:sx, punchT:0});
    }
    // chakra glow sprite (hidden until jutsu)
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({
      map:Textures.getParticle('#00aaff'), transparent:true, opacity:0,
      blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false, fog:false}));
    glow.scale.setScalar(0.6); glow.position.set(0,-0.25,-0.7);
    fppHands.add(glow);
    fppHands.userData.chakraGlow=glow;
    // rasengan orb (hidden)
    const orb=new THREE.Mesh(new THREE.SphereGeometry(0.25,16,12),
      new THREE.MeshStandardMaterial({color:C('#40ccff'),emissive:C('#0088ff'),emissiveIntensity:1.5,transparent:true,opacity:0}));
    orb.position.set(0,-0.28,-0.75);
    fppHands.add(orb);
    fppHands.userData.rasenganOrb=orb;

    camera.add(fppHands);
    fppHands.renderOrder=1000;
    fppHands.traverse(o=>{if(o.material){o.material.depthTest=true;}});
  }

  // ── Spawn companions for a level ─────────────────────────────────────────────
  function spawnCompanions(lvl){
    clearCompanions();
    const spawns = {
      konoha:          [{maker:makeIruka, side:-1},{maker:makeSakura, side:1}],
      forestDeath:     [{maker:makeSakura, side:1}],
      treeWalking:     [{maker:makeSasuke, side:1}],
      trainingGround:  [{maker:makeIruka, side:-1},{maker:makeSakura, side:1}],
      sandArena:       [{maker:makeSakura, side:-1}],
      akatsukiHideout: [],
      bridge:          [{maker:makeSakura, side:1},{maker:makeSasuke, side:-1}],
      destroyedKonoha: [{maker:makeSakura, side:1}],
      battlefield:     [{maker:makeSasuke, side:1},{maker:makeSakura, side:-1}],
      valleyEnd:       [],
    };
    // map old makers to theme names
    const themeOf = (mk)=> mk===makeSakura?'sakura' : mk===makeSasuke?'sasuke' : mk===makeIruka?'iruka' : 'naruto';
    const list = spawns[lvl.scenery] || [];
    list.forEach(spec=>{
      let mesh = makeRealNinja(themeOf(spec.maker));  // realistic rigged ninja
      let real = !!mesh;
      if(!mesh) mesh = spec.maker();                   // fallback procedural if model not ready
      mesh.position.set(spec.side*3.5, 0, -8);
      mesh.rotation.y = Math.PI; // face away (running with player)
      scene.add(mesh);
      companions.push({mesh, side:spec.side, phase:Math.random()*Math.PI*2, baseX:spec.side*3.5, real});
    });
  }

  function clearCompanions(){
    companions.forEach(c=>{ scene.remove(c.mesh); disposeMesh(c.mesh); });
    companions=[];
  }

  // ── Boss (Sasuke) ────────────────────────────────────────────────────────────
  function spawnBoss(){
    boss = makeSasuke();
    boss.scale.setScalar(1.4);
    boss.position.set(0, 0, -14);
    boss.rotation.y = 0; // faces player
    // Susanoo aura (purple)
    const aura=new THREE.Mesh(new THREE.SphereGeometry(2.2,16,12),
      new THREE.MeshStandardMaterial({color:C('#8040cc'),emissive:C('#4020aa'),emissiveIntensity:.4,transparent:true,opacity:0.2,flatShading:true}));
    aura.position.y=1.5; boss.add(aura); boss.userData.aura=aura;
    // Sharingan eyes glow red
    boss.traverse(o=>{
      if(o.material && o.material.emissive && o.geometry && o.geometry.type==='SphereGeometry' && o.geometry.parameters.radius===0.05){
        o.material.color=C('#ff0000'); o.material.emissive=C('#cc0000'); o.material.emissiveIntensity=1;
      }
    });
    scene.add(boss);
    boss.userData.phase=0;
    return boss;
  }

  function clearBoss(){
    if(boss){ scene.remove(boss); disposeMesh(boss); boss=null; }
  }

  function getBoss(){ return boss; }

  // ── FPP hand actions ─────────────────────────────────────────────────────────
  function punch(){
    if(!fppHands) return;
    fppHands.userData.hands.forEach(h=>{ h.punchT=1; });
  }
  function showChakra(on){
    if(!fppHands) return;
    fppHands.userData.chakraGlow.userData.target = on ? 0.8 : 0;
  }
  function showRasengan(intensity){
    if(!fppHands) return;
    fppHands.userData.rasenganOrb.material.opacity = intensity;
    fppHands.userData.rasenganOrb.scale.setScalar(0.5 + intensity*0.8);
  }

  // ── Update ─────────────────────────────────────────────────────────────────────
  function update(dt, player){
    const t = performance.now()*0.001;

    // FPP hands sway + punch
    if(fppHands){
      const bob = player.grounded ? Math.sin(player.bobPhase*2)*0.02 : 0;
      fppHands.position.y = -0.02 + bob;
      fppHands.userData.hands.forEach(h=>{
        if(h.punchT>0){
          h.punchT=Math.max(0,h.punchT-dt*5);
          const p=h.punchT;
          h.group.position.z=-0.55 - (1-Math.abs(p*2-1))*0.35;
        } else {
          h.group.position.z += (-0.55 - h.group.position.z)*0.2;
        }
        // sway
        h.group.position.x = h.side*0.28 + Math.sin(player.bobPhase+h.side)*0.015;
      });
      // chakra glow lerp
      const glow=fppHands.userData.chakraGlow;
      const tgt=glow.userData.target||0;
      glow.material.opacity += (tgt-glow.material.opacity)*0.2;
      glow.material.rotation += dt*3;
      // rasengan spin
      const orb=fppHands.userData.rasenganOrb;
      if(orb.material.opacity>0.01){ orb.rotation.y+=dt*15; orb.rotation.x+=dt*8; }
    }

    // companions run cycle + follow player
    companions.forEach(c=>{
      c.phase += dt * player.speed * 0.5;
      const m=c.mesh;
      // stay ahead of player, matching z
      m.position.z = player.z - 6 + Math.sin(c.phase*0.3)*1.5;
      // lateral bob
      m.position.x = c.baseX + Math.sin(t*0.8+c.side)*0.3;
      if(c.real && m.userData.mixer){
        // realistic rigged model: drive skeletal run animation
        m.userData.mixer.update(dt * Math.max(0.6, player.speed/16));
        m.position.y = 0;
      } else {
        // procedural fallback run cycle
        m.position.y = Math.abs(Math.sin(c.phase))*0.08;
        if(m.userData.legs) m.userData.legs.forEach(l=>{ l.pivot.rotation.x=Math.sin(c.phase + (l.side>0?0:Math.PI))*0.7; });
        if(m.userData.arms) m.userData.arms.forEach(a=>{ a.pivot.rotation.x=Math.sin(c.phase + (a.side>0?Math.PI:0))*0.5; });
      }
    });

    // boss idle
    if(boss){
      boss.userData.phase += dt;
      boss.position.z = player.z - 14 + Math.sin(boss.userData.phase*0.5)*2;
      boss.position.y = Math.sin(boss.userData.phase*2)*0.1;
      if(boss.userData.aura){
        boss.userData.aura.material.opacity=0.2+Math.sin(t*3)*0.1;
        boss.userData.aura.rotation.y+=dt*0.5;
      }
    }
  }

  function disposeMesh(m){
    m.traverse(o=>{
      if(o.geometry) o.geometry.dispose();
      if(o.material){if(Array.isArray(o.material))o.material.forEach(mm=>mm.dispose&&mm.dispose());else o.material.dispose&&o.material.dispose();}
    });
  }

  return { init, spawnCompanions, clearCompanions, spawnBoss, clearBoss, getBoss,
           punch, showChakra, showRasengan, update, makeNaruto };
})();

window.Characters = Characters;

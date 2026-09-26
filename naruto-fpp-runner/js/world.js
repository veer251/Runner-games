// ─── WORLD — sky, fog, track streaming, 5-layer scenery ──────────────────────
'use strict';

const World = (() => {
  let scene, renderer, camera;
  let sky, skyMat, skyUniforms;
  let sunLight, rimLight, hemiLight;
  let fogColor = new THREE.Color();
  let trackSegments = [];
  let sceneryGroups = [];
  let bgLifeObjects = [];
  let currentLevel = null;
  let playerRef = null;

  const TRACK_SEG_LEN = 30;
  const TRACK_SEG_COUNT = 10;
  const TRACK_W = 9;

  // sun follows player every frame
  function init(_scene, _renderer, _camera) {
    scene = _scene;
    renderer = _renderer;
    camera = _camera;
    Textures.init(renderer);
    buildSky();
    buildLights();
  }

  // ── Sky dome ──────────────────────────────────────────────────────────────────
  function buildSky() {
    skyUniforms = {
      top:     { value: C('#2a6fd6') },
      mid:     { value: C('#8fd0ff') },
      horizon: { value: C('#ffe3c4') },
      sunDir:  { value: new THREE.Vector3(0.3,0.25,-1).normalize() },
      sunCol:  { value: C('#fff2c8') },
    };
    skyMat = new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader:`varying vec3 vDir;
        void main(){vDir=normalize(position);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`uniform vec3 top,mid,horizon,sunDir,sunCol; varying vec3 vDir;
        void main(){
          float h=clamp(vDir.y,-0.2,1.0);
          vec3 col=mix(horizon,mid,smoothstep(0.0,0.25,h));
          col=mix(col,top,smoothstep(0.25,0.9,h));
          float s=max(dot(normalize(vDir),sunDir),0.0);
          col+=sunCol*(pow(s,900.0)*3.5+pow(s,40.0)*0.4+pow(s,6.0)*0.15);
          gl_FragColor=vec4(col,1.0);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`,
    });
    sky = new THREE.Mesh(new THREE.SphereGeometry(450,32,16), skyMat);
    sky.renderOrder = -1000;
    scene.add(sky);
  }

  // ── Lights (fixed count — never add/remove at runtime) ───────────────────────
  function buildLights() {
    hemiLight = new THREE.HemisphereLight(C('#bfe3ff'), C('#6b8f4e'), 0.35);
    sunLight = new THREE.DirectionalLight(C('#fff1d6'), 2.0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048,2048);
    Object.assign(sunLight.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:160});
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
    rimLight = new THREE.DirectionalLight(C('#9fd4ff'), 0.5);
    rimLight.position.set(-25, 30, 15);
    scene.add(hemiLight, sunLight, sunLight.target, rimLight);
  }

  // ── Apply level theme ─────────────────────────────────────────────────────────
  function applyLevel(lvl, player) {
    currentLevel = lvl;
    playerRef = player;

    // sky colors
    const s = lvl.sky;
    const sd = new THREE.Vector3(...s.sunDir).normalize();
    skyUniforms.top.value.copy(C(s.top));
    skyUniforms.mid.value.copy(C(s.mid));
    skyUniforms.horizon.value.copy(C(s.horizon));
    skyUniforms.sunDir.value.copy(sd);
    skyUniforms.sunCol.value.copy(C(lvl.sunColor));

    // fog
    fogColor.copy(C(lvl.fogColor));
    scene.fog = new THREE.Fog(fogColor.clone(), lvl.fogNear, lvl.fogFar);

    // lights
    hemiLight.color.copy(C(lvl.hemiSky));
    hemiLight.groundColor.copy(C(lvl.hemiGnd));
    sunLight.color.copy(C(lvl.sunColor));
    renderer.toneMappingExposure = lvl.exposure || 1.0;

    // rebuild world
    clearWorld();
    buildTrack(lvl);
    buildScenery(lvl);
    buildBackgroundLife(lvl);
    buildLandmark(lvl);
  }

  function clearWorld() {
    trackSegments.forEach(g => { scene.remove(g); disposeGroup(g); });
    trackSegments = [];
    sceneryGroups.forEach(g => { scene.remove(g); disposeGroup(g); });
    sceneryGroups = [];
    bgLifeObjects.forEach(o => { scene.remove(o.mesh || o); });
    bgLifeObjects = [];
  }

  // ── Track segments (pool of 10) ───────────────────────────────────────────────
  function buildTrack(lvl) {
    const tex = Textures.get(lvl.trackTex || 'cobblestone');
    tex.repeat.set(3,3);

    for (let i=0; i<TRACK_SEG_COUNT; i++) {
      const g = new THREE.Group();
      // main road plane
      const roadGeo = new THREE.PlaneGeometry(TRACK_W, TRACK_SEG_LEN, 1, 6);
      const roadMat = new THREE.MeshStandardMaterial({
        map: tex, roughness: 0.9, flatShading: false,
        color: C(lvl.trackColor || '#c8a060'),
      });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI/2;
      road.receiveShadow = true;
      g.add(road);

      // curbs
      const curbMat = new THREE.MeshStandardMaterial({ color: C('#e0e0d0'), roughness:0.8, flatShading:true });
      [-TRACK_W/2-0.3, TRACK_W/2+0.3].forEach(cx => {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, TRACK_SEG_LEN), curbMat);
        curb.position.set(cx, 0.15, 0);
        curb.receiveShadow = true;
        g.add(curb);
      });

      // lane markings
      const lineMat = new THREE.MeshBasicMaterial({color: C('#ffffff'), transparent:true, opacity:0.4});
      [-2.6, 0, 2.6].forEach(lx => {
        for(let j=0; j<5; j++){
          const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 3), lineMat);
          line.rotation.x=-Math.PI/2; line.position.set(lx, 0.01, -TRACK_SEG_LEN/2+3+j*6);
          g.add(line);
        }
      });

      // ground extension (beyond track)
      const extGeo = new THREE.PlaneGeometry(80, TRACK_SEG_LEN, 20, 8);
      const extPos = extGeo.attributes.position;
      for(let v=0; v<extPos.count; v++){
        const x=extPos.getX(v), z=extPos.getZ(v);
        const dx=Math.max(0,Math.abs(x)-TRACK_W/2-1);
        extPos.setY(v, dx*0.10 + Math.sin(x*0.12)*1.1 + Math.cos(z*0.18)*0.8 + Math.sin((x+z)*0.08)*0.5);
      }
      extGeo.computeVertexNormals();
      const extMat = new THREE.MeshStandardMaterial({
        color: C(lvl.trackColor || '#c8a060'), roughness:0.95, flatShading:true,
        map: tex,
      });
      const ext = new THREE.Mesh(extGeo, extMat);
      ext.rotation.x=-Math.PI/2; ext.receiveShadow=true;
      g.add(ext);

      g.position.z = -i * TRACK_SEG_LEN;
      scene.add(g);
      trackSegments.push(g);
    }
  }

  // ── Scenery layers (L2 near rhythm + L3 mid) ──────────────────────────────────
  function buildScenery(lvl) {
    const sceneName = lvl.scenery || 'konoha';
    const builders = {
      konoha:          buildKonohaScenery,
      forestDeath:     buildForestScenery,
      treeWalking:     buildTreeWalkingScenery,
      trainingGround:  buildTrainingScenery,
      sandArena:       buildSandScenery,
      akatsukiHideout: buildAkatsukiScenery,
      bridge:          buildBridgeScenery,
      destroyedKonoha: buildDestroyedScenery,
      battlefield:     buildBattlefieldScenery,
      valleyEnd:       buildValleyScenery,
    };
    const fn = builders[sceneName] || buildKonohaScenery;
    fn(lvl);
  }

  function addSceneryGroup(g) { scene.add(g); sceneryGroups.push(g); }

  function buildKonohaScenery(lvl) {
    const rng = seededRng(1001);
    // L2: torii-like gates every 10m + lamp posts
    for(let i=0; i<30; i++){
      const z=-i*10-5;
      const side = i%2===0 ? -6.5 : 6.5;
      // lamp post
      const g=new THREE.Group();
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,4.5,6),
        new THREE.MeshStandardMaterial({color:C('#707860'),roughness:.6,flatShading:true}));
      pole.position.y=2.25; pole.castShadow=true; g.add(pole);
      // lantern
      const lan=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),
        new THREE.MeshStandardMaterial({color:C('#ff4400'),emissive:C('#ff2200'),emissiveIntensity:0.8,flatShading:true}));
      lan.position.y=4.6; g.add(lan);
      // glow sprite
      const spriteMat=new THREE.SpriteMaterial({map:Textures.getParticle('#ff8844'),transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
      const sprite=new THREE.Sprite(spriteMat); sprite.scale.setScalar(2.5); sprite.position.y=4.6; g.add(sprite);
      g.position.set(side, 0, z); addSceneryGroup(g);
    }
    // L3: konoha buildings
    const buildingColors=['#d4a870','#c8c0b0','#b09080','#e0d0b8'];
    for(let i=0; i<40; i++){
      const z=-rng()*300-10;
      const side=(rng()<.5?-1:1)*(8+rng()*10);
      const w=3+rng()*5, h=4+rng()*12, d=3+rng()*5;
      const g=new THREE.Group();
      const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
        new THREE.MeshStandardMaterial({color:C(buildingColors[Math.floor(rng()*buildingColors.length)]),roughness:.8,flatShading:true}));
      body.position.y=h/2; body.castShadow=true; body.receiveShadow=true; g.add(body);
      // red roof
      const roofH=h*.25+.8;
      const roofGeo=new THREE.CylinderGeometry(0,Math.max(w,d)*.7,roofH,4);
      const roof=new THREE.Mesh(roofGeo,new THREE.MeshStandardMaterial({color:C('#882211'),roughness:.7,flatShading:true}));
      roof.position.y=h+roofH/2; roof.rotation.y=Math.PI/4; roof.castShadow=true; g.add(roof);
      // windows
      const winMat=new THREE.MeshStandardMaterial({color:C('#ffffa0'),emissive:C('#ffd040'),emissiveIntensity:.5});
      for(let wr=0;wr<3;wr++){
        const win=new THREE.Mesh(new THREE.PlaneGeometry(.8,.6),winMat);
        win.position.set(w/2+.01,1.5+wr*2,rng()*d*.6-d*.3);
        win.rotation.y=Math.PI/2; g.add(win);
      }
      g.position.set(side, 0, z); addSceneryGroup(g);
    }
  }

  function buildForestScenery(lvl) {
    const rng = seededRng(2002);
    const trunkCol=['#2a1a0a','#1a1005','#3a2510'];
    const leafCol=['#1a3a10','#0d2508','#2a5015'];
    for(let i=0; i<60; i++){
      const z=-rng()*350-5;
      const side=(rng()<.5?-1:1)*(5+rng()*18);
      const g=new THREE.Group();
      const h=8+rng()*20;
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.4+rng()*.3,.5+rng()*.4,h,7),
        new THREE.MeshStandardMaterial({color:C(trunkCol[Math.floor(rng()*3)]),roughness:.95,flatShading:true,map:Textures.get('bark')}));
      trunk.position.y=h/2; trunk.castShadow=true; g.add(trunk);
      // canopy (multiple puffs)
      for(let j=0;j<3;j++){
        const puff=new THREE.Mesh(new THREE.IcosahedronGeometry(2+rng()*2.5,1),
          new THREE.MeshStandardMaterial({color:C(leafCol[Math.floor(rng()*3)]),roughness:.9,flatShading:true}));
        puff.position.set(rng()*2-1,h+rng()*2,rng()*2-1);
        puff.castShadow=true; g.add(puff);
      }
      // hanging vines
      if(rng()>.5){
        const vineMat=new THREE.MeshStandardMaterial({color:C('#1a4010'),roughness:.95,flatShading:true});
        for(let v=0;v<3;v++){
          const vine=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,4+rng()*3,4),vineMat);
          vine.position.set(rng()*3-1.5,h-2-rng()*2,rng()*1-0.5);
          g.add(vine);
        }
      }
      g.position.set(side, 0, z); addSceneryGroup(g);
    }
    // giant roots crossing track (decorative)
    for(let i=0;i<10;i++){
      const z=-i*30-15;
      for(let s=-1;s<=1;s+=2){
        const root=new THREE.Mesh(new THREE.CylinderGeometry(.2,.35,4,6),
          new THREE.MeshStandardMaterial({color:C('#2a1a05'),roughness:.9,flatShading:true}));
        root.position.set(s*(TRACK_W/2+1.5),.2,z);
        root.rotation.z=s*.35; root.castShadow=true;
        scene.add(root); sceneryGroups.push(root);
      }
    }
  }

  function buildTreeWalkingScenery(lvl) {
    const rng = seededRng(3003);
    // massive tree trunks on sides
    for(let i=0;i<25;i++){
      const z=-i*14-5; const side=(i%2===0?-1:1)*(6+rng()*6);
      const g=new THREE.Group();
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(1.2+rng()*.5,1.5+rng()*.5,40,8),
        new THREE.MeshStandardMaterial({color:C('#1a3010'),roughness:.95,flatShading:true,map:Textures.get('bark')}));
      trunk.position.y=20; trunk.castShadow=true; g.add(trunk);
      // chakra glow on bark
      const glow=new THREE.Mesh(new THREE.CylinderGeometry(1.25+rng()*.5,1.55+rng()*.5,2,8),
        new THREE.MeshStandardMaterial({color:C('#00aaff'),emissive:C('#0088ff'),emissiveIntensity:.6,transparent:true,opacity:.5}));
      glow.position.y=1+rng()*8; g.add(glow);
      g.position.set(side,0,z); addSceneryGroup(g);
    }
    // chakra energy rings floating
    for(let i=0;i<15;i++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1+rng()*.8,.08,8,24),
        new THREE.MeshStandardMaterial({color:C('#00ccff'),emissive:C('#0099ff'),emissiveIntensity:1.2,transparent:true,opacity:.7}));
      ring.position.set((rng()-.5)*20,2+rng()*6,-rng()*250-10);
      ring.rotation.x=rng()*Math.PI; ring.userData.rotSpd=rng()*.5+.2;
      scene.add(ring); bgLifeObjects.push({mesh:ring,type:'ring'});
    }
  }

  function buildTrainingScenery(lvl) {
    const rng=seededRng(4004);
    // training dummies
    for(let i=0;i<20;i++){
      const z=-i*15-8; const side=(rng()-.5)*20;
      const g=new THREE.Group();
      // wooden post
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,2.5,6),
        new THREE.MeshStandardMaterial({color:C('#8a6030'),roughness:.9,flatShading:true}));
      post.position.y=1.25; g.add(post);
      // crossbar
      const cross=new THREE.Mesh(new THREE.BoxGeometry(1.5,.15,.15),
        new THREE.MeshStandardMaterial({color:C('#8a6030'),roughness:.9,flatShading:true}));
      cross.position.y=2.2; g.add(cross);
      // target circle
      const target=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.05,16),
        new THREE.MeshStandardMaterial({color:C('#cc2200'),roughness:.6}));
      target.rotation.x=Math.PI/2; target.position.set(0,1.5,.1); g.add(target);
      g.position.set(side,0,z); addSceneryGroup(g);
    }
    // stone walls / fences
    for(let i=0;i<30;i++){
      const z=-rng()*250-10; const side=(rng()<.5?-1:1)*(7+rng()*8);
      const fence=new THREE.Mesh(new THREE.BoxGeometry(.2,1.8,4),
        new THREE.MeshStandardMaterial({color:C('#9a8060'),roughness:.9,flatShading:true}));
      fence.position.set(side,.9,z); fence.castShadow=true;
      addSceneryGroup(fence);
    }
  }

  function buildSandScenery(lvl) {
    const rng=seededRng(5005);
    // stone pillars / arena walls
    for(let i=0;i<25;i++){
      const z=-i*12-5; const side=(i%2===0?-1:1)*(6+rng()*5);
      const g=new THREE.Group();
      const h=3+rng()*5;
      const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.6+rng()*.3,.8+rng()*.3,h,8),
        new THREE.MeshStandardMaterial({color:C('#c8a050'),roughness:.85,flatShading:true,map:Textures.get('sand')}));
      pillar.position.y=h/2; pillar.castShadow=true; g.add(pillar);
      // capital
      const cap=new THREE.Mesh(new THREE.BoxGeometry(1.4+rng()*.3,.4,1.4+rng()*.3),
        new THREE.MeshStandardMaterial({color:C('#d4b060'),roughness:.8,flatShading:true}));
      cap.position.y=h+.2; g.add(cap);
      g.position.set(side,0,z); addSceneryGroup(g);
    }
    // sand dunes background
    for(let i=0;i<20;i++){
      const z=-rng()*300-30; const side=(rng()-.5)*35;
      const dune=new THREE.Mesh(new THREE.SphereGeometry(3+rng()*5,7,5),
        new THREE.MeshStandardMaterial({color:C('#c49840'),roughness:.95,flatShading:true}));
      dune.scale.y=.35; dune.position.set(side,-.2,z); addSceneryGroup(dune);
    }
  }

  function buildAkatsukiScenery(lvl) {
    const rng=seededRng(6006);
    // dark rock formations
    for(let i=0;i<40;i++){
      const z=-rng()*350-5; const side=(rng()<.5?-1:1)*(5+rng()*15);
      const g=new THREE.Group();
      for(let j=0;j<2+Math.floor(rng()*3);j++){
        const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.8+rng()*2.5,1),
          new THREE.MeshStandardMaterial({color:C('#1a1015'),roughness:.9,flatShading:true}));
        rock.position.set(rng()*2-1,rng()*.5,(j-.5)*2);
        rock.rotation.set(rng()*2,rng()*2,rng()*2);
        rock.castShadow=true; g.add(rock);
      }
      // occasional akatsuki lantern (red glow)
      if(rng()>.6){
        const lan=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),
          new THREE.MeshStandardMaterial({color:C('#cc0000'),emissive:C('#880000'),emissiveIntensity:1.5}));
        lan.position.y=2; g.add(lan);
        const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:Textures.getParticle('#ff0000'),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,fog:false}));
        glow.scale.setScalar(1.5); glow.position.y=2; g.add(glow);
      }
      g.position.set(side,0,z); addSceneryGroup(g);
    }
  }

  function buildBridgeScenery(lvl) {
    const rng=seededRng(7007);
    // bridge cables / pillars
    for(let i=0;i<20;i++){
      const z=-i*15-5;
      for(let s=-1;s<=1;s+=2){
        const g=new THREE.Group();
        // pillar
        const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.4,.5,8,8),
          new THREE.MeshStandardMaterial({color:C('#606878'),roughness:.8,flatShading:true}));
        pillar.position.y=4; pillar.castShadow=true; g.add(pillar);
        // cable attachment
        const cap=new THREE.Mesh(new THREE.BoxGeometry(.8,.8,.8),
          new THREE.MeshStandardMaterial({color:C('#4a5060'),roughness:.7,flatShading:true}));
        cap.position.y=8.4; g.add(cap);
        g.position.set(s*(TRACK_W/2+.6),0,z); addSceneryGroup(g);
      }
    }
    // water below (animated UV)
    const waterGeo=new THREE.PlaneGeometry(80,400,2,2);
    const waterMat=new THREE.MeshStandardMaterial({color:C('#203050'),roughness:.2,metalness:.3,transparent:true,opacity:.7});
    const water=new THREE.Mesh(waterGeo,waterMat);
    water.rotation.x=-Math.PI/2; water.position.set(0,-3,-200);
    water.userData.type='water'; scene.add(water); bgLifeObjects.push({mesh:water,type:'water'});
    // fog mist sprites
    for(let i=0;i<10;i++){
      const mist=new THREE.Sprite(new THREE.SpriteMaterial({map:Textures.getParticle('#a0c0d0'),transparent:true,opacity:.15,fog:false}));
      mist.scale.set(20+rng()*20,8+rng()*8,1);
      mist.position.set((rng()-.5)*40,1+rng()*2,-rng()*250-20);
      scene.add(mist); bgLifeObjects.push({mesh:mist,type:'mist'});
    }
  }

  function buildDestroyedScenery(lvl) {
    const rng=seededRng(8008);
    // destroyed buildings (rubble piles)
    for(let i=0;i<30;i++){
      const z=-rng()*350-5; const side=(rng()<.5?-1:1)*(6+rng()*12);
      const g=new THREE.Group();
      const h=rng()*5+1;
      const body=new THREE.Mesh(new THREE.BoxGeometry(3+rng()*4,h,3+rng()*4),
        new THREE.MeshStandardMaterial({color:C('#404030'),roughness:.9,flatShading:true,map:Textures.get('rubble')}));
      body.position.y=h/2; body.castShadow=true; g.add(body);
      // rubble chunks
      for(let j=0;j<4+Math.floor(rng()*4);j++){
        const chunk=new THREE.Mesh(new THREE.IcosahedronGeometry(.3+rng()*.7,0),
          new THREE.MeshStandardMaterial({color:C('#383028'),roughness:.95,flatShading:true}));
        chunk.position.set(rng()*4-2,.5+rng()*.5,rng()*4-2);
        chunk.rotation.set(rng()*3,rng()*3,rng()*3);
        g.add(chunk);
      }
      // fire glow
      if(rng()>.5){
        const fire=new THREE.Sprite(new THREE.SpriteMaterial({map:Textures.getParticle('#ff4400'),transparent:true,opacity:.6,blending:THREE.AdditiveBlending,fog:false}));
        fire.scale.set(2,3,1); fire.position.y=h+1; g.add(fire);
        fire.userData.baseOpacity=.6; fire.userData.phase=rng()*Math.PI*2;
      }
      g.position.set(side,0,z); addSceneryGroup(g);
    }
  }

  function buildBattlefieldScenery(lvl) {
    const rng=seededRng(9009);
    // barren rock formations
    for(let i=0;i<35;i++){
      const z=-rng()*380-5; const side=(rng()<.5?-1:1)*(6+rng()*14);
      const g=new THREE.Group();
      for(let j=0;j<3+Math.floor(rng()*3);j++){
        const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.5+rng()*2,1),
          new THREE.MeshStandardMaterial({color:C('#3a2a10'),roughness:.92,flatShading:true}));
        rock.position.set(rng()*3-1.5,rng()*.8,(j-1)*2);
        rock.rotation.set(rng()*2,rng()*2,rng()*2);
        rock.castShadow=true; g.add(rock);
      }
      // battle smoke
      if(rng()>.5){
        const smoke=new THREE.Sprite(new THREE.SpriteMaterial({map:Textures.getParticle('#806040'),transparent:true,opacity:.3,fog:false}));
        smoke.scale.set(4+rng()*4,4+rng()*4,1); smoke.position.y=3+rng()*3; g.add(smoke);
        smoke.userData.phase=rng()*Math.PI*2;
      }
      g.position.set(side,0,z); addSceneryGroup(g);
    }
  }

  function buildValleyScenery(lvl) {
    const rng=seededRng(1011);
    // waterfall cliff walls
    for(let side of[-1,1]){
      for(let i=0;i<12;i++){
        const z=-i*25-5;
        const g=new THREE.Group();
        const h=20+rng()*15; const w=6+rng()*4;
        const cliff=new THREE.Mesh(new THREE.BoxGeometry(w,h,2),
          new THREE.MeshStandardMaterial({color:C('#1a2030'),roughness:.95,flatShading:true,map:Textures.get('wetRock')}));
        cliff.position.y=h/2; cliff.castShadow=true; g.add(cliff);
        // waterfall streams
        if(rng()>.4){
          const fallMat=new THREE.MeshStandardMaterial({color:C('#4080c0'),transparent:true,opacity:.5,roughness:.1});
          for(let f=0;f<2;f++){
            const fall=new THREE.Mesh(new THREE.PlaneGeometry(.3+rng()*.4,h),fallMat);
            fall.position.set(rng()*w*.4-w*.2,0,.15); g.add(fall);
          }
        }
        g.position.set(side*(TRACK_W/2+3+rng()*3),0,z); addSceneryGroup(g);
      }
    }
    // rain streaks (animated in update)
    for(let i=0;i<8;i++){
      const rain=new THREE.Sprite(new THREE.SpriteMaterial({map:Textures.getParticle('#8090c0'),transparent:true,opacity:.2,fog:false}));
      rain.scale.set(30,60,1); rain.position.set((rng()-.5)*30,10,-rng()*200-10);
      scene.add(rain); bgLifeObjects.push({mesh:rain,type:'rain',spd:.5+rng()*.5});
    }
  }

  // ── Landmark ──────────────────────────────────────────────────────────────────
  function buildLandmark(lvl) {
    // landmark at horizon (Z = -350)
    const builders = {
      hokageFaces:   buildHokageFacesLandmark,
      hugeTreeTower: buildTreeTowerLandmark,
      giantTreeCanopy: buildCanopyLandmark,
      konohaGate:    buildKonohaGateLandmark,
      examStadium:   buildStadiumLandmark,
      akatsukiMoon:  buildMoonLandmark,
      bridgeTower:   buildBridgeTowerLandmark,
      painGodRealm:  buildPainLandmark,
      madara:        buildMadaraLandmark,
      waterfalls:    buildWaterfallsLandmark,
    };
    const fn = builders[lvl.landmark];
    if(fn) fn(lvl);
  }

  function buildHokageFacesLandmark() {
    // 4 giant stone faces on a cliffside
    const g=new THREE.Group();
    const cliff=new THREE.Mesh(new THREE.BoxGeometry(40,30,5),
      new THREE.MeshStandardMaterial({color:C('#9a8060'),roughness:.9,flatShading:true}));
    cliff.position.set(0,15,0); g.add(cliff);
    const faceColors=['#c09870','#b08860','#d0a880'];
    for(let i=0;i<4;i++){
      const face=new THREE.Mesh(new THREE.SphereGeometry(3,8,7),
        new THREE.MeshStandardMaterial({color:C(faceColors[i%3]),roughness:.85,flatShading:true}));
      face.scale.y=1.2; face.position.set(-14+i*9,22,2.5); g.add(face);
    }
    g.position.set(0,0,-360); scene.add(g); sceneryGroups.push(g);
  }
  function buildTreeTowerLandmark() {
    const g=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(4,6,80,10),
      new THREE.MeshStandardMaterial({color:C('#1a2808'),roughness:.95,flatShading:true}));
    trunk.position.y=40; g.add(trunk);
    const canopy=new THREE.Mesh(new THREE.IcosahedronGeometry(20,1),
      new THREE.MeshStandardMaterial({color:C('#0d2008'),roughness:.9,flatShading:true}));
    canopy.position.y=90; g.add(canopy);
    g.position.set(0,0,-380); scene.add(g); sceneryGroups.push(g);
  }
  function buildCanopyLandmark() {
    const g=new THREE.Group();
    const spread=new THREE.Mesh(new THREE.IcosahedronGeometry(30,1),
      new THREE.MeshStandardMaterial({color:C('#1a4020'),roughness:.9,flatShading:true}));
    spread.scale.y=.3; spread.position.y=60; g.add(spread);
    g.position.set(0,0,-380); scene.add(g); sceneryGroups.push(g);
  }
  function buildKonohaGateLandmark() {
    const g=new THREE.Group();
    const arch=new THREE.Mesh(new THREE.TorusGeometry(8,1.2,8,16,Math.PI),
      new THREE.MeshStandardMaterial({color:C('#802010'),roughness:.7,flatShading:true}));
    arch.rotation.z=Math.PI; arch.position.y=8; g.add(arch);
    for(let s=-1;s<=1;s+=2){
      const post=new THREE.Mesh(new THREE.CylinderGeometry(1,1,16,8),
        new THREE.MeshStandardMaterial({color:C('#9a2818'),roughness:.7,flatShading:true}));
      post.position.set(s*8,8,0); g.add(post);
    }
    const banner=new THREE.Mesh(new THREE.PlaneGeometry(10,4),
      new THREE.MeshStandardMaterial({color:C('#cc2200'),emissive:C('#440000'),emissiveIntensity:.3,side:THREE.DoubleSide}));
    banner.position.y=18; g.add(banner);
    g.position.set(0,0,-360); scene.add(g); sceneryGroups.push(g);
  }
  function buildStadiumLandmark() {
    const g=new THREE.Group();
    const stadium=new THREE.Mesh(new THREE.CylinderGeometry(30,32,8,16,1,true),
      new THREE.MeshStandardMaterial({color:C('#c0a040'),roughness:.8,flatShading:true,side:THREE.DoubleSide}));
    stadium.position.y=4; g.add(stadium);
    for(let i=0;i<16;i++){
      const col=new THREE.Mesh(new THREE.CylinderGeometry(.5,.6,10,6),
        new THREE.MeshStandardMaterial({color:C('#d4b060'),roughness:.8,flatShading:true}));
      const a=i/16*Math.PI*2;
      col.position.set(Math.cos(a)*31,5,Math.sin(a)*31); g.add(col);
    }
    g.position.set(0,0,-370); scene.add(g); sceneryGroups.push(g);
  }
  function buildMoonLandmark() {
    const moon=new THREE.Mesh(new THREE.SphereGeometry(18,16,12),
      new THREE.MeshStandardMaterial({color:C('#cc0010'),emissive:C('#660008'),emissiveIntensity:.4,flatShading:true}));
    moon.position.set(0,40,-400);
    // cloud wisps around moon
    const glowMat=new THREE.SpriteMaterial({map:Textures.getParticle('#ff0020'),transparent:true,opacity:.2,blending:THREE.AdditiveBlending,fog:false});
    const glow=new THREE.Sprite(glowMat); glow.scale.setScalar(50); glow.position.copy(moon.position);
    scene.add(moon,glow); sceneryGroups.push(moon,glow);
  }
  function buildBridgeTowerLandmark() {
    const g=new THREE.Group();
    for(let s=-1;s<=1;s+=2){
      const tower=new THREE.Mesh(new THREE.BoxGeometry(4,40,4),
        new THREE.MeshStandardMaterial({color:C('#505870'),roughness:.8,flatShading:true}));
      tower.position.set(s*12,20,0); g.add(tower);
    }
    // suspension cable line (simplified box)
    const cable=new THREE.Mesh(new THREE.BoxGeometry(30,.15,.15),
      new THREE.MeshStandardMaterial({color:C('#304050'),roughness:.8}));
    cable.position.y=40; g.add(cable);
    g.position.set(0,0,-370); scene.add(g); sceneryGroups.push(g);
  }
  function buildPainLandmark() {
    const g=new THREE.Group();
    // God Realm floating rocks
    for(let i=0;i<6;i++){
      const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(3+Math.random()*4,1),
        new THREE.MeshStandardMaterial({color:C('#303020'),roughness:.9,flatShading:true}));
      const a=i/6*Math.PI*2;
      rock.position.set(Math.cos(a)*25,20+Math.sin(a*2)*8,Math.sin(a)*15);
      g.add(rock);
    }
    // Pain summoning rings (chakra)
    const ring=new THREE.Mesh(new THREE.TorusGeometry(10,.4,8,32),
      new THREE.MeshStandardMaterial({color:C('#8040ff'),emissive:C('#4020aa'),emissiveIntensity:.8,transparent:true,opacity:.7}));
    ring.position.y=25; ring.rotation.x=Math.PI/4; g.add(ring);
    g.position.set(0,0,-380); scene.add(g); sceneryGroups.push(g);
    g.userData.type='painRings';
    bgLifeObjects.push({mesh:g,type:'spin',spd:.3});
  }
  function buildMadaraLandmark() {
    const g=new THREE.Group();
    // colossal Madara silhouette
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(8,30,8,16),
      new THREE.MeshStandardMaterial({color:C('#1a0808'),roughness:.9,flatShading:true}));
    body.position.y=30; g.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(9,8,7),
      new THREE.MeshStandardMaterial({color:C('#1a0808'),roughness:.9,flatShading:true}));
    head.position.y=60; g.add(head);
    // Sharingan glow
    const eye=new THREE.Sprite(new THREE.SpriteMaterial({map:Textures.getParticle('#ff2000'),transparent:true,opacity:.8,blending:THREE.AdditiveBlending,fog:false}));
    eye.scale.setScalar(8); eye.position.set(0,61,3); g.add(eye);
    g.position.set(0,0,-400); scene.add(g); sceneryGroups.push(g);
  }
  function buildWaterfallsLandmark() {
    const g=new THREE.Group();
    // Two giant statues (Hashirama & Madara) cliffside
    for(let s=-1;s<=1;s+=2){
      const statue=new THREE.Mesh(new THREE.CapsuleGeometry(4,20,8,12),
        new THREE.MeshStandardMaterial({color:C('#1a2030'),roughness:.9,flatShading:true}));
      statue.position.set(s*18,20,0); g.add(statue);
      const head=new THREE.Mesh(new THREE.SphereGeometry(5,8,7),
        new THREE.MeshStandardMaterial({color:C('#1a2030'),roughness:.9,flatShading:true}));
      head.position.set(s*18,40,0); g.add(head);
    }
    // waterfall sheets
    for(let i=0;i<4;i++){
      const fall=new THREE.Mesh(new THREE.PlaneGeometry(4,40),
        new THREE.MeshStandardMaterial({color:C('#4070b0'),transparent:true,opacity:.35,roughness:.1,side:THREE.DoubleSide}));
      fall.position.set(-6+i*4,20,-2); g.add(fall);
    }
    g.position.set(0,0,-380); scene.add(g); sceneryGroups.push(g);
  }

  // ── Background life ───────────────────────────────────────────────────────────
  function buildBackgroundLife(lvl) {
    const type = lvl.particles || 'leaves';
    if(type==='leaves' || type==='chakraDust' || type==='sandDust' || type==='crowFeathers' ||
       type==='seaMist' || type==='ashEmbers' || type==='warDust') {
      addAmbientParticles(type);
    }
    if(type==='forestSpores') { addAmbientParticles('forestSpores'); }
    if(type==='chakraParticles') { addAmbientParticles('chakraParticles'); }
    if(type==='rain') { addAmbientParticles('rain'); }

    // Level-specific flying entities
    if(lvl.scenery==='konoha') addFlyers('leaf', 6);
    if(lvl.scenery==='forestDeath') addFlyers('bird', 4);
    if(lvl.scenery==='sandArena') addFlyers('eagle', 3);
    if(lvl.scenery==='bridge') addFlyers('seagull', 5);
    if(lvl.scenery==='battlefield') addFlyers('eagle', 3);
  }

  function addAmbientParticles(type) {
    const count = type==='rain' ? 1500 : 800;
    const ptex = Textures.getParticle(
      type==='leaves'?'#40c020':
      type==='forestSpores'?'#c8e040':
      type==='chakraParticles'||type==='chakraDust'?'#40aaff':
      type==='sandDust'?'#d4a840':
      type==='crowFeathers'?'#202020':
      type==='seaMist'?'#a0b8c8':
      type==='ashEmbers'?'#ff6020':
      type==='warDust'?'#806040':
      type==='rain'?'#8090c0':
      '#ffffff'
    );
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3);
    const vel = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      pos[i*3]   = (Math.random()-.5)*50;
      pos[i*3+1] = Math.random()*20;
      pos[i*3+2] = Math.random()*-135+15;
      vel[i*3]   = (Math.random()-.5)*.5;
      vel[i*3+1] = type==='rain' ? -8-Math.random()*4 : -.2-Math.random()*.5;
      vel[i*3+2] = 0;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    const mat = new THREE.PointsMaterial({
      map:ptex, size:type==='rain'?.15:.3, sizeAttenuation:true,
      transparent:true, opacity:type==='rain'?.4:.7,
      depthWrite:false,
      blending: (type==='chakraParticles'||type==='chakraDust'||type==='ashEmbers') ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    bgLifeObjects.push({mesh:pts, type:'particles', vel, pos, count});
  }

  function addFlyers(type, count) {
    const color = type==='leaf'?'#40c050':type==='seagull'?'#e0e8f0':'#303030';
    for(let i=0;i<count;i++){
      const g=new THREE.Group();
      const body=new THREE.Mesh(new THREE.BoxGeometry(.3,.15,.8),
        new THREE.MeshStandardMaterial({color:C(color),roughness:.8,flatShading:true}));
      g.add(body);
      // wings
      for(let s=-1;s<=1;s+=2){
        const wing=new THREE.Mesh(new THREE.BoxGeometry(.8,.04,.4),
          new THREE.MeshStandardMaterial({color:C(color),roughness:.8,flatShading:true}));
        wing.position.x=s*.6; wing.userData.pivotSide=s; g.add(wing);
      }
      g.position.set((Math.random()-.5)*30, 8+Math.random()*12, -Math.random()*250-10);
      g.userData={type:'flyer',phase:Math.random()*Math.PI*2,spd:.5+Math.random()*.5,lateralSpd:(Math.random()-.5)*.3};
      scene.add(g); bgLifeObjects.push({mesh:g,type:'flyer'});
    }
  }

  // ── Update (every frame) ──────────────────────────────────────────────────────
  function update(dt, playerZ) {
    if(!playerRef) return;
    const px=playerRef.x, pz=playerRef.z;

    // sky follows camera
    sky.position.copy(camera.position);

    // sun follows player (shadows stay)
    sunLight.position.set(px+25, 50, pz+15);
    sunLight.target.position.set(px, 0, pz-25);
    sunLight.target.updateMatrixWorld();

    // recycle track segments
    trackSegments.forEach(seg => {
      if(seg.position.z - pz > TRACK_SEG_LEN) {
        seg.position.z -= TRACK_SEG_COUNT * TRACK_SEG_LEN;
      }
    });

    // animate bg life
    const t = performance.now()*0.001;
    bgLifeObjects.forEach(obj => {
      if(!obj.mesh) return;
      if(obj.type==='flyer') {
        const g=obj.mesh;
        const d=g.userData;
        d.phase+=dt*d.spd;
        g.position.x += d.lateralSpd*dt;
        if(Math.abs(g.position.x-px)>20) d.lateralSpd*=-1;
        g.position.y = 8 + Math.sin(d.phase)*2;
        g.position.z += dt*6;
        if(g.position.z > pz+20) g.position.z = pz - 250 - Math.random()*50;
        // flap wings
        g.children.forEach(c=>{if(c.userData.pivotSide!==undefined) c.rotation.z=c.userData.pivotSide*Math.sin(d.phase*5)*.5;});
      } else if(obj.type==='particles') {
        const pos=obj.pos; const vel=obj.vel; const n=obj.count;
        const posAttr=obj.mesh.geometry.attributes.position;
        for(let i=0;i<n;i++){
          pos[i*3]  +=vel[i*3]*dt;
          pos[i*3+1]+=vel[i*3+1]*dt;
          pos[i*3+2]+=vel[i*3+2]*dt;
          // wrap z
          if(pos[i*3+2]>pz+15) pos[i*3+2]=pz-120;
          if(pos[i*3+2]<pz-120) pos[i*3+2]=pz+15;
          // wrap x
          if(pos[i*3]>px+25) pos[i*3]=px-25;
          if(pos[i*3]<px-25) pos[i*3]=px+25;
          // wrap y
          if(pos[i*3+1]<0) pos[i*3+1]=20;
          if(pos[i*3+1]>22) pos[i*3+1]=0;
        }
        posAttr.array=pos; posAttr.needsUpdate=true;
        // keep centered on player
        obj.mesh.position.set(px,0,pz);
      } else if(obj.type==='ring') {
        obj.mesh.rotation.y+=dt*(obj.mesh.userData.rotSpd||.3);
        obj.mesh.position.z = pz - 200 - (t%10)*20;
      } else if(obj.type==='spin') {
        obj.mesh.rotation.y+=dt*(obj.spd||.2);
      } else if(obj.type==='mist') {
        obj.mesh.material.opacity=.1+Math.sin(t*.3+obj.mesh.position.x)*.05;
      } else if(obj.type==='water') {
        // no UV animation (no texture), just slight color oscillation
      } else if(obj.type==='rain') {
        obj.mesh.position.y-=obj.spd*dt*40;
        if(obj.mesh.position.y<-5) obj.mesh.position.y=30;
      }
    });

    // fire flicker on destroyed konoha
    sceneryGroups.forEach(g=>{
      if(!g.children) return;
      g.children.forEach(c=>{
        if(c.userData.baseOpacity!==undefined){
          c.material.opacity=c.userData.baseOpacity*(0.7+Math.sin(t*8+c.userData.phase)*.3);
        }
      });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function C(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }

  function seededRng(seed) {
    let s=seed;
    return ()=>{ s=(s*9301+49297)%233280; return s/233280; };
  }

  function disposeGroup(g) {
    g.traverse(o=>{
      if(o.geometry) o.geometry.dispose();
      if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}
    });
  }

  return { init, applyLevel, update, clearWorld };
})();

window.World = World;

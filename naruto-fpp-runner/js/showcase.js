// ─── GRAPHICS SHOWCASE — cel-shaded anime preview ────────────────────────────
'use strict';

(function(){
  let renderer, scene, camera, composer, clock;
  let hero, envGroup;
  const C = (hex)=>new THREE.Color(hex).convertSRGBToLinear();

  function init(){
    const canvas=document.getElementById('c');
    renderer=new THREE.WebGLRenderer({canvas, antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(innerWidth,innerHeight);
    renderer.outputEncoding=THREE.sRGBEncoding;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.05;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;

    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 500);
    camera.position.set(0,2,7);
    clock=new THREE.Clock();

    buildSky();
    buildLights();
    buildEnvironment();
    hero=buildHero();
    hero.position.set(0,0,2.5);
    scene.add(hero);

    // bloom composer
    composer=new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene,camera));
    const bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 0.55, 0.5, 0.85);
    composer.addPass(bloom);

    window.addEventListener('resize',onResize);
    document.getElementById('label').innerHTML='<b>Cel-shaded</b> hero + Konoha environment · toon shading + black outlines + bloom';
    window.__ready=true;
    animate();
  }

  function onResize(){
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
    composer.setSize(innerWidth,innerHeight);
  }

  // ── Sky ───────────────────────────────────────────────────────────────────────
  function buildSky(){
    const uniforms={
      top:{value:C('#1a5ac8')}, mid:{value:C('#5aa0e8')}, horizon:{value:C('#ffddb0')},
    };
    const mat=new THREE.ShaderMaterial({
      uniforms, side:THREE.BackSide, depthWrite:false,
      vertexShader:`varying vec3 vD; void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`uniform vec3 top,mid,horizon;varying vec3 vD;
        void main(){float h=clamp(vD.y,-0.2,1.0);
        vec3 c=mix(horizon,mid,smoothstep(0.0,0.3,h));c=mix(c,top,smoothstep(0.3,0.9,h));
        gl_FragColor=vec4(c,1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>}`,
    });
    const sky=new THREE.Mesh(new THREE.SphereGeometry(300,32,16),mat);
    scene.add(sky);
    scene.fog=new THREE.Fog(C('#ffddb0'),40,180);

    // sun disc (bloom target)
    const sun=new THREE.Mesh(new THREE.CircleGeometry(6,32),
      new THREE.MeshBasicMaterial({color:C('#fff2d0')}));
    sun.position.set(30,28,-120); sun.userData.noToon=true; scene.add(sun);
  }

  function buildLights(){
    const hemi=new THREE.HemisphereLight(C('#cfe8ff'),C('#6a8f4e'),0.7);
    const sun=new THREE.DirectionalLight(C('#fff0d0'),2.0);
    sun.position.set(12,20,8); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);
    Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:80});
    sun.shadow.bias=-0.0004;
    const rim=new THREE.DirectionalLight(C('#a0d0ff'),0.6);
    rim.position.set(-15,10,-10);
    scene.add(hemi,sun,rim);
  }

  // ── Cel-shaded Konoha environment ────────────────────────────────────────────
  function buildEnvironment(){
    envGroup=new THREE.Group();

    // ground (grass)
    const ground=new THREE.Mesh(new THREE.CylinderGeometry(30,30,0.5,48),
      Toon.mat('#5a9a3a',{steps:3}));
    ground.position.y=-0.25; ground.receiveShadow=true;
    Toon.outline(ground,0.04); envGroup.add(ground);

    // path
    const path=new THREE.Mesh(new THREE.BoxGeometry(4,0.1,60),Toon.mat('#c8a866',{steps:3}));
    path.position.set(0,0.05,-20); path.receiveShadow=true; envGroup.add(path);

    // Konoha buildings (cel shaded, red roofs)
    const wallCols=['#e8dcc0','#d8c8a8','#f0e4c8'];
    for(let i=0;i<14;i++){
      const side=i%2===0?-1:1;
      const z=-4-i*3.5;
      const g=new THREE.Group();
      const w=2+Math.random()*1.5,h=2.5+Math.random()*3,d=2+Math.random()*1.5;
      const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),Toon.mat(wallCols[i%3],{steps:3}));
      body.position.y=h/2; body.castShadow=true; body.receiveShadow=true;
      Toon.outline(body,0.025); g.add(body);
      // roof
      const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*0.78,h*0.35+0.6,4),Toon.mat('#c0392b',{steps:3}));
      roof.position.y=h+(h*0.35+0.6)/2-0.1; roof.rotation.y=Math.PI/4; roof.castShadow=true;
      Toon.outline(roof,0.025); g.add(roof);
      // window (emissive for bloom)
      const win=new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.6),
        Toon.mat('#ffe08a',{emissive:'#ffcc55',emissiveIntensity:1.2}));
      win.position.set(side*(w/2+0.01),h*0.5,d*0.2); win.rotation.y=side*Math.PI/2;
      win.userData.noOutline=true; g.add(win);
      g.position.set(side*(3.5+Math.random()*3),0,z);
      envGroup.add(g);
    }

    // trees (cel shaded, layered canopy)
    for(let i=0;i<18;i++){
      const side=Math.random()<0.5?-1:1;
      const g=new THREE.Group();
      const th=2+Math.random()*2;
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.3,th,7),Toon.mat('#6a4a2a',{steps:3}));
      trunk.position.y=th/2; trunk.castShadow=true; Toon.outline(trunk,0.02); g.add(trunk);
      for(let j=0;j<3;j++){
        const puff=new THREE.Mesh(new THREE.IcosahedronGeometry(1+Math.random()*0.8,0),
          Toon.mat(['#3a7a2a','#2e6a22','#4a8a32'][j%3],{steps:3}));
        puff.position.set((Math.random()-.5)*1.2,th+j*0.5,(Math.random()-.5)*1.2);
        puff.castShadow=true; Toon.outline(puff,0.03); g.add(puff);
      }
      g.position.set(side*(5+Math.random()*8),0,-6-Math.random()*30);
      envGroup.add(g);
    }

    // Hokage rock (background landmark)
    const rock=new THREE.Group();
    const cliff=new THREE.Mesh(new THREE.BoxGeometry(40,22,4),Toon.mat('#a8906a',{steps:3}));
    cliff.position.y=11; Toon.outline(cliff,0.05); rock.add(cliff);
    for(let i=0;i<4;i++){
      const face=new THREE.Mesh(new THREE.SphereGeometry(2.6,10,8),Toon.mat(['#c0a880','#b89870','#c8b088','#b09068'][i],{steps:3}));
      face.scale.y=1.25; face.position.set(-13+i*8.6,16,2.2); Toon.outline(face,0.03); rock.add(face);
    }
    rock.position.set(0,0,-95); envGroup.add(rock);

    // torii gates over path (rhythm structures, red - bloom)
    for(let i=0;i<6;i++){
      const z=-6-i*8;
      const g=new THREE.Group();
      const gm=Toon.mat('#e8452a',{steps:3});
      for(let s=-1;s<=1;s+=2){
        const post=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,4,8),gm);
        post.position.set(s*2.3,2,0); post.castShadow=true; Toon.outline(post,0.025); g.add(post);
      }
      const top=new THREE.Mesh(new THREE.BoxGeometry(5.6,0.35,0.5),gm);
      top.position.y=4; Toon.outline(top,0.025); g.add(top);
      const top2=new THREE.Mesh(new THREE.BoxGeometry(6.2,0.3,0.6),gm);
      top2.position.y=4.5; Toon.outline(top2,0.025); g.add(top2);
      g.position.set(0,0,z); envGroup.add(g);
    }

    // paper lanterns (emissive - bloom)
    for(let i=0;i<10;i++){
      const lan=new THREE.Mesh(new THREE.SphereGeometry(0.28,10,8),
        Toon.mat('#ff5522',{emissive:'#ff3311',emissiveIntensity:1.4}));
      lan.scale.y=1.2; lan.userData.noOutline=true;
      lan.position.set((i%2===0?-1:1)*2.6, 2.2+Math.sin(i)*0.3, -6-i*3.2);
      envGroup.add(lan);
    }

    scene.add(envGroup);
  }

  // ── Detailed cel-shaded hero (Naruto-style, original fan-art) ─────────────────
  function buildHero(){
    const g=new THREE.Group();

    const skin=Toon.mat('#f4c896',{steps:4});
    const jacket=Toon.mat('#ff7a1a',{steps:4});
    const jacketDark=Toon.mat('#1a3a8b',{steps:4});
    const pants=Toon.mat('#243a66',{steps:4});
    const hair=Toon.mat('#ffd21a',{steps:3});
    const shoe=Toon.mat('#1a2028',{steps:3});

    // ── Torso (jacket) ──
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.36,1.0,10),jacket);
    torso.position.y=1.5; torso.castShadow=true; Toon.outline(torso,0.02); g.add(torso);
    // blue shoulders/collar
    const collar=new THREE.Mesh(new THREE.CylinderGeometry(0.44,0.44,0.22,10),jacketDark);
    collar.position.y=1.95; Toon.outline(collar,0.02); g.add(collar);
    // zipper line
    const zip=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.9,0.02),jacketDark);
    zip.position.set(0,1.5,0.4); g.add(zip);
    // orange circle emblem
    const emblem=new THREE.Mesh(new THREE.CircleGeometry(0.12,16),jacketDark);
    emblem.position.set(0,1.35,0.41); g.add(emblem);

    // ── Waist ──
    const waist=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.3,0.2,10),pants);
    waist.position.y=0.95; Toon.outline(waist,0.02); g.add(waist);

    // ── Head ──
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.4,16,14),skin);
    head.scale.set(1,1.08,0.95); head.position.y=2.5; head.castShadow=true;
    Toon.outline(head,0.02); g.add(head);
    // cheeks (whisker area) — 3 whisker lines each side
    for(let s=-1;s<=1;s+=2){
      for(let w=0;w<3;w++){
        const whisker=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.02,0.01),Toon.mat('#8a5a3a',{steps:2}));
        whisker.position.set(s*0.28,2.45+(w-1)*0.07,0.32); g.add(whisker);
      }
    }
    // eyes (white + blue iris - emissive for pop)
    for(let s=-1;s<=1;s+=2){
      const white=new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8),Toon.mat('#ffffff',{steps:2}));
      white.scale.set(1,1.2,0.5); white.position.set(s*0.16,2.55,0.34); g.add(white);
      const iris=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,6),
        Toon.mat('#3a80d0',{emissive:'#1a4a9a',emissiveIntensity:0.4,steps:3}));
      iris.position.set(s*0.16,2.54,0.4); iris.userData.noOutline=true; g.add(iris);
      const pupil=new THREE.Mesh(new THREE.SphereGeometry(0.025,6,5),Toon.mat('#101018',{steps:2}));
      pupil.position.set(s*0.16,2.54,0.44); g.add(pupil);
    }
    // nose hint + mouth
    const mouth=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.02,0.02),Toon.mat('#a0604a',{steps:2}));
    mouth.position.set(0,2.32,0.37); g.add(mouth);

    // ── Spiky hair ──
    const hairBase=new THREE.Mesh(new THREE.SphereGeometry(0.42,14,12),hair);
    hairBase.scale.set(1.02,0.85,1.02); hairBase.position.y=2.62;
    Toon.outline(hairBase,0.02); g.add(hairBase);
    // spikes all around
    const spikes=22;
    for(let i=0;i<spikes;i++){
      const a=(i/spikes)*Math.PI*2;
      const ring=0.32+Math.random()*0.06;
      const spike=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.32+Math.random()*0.14,4),hair);
      const hy=2.62+Math.random()*0.18;
      spike.position.set(Math.cos(a)*ring, hy, Math.sin(a)*ring*0.9);
      spike.rotation.z=-Math.cos(a)*0.9; spike.rotation.x=Math.sin(a)*0.9;
      Toon.outline(spike,0.015); g.add(spike);
    }
    // top spikes
    for(let i=0;i<8;i++){
      const spike=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.4,4),hair);
      spike.position.set((Math.random()-.5)*0.5,2.95,(Math.random()-.5)*0.5);
      spike.rotation.z=(Math.random()-.5)*0.5; spike.rotation.x=(Math.random()-.5)*0.5;
      Toon.outline(spike,0.015); g.add(spike);
    }

    // ── Headband (metal plate - bloom via slight emissive) ──
    const band=new THREE.Mesh(new THREE.CylinderGeometry(0.43,0.43,0.16,14,1,true),
      Toon.mat('#1a2838',{steps:2}));
    band.position.y=2.72; Toon.outline(band,0.015); g.add(band);
    const plate=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.04,16),
      Toon.mat('#b8c4d0',{emissive:'#404850',emissiveIntensity:0.3,steps:3}));
    plate.rotation.x=Math.PI/2; plate.position.set(0,2.74,0.4); plate.userData.noOutline=true; g.add(plate);
    // leaf swirl symbol
    const swirl=new THREE.Mesh(new THREE.TorusGeometry(0.07,0.015,6,16,Math.PI*1.5),Toon.mat('#2a3440',{steps:2}));
    swirl.position.set(0,2.75,0.43); g.add(swirl);

    // ── Arms ──
    g.userData.arms=[];
    for(let s=-1;s<=1;s+=2){
      const armPivot=new THREE.Group();
      armPivot.position.set(s*0.44,1.9,0);
      const upper=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.12,0.5,8),jacket);
      upper.position.y=-0.25; upper.castShadow=true; Toon.outline(upper,0.018); armPivot.add(upper);
      const fore=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.1,0.45,8),jacket);
      fore.position.y=-0.7; Toon.outline(fore,0.018); armPivot.add(fore);
      // blue glove
      const glove=new THREE.Mesh(new THREE.SphereGeometry(0.13,8,7),skin);
      glove.position.y=-0.98; Toon.outline(glove,0.018); armPivot.add(glove);
      armPivot.rotation.z=s*0.12; armPivot.rotation.x=-0.15;
      g.add(armPivot); g.userData.arms.push({pivot:armPivot,side:s});
    }

    // ── Legs ──
    g.userData.legs=[];
    for(let s=-1;s<=1;s+=2){
      const legPivot=new THREE.Group();
      legPivot.position.set(s*0.18,0.9,0);
      const thigh=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.14,0.5,8),pants);
      thigh.position.y=-0.25; thigh.castShadow=true; Toon.outline(thigh,0.018); legPivot.add(thigh);
      const shin=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.11,0.45,8),pants);
      shin.position.y=-0.7; Toon.outline(shin,0.018); legPivot.add(shin);
      // bandage wrap (white)
      const wrap=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.12,0.2,8),Toon.mat('#e8e0d0',{steps:2}));
      wrap.position.y=-0.88; legPivot.add(wrap);
      // sandal
      const foot=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.12,0.4),shoe);
      foot.position.set(0,-1.02,0.08); Toon.outline(foot,0.018); legPivot.add(foot);
      g.add(legPivot); g.userData.legs.push({pivot:legPivot,side:s});
    }

    // platform under hero
    const plat=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.5,0.3,32),Toon.mat('#8a6a4a',{steps:3}));
    plat.position.y=-0.15; plat.receiveShadow=true; Toon.outline(plat,0.03); g.add(plat);
    // chakra ring on platform (bloom)
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.35,0.05,8,48),
      Toon.mat('#40c0ff',{emissive:'#20a0ff',emissiveIntensity:1.6,steps:2}));
    ring.rotation.x=-Math.PI/2; ring.position.y=0.02; ring.userData.noOutline=true; g.add(ring);
    g.userData.chakraRing=ring;

    return g;
  }

  // ── Animation / camera cycle ─────────────────────────────────────────────────
  let shotTime=0, shotIndex=0;
  const shots=[
    {name:'Hero — cel-shaded character', dur:6, cam:{r:5,h:2.2,look:1.6,spin:true}},
    {name:'Konoha village — full scene', dur:6, cam:{pos:[6,3.5,10],look:[0,2,-6]}},
    {name:'Down the path — gameplay angle', dur:6, cam:{pos:[0,1.7,6],look:[0,1.5,-30]}},
  ];

  function animate(){
    requestAnimationFrame(animate);
    const dt=Math.min(clock.getDelta(),0.05);
    const t=clock.elapsedTime;

    // hero idle bob + run-pose legs
    if(hero){
      hero.position.y=Math.sin(t*1.5)*0.04;
      hero.userData.legs.forEach(l=>l.pivot.rotation.x=Math.sin(t*3+(l.side>0?0:Math.PI))*0.25);
      hero.userData.arms.forEach(a=>a.pivot.rotation.x=-0.15+Math.sin(t*3+(a.side>0?Math.PI:0))*0.2);
      if(hero.userData.chakraRing){ hero.userData.chakraRing.rotation.z+=dt*0.5; }
    }

    // camera shot cycle
    shotTime+=dt;
    const shot=shots[shotIndex];
    if(shotTime>shot.dur){ shotTime=0; shotIndex=(shotIndex+1)%shots.length;
      document.getElementById('label').innerHTML='<b>'+shots[shotIndex].name+'</b>'; }
    const cam=shot.cam;
    if(cam.spin){
      const a=t*0.4;
      camera.position.set(Math.sin(a)*cam.r, cam.h, 2.5+Math.cos(a)*cam.r);
      camera.lookAt(0,cam.look,2.5);
    } else {
      camera.position.set(...cam.pos);
      camera.lookAt(...cam.look);
    }

    composer.render();
  }

  window.addEventListener('DOMContentLoaded', init);
})();

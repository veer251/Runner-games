// ─── REALISTIC SHOWCASE — PBR + HDRI + rigged animated character ─────────────
'use strict';

(function(){
  let renderer, scene, camera, composer, clock;
  let mixer, hero;
  const loaded = { hdri:false, model:false };

  function init(){
    const canvas=document.getElementById('c');
    renderer=new THREE.WebGLRenderer({canvas, antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(innerWidth,innerHeight);
    renderer.outputEncoding=THREE.sRGBEncoding;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.0;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights=true;

    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 0.1, 500);
    camera.position.set(2.5,1.6,4);
    clock=new THREE.Clock();

    // HDRI image-based lighting (realism)
    const pmrem=new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    new THREE.RGBELoader().load('js/hdri/venice_sunset_1k.hdr', (hdr)=>{
      const envMap=pmrem.fromEquirectangular(hdr).texture;
      scene.environment=envMap;
      scene.background=envMap;
      hdr.dispose();
      loaded.hdri=true; checkReady();
    });

    buildGround();
    buildLights();
    buildEnvironmentProps();
    loadHero();

    // post
    composer=new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene,camera));
    composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.35,0.6,0.9));

    window.addEventListener('resize',onResize);
    animate();
  }

  function onResize(){
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
  }

  function buildGround(){
    // realistic ground with normal-ish detail
    const geo=new THREE.PlaneGeometry(200,200,50,50);
    const mat=new THREE.MeshStandardMaterial({color:0x5a6a3a, roughness:0.95, metalness:0.0});
    const ground=new THREE.Mesh(geo,mat);
    ground.rotation.x=-Math.PI/2; ground.receiveShadow=true;
    scene.add(ground);
    // stone path
    const path=new THREE.Mesh(new THREE.PlaneGeometry(4,200),
      new THREE.MeshStandardMaterial({color:0x8a7a5a, roughness:0.9}));
    path.rotation.x=-Math.PI/2; path.position.y=0.01; path.receiveShadow=true;
    scene.add(path);
  }

  function buildLights(){
    const sun=new THREE.DirectionalLight(0xfff0dd, 3.0);
    sun.position.set(5,10,4); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);
    Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:0.5,far:50});
    sun.shadow.bias=-0.0003; sun.shadow.normalBias=0.02;
    scene.add(sun);
    const fill=new THREE.HemisphereLight(0xbfd8ff,0x4a5a3a,0.4);
    scene.add(fill);
  }

  function buildEnvironmentProps(){
    // realistic-ish trees & rocks for depth (PBR)
    const trunkMat=new THREE.MeshStandardMaterial({color:0x5a4028,roughness:0.9});
    const leafMat=new THREE.MeshStandardMaterial({color:0x2e5a24,roughness:0.85});
    const rockMat=new THREE.MeshStandardMaterial({color:0x6a6a62,roughness:0.9});
    for(let i=0;i<24;i++){
      const side=Math.random()<0.5?-1:1;
      const z=-3-i*2.2;
      const g=new THREE.Group();
      const th=2.5+Math.random()*2.5;
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.32,th,8),trunkMat);
      trunk.position.y=th/2; trunk.castShadow=true; trunk.receiveShadow=true; g.add(trunk);
      for(let j=0;j<3;j++){
        const puff=new THREE.Mesh(new THREE.SphereGeometry(1.1+Math.random()*0.7,10,8),leafMat);
        puff.position.set((Math.random()-.5)*1.1,th+j*0.55,(Math.random()-.5)*1.1);
        puff.castShadow=true; g.add(puff);
      }
      g.position.set(side*(4+Math.random()*7),0,z); scene.add(g);
    }
    for(let i=0;i<14;i++){
      const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(0.4+Math.random()*0.8,0),rockMat);
      rock.position.set((Math.random()<.5?-1:1)*(3+Math.random()*6),0.2,-3-Math.random()*40);
      rock.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
      rock.castShadow=true; rock.receiveShadow=true; scene.add(rock);
    }
  }

  function loadHero(){
    new THREE.GLTFLoader().load('js/models/soldier.glb', (gltf)=>{
      hero=gltf.scene;
      hero.scale.setScalar(1.0);
      hero.position.set(0,0,0);
      hero.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true;
        if(o.material){ o.material.envMapIntensity=1.0; } } });
      scene.add(hero);
      // play Run animation
      mixer=new THREE.AnimationMixer(hero);
      const clips=gltf.animations;
      const run=clips.find(c=>/run/i.test(c.name)) || clips.find(c=>/walk/i.test(c.name)) || clips[0];
      if(run) mixer.clipAction(run).play();
      loaded.model=true; checkReady();
    }, undefined, (err)=>{
      document.getElementById('label').innerHTML='Model load error: '+err;
    });
  }

  function checkReady(){
    if(loaded.hdri && loaded.model){
      document.getElementById('label').innerHTML='<b>Realistic</b> rigged character (running) + HDRI lighting + real shadows + PBR + bloom';
      window.__ready=true;
    }
  }

  let shotTime=0, shotIndex=0;
  const shots=[
    {dur:5, name:'Character running — 3/4 view', cam:{pos:[2.2,1.5,3.5],look:[0,1.0,0]}},
    {dur:5, name:'Close-up detail', cam:{pos:[0.9,1.5,1.8],look:[0,1.2,0]}},
    {dur:5, name:'Behind — gameplay runner angle', cam:{pos:[0,1.7,-3.2],look:[0,1.0,6]}},
    {dur:5, name:'Wide environment', cam:{pos:[5,2.5,6],look:[0,1,-8]}},
  ];

  function animate(){
    requestAnimationFrame(animate);
    const dt=Math.min(clock.getDelta(),0.05);
    if(mixer) mixer.update(dt);

    shotTime+=dt;
    const shot=shots[shotIndex];
    if(shotTime>shot.dur){ shotTime=0; shotIndex=(shotIndex+1)%shots.length;
      if(window.__ready) document.getElementById('label').innerHTML='<b>'+shots[shotIndex].name+'</b>'; }
    const cam=shot.cam;
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.look);

    composer.render();
  }

  window.addEventListener('DOMContentLoaded', init);
})();

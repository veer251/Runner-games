// ─── FX — particles, debris, shockwaves, speed lines, flashes ────────────────
'use strict';

const FX = (() => {
  let scene, camera;
  let debrisPool = [];
  let activeDebris = [];
  let shockwaves = [];
  let puffs = [];
  let confetti = [];
  const DEBRIS_POOL_SIZE = 100;

  // speed lines canvas
  let slCanvas, slCtx, slLines = [];

  function C(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }

  function init(_scene, _camera){
    scene=_scene; camera=_camera;
    buildDebrisPool();
    initSpeedLines();
  }

  // ── Debris pool ──────────────────────────────────────────────────────────────
  function buildDebrisPool(){
    const geos=[new THREE.BoxGeometry(0.2,0.2,0.2), new THREE.TetrahedronGeometry(0.15), new THREE.DodecahedronGeometry(0.13)];
    for(let i=0;i<DEBRIS_POOL_SIZE;i++){
      const geo=geos[i%3];
      const mat=new THREE.MeshStandardMaterial({color:C('#c8a050'),roughness:.9,flatShading:true});
      const m=new THREE.Mesh(geo,mat);
      m.visible=false; m.castShadow=true;
      scene.add(m);
      debrisPool.push(m);
    }
  }

  function getDebris(){
    for(const d of debrisPool){ if(!d.visible) return d; }
    return null;
  }

  // ── Dust puff (jump takeoff) ──────────────────────────────────────────────────
  function dustPuff(x,y,z){
    for(let i=0;i<6;i++){
      const d=getDebris(); if(!d) break;
      d.visible=true; d.material.color=C('#d0c0a0'); d.material.opacity=0.6; d.material.transparent=true;
      d.position.set(x+(Math.random()-.5)*0.5, y+0.1, z);
      d.scale.setScalar(0.5);
      activeDebris.push({mesh:d, vx:(Math.random()-.5)*3, vy:Math.random()*2+1, vz:(Math.random()-.5)*3, spin:0, life:0.5, maxLife:0.5, fade:true});
    }
  }
  function dustRing(x,y,z){
    for(let i=0;i<10;i++){
      const d=getDebris(); if(!d) break;
      const a=i/10*Math.PI*2;
      d.visible=true; d.material.color=C('#d0c0a0'); d.material.opacity=0.5; d.material.transparent=true;
      d.position.set(x,0.1,z); d.scale.setScalar(0.4);
      activeDebris.push({mesh:d, vx:Math.cos(a)*4, vy:1, vz:Math.sin(a)*4, spin:0, life:0.4, maxLife:0.4, fade:true});
    }
  }

  // ── Impact (meteor/rock landing) ──────────────────────────────────────────────
  function impact(x,y,z,color){
    shockwave(x,0.1,z,color||'#ff6b1a');
    for(let i=0;i<15;i++){
      const d=getDebris(); if(!d) break;
      d.visible=true; d.material.color=C(color||'#806040'); d.material.transparent=false; d.material.opacity=1;
      d.position.set(x,0.2,z); d.scale.setScalar(0.8+Math.random()*0.6);
      activeDebris.push({mesh:d, vx:(Math.random()-.5)*10, vy:Math.random()*8+3, vz:(Math.random()-.5)*10, spin:Math.random()*9, life:1.5, maxLife:1.5, fade:false});
    }
  }

  // ── Wall shatter (smash wall break) ──────────────────────────────────────────
  function shatter(x,y,z,color){
    for(let i=0;i<60;i++){
      const d=getDebris(); if(!d) break;
      d.visible=true;
      d.material.color=C(i%3===0 ? '#ff8844' : (color||'#c8a050'));
      d.material.transparent=false; d.material.opacity=1;
      d.position.set(x+(Math.random()-.5)*7, y+Math.random()*3.5, z);
      d.scale.setScalar(0.5+Math.random()*1);
      // some fly toward camera
      const towardCam = i<15;
      activeDebris.push({
        mesh:d,
        vx:(Math.random()-.5)*12,
        vy:Math.random()*12+4,
        vz: towardCam ? (4+Math.random()*8) : -(6+Math.random()*14),
        spin:(Math.random()-.5)*18,
        life:2, maxLife:2, fade:false, bounce:true,
      });
    }
    shockwave(x,0.1,z,color||'#ff6b1a');
    shockwave(x,y,z,'#ffffff');
  }

  // ── Shockwave ring ────────────────────────────────────────────────────────────
  function shockwave(x,y,z,color){
    const ring=new THREE.Mesh(new THREE.RingGeometry(0.2,0.45,32),
      new THREE.MeshBasicMaterial({color:C(color),transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    ring.position.set(x,y,z);
    ring.rotation.x=-Math.PI/2;
    scene.add(ring);
    shockwaves.push({mesh:ring, scale:1, opacity:0.9});
  }

  // ── Chakra burst (rasengan / jutsu) ───────────────────────────────────────────
  function chakraBurst(x,y,z){
    for(let i=0;i<25;i++){
      const d=getDebris(); if(!d) break;
      d.visible=true; d.material.color=C('#40ccff'); d.material.transparent=true; d.material.opacity=0.9;
      d.position.set(x,y,z); d.scale.setScalar(0.3+Math.random()*0.4);
      const a=Math.random()*Math.PI*2, sp=Math.random()*6+2;
      activeDebris.push({mesh:d, vx:Math.cos(a)*sp, vy:(Math.random()-.3)*6, vz:Math.sin(a)*sp - 3, spin:Math.random()*10, life:0.8, maxLife:0.8, fade:true});
    }
    shockwave(x,y,z,'#00aaff');
  }

  // ── Confetti (celebration) ────────────────────────────────────────────────────
  function celebrate(x,y,z){
    const colors=['#ff6b1a','#ffd700','#00aaff','#ff3366','#40c050'];
    for(let i=0;i<40;i++){
      const d=getDebris(); if(!d) break;
      d.visible=true; d.material.color=C(colors[i%colors.length]); d.material.transparent=false; d.material.opacity=1;
      d.position.set(x+(Math.random()-.5)*4, y+3+Math.random()*3, z-2);
      d.scale.set(0.4,0.4,0.05);
      activeDebris.push({mesh:d, vx:(Math.random()-.5)*6, vy:Math.random()*4+2, vz:(Math.random()-.5)*4, spin:Math.random()*12, life:3, maxLife:3, fade:false, bounce:false, float:true});
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────────
  function update(dt){
    // debris
    for(let i=activeDebris.length-1;i>=0;i--){
      const p=activeDebris[i];
      const m=p.mesh;
      if(p.float){
        p.vy -= 8*dt; // lighter gravity, flutter
        m.position.x += p.vx*dt + Math.sin(performance.now()*0.005+i)*0.02;
      } else {
        p.vy -= 26*dt;
        m.position.x += p.vx*dt;
      }
      m.position.y += p.vy*dt;
      m.position.z += p.vz*dt;
      m.rotation.x += p.spin*dt; m.rotation.y += p.spin*dt*0.7;
      if(m.position.y<=0.05 && p.bounce && p.vy<0){ m.position.y=0.05; p.vy*=-0.35; p.vx*=0.8; p.vz*=0.8; }
      else if(m.position.y<0 && !p.bounce){ m.position.y=0; p.vy=0; }
      p.life -= dt;
      if(p.life < 0.5 && (p.fade || p.life<0.3)){
        m.material.transparent=true;
        m.material.opacity = Math.max(0, p.life/0.5);
        m.scale.multiplyScalar(0.96);
      }
      if(p.life<=0){
        m.visible=false; m.scale.setScalar(1); m.material.opacity=1; m.material.transparent=false;
        activeDebris.splice(i,1);
      }
    }

    // shockwaves
    for(let i=shockwaves.length-1;i>=0;i--){
      const s=shockwaves[i];
      s.scale += 18*dt;
      s.opacity -= 2.2*dt;
      s.mesh.scale.setScalar(s.scale);
      s.mesh.material.opacity=Math.max(0,s.opacity);
      if(s.opacity<=0){
        scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose();
        shockwaves.splice(i,1);
      }
    }
  }

  // ── Speed lines ─────────────────────────────────────────────────────────────
  function initSpeedLines(){
    slCanvas=document.getElementById('speedLines');
    slCtx=slCanvas.getContext('2d');
    resizeSpeedLines();
    for(let i=0;i<45;i++){
      slLines.push({angle:Math.random()*Math.PI*2, width:Math.random()*2+1});
    }
  }
  function resizeSpeedLines(){
    if(!slCanvas) return;
    slCanvas.width=window.innerWidth; slCanvas.height=window.innerHeight;
  }
  function updateSpeedLines(speed){
    if(!slCtx) return;
    const intensity=Math.max(0,(speed-14)/8);
    slCanvas.style.opacity = Math.min(1, intensity);
    if(intensity<=0){ slCtx.clearRect(0,0,slCanvas.width,slCanvas.height); return; }
    const w=slCanvas.width, h=slCanvas.height, cx=w/2, cy=h/2;
    slCtx.clearRect(0,0,w,h);
    slCtx.strokeStyle='rgba(255,255,255,'+(0.5*intensity)+')';
    const maxR=Math.hypot(cx,cy);
    slLines.forEach(l=>{
      const len=(0.15+Math.random()*0.15)*maxR*intensity;
      const r0=maxR*(0.55+Math.random()*0.1);
      const x0=cx+Math.cos(l.angle)*r0, y0=cy+Math.sin(l.angle)*r0;
      const x1=cx+Math.cos(l.angle)*(r0+len), y1=cy+Math.sin(l.angle)*(r0+len);
      slCtx.lineWidth=l.width;
      slCtx.beginPath(); slCtx.moveTo(x0,y0); slCtx.lineTo(x1,y1); slCtx.stroke();
    });
  }

  // ── Screen flash ────────────────────────────────────────────────────────────
  function flash(color, alpha){
    const el=document.getElementById('flash');
    el.style.background=color||'#ffffff';
    el.style.opacity=alpha||1;
    void el.offsetWidth;
    el.style.opacity=0;
  }
  function vignette(on){
    const el=document.getElementById('vignette');
    el.style.opacity = on ? 1 : 0;
    if(on) setTimeout(()=>{el.style.opacity=0;}, 250);
  }

  function reset(){
    activeDebris.forEach(p=>{p.mesh.visible=false;p.mesh.scale.setScalar(1);p.mesh.material.opacity=1;p.mesh.material.transparent=false;});
    activeDebris=[];
    shockwaves.forEach(s=>{scene.remove(s.mesh);s.mesh.geometry.dispose();s.mesh.material.dispose();});
    shockwaves=[];
  }

  return {
    init, update, reset,
    dustPuff, dustRing, impact, shatter, shockwave, chakraBurst, celebrate,
    updateSpeedLines, resizeSpeedLines, flash, vignette,
  };
})();

window.FX = FX;

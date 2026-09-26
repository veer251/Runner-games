// ─── PLAYER — movement, physics, camera feel ─────────────────────────────────
'use strict';

const Player = (() => {
  let camera;
  const LANES = [-2.6, 0, 2.6];

  const p = {
    lane: 1,
    x: 0, targetX: 0,
    z: 0,
    feetY: 0, vy: 0,
    speed: 14,
    jumping: false,
    ducking: false,
    duckTimer: 0,
    grounded: true,
    // camera feel
    roll: 0, pitch: 0,
    bobPhase: 0,
    trauma: 0,
    fovPunch: 0, punchZ: 0,
    // state locks (set pieces)
    locked: false,       // movement locked (smash/push)
    eye: 1.7,
  };

  // physics constants
  const GRAVITY = -34, JUMP_V = 11.5, DUCK_TIME = 0.7;

  function init(_camera){
    camera = _camera;
    camera.fov = 72;
    camera.updateProjectionMatrix();
  }

  function reset(startSpeed){
    p.lane=1; p.x=0; p.targetX=0; p.z=0;
    p.feetY=0; p.vy=0; p.speed=startSpeed||14;
    p.jumping=false; p.ducking=false; p.duckTimer=0; p.grounded=true;
    p.roll=0; p.pitch=0; p.bobPhase=0; p.trauma=0;
    p.fovPunch=0; p.punchZ=0; p.locked=false;
  }

  // ── Input actions ────────────────────────────────────────────────────────────
  function moveLane(dir){
    if(p.locked) return;
    const n = Math.max(0, Math.min(2, p.lane+dir));
    if(n!==p.lane){
      p.lane=n; p.targetX=LANES[n];
      if(dir<0) Audio.left(); else Audio.right();
    }
  }
  function jump(){
    if(p.locked) return;
    if(p.grounded && !p.jumping){
      p.jumping=true; p.grounded=false; p.vy=JUMP_V;
      p.fovPunch+=2;
      Audio.jump();
      if(window.FX) FX.dustPuff(p.x, 0, p.z);
    }
  }
  function duck(){
    if(p.locked) return;
    if(!p.ducking){
      p.ducking=true; p.duckTimer=DUCK_TIME;
      Audio.duck();
      if(!p.grounded){ p.vy = -18; } // fast fall
    } else {
      p.duckTimer=DUCK_TIME; // extend
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────────
  function update(dt, worldSpeed){
    const d = (k) => 1 - Math.exp(-k*dt);

    // forward motion
    p.speed = worldSpeed;
    if(!p.locked) p.z -= p.speed * dt;

    // lane lerp
    p.x += (p.targetX - p.x) * d(14);

    // roll (bank into lane change)
    const targetRoll = -(p.targetX - p.x) * 0.06;
    p.roll += (targetRoll - p.roll) * d(12);

    // jump physics
    if(p.jumping){
      p.vy += GRAVITY*dt;
      p.feetY += p.vy*dt;
      if(p.feetY<=0){
        p.feetY=0; p.vy=0; p.jumping=false; p.grounded=true;
        p.trauma+=0.12;
        Audio.land();
        if(window.FX) FX.dustRing(p.x, 0, p.z);
      }
    }
    p.grounded = !p.jumping;

    // duck timer
    if(p.ducking){
      p.duckTimer -= dt;
      if(p.duckTimer<=0) p.ducking=false;
    }

    // bob
    if(p.grounded && !p.ducking && !p.locked){
      p.bobPhase += dt * p.speed * 0.65;
    }
    const bobY = (p.grounded && !p.ducking) ? Math.abs(Math.sin(p.bobPhase))*0.06 : 0;
    const bobX = (p.grounded && !p.ducking) ? Math.cos(p.bobPhase*0.5)*0.035 : 0;

    // pitch (duck/jump)
    const pitchT = p.ducking ? -0.08 : (p.jumping ? (p.vy/JUMP_V)*0.05 : 0);
    p.pitch += (pitchT - p.pitch) * d(10);

    // trauma shake
    p.trauma = Math.max(0, p.trauma - dt*1.8);
    const sh = p.trauma*p.trauma;
    const shX = (Math.random()-0.5)*sh*0.25;
    const shY = (Math.random()-0.5)*sh*0.25;

    // eye height (duck lowers)
    const targetEye = p.ducking ? 0.75 : 1.7;
    p.eye += (targetEye - p.eye) * d(16);

    // apply to camera
    camera.position.set(
      p.x + bobX + shX,
      p.feetY + p.eye + bobY + shY,
      p.z + p.punchZ
    );
    camera.rotation.set(
      p.pitch + sh*0.02*(Math.random()-0.5),
      0,
      p.roll
    );

    // FOV kick with speed
    const fovT = 72 + (p.speed-14)*0.9 + p.fovPunch;
    camera.fov += (fovT - camera.fov) * d(6);
    camera.updateProjectionMatrix();
    p.fovPunch *= Math.exp(-6*dt);
    p.punchZ *= Math.exp(-14*dt);
  }

  // hooks for events
  function addTrauma(v){ p.trauma=Math.min(1,p.trauma+v); }
  function addFovPunch(v){ p.fovPunch+=v; }
  function addPunchZ(v){ p.punchZ+=v; }
  function lock(v){ p.locked=v; }
  function setSpeed(s){ p.speed=s; }

  return {
    init, reset, update, moveLane, jump, duck,
    addTrauma, addFovPunch, addPunchZ, lock, setSpeed,
    get state(){ return p; },
    LANES,
  };
})();

window.Player = Player;

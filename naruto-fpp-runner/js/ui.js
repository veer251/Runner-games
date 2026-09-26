// ─── UI — screens, cards, HUD, pose walls, boss bar, shouts ──────────────────
'use strict';

const UI = (() => {
  let els = {};
  let hudEnabled = false;

  function init(){
    const ids = ['startScreen','pauseScreen','levelCompleteScreen','gameOverScreen','winScreen',
      'levelIntro','levelIntroNumber','levelIntroName','levelIntroMoves',
      'moveCue','bossBar','bossName','bossBarInner','bossRound',
      'hud','hudLevel','hudProgressInner','hudSpeed','shout',
      'poseWall','poseIcon','poseLabel','levelMapDisplay','nextLevelName',
      'levelStars','levelCompleteTitle','guidePill'];
    ids.forEach(id => els[id] = document.getElementById(id));

    hudEnabled = new URLSearchParams(location.search).has('hud');
    if(hudEnabled) els.hud.style.display='flex';

    buildLevelMap();
  }

  // ── Level map on start screen ─────────────────────────────────────────────────
  function buildLevelMap(){
    const map = els.levelMapDisplay;
    map.innerHTML='';
    THEME.levels.forEach((lvl,i)=>{
      const item=document.createElement('div');
      item.className='levelMapItem';
      item.innerHTML = `L${i+1}<span>${lvl.name.split(' ')[0]}</span>`;
      map.appendChild(item);
    });
  }

  // ── Screen helpers ────────────────────────────────────────────────────────────
  function show(screen){ els[screen].classList.remove('hidden'); }
  function hide(screen){ els[screen].classList.add('hidden'); }
  function hideAll(){
    ['startScreen','pauseScreen','levelCompleteScreen','gameOverScreen','winScreen'].forEach(s=>hide(s));
  }

  // ── Level intro card ─────────────────────────────────────────────────────────
  function showLevelIntro(lvl, idx, cb){
    els.levelIntroNumber.textContent = 'LEVEL '+(idx+1);
    els.levelIntroName.textContent = lvl.name;
    // move icons
    const moveIcons = {jump:'⬆ JUMP', duck:'⬇ DUCK', dodge:'⬅➡ DODGE', pose:'🙌 POSE', smash:'👊 SMASH', push:'🛒 PUSH', boss:'⚡ BOSS'};
    els.levelIntroMoves.innerHTML='';
    lvl.allowedMoves.forEach(mv=>{
      const el=document.createElement('div');
      el.className='introMove';
      el.textContent = moveIcons[mv]||mv;
      if(lvl.newMove && (mv==='pose'&&lvl.newMove.includes('SIGN') || mv==='smash'&&lvl.newMove.includes('SMASH') || mv==='push'&&lvl.newMove.includes('PUSH') || mv==='boss')){
        el.classList.add('newMove');
        el.textContent += ' ✦NEW';
      }
      els.levelIntroMoves.appendChild(el);
    });
    els.levelIntro.classList.remove('hidden');
    els.levelIntro.style.opacity=1;
    setTimeout(()=>{
      els.levelIntro.style.opacity=0;
      setTimeout(()=>{ els.levelIntro.classList.add('hidden'); if(cb) cb(); }, 500);
    }, 2600);
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  function updateHUD(lvlIdx, progress, speed){
    if(!hudEnabled) return;
    els.hudLevel.textContent = 'LEVEL '+(lvlIdx+1);
    els.hudProgressInner.style.width = (progress*100)+'%';
    els.hudSpeed.textContent = Math.round(speed)+' m/s';
  }

  // ── Move cue ──────────────────────────────────────────────────────────────────
  let cueTimer=0;
  function showMoveCue(action){
    const icons={jump:'⬆',duck:'⬇',dodgeL:'⬅',dodgeR:'➡',dodge:'⬅➡',smash:'👊',push:'🛒',pose:'🙌'};
    els.moveCue.textContent = icons[action]||'●';
    els.moveCue.style.opacity=1;
    cueTimer=0.8;
  }
  function updateMoveCue(dt){
    if(cueTimer>0){ cueTimer-=dt; if(cueTimer<=0) els.moveCue.style.opacity=0; }
  }

  // ── Shout text ─────────────────────────────────────────────────────────────────
  let shoutTimer=0;
  function shout(text){
    els.shout.textContent=text;
    els.shout.style.opacity=1;
    els.shout.style.transform='translate(-50%,-50%) scale(1.1)';
    shoutTimer=1.0;
  }
  function shoutRandom(tier){
    const pool = THEME.shouts[tier]||THEME.shouts.nice;
    shout(pool[Math.floor(Math.random()*pool.length)]);
  }
  function updateShout(dt){
    if(shoutTimer>0){
      shoutTimer-=dt;
      if(shoutTimer<0.3){ els.shout.style.opacity=shoutTimer/0.3; }
      if(shoutTimer<=0){ els.shout.style.opacity=0; els.shout.style.transform='translate(-50%,-50%) scale(0.5)'; }
    }
  }

  // ── Pose wall ─────────────────────────────────────────────────────────────────
  let poseTimer=0;
  function showPose(pose){
    els.poseIcon.textContent = pose.icon;
    els.poseLabel.textContent = pose.label + '!';
    els.poseWall.style.display='flex';
    poseTimer=1.2;
  }
  function updatePose(dt){
    if(poseTimer>0){
      poseTimer-=dt;
      if(poseTimer<=0) els.poseWall.style.display='none';
    }
  }

  // ── Boss bar ─────────────────────────────────────────────────────────────────
  function showBossBar(name){
    els.bossName.textContent=name;
    els.bossBar.style.display='flex';
    els.bossBarInner.style.width='100%';
  }
  function updateBossBar(healthFrac, round){
    els.bossBarInner.style.width=(healthFrac*100)+'%';
    els.bossRound.textContent = round;
  }
  function hideBossBar(){ els.bossBar.style.display='none'; }

  // ── Level complete ─────────────────────────────────────────────────────────────
  function showLevelComplete(stars, nextName){
    els.levelStars.textContent = '⭐'.repeat(Math.max(1,stars)) + '☆'.repeat(3-stars);
    els.nextLevelName.textContent = nextName ? 'NEXT: '+nextName : '';
    show('levelCompleteScreen');
  }

  function setGuide(text){ if(els.guidePill) els.guidePill.textContent=text; }

  return {
    init, show, hide, hideAll, showLevelIntro, updateHUD,
    showMoveCue, updateMoveCue, shout, shoutRandom, updateShout,
    showPose, updatePose, showBossBar, updateBossBar, hideBossBar,
    showLevelComplete, setGuide,
  };
})();

window.UI = UI;

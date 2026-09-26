// ─── PROCEDURAL TEXTURES ─────────────────────────────────────────────────────
'use strict';

const Textures = (() => {
  const cache = new Map();
  let maxAniso = 1;

  function init(renderer) {
    maxAniso = renderer.capabilities.getMaxAnisotropy();
  }

  function make(key, size, drawFn) {
    if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    drawFn(ctx, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = maxAniso;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    cache.set(key, tex);
    return tex;
  }

  // Seeded RNG
  function mkRng(seed) {
    let s = seed || 12345;
    return () => { s=(s*9301+49297)%233280; return s/233280; };
  }

  // ── Cobblestone ──────────────────────────────────────────────────────────────
  function cobblestone(ctx, s) {
    const rng = mkRng(101);
    ctx.fillStyle = '#7a6a50'; ctx.fillRect(0,0,s,s);
    const tones = ['#9a8a68','#8a7a58','#b0a080','#7a6848','#c0aa84'];
    const rows = 8, cols = 8;
    const cw = s/cols, ch = s/rows;
    for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
      const jx = (rng()-.5)*cw*.3, jy = (rng()-.5)*ch*.3;
      const x = c*cw+jx+2, y = r*ch+jy+2;
      const w = cw-4+rng()*4, h = ch-4+rng()*4;
      ctx.fillStyle = tones[Math.floor(rng()*tones.length)];
      ctx.beginPath();
      roundRect(ctx,x,y,w,h,3);
      ctx.fill();
      // highlight top-left
      ctx.fillStyle = 'rgba(255,240,210,.14)';
      ctx.fillRect(x,y,2,h);
      ctx.fillRect(x,y,w,2);
      // shadow bottom-right
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(x+w-2,y,2,h);
      ctx.fillRect(x,y+h-2,w,2);
      // grain
      for(let i=0;i<5;i++){
        ctx.fillStyle='rgba(0,0,0,.12)';
        ctx.fillRect(x+rng()*w,y+rng()*h,rng()*2+1,rng()*2+1);
      }
    }
  }

  // ── Dirt track ───────────────────────────────────────────────────────────────
  function dirt(ctx, s) {
    const rng = mkRng(202);
    ctx.fillStyle = '#3a2510'; ctx.fillRect(0,0,s,s);
    for(let i=0;i<8000;i++){
      const x=rng()*s,y=rng()*s;
      const b=Math.floor(rng()*40)-20;
      const br=50+b,bg=35+b,bb=15+b;
      ctx.fillStyle=`rgb(${br},${bg},${bb})`;
      ctx.fillRect(x,y,rng()*3+1,rng()*2+1);
    }
    // roots/cracks
    for(let c=0;c<8;c++){
      let x=rng()*s,y=rng()*s;
      ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=rng()*2+1;
      ctx.beginPath();ctx.moveTo(x,y);
      for(let i=0;i<6;i++){x+=rng()*20-10;y+=rng()*20-10;ctx.lineTo(x,y);}
      ctx.stroke();
    }
  }

  // ── Tree bark ────────────────────────────────────────────────────────────────
  function bark(ctx, s) {
    const rng = mkRng(303);
    ctx.fillStyle='#2a3818';ctx.fillRect(0,0,s,s);
    for(let i=0;i<20;i++){
      const y=rng()*s;const h=rng()*12+4;
      ctx.fillStyle=`rgba(${Math.floor(rng()*30+30)},${Math.floor(rng()*30+50)},${Math.floor(rng()*10+10)},.8)`;
      ctx.fillRect(0,y,s,h);
    }
    for(let c=0;c<12;c++){
      ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=rng()*1.5+.5;
      ctx.beginPath();ctx.moveTo(0,rng()*s);
      let x=0,y=rng()*s;
      for(let i=0;i<10;i++){x+=rng()*s*.12;y+=rng()*6-3;ctx.lineTo(x,y);}
      ctx.stroke();
    }
  }

  // ── Tiled stone (training ground) ───────────────────────────────────────────
  function tiledStone(ctx, s) {
    const rng=mkRng(404);
    ctx.fillStyle='#b09878';ctx.fillRect(0,0,s,s);
    const tones=['#c0a888','#b09070','#d0b890','#a08858'];
    const n=4;const ts=s/n;
    for(let r=0;r<n;r++) for(let c=0;c<n;c++){
      ctx.fillStyle=tones[Math.floor(rng()*tones.length)];
      ctx.fillRect(c*ts+1,r*ts+1,ts-2,ts-2);
      ctx.fillStyle='rgba(255,240,200,.1)';
      ctx.fillRect(c*ts+1,r*ts+1,ts-2,2);
      ctx.fillStyle='rgba(0,0,0,.3)';
      ctx.fillRect(c*ts+1,r*ts+ts-3,ts-2,2);
    }
    ctx.strokeStyle='rgba(60,40,20,.7)';ctx.lineWidth=2;
    for(let r=1;r<n;r++){ctx.beginPath();ctx.moveTo(0,r*ts);ctx.lineTo(s,r*ts);ctx.stroke();}
    for(let c=1;c<n;c++){ctx.beginPath();ctx.moveTo(c*ts,0);ctx.lineTo(c*ts,s);ctx.stroke();}
  }

  // ── Sand ─────────────────────────────────────────────────────────────────────
  function sand(ctx, s) {
    const rng=mkRng(505);
    const grd=ctx.createLinearGradient(0,0,s,s);
    grd.addColorStop(0,'#d4a840');grd.addColorStop(.5,'#c89030');grd.addColorStop(1,'#e0b850');
    ctx.fillStyle=grd;ctx.fillRect(0,0,s,s);
    for(let i=0;i<30000;i++){
      const x=rng()*s,y=rng()*s;const b=Math.floor(rng()*30-15);
      ctx.fillStyle=`rgba(${200+b},${150+b},${50+b},.6)`;
      ctx.fillRect(x,y,1,1);
    }
    for(let i=0;i<30;i++){
      const y=rng()*s;const amp=rng()*3+1;
      ctx.strokeStyle=`rgba(${180+Math.floor(rng()*40)},${130+Math.floor(rng()*30)},40,.4)`;
      ctx.lineWidth=1;ctx.beginPath();
      for(let x=0;x<s;x+=4){ctx.lineTo(x,y+Math.sin(x*.05+i)*amp);}
      ctx.stroke();
    }
  }

  // ── Dark stone (akatsuki) ────────────────────────────────────────────────────
  function darkStone(ctx, s) {
    const rng=mkRng(606);
    ctx.fillStyle='#1a1818';ctx.fillRect(0,0,s,s);
    for(let i=0;i<3000;i++){
      const x=rng()*s,y=rng()*s;
      ctx.fillStyle=`rgba(${Math.floor(rng()*20+10)},${Math.floor(rng()*20+10)},${Math.floor(rng()*20+10)},.8)`;
      ctx.fillRect(x,y,rng()*3+1,rng()*3+1);
    }
    // blood-red cracks
    for(let c=0;c<5;c++){
      let x=rng()*s,y=rng()*s;
      ctx.strokeStyle='rgba(150,10,10,.4)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y);
      for(let i=0;i<8;i++){x+=rng()*16-8;y+=rng()*16-8;ctx.lineTo(x,y);}
      ctx.stroke();
    }
  }

  // ── Bridge wood ──────────────────────────────────────────────────────────────
  function bridgeWood(ctx, s) {
    const rng=mkRng(707);
    const planks=['#706050','#605040','#807060','#504030'];
    const ph=s/8;
    for(let r=0;r<8;r++){
      ctx.fillStyle=planks[r%planks.length];
      ctx.fillRect(0,r*ph,s,ph-2);
      // grain
      for(let i=0;i<12;i++){
        const gx=rng()*s;
        ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=.5;
        ctx.beginPath();ctx.moveTo(gx,r*ph);
        let xx=gx;
        for(let j=0;j<6;j++){xx+=rng()*8-4;ctx.lineTo(xx,r*ph+j*(ph/6));}
        ctx.stroke();
      }
    }
    ctx.fillStyle='rgba(0,0,0,.6)';
    for(let r=1;r<8;r++){ctx.fillRect(0,r*ph-2,s,2);}
  }

  // ── Rubble ───────────────────────────────────────────────────────────────────
  function rubble(ctx, s) {
    const rng=mkRng(808);
    ctx.fillStyle='#383030';ctx.fillRect(0,0,s,s);
    const tones=['#503a30','#403028','#604840','#282020'];
    for(let i=0;i<40;i++){
      ctx.fillStyle=tones[Math.floor(rng()*tones.length)];
      const x=rng()*s,y=rng()*s,w=rng()*s*.15+s*.05,h=rng()*s*.1+s*.04;
      ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(rng()*Math.PI);
      ctx.fillRect(-w/2,-h/2,w,h);ctx.restore();
    }
    for(let i=0;i<3000;i++){
      const x=rng()*s,y=rng()*s;
      ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x,y,rng()*2+1,rng()*2+1);
    }
  }

  // ── Battle earth ─────────────────────────────────────────────────────────────
  function battleEarth(ctx, s) {
    const rng=mkRng(909);
    ctx.fillStyle='#3a2a10';ctx.fillRect(0,0,s,s);
    for(let i=0;i<10000;i++){
      const x=rng()*s,y=rng()*s;
      const v=Math.floor(rng()*40+20);
      ctx.fillStyle=`rgb(${v+30},${v+15},${v})`;
      ctx.fillRect(x,y,rng()*3+1,rng()*2+1);
    }
    // scorch marks
    for(let i=0;i<8;i++){
      const x=rng()*s,y=rng()*s,r=rng()*30+10;
      const grd=ctx.createRadialGradient(x,y,0,x,y,r);
      grd.addColorStop(0,'rgba(0,0,0,.7)');
      grd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grd;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
  }

  // ── Wet rock (valley of the end) ─────────────────────────────────────────────
  function wetRock(ctx, s) {
    const rng=mkRng(1010);
    ctx.fillStyle='#282830';ctx.fillRect(0,0,s,s);
    const tones=['#303038','#242430','#383840','#1e1e28'];
    for(let i=0;i<20;i++){
      ctx.fillStyle=tones[Math.floor(rng()*tones.length)];
      const x=rng()*s,y=rng()*s,w=rng()*s*.25+s*.05,h=rng()*s*.15+s*.05;
      ctx.save();ctx.translate(x,y);ctx.rotate(rng()*Math.PI*.5);
      roundRect(ctx,0,0,w,h,4);ctx.fill();ctx.restore();
    }
    // wet sheen
    for(let i=0;i<15;i++){
      const x=rng()*s,y=rng()*s,w=rng()*40+5,h=rng()*4+1;
      ctx.fillStyle='rgba(80,100,140,.25)';
      ctx.fillRect(x,y,w,h);
    }
  }

  // ── Road/asphalt (generic) ────────────────────────────────────────────────────
  function asphalt(ctx, s) {
    const rng=mkRng(1111);
    ctx.fillStyle='#2a2a2a';ctx.fillRect(0,0,s,s);
    for(let i=0;i<50000;i++){
      const x=rng()*s,y=rng()*s;
      const v=Math.floor(rng()*30+20);
      ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(x,y,1,1);
    }
    // crack lines
    for(let c=0;c<60;c++){
      let x=rng()*s,y=rng()*s;
      ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=rng()*2.5+.5;
      ctx.beginPath();ctx.moveTo(x,y);
      for(let i=0;i<5;i++){x+=rng()*16-8;y+=rng()*16-8;ctx.lineTo(x,y);}
      ctx.stroke();
    }
  }

  // ── Glowing window (city buildings) ──────────────────────────────────────────
  function glowWindow(ctx, s, color='#ffffa0') {
    ctx.fillStyle='#1a1a2a';ctx.fillRect(0,0,s,s);
    const cols=6,rows=8,cw=s/cols,ch=s/rows,pad=3;
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const on = Math.random()>.4;
      if(!on){ctx.fillStyle='#0a0a18';ctx.fillRect(c*cw+pad,r*ch+pad,cw-pad*2,ch-pad*2);continue;}
      const grd=ctx.createRadialGradient(c*cw+cw/2,r*ch+ch/2,0,c*cw+cw/2,r*ch+ch/2,cw*.8);
      grd.addColorStop(0,'rgba(255,255,200,.9)');grd.addColorStop(1,'rgba(255,200,80,.15)');
      ctx.fillStyle=grd;ctx.fillRect(c*cw+pad,r*ch+pad,cw-pad*2,ch-pad*2);
    }
  }

  // ── Crack decal (smash wall) ──────────────────────────────────────────────────
  function crackDecal(ctx, s, color='#ff6b1a') {
    ctx.clearRect(0,0,s,s);
    const cx=s/2,cy=s/2;
    const lines=[
      [[cx,cy],[cx-s*.3,cy-s*.2],[cx-s*.45,cy-s*.1]],
      [[cx,cy],[cx+s*.35,cy-s*.25]],
      [[cx,cy],[cx+s*.2,cy+s*.3],[cx+s*.1,cy+s*.45]],
      [[cx,cy],[cx-s*.25,cy+s*.35]],
      [[cx,cy],[cx+s*.1,cy-s*.4]],
      [[cx,cy],[cx-s*.1,cy+s*.2],[cx-s*.3,cy+s*.15]],
    ];
    lines.forEach(pts=>{
      ctx.lineWidth=18;ctx.strokeStyle=color+'66';ctx.lineCap='round';
      ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
      ctx.lineWidth=8;ctx.strokeStyle='#fff8';
      ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
      ctx.lineWidth=3;ctx.strokeStyle='#fff';
      ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    });
  }

  // ── Particle sprite ───────────────────────────────────────────────────────────
  function particleSprite(ctx, s, color='#ffffff') {
    const grd=ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
    grd.addColorStop(0,color);grd.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grd;ctx.fillRect(0,0,s,s);
  }

  // ── Contact shadow blob ───────────────────────────────────────────────────────
  function shadowBlob(ctx, s) {
    const grd=ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
    grd.addColorStop(0,'rgba(0,0,0,.55)');grd.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grd;ctx.fillRect(0,0,s,s);
  }

  // ── Naruto headband spiral ────────────────────────────────────────────────────
  function headbandSpiral(ctx, s) {
    ctx.fillStyle='#c0c8d0';ctx.fillRect(0,0,s,s);
    ctx.strokeStyle='#303840';ctx.lineWidth=s*.06;
    ctx.beginPath();
    ctx.arc(s/2,s/2,s*.3,0,Math.PI*2);ctx.stroke();
    // leaf symbol lines
    ctx.lineWidth=s*.04;
    ctx.beginPath();ctx.moveTo(s*.35,s*.5);ctx.lineTo(s*.65,s*.5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(s*.5,s*.35);ctx.lineTo(s*.5,s*.65);ctx.stroke();
    ctx.beginPath();ctx.moveTo(s*.38,s*.38);ctx.lineTo(s*.62,s*.62);ctx.stroke();
    ctx.beginPath();ctx.moveTo(s*.62,s*.38);ctx.lineTo(s*.38,s*.62);ctx.stroke();
  }

  // ── Helper: rounded rect path ─────────────────────────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function get(name, size=512) {
    return make(name, size, (ctx,s) => {
      switch(name) {
        case 'cobblestone': cobblestone(ctx,s); break;
        case 'dirt':        dirt(ctx,s);        break;
        case 'bark':        bark(ctx,s);        break;
        case 'tiledStone':  tiledStone(ctx,s);  break;
        case 'sand':        sand(ctx,s);        break;
        case 'darkStone':   darkStone(ctx,s);   break;
        case 'bridgeWood':  bridgeWood(ctx,s);  break;
        case 'rubble':      rubble(ctx,s);      break;
        case 'battleEarth': battleEarth(ctx,s); break;
        case 'wetRock':     wetRock(ctx,s);     break;
        case 'asphalt':     asphalt(ctx,s);     break;
        default:            dirt(ctx,s);
      }
    });
  }

  function getParticle(color='#ffffff') {
    const key='particle_'+color;
    return make(key,64,(ctx,s)=>particleSprite(ctx,s,color));
  }

  function getShadowBlob() {
    return make('shadowBlob',128,shadowBlob);
  }

  function getCrackDecal(stage=1) {
    const key='crack'+stage;
    return make(key,512,(ctx,s)=>{
      const c=['#ff6b1a','#ff9940','#ffffff'][stage-1];
      crackDecal(ctx,s,c);
    });
  }

  function getHeadbandSpiral() {
    return make('headband',256,headbandSpiral);
  }

  function getGlowWindow() {
    return make('glowWindow',256,glowWindow);
  }

  return { init, get, getParticle, getShadowBlob, getCrackDecal, getHeadbandSpiral, getGlowWindow };
})();

window.Textures = Textures;

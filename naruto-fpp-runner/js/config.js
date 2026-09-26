// ─── NARUTO FPP RUNNER — CONFIG ───────────────────────────────────────────────
'use strict';

// Polyfill: CapsuleGeometry (added in three r140) — approximate for r128.
// Signature: (radius, length, capSegments, radialSegments)
if (typeof THREE.CapsuleGeometry === 'undefined') {
  THREE.CapsuleGeometry = function(radius=1, length=1, capSeg=4, radialSeg=8){
    const geos = [];
    const cyl = new THREE.CylinderGeometry(radius, radius, length, radialSeg, 1, false);
    geos.push(cyl);
    const topCap = new THREE.SphereGeometry(radius, radialSeg, capSeg*2, 0, Math.PI*2, 0, Math.PI/2);
    topCap.translate(0, length/2, 0);
    geos.push(topCap);
    const botCap = new THREE.SphereGeometry(radius, radialSeg, capSeg*2, 0, Math.PI*2, Math.PI/2, Math.PI/2);
    botCap.translate(0, -length/2, 0);
    geos.push(botCap);
    // merge manually
    return mergeGeometries(geos);
  };
}
function mergeGeometries(geos){
  // simple merge for BufferGeometry (position, normal, uv)
  let totalVerts = 0, totalIndices = 0;
  geos.forEach(g => {
    totalVerts += g.attributes.position.count;
    if (g.index) totalIndices += g.index.count;
    else totalIndices += g.attributes.position.count;
  });
  const merged = new THREE.BufferGeometry();
  const pos = new Float32Array(totalVerts*3);
  const nor = new Float32Array(totalVerts*3);
  const uv  = new Float32Array(totalVerts*2);
  const idx = [];
  let vOff = 0;
  geos.forEach(g => {
    const p = g.attributes.position.array;
    const n = g.attributes.normal ? g.attributes.normal.array : null;
    const u = g.attributes.uv ? g.attributes.uv.array : null;
    const vc = g.attributes.position.count;
    pos.set(p, vOff*3);
    if (n) nor.set(n, vOff*3);
    if (u) uv.set(u, vOff*2);
    if (g.index) {
      const gi = g.index.array;
      for (let i=0;i<gi.length;i++) idx.push(gi[i]+vOff);
    } else {
      for (let i=0;i<vc;i++) idx.push(i+vOff);
    }
    vOff += vc;
  });
  merged.setAttribute('position', new THREE.BufferAttribute(pos,3));
  merged.setAttribute('normal', new THREE.BufferAttribute(nor,3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uv,2));
  merged.setIndex(idx);
  return merged;
}

const C = (hex) => new THREE.Color(hex).convertSRGBToLinear();

const THEME = {
  name: 'Naruto FPP Runner',
  lanes: [-2.6, 0, 2.6],
  laneWidth: 2.6,
  trackWidth: 8,

  // ── Colors ──────────────────────────────────────────────────────────────────
  palette: {
    orange:    '#ff6b1a',
    orangeDk:  '#cc4400',
    blue:      '#1a3a8b',
    blueLt:    '#4a7fd4',
    red:       '#cc2200',
    yellow:    '#ffd700',
    white:     '#f0f0f0',
    sandstone: '#d4a855',
    forestGn:  '#2d6b2a',
    darkPurple:'#3a1560',
    akatsuki:  '#cc0000',
    chakraBlue:'#00aaff',
  },

  // ── 10 Levels ────────────────────────────────────────────────────────────────
  levels: [
    {
      // Level 1 — Konoha Academy
      name: 'NINJA ACADEMY',
      subtitle: 'Konoha Village — Bright Day',
      duration: 90,
      speedStart: 13, speedEnd: 15,
      obstaclGap: 36,
      sky: { top:'#1a4a9b', mid:'#4a8fd4', horizon:'#ffd4a0', sunDir:[0.3,0.28,-1] },
      fogColor: '#ffd4a0', fogNear: 80, fogFar: 260,
      sunColor: '#fff6e0', hemiSky: '#bfe3ff', hemiGnd: '#5a8040',
      exposure: 0.82,
      trackColor: '#b89050', trackTex: 'cobblestone',
      scenery: 'konoha',
      landmark: 'hokageFaces',
      particles: 'leaves',
      allowedMoves: ['jump','duck','dodge'],
      newMove: null,
      patterns: [
        {w:3, rows:[['jump','jump','jump']]},
        {w:3, rows:[['block','free','block']]},
        {w:2, rows:[['duck','duck','duck']]},
        {w:1, rows:[['block','free','free']]},
        {w:1, rows:[['jump','block','duck']]},
      ],
      setPieces: [],
    },
    {
      // Level 2 — Forest of Death
      name: 'FOREST OF DEATH',
      subtitle: 'Chunin Exams — Dusk',
      duration: 90,
      speedStart: 15, speedEnd: 17,
      obstaclGap: 33,
      sky: { top:'#1a1230', mid:'#4a2060', horizon:'#b86040', sunDir:[0.2,0.12,-1] },
      fogColor: '#b86040', fogNear: 60, fogFar: 220,
      sunColor: '#ffb060', hemiSky: '#6a3a80', hemiGnd: '#2a1a10',
      exposure: 1.05,
      trackColor: '#3a2a18', trackTex: 'dirt',
      scenery: 'forestDeath',
      landmark: 'hugeTreeTower',
      particles: 'forestSpores',
      allowedMoves: ['jump','duck','dodge'],
      newMove: null,
      patterns: [
        {w:3, rows:[['jump','jump','jump']]},
        {w:3, rows:[['block','free','block']]},
        {w:2, rows:[['duck','duck','duck']]},
        {w:2, rows:[['jump','block','duck']]},
        {w:1, rows:[['block','free','free'],['free','free','block']], gap:12},
        {w:1, rows:[['block','free','block']]},
      ],
      setPieces: ['movingSnake'],
    },
    {
      // Level 3 — Chakra Control
      name: 'CHAKRA CONTROL',
      subtitle: 'Tree Walking — Morning',
      duration: 85,
      speedStart: 17, speedEnd: 20,
      obstaclGap: 30,
      sky: { top:'#0d2a5a', mid:'#1a5a9b', horizon:'#a8d4ff', sunDir:[0.4,0.35,-1] },
      fogColor: '#a8d4ff', fogNear: 70, fogFar: 240,
      sunColor: '#ffe8c0', hemiSky: '#a0c8ff', hemiGnd: '#3a5a2a',
      exposure: 1.1,
      trackColor: '#3a5a30', trackTex: 'bark',
      scenery: 'treeWalking',
      landmark: 'giantTreeCanopy',
      particles: 'chakraParticles',
      allowedMoves: ['jump','duck','dodge'],
      newMove: 'SPEED BOOST',
      patterns: [
        {w:3, rows:[['jump','jump','jump']]},
        {w:2, rows:[['block','free','block']]},
        {w:2, rows:[['duck','duck','duck']]},
        {w:2, rows:[['jump','block','duck']]},
        {w:1, rows:[['block','free','block']]},
      ],
      setPieces: ['speedBurst'],
    },
    {
      // Level 4 — Jutsu Training (POSE WALLS)
      name: 'JUTSU TRAINING',
      subtitle: 'Ninja Training Ground — Noon',
      duration: 90,
      speedStart: 16, speedEnd: 18,
      obstaclGap: 38,
      sky: { top:'#1a4a9b', mid:'#4a8fd4', horizon:'#ffe0a0', sunDir:[0.1,0.5,-1] },
      fogColor: '#ffe0a0', fogNear: 90, fogFar: 270,
      sunColor: '#fffbd0', hemiSky: '#d0e8ff', hemiGnd: '#6a8a4a',
      exposure: 1.0,
      trackColor: '#b09060', trackTex: 'tiledStone',
      scenery: 'trainingGround',
      landmark: 'konohaGate',
      particles: 'chakraDust',
      allowedMoves: ['jump','duck','dodge','pose'],
      newMove: 'HAND SIGNS',
      patterns: [
        {w:2, rows:[['jump','jump','jump']]},
        {w:2, rows:[['block','free','block']]},
        {w:2, rows:[['duck','duck','duck']]},
        {w:1, rows:[['jump','block','duck']]},
      ],
      setPieces: ['poseWall','poseWall','poseWall','poseWall','poseWall'],
      poseWallFrequency: 180,
    },
    {
      // Level 5 — Sand Arena (SMASH WALL)
      name: "GAARA'S DEFENSE",
      subtitle: 'Chunin Exam Arena — Hot Noon',
      duration: 95,
      speedStart: 16, speedEnd: 19,
      obstaclGap: 32,
      sky: { top:'#3a2010', mid:'#c07030', horizon:'#ffd080', sunDir:[0.0,0.6,-1] },
      fogColor: '#ffd080', fogNear: 75, fogFar: 250,
      sunColor: '#ffe0a0', hemiSky: '#ffc870', hemiGnd: '#8a5020',
      exposure: 1.05,
      trackColor: '#d4a840', trackTex: 'sand',
      scenery: 'sandArena',
      landmark: 'examStadium',
      particles: 'sandDust',
      allowedMoves: ['jump','duck','dodge','smash'],
      newMove: 'SAND SMASH (SHIFT)',
      patterns: [
        {w:2, rows:[['jump','jump','jump']]},
        {w:2, rows:[['block','free','block']]},
        {w:2, rows:[['duck','duck','duck']]},
        {w:1, rows:[['jump','block','duck']]},
        {w:1, setPiece:'smashWall'},
      ],
      setPieces: ['smashWall','smashWall'],
    },
    {
      // Level 6 — Akatsuki Ambush
      name: 'AKATSUKI AMBUSH',
      subtitle: 'Itachi Hideout — Night Fog',
      duration: 100,
      speedStart: 18, speedEnd: 21,
      obstaclGap: 28,
      sky: { top:'#04080f', mid:'#0f1825', horizon:'#2a1530', sunDir:[0.1,0.05,-1] },
      fogColor: '#1a0d20', fogNear: 40, fogFar: 180,
      sunColor: '#ffb0e0', hemiSky: '#1a0a2a', hemiGnd: '#0a0508',
      exposure: 1.1,
      trackColor: '#1a1a1a', trackTex: 'darkStone',
      scenery: 'akatsukiHideout',
      landmark: 'akatsukiMoon',
      particles: 'crowFeathers',
      allowedMoves: ['jump','duck','dodge'],
      newMove: null,
      patterns: [
        {w:2, rows:[['jump','jump','jump']]},
        {w:2, rows:[['block','free','block']]},
        {w:3, rows:[['duck','duck','duck']]},
        {w:2, rows:[['jump','block','duck']]},
        {w:1, rows:[['block','free','block']]},
        {w:1, rows:[['jump','free','jump']]},
      ],
      setPieces: ['movingCrow'],
    },
    {
      // Level 7 — Escort Mission (PUSH CART)
      name: 'ESCORT MISSION',
      subtitle: 'Great Naruto Bridge — Overcast',
      duration: 100,
      speedStart: 17, speedEnd: 20,
      obstaclGap: 30,
      sky: { top:'#2a3a4a', mid:'#506070', horizon:'#a0b0c0', sunDir:[0.2,0.15,-1] },
      fogColor: '#a0b0c0', fogNear: 65, fogFar: 230,
      sunColor: '#ffd0a0', hemiSky: '#8090a0', hemiGnd: '#404050',
      exposure: 1.0,
      trackColor: '#606878', trackTex: 'bridgeWood',
      scenery: 'bridge',
      landmark: 'bridgeTower',
      particles: 'seaMist',
      allowedMoves: ['jump','duck','dodge','push'],
      newMove: 'CART PUSH (SHIFT)',
      patterns: [
        {w:2, rows:[['jump','jump','jump']]},
        {w:2, rows:[['block','free','block']]},
        {w:2, rows:[['duck','duck','duck']]},
        {w:1, rows:[['jump','block','duck']]},
        {w:1, setPiece:'pushCart'},
      ],
      setPieces: ['pushCart'],
    },
    {
      // Level 8 — Pain's Assault
      name: "PAIN'S ASSAULT",
      subtitle: 'Destroyed Konoha — Red Sky',
      duration: 110,
      speedStart: 19, speedEnd: 22,
      obstaclGap: 26,
      sky: { top:'#2a0808', mid:'#6a1010', horizon:'#cc4020', sunDir:[0.15,0.1,-1] },
      fogColor: '#cc4020', fogNear: 50, fogFar: 200,
      sunColor: '#ff9060', hemiSky: '#8a2010', hemiGnd: '#1a0808',
      exposure: 1.1,
      trackColor: '#404040', trackTex: 'rubble',
      scenery: 'destroyedKonoha',
      landmark: 'painGodRealm',
      particles: 'ashEmbers',
      allowedMoves: ['jump','duck','dodge'],
      newMove: null,
      patterns: [
        {w:2, rows:[['jump','jump','jump']]},
        {w:2, rows:[['block','free','block']]},
        {w:3, rows:[['duck','duck','duck']]},
        {w:2, rows:[['jump','block','duck']]},
        {w:1, rows:[['jump','jump','jump']]},
      ],
      setPieces: ['fallingRock','fallingRock','fallingRock'],
    },
    {
      // Level 9 — Madara's Meteors
      name: "MADARA'S METEORS",
      subtitle: 'Fourth Ninja War Battlefield',
      duration: 110,
      speedStart: 20, speedEnd: 23,
      obstaclGap: 24,
      sky: { top:'#1a1205', mid:'#3a2808', horizon:'#806020', sunDir:[0.0,0.2,-1] },
      fogColor: '#806020', fogNear: 55, fogFar: 210,
      sunColor: '#ffb040', hemiSky: '#6a4810', hemiGnd: '#1a1005',
      exposure: 1.15,
      trackColor: '#4a3a20', trackTex: 'battleEarth',
      scenery: 'battlefield',
      landmark: 'madara',
      particles: 'warDust',
      allowedMoves: ['jump','duck','dodge'],
      newMove: 'SHADOW DODGE',
      patterns: [
        {w:2, rows:[['jump','jump','jump']]},
        {w:2, rows:[['block','free','block']]},
        {w:3, rows:[['duck','duck','duck']]},
        {w:1, rows:[['jump','block','duck']]},
      ],
      setPieces: ['meteorShadow','meteorShadow','meteorShadow','meteorShadow'],
    },
    {
      // Level 10 — Boss: Sasuke
      name: 'VALLEY OF THE END',
      subtitle: 'Final Battle — Rain',
      duration: 150,
      speedStart: 18, speedEnd: 20,
      obstaclGap: 30,
      sky: { top:'#0a0e1a', mid:'#1a2440', horizon:'#2a3a60', sunDir:[0.05,0.08,-1] },
      fogColor: '#1a2030', fogNear: 50, fogFar: 190,
      sunColor: '#a0c0ff', hemiSky: '#2a3a60', hemiGnd: '#0a0e18',
      exposure: 1.05,
      trackColor: '#303040', trackTex: 'wetRock',
      scenery: 'valleyEnd',
      landmark: 'waterfalls',
      particles: 'rain',
      allowedMoves: ['jump','duck','dodge','boss'],
      newMove: 'RASENGAN (SHIFT)',
      patterns: [],
      setPieces: [],
      isBoss: true,
      bossName: 'SASUKE UCHIHA',
      bossRounds: 3,
    },
  ],

  // ── Sounds (synthesized in audio.js) ─────────────────────────────────────────
  sounds: {
    jump:    { type:'whoosh', pitch:1.0 },
    duck:    { type:'whoosh', pitch:0.6 },
    land:    { type:'thud',   pitch:1.0 },
    hitLeft: { type:'voice',  text:'LEFT' },
    hitRight:{ type:'voice',  text:'RIGHT' },
    hit:     { type:'impact', pitch:1.0 },
    smash1:  { type:'crack',  pitch:1.0 },
    smash2:  { type:'crack',  pitch:0.85 },
    smash3:  { type:'shatter',pitch:1.0 },
    push:    { type:'grind',  pitch:1.0 },
    rasengan:{ type:'charge', pitch:1.0 },
    levelUp: { type:'chime',  pitch:1.0 },
    bossHit: { type:'impact', pitch:0.8 },
  },

  // ── Pose wall definitions ─────────────────────────────────────────────────────
  poses: [
    { label: 'TIGER SIGN',   emoji: '🐯', icon: '🤜' },
    { label: 'DRAGON SIGN',  emoji: '🐉', icon: '🙌' },
    { label: 'BIRD SIGN',    emoji: '🐦', icon: '👐' },
    { label: 'SNAKE SIGN',   emoji: '🐍', icon: '🤲' },
    { label: 'RAM SIGN',     emoji: '🐏', icon: '✌️' },
    { label: 'BOAR SIGN',    emoji: '🐗', icon: '👊' },
    { label: 'OX SIGN',      emoji: '🐂', icon: '🤜🤛' },
    { label: 'MONKEY SIGN',  emoji: '🐒', icon: '🙏' },
    { label: 'HORSE SIGN',   emoji: '🐴', icon: '🖐' },
    { label: 'HARE SIGN',    emoji: '🐰', icon: '👋' },
    { label: 'ROOSTER SIGN', emoji: '🐓', icon: '🤟' },
    { label: 'DOG SIGN',     emoji: '🐕', icon: '✊' },
  ],

  // ── Shout pool ────────────────────────────────────────────────────────────────
  shouts: {
    nice:      ['NICE!','DATTEBAYO!','BELIEVE IT!','AWESOME!'],
    excellent: ['EXCELLENT!','SHADOWCLONE!','JUTSU!'],
    amazing:   ['AMAZING!','NEXT HOKAGE!','UNSTOPPABLE!'],
  },
};

// ── Polish phase: play first 3 levels only (restore full game by removing next 2 lines) ──
THEME.allLevels = THEME.levels;
THEME.levels = THEME.levels.slice(0, 3);

// expose globally
window.THEME = THEME;

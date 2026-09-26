# FPP Runner Game Builder — Master Guide

> **User ke liye (Roman Urdu):**
> Agli baar sirf apna idea do: ek theme ("Avengers wali game chahiye"), ya ek reference image, ya ek line ka description.
> Claude khud internet se research karega (characters, locations, colors, props), phir isi guide ke rules follow kar ke
> poori game bana ke dega: levels, obstacles, premium visuals, sounds, sab kuch.
> Zaroorat pade to **zyada se zyada 5 sawal** poochega, baqi sab khud decide karega.

> **Claude ke liye:** Ye file tumhari build spec hai. Har nayi game ke liye **isey poora padho**. Section 1 workflow hai,
> Section 2 user ka "house style" hai (jo unki 35 purani games se nikla), Sections 4–14 technical recipes hain,
> Section 15 QA hai. Quality bar: **template games ki best visuals (7–7.5/10) se upar, 9/10 target.**

---

## Table of contents
0. [Kya analyze hua (35 games ka summary)](#0-what-was-analyzed)
1. [Build workflow (idea → finished game)](#1-build-workflow)
2. [House style — user ki default preferences](#2-house-style-defaults)
3. [Good vs bad visuals — kya seekha](#3-good-vs-bad-visuals)
4. [Tech stack & file structure](#4-tech-stack--file-structure)
5. [Renderer, color & lighting recipe](#5-renderer-color--lighting)
6. [Sky, fog, sun & horizon](#6-sky-fog-sun--horizon)
7. [World / environment design (layers)](#7-world--environment-design)
8. [Procedural texture library](#8-procedural-texture-library)
9. [Obstacles — catalog, rules, spawning](#9-obstacles)
10. [Levels & progression](#10-levels--progression)
11. [Theme research, characters & landmarks](#11-theme-research-characters--landmarks)
12. [Camera feel & "juice"](#12-camera-feel--juice)
13. [VFX: particles, debris, glow, speed lines](#13-vfx)
14. [Audio & UI](#14-audio--ui)
15. [Performance rules & known-bug blacklist](#15-performance--bug-blacklist)
16. [QA / self-test procedure](#16-qa--self-test)
17. [Theme cookbook (ready presets)](#17-theme-cookbook)

---

## 0. What was analyzed

Source: `E:\Claud in ssd\games\All Games Tamplates\*.rar` — 28 archives, **35 unique games** (5 duplicates). Sab Three.js r128,
first-person (FPP) endless runners, 100% procedural (koi 3D model / image asset nahi). Har game ko browser mein chala ke
screenshots liye gaye aur code line-by-line analyze hua.

### Visual ranking (screenshot + code, out of 10)

| Rank | Game (folder) | Score | Kyun |
|---|---|---|---|
| ⭐1 | `subway surf charry blosom` (Asian Garden) | **7.5** | Sirf yehi game sRGB + ACES + sun-follow shadows use karti hai. Torii gates ka rhythm, pagoda, sakura trees, additive sprite sun (fake bloom), emissive lanterns, sunset gradient sky |
| ⭐2 | `Sky bridge Runner` (steampunk bridge) | **7** | Floating islands, hot-air balloons, zeppelins, birds, lighthouse, gear towers. Sunburst sky. Bohat "living" background |
| ⭐3 | `Road Runner/castle runner` | **7** | Distant clock-tower castle as landmark, balloons + airships, lamp posts, puffy 3D clouds |
| ⭐4 | `subwaysurf city` | **7** | NYC buildings with windows/fire escapes/awnings, Empire-State skyline, animated police-inspector enemy, ACES |
| 5 | `jungle bridge Runner` | 6.5 | Sunburst at vanishing point, additive fireflies, vines, fern cards, themed totem/temple obstacles |
| 6 | `corridor runner level 4(Sky runner)` | 6.5 | Parallax floating islands (3 depth tiers), timber A-frames, planar reflection deck, sun halo sprite |
| 7 | `corridor runner level 4 (dessert)` | 6.5 | Oasis village, adobe houses, walking camels, festoon string lights, market canopy with tassels |
| 8 | `pyramid-fpp-runner` | 6.5 | Best canvas textures (cobblestone bevels, sandstone strata, carved hieroglyphs), giant stepped pyramid landmark |
| 9 | `voxel-winter-runner` | 6.5 | Fog == sky color, 5,500 snow sprites, layered pines with snow pillows, ice-wall shatter |
| 10 | `sniker runner` / `(Desert)` / `subwaysurf sea` / `Obby Runner` (= sea) | 6–6.5 | Graffiti trains, dunes + cacti + sun glow, underwater tunnel with animated whales/sharks |
| 11 | `subway surf open field`, `level 4`, `ice cream`, `road runner (winter)`, `corridor winter`, `ESCAPE PIZZA` | 5.5–6 | Decent theme, but flat lighting / empty mid-ground / shadows vanish |
| 12 | `prison-runner-3d level 2`, `cheese-runner-3d 2`, `brick-corridor`, `crystel`, `mario`, `squid-game` | 5–5.5 | One good idea each (moody lights, hex texture, brick texture…) but flat/washed or monotone |
| 13 | `road runner` (base), `corridor runner level 4` (base), `roblox-tunnel`, `fpp-voxel-runner`, `prison-escape`, `Obby Runner(incomplete)` | 4.5 | Washed-out, empty sides, placeholder palette, or broken |
| 14 | `fpp-desert-runner`, `cheese-runner-3d` (v1) | 3.5 | Empty flat floor, single-color everything, sky/fog mismatch, stretched textures |

**Important:** kisi bhi template game ka "levels" system real nahi tha — sab endless hain, speed constant hai, aur
~60% `obstacles.js` dead code hai. Nayi games mein ye sab theek karna hai (Section 10).

---

## 1. Build workflow

Jab user idea / theme / image de, **exactly ye steps** follow karo:

### Step 1 — Samjho (0 tool calls)
Idea ko in slots mein todo: **Theme · Setting/location · Characters · Mood/time-of-day · Special mechanic · Kitne levels**.
Jo slot missing hai uska **default Section 2 se lo**. Reference image mili ho to usko Read tool se dekho (Step 3b).

### Step 2 — Sawal (MAX 5, sirf zaroorat ho to)
- **Hard limit: 5 sawal total poori game ke liye.** Ek hi `AskUserQuestion` call mein bundle karo (max 4 per call; 5th ho to baad mein).
- Sirf wo poocho jiska jawab **game ko bilkul badal de** aur default se guess na ho sake. Har option ke saath recommended default pehle likho.
- Agar idea clear hai → **zero sawal**, seedha build karo.
- Achhe sawal (priority order):
  1. **Setting/location** jab theme mein bohat options hon (e.g. Avengers → "New York battle / Wakanda / Space-Titan / Avengers Tower").
  2. **Levels vs endless** (default: 3 levels + finish, Section 10).
  3. **Screen text/HUD** (default: clean screen, no text — recording-friendly).
  4. **Mechanics mix** (default: jump + duck + dodge + smash-wall + push-cart; purani games mein kabhi "sirf jump hurdles" bhi manga gaya tha).
  5. **Hero/characters kahan dikhein** (default: flying allies + enemies as obstacles + landmark at horizon).
- Kabhi mat poocho: colors, obstacle shapes, textures, camera numbers, file structure — ye tumhara kaam hai.

### Step 3 — Research (khud, bina pooche)
a. **Theme research** (WebSearch / WebFetch): iconic locations, characters + unki signature colors & props, enemies,
   vehicles, symbols, mood. 3–6 searches kaafi hain. Wikipedia/fandom wikis se visual facts lo.
b. **Reference image** mili ho: dominant palette nikalo (Python PIL se top 6 colors), composition note karo
   (vanishing point par kya hai, sides par kya repeat ho raha hai, sky kaisa hai, materials kaise hain).
c. Output: game folder mein **`art-bible.md`** likho (Section 11.2 template) — palette hex codes, landmark, 8–12 props,
   6–10 obstacles mapped to actions, characters list, sky/time, per-level variation, music mood.

### Step 4 — Build
- Folder: `E:\Claud in ssd\games\<theme-slug>-runner\`
- `_game_kit` se copy karo: `lib/three.r128.min.js` → `js/three.min.js`, `sounds/set-A-default/*` → `sounds/`, `start-server.ps1`.
- File structure Section 4. Code recipes Sections 5–14. **Pehle core loop + world chalao, phir obstacles, phir juice, phir UI.**

### Step 5 — Self-QA (Section 16)
Server chalao, browser mein kholo, screenshots lo (start, 5s, 20s, 60s, har level), checklist tick karo, bugs fix karo.
**Jab tak screenshot "premium" na lage, deliver mat karo.**

### Step 6 — Deliver
User ko: 2–4 best screenshots (SendUserFile), game kaise chalani hai (1 command), controls, levels ka short list,
aur kya assumptions liye. Short aur saaf.

---

## 2. House style (defaults)

Ye user ki 35 games se nikle hue patterns hain. **Jab tak user kuch aur na kahe, yehi use karo.**

| Cheez | Default | Note |
|---|---|---|
| Camera | **First-person (FPP)**, koi player body nahi | Optional: FPP hands/gloves (Section 12.5) — theme ke liye premium touch |
| Lanes | **3 lanes**, x = −2.6 / 0 / +2.6 | Track width ~9–10 m |
| Controls | A/D or ←/→ lane · W/↑/Space jump · S/↓ duck · **Shift = smash / push** · P/Esc pause · M mute · swipe on mobile | Mobile par Shift ka touch button **zaroor** do (templates mein missing tha) |
| Screen text | **No HUD (score/lives) during play**, but **YES to move-cue icons**: a big silhouette/icon (⬆ JUMP, ⬇ DUCK, ⬅ ➡, 👊, ✋ GRAB) ~1 s before each obstacle, plus a **level intro card** ("LEVEL 1" + move silhouettes, 3–4 s) and a boss health bar. Start/pause = icon-only glass buttons | YouTube research (Sep 2026): every top warm-up video teaches the moves with cards/icons. See `YOUTUBE_VIRAL_RESEARCH.md` §7. Optional HUD `?hud=1` |
| Video length / levels | **Follow `VIRAL_DNA.md` §4**: SHORT flagship **3:30–4:30, 3–4 levels × 35–60 s** (ImmerZone format, the highest views) and/or LONG **8–10 min, 6–8 levels** (35 s → 90 s). Every level = new world + new move/gimmick; hook → level map → cards → finale boss/escape → celebration → CTA | Frame-by-frame study of 10 viral videos (Sep 2026) |
| Workout moves | Besides lanes/jump/duck: run in place, **reach up to grab** coins, high knees in boost zones, punch combos at the smash wall, push, 5–10 s rest beats between levels | This makes it a "workout", which is why people watch |
| Lives | **Unlimited** (hit = shake + flash + sound, run continues) | Optional "challenge mode" with 3 hearts |
| Sounds | User ki **voice-cue MP3s** (`_game_kit/sounds/set-A-default`): jump, duck, left, right, hit, push, smash | Action par play; ek sound 80 ms throttle |
| Signature set-pieces | **Stop-and-Smash wall** (player 5 m pe ruk jata hai, Shift ×3: crack → crack → shatter) and **Push-Cart** (Shift hold, cart 35–50 m push, phir auto lane-change) | Har game mein ye dono hon, theme ke mutabiq reskin |
| Obstacle rhythm | 1 obstacle every ~1.8–2.2 s (≈ 30–34 m at 16 m/s) | Levels ke saath tighten |
| Speed | 14 → 22 m/s across levels (templates constant 16 thi — ab ramp karo) | |
| Look | Stylized low-poly, **flat-shaded, saturated, cheerful**, warm/cool contrast | Realistic nahi; "premium mobile game" feel (Subway Surfers / Temple Run level) |
| Hosting | Local folder + `start-server.ps1`; Three.js **local** copy (offline chale) | |

---

## 3. Good vs bad visuals

### 3.1 Top games kyun achhi lagti hain (inko hamesha karo)
1. **Landmark at the vanishing point** — castle, pagoda, pyramid, skyline, clock tower. Aankh ko destination milti hai, depth banti hai. *(Cherry, Castle, City, Pyramid)*
2. **Rhythmic framing structures** har 6–30 m par track ke upar/side mein — torii gates, gantry towers, arches, poles with sagging wires. Speed ka ehsaas yahin se aata hai. *(Cherry, Sky Bridge, Jungle, Level 4)*
3. **Sky with gradient + visible sun glow / sunburst rays**, fog color = horizon color.
4. **Living background** — balloons, zeppelins, birds, bobbing islands, fish, walking camels, drifting clouds. Kuch na kuch hamesha hil raha ho.
5. **Palette discipline:** 1 dominant hue family + 1 complementary accent + neutrals. Warm vs cool contrast (e.g. mahogany + azure, red lacquer + pink + green).
6. **Themed obstacles** jo world ka hissa lagein (totem faces, ship helms, milk-carton trains), generic cones nahi.
7. **Dense mid-ground:** track ke 5–20 m side mein props ki layer (lanterns, stone lanterns, trees, houses).

### 3.2 Kharab games kyun kharab lagti hain (ye kabhi mat karo)
1. **Monochrome world** — cheese (sab yellow), roblox tunnel (sab beige), voxel forest (neon green overload). Value contrast zero.
2. **Empty sides / flat planes** — fpp-desert: sirf floor + do walls. Mid-ground missing.
3. **Over-bright ambient** (Ambient 0.9–1.5 + hemi + sun) → washed-out, flat, shadowless look. *(prison-escape, roblox, crystal)*
4. **Fog ≠ sky color** ya fog bohat patla → world ka end dikhta hai, obstacles pop-in hote hain.
5. **Static sun** → shadows 3–5 second baad gayab (29/35 games mein ye bug tha!).
6. **Stretched textures / no anisotropy** → road 15 m ke baad mush.
7. **Flat single-color sky** (`scene.background = 0x...`) bina sun/gradient ke.
8. **Theme clash** — aquarium mein subway trains, prison road par pyramids, desert mein snow on cones.
9. **Emissive without glow** — lanterns flat orange dikhte hain (halo sprite ya bloom chahiye).
10. **Invisible feedback** — hit par na flash, na shake, na sound.

### 3.3 Premium Visual Checklist (har game mein MUST)
- [ ] `sRGBEncoding` output + ACES tone mapping + color textures `sRGBEncoding` + anisotropy
- [ ] Sky dome (gradient shader) + sun disc + additive glow halo; fog color matched
- [ ] Sun **follows player** → shadows poori game mein
- [ ] Hemisphere + sun + (optional) rim light; ambient ≤ 0.35
- [ ] Environment map (`scene.environment`) so metals/glass look right
- [ ] 5 visual layers (Section 7): track · near rhythm props · mid scenery · far silhouettes · sky life
- [ ] Landmark at horizon (per level alag)
- [ ] ≥ 2 animated background elements
- [ ] Ambient particles (dust / leaves / snow / embers / sparkles) streaming past camera
- [ ] Camera juice: bob, lane roll, jump/duck pitch, FOV kick with speed, trauma shake
- [ ] Speed lines overlay at high speed
- [ ] Obstacle hit/smash VFX: debris + shockwave ring + flash
- [ ] Contact shadows (soft radial blob) under every obstacle
- [ ] Per-level color/time-of-day change
- [ ] Finish gate + celebration (confetti) per level

---

## 4. Tech stack & file structure

- **Three.js r128** (global `THREE`, classic `<script>` tags) — `_game_kit/lib/three.r128.min.js` copy karo `js/three.min.js` mein.
  Optional extras (sirf zaroorat par, jsDelivr se): `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js`,
  `.../examples/js/postprocessing/{EffectComposer,RenderPass,ShaderPass,UnrealBloomPass}.js`, `.../examples/js/shaders/{CopyShader,LuminosityHighPassShader,GammaCorrectionShader}.js`.
- No bundler, no modules. Game `start-server.ps1` se `http://localhost:8090/` par chalti hai.

```
<theme>-runner/
  index.html          ← canvas, overlay divs, script tags (three → config → textures → audio → world → obstacles → player → fx → ui → main)
  style.css
  art-bible.md        ← research output (Section 11.2)
  start-server.ps1
  js/three.min.js
  js/config.js        ← THEME object: palette, levels, speeds, obstacle weights (theme badalne ke liye sirf ye file)
  js/textures.js      ← all CanvasTexture generators (cached, created ONCE)
  js/audio.js         ← MP3 pool + WebAudio music/sfx
  js/world.js         ← sky, lights, fog, track pool, scenery layers, background life
  js/obstacles.js     ← obstacle factory + pool + spawner + bounds
  js/characters.js    ← hero/enemy/ally builders from primitives (theme ke characters)
  js/player.js        ← movement, physics, camera feel
  js/fx.js            ← particles, debris, shockwaves, speed lines, flashes
  js/ui.js            ← screens, optional HUD, level banners
  js/main.js          ← state machine + main loop
  sounds/*.mp3
```

**Main loop order:** `dt = Math.min(clock.getDelta(), 0.05)` → input → `player.update` → `world.update(z)` →
`obstacles.update(z)` → `collisions` → `fx.update` → `camera` → `render`. States: `MENU, PLAYING, PAUSED, LEVEL_COMPLETE, GAMEOVER`.
Loop ko try/catch mein **mat** chupao silently — `console.error` karo aur loop continue rakho.

**Movement model:** player −Z direction mein chalta hai, world static. Har ~2 km par floating-origin shift (sab objects `z += 2000`)
taake float precision theek rahe.

**Frame-rate independent smoothing — hamesha:**
```js
const damp = (k, dt) => 1 - Math.exp(-k * dt);
x += (targetX - x) * damp(14, dt);          // NEVER: x += (t-x)*0.15  or  roll *= 0.88
```

---

## 5. Renderer, color & lighting

```js
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;            // 0.9–1.2; screenshot dekh ke tune karo
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Hex colors ko sRGB mein author karo, linear mein convert karo (warna sab washed dikhega):
const C = (hex) => new THREE.Color(hex).convertSRGBToLinear();
const mat = new THREE.MeshStandardMaterial({ color: C(0xd94a2b), roughness: 0.8, flatShading: true });

// Canvas textures (color maps):
tex.encoding = THREE.sRGBEncoding;
tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
```

### Lighting rig (fixed count — kabhi runtime par lights add/remove mat karo; shader recompile stutter hota hai)
```js
const hemi = new THREE.HemisphereLight(C(skyColor), C(groundColor), 0.55);
const sun  = new THREE.DirectionalLight(C(0xfff1d6), 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left:-30, right:30, top:30, bottom:-30, near:1, far:160 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
const rim  = new THREE.DirectionalLight(C(0x9fd4ff), 0.5);   // opposite side, cool rim
scene.add(hemi, sun, sun.target, rim);                        // sun.target ZAROOR scene mein add ho

// EVERY FRAME — shadows poori game mein rahenge:
sun.position.set(player.x + 25, 50, player.z + 15);
sun.target.position.set(player.x, 0, player.z - 25);
```
- Ambient light default **mat** lagao; lagani ho to ≤ 0.3. Hemi 0.4–0.7, sun 1.8–2.6 (ACES ke saath).
- Night/indoor levels: hemi kam (0.25), emissive props + few **fixed** PointLights (max 4, pooled — player ke aage move karte raho).

### Environment map (metals, glass, gold ke liye must)
```js
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
const envSky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16),
  new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: gradientCanvasTexture }));  // same palette as sky
envScene.add(envSky);
// 2–3 bright panels for highlights:
const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
panel.position.set(0, 6, -5); panel.lookAt(0, 0, 0); envScene.add(panel);
scene.environment = pmrem.fromScene(envScene, 0.04).texture;
```
Metals: `metalness 0.7–1, roughness 0.25–0.45`. Bina env map ke metalness > 0.3 kabhi mat do (templates mein metals kaale/muddy the).

### Optional bloom (advanced)
Default = **fake bloom** (additive halo sprites, Section 13.4) — reliable aur sasta. Real bloom r128 mein:
`RenderPass → UnrealBloomPass(res, 0.6, 0.4, 0.85) → ShaderPass(GammaCorrectionShader)` aur composer use karte waqt
`renderer.outputEncoding = LinearEncoding` rakho. Screenshot mein colors check karo; agar ajeeb lagen to bloom hata do.

---

## 6. Sky, fog, sun & horizon

### 6.1 Gradient sky dome (tone-mapped, fog-matched)
```js
const skyUniforms = {
  top:     { value: C(0x2a6fd6) }, mid: { value: C(0x8fd0ff) }, horizon: { value: C(0xffe3c4) },
  sunDir:  { value: new THREE.Vector3(0.3, 0.25, -1).normalize() },
  sunCol:  { value: C(0xfff2c8) },
};
const skyMat = new THREE.ShaderMaterial({
  uniforms: skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 top, mid, horizon, sunDir, sunCol; varying vec3 vDir;
    void main(){
      float h = clamp(vDir.y, -0.2, 1.0);
      vec3 col = mix(horizon, mid, smoothstep(0.0, 0.25, h));
      col = mix(col, top, smoothstep(0.25, 0.9, h));
      float s = max(dot(normalize(vDir), sunDir), 0.0);
      col += sunCol * (pow(s, 900.0) * 3.0 + pow(s, 40.0) * 0.35 + pow(s, 6.0) * 0.12);  // disc + glow + haze
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 16), skyMat);
sky.renderOrder = -1000; scene.add(sky);
// every frame: sky.position.copy(camera.position);
scene.fog = new THREE.Fog(skyUniforms.horizon.value.clone(), 70, 260);   // fog = horizon color
```
- **Fog rule:** fog far ≤ spawn distance + 20 aur track pool length se kam; obstacles fog se "nikal ke" aayein, pop-in na ho.
  Linear `Fog(near 60–90, far 220–300)` best; `FogExp2` use karo to density 0.006–0.012.
- Camera far = 500 (sky dome 450 radius).
- **Sunburst rays** (jungle/sky-bridge style): sky ke andar ek bade transparent plane par 24 radial wedges (canvas) additive blending
  se, sun ke peeche, `rotation.z += 0.02*dt`.
- **Painted horizon layers:** 2–3 mountain/skyline silhouette rings (low-poly cylinders ya canvas planes) player ke saath move karein,
  har layer alag parallax factor (0.9, 0.95) aur fog-tinted color. Two-tone faceted peaks (left face dark, right face lit) best lagte hain.

### 6.2 Clouds
Shared `DodecahedronGeometry(2.2, 0)` puffs, 5–8 per cluster, flat-shaded white + slight emissive, `fog:false`
nahi — fog lagne do. Drift x mein, wrap. 20–30 clusters.

### 6.3 Time-of-day presets (level ke hisaab se)
| Preset | top | mid | horizon | sun | hemi sky/ground | exposure |
|---|---|---|---|---|---|---|
| Bright noon | `#2a6fd6` | `#8fd0ff` | `#e8f6ff` | `#fff6e0` | `#bfe3ff`/`#6b8f4e` | 1.0 |
| Golden hour | `#3b6fb6` | `#ff9fb5` | `#ffd28a` | `#ffc48a` | `#ffc9b0`/`#6b4a2e` | 1.05 |
| Sunset (cherry-blossom best) | `#2e75b6` | `#ff96b5` | `#ffd454` | `#ffe0a0` | `#ffccd7`/`#689f38` | 0.95 |
| Twilight / night | `#0c142c` | `#541c49` | `#b84258` | `#ffb0d0` (moon) | `#7c6bf0`/`#20152e` | 1.1 |
| Stormy / epic battle | `#2b3445` | `#5b6478` | `#c9a27a` | `#ffd9a0` | `#8d97ad`/`#3a3228` | 1.1 |

---

## 7. World / environment design

### 7.1 The 5 layers (har level mein sab 5 hon)
| Layer | Distance | Kya | Example (Avengers NYC) |
|---|---|---|---|
| **L1 Track** | 0–5 m | Road/rails/bridge deck, lane markings, curbs, textured | Cracked asphalt with lane paint, debris decals, yellow taxis wreck edges |
| **L2 Near rhythm** | 5–12 m | Repeating frames har 6–15 m: gates, lamp posts, arches, pylons + sagging wires, railings | Street lamps, traffic lights, subway entrance railings |
| **L3 Mid scenery** | 12–60 m | Buildings/trees/rocks/houses — 4–6 variants, random scale/rotation, InstancedMesh jahan ho sake | Brownstones, glass towers with window grid, billboards |
| **L4 Far silhouettes** | 80–300 m | Low-detail skyline/mountains, fog-tinted, 2 parallax rings | Manhattan skyline silhouettes |
| **L5 Sky & landmark** | horizon | Sky dome, sun, clouds, **landmark at vanishing point**, flying life | Avengers Tower (glowing "A"), Iron Man flybys, Chitauri ships, portal in sky |

### 7.2 Track streaming (pooling)
- 8 segments × 30 m pool. Segment jab player se 30 m peeche ho jaye → `z = minZ − 30` (reposition, **rebuild mat karo**).
- Har segment mein props ki **placement random seed** se ho aur recycle par **re-randomize** (sirf position/scale/visibility; naye meshes nahi) taake 240 m baad pattern repeat na lage.
- Repeated items (sleepers, lamp posts, windows, trees, rocks) → **InstancedMesh**. Ek segment ke static parts ko `BufferGeometryUtils.mergeBufferGeometries` se merge karo (per material).
- Far layers (L4/L5) player ke saath `z = player.z − D` par lock rahein (skybox jaisa), lekin landmark level ke end par **approach** kare (Section 10.4) — templates mein landmark kabhi paas nahi aata tha, ye upgrade hai.

### 7.3 Ground & terrain beyond track
Flat plane nahi. `PlaneGeometry(80, 30, 24, 12)` vertices displace karo:
```js
p.setY(i, Math.max(0, Math.abs(x) - 8) * 0.12 + Math.sin(x*0.12)*1.2 + Math.cos(z*0.18)*0.9 + Math.sin((x+z)*0.08)*0.6);
```
flat-shaded → low-poly dunes/hills/snowbanks. Track edge par 0.3 m curb/trim hamesha.

### 7.4 Life in the world (min 2 per level)
- Flyers: balloons (sphere cap + gore panels + basket), zeppelins (propeller 18 rad/s), birds (2 plane wings, `sin(t*9)` flap), heroes flying (Section 11).
- Walkers: camels/animals with pivot-group legs `sin(phase*4 ± π)*0.42`.
- Bobbing: floating islands `y = base + sin(t*speed + off)*1.4`.
- Sway: lanterns `rotation.z = sin(t*2+off)*0.08`, flags, banners.
- Scrolling: lava/water UV `tex.offset.y += dt*0.4`.

---

## 8. Procedural texture library

Sab `textures.js` mein, **ek dafa** generate, cache (`Map`), share. Size 512² (hero surfaces 1024²). `RepeatWrapping`,
`encoding = sRGBEncoding`, `anisotropy = max`. **Repeat ko surface ke meter size se calculate karo** (1 tile ≈ 2–4 m) — stretch nahi.

| Texture | Recipe (proven in templates) |
|---|---|
| **Beveled pavers / cobblestone** (pyramid, cherry) | Mortar base → har stone random tone from 8–12 palette → top-left 2px highlight `rgba(255,240,210,.15)` + bottom-right 2px shadow `rgba(0,0,0,.6)` → 15 grain specks |
| **Brick** (mario, brick-corridor) | Running bond, 6-tone palette, per-brick vertical gradient (light top, dark bottom), then `getImageData` noise ±9 warm-biased |
| **Asphalt with cracks** (prison-escape) | 50k grain rects → 90 random-walk cracks (3–8 segments, 45% branch) stroked dark 2.8px + light offset highlight → lane paint |
| **Sandstone strata** (pyramid) | 10 horizontal bands of varying height/tone → jittered lamination lines → 45 erosion streaks → 35k specks |
| **Sand with ripples** | Gradient → 40k specks → `quadraticCurveTo` ripple lines every 16–32 px alternating crest/trough |
| **Wood planks** (sky bridge) | 6 plank tones → sine-wobbled grain lines → dark seams → staggered butt joints → knots |
| **Hazard stripes** | Yellow `#ffcc00` + black parallelograms every 32 px, `repeat(8,1)` |
| **Chevrons** (duck/jump signs) | Dark bg + bright double chevrons, used with emissive |
| **Glowing windows** (city, desert) | Window grid; each window radial gradient (bright core → saturated → dark) — use same canvas as `emissiveMap` |
| **Stud / Lego** (obby) | Per stud: rim circle, offset highlight circle, face circle. Use as map **and** bumpMap (bumpScale 0.08) |
| **Ice / crystal facets** | Diagonal gradient + 13 facet triangles alternating white/blue alpha 0.15–0.5 + 4px white strokes |
| **Graffiti decal** (sniker) | `900 78px` font text: dark 18px stroke → color 10px stroke → fill → 8 paint drips. Wait `document.fonts.ready` first |
| **Crack decals** (all smash walls) | Same polyline stroked 3×: wide colored glow (14–18px) → bright core (7–8px) → white hairline (3px). Transparent plane, `depthWrite:false`, `renderOrder 999` |
| **Organic holes / lace** (cheese v2) | Fill color → `globalCompositeOperation='destination-out'` ellipses → alpha texture |
| **Contact shadow blob** | Radial gradient `rgba(0,0,0,.55)` → transparent. Plane under every obstacle, `depthWrite:false` |
| **Particle sprite** | 64² radial gradient white → transparent |
| **Hand-painted character decals** | Emblems/logos drawn with Canvas paths (shield star, arc reactor, spider, etc.) |

**Extra premium tricks:**
- Normal-ish relief: same canvas grayscale → `bumpMap` (bumpScale 0.03–0.08).
- Roughness variation: second canvas (noise) as `roughnessMap`.
- Seamless tiling: stones/holes ko 9 offsets (incl. diagonals) par draw karo.
- Seeded RNG for deterministic textures: `seed = (seed*9301+49297)%233280`.

---

## 9. Obstacles

### 9.1 Action archetypes (har game mein sab types, theme ke mutabiq reskin)
| Archetype | Player action | Size / hitbox rule | Template examples → premium reskin idea |
|---|---|---|---|
| **Low hurdle** (1 lane / 2 lanes / full width) | Jump | Visual top ≤ 1.0 m; hitbox = visual | cones, logs, anchors, spikes, macarons, ice spikes |
| **Overhead bar** | Duck | Underside 1.2–1.5 m (eye 1.7, duck eye 0.75); hitbox only the bar band | beams, boom barriers, lintels, canopy, swinging log |
| **Lane blocker** | Dodge (lane change) | 1 or 2 lanes; **always ≥1 free lane**; tall (≥3 m) so jump se clear na ho | pillars, trains, containers, fridges, palisades, cacti |
| **Moving hazard** | Dodge/jump with timing | Hitbox animated with visual (update every frame) | rolling boulder, swinging pendulum, running enemy, spinning gear |
| **Pit / gap** | Jump | Real hole: depth-mask plane (`colorWrite:false`) so sky shows through; or broken bridge planks | chasm, missing planks, lava gap |
| **Smash wall** (set piece) | Stop 5 m → Shift ×3 | Full width, 3 stages: crack1 → crack2 → shatter (debris + shockwave + flash + FOV punch) | wooden wall, ice wall, shield wall, glass wall, cheese slab |
| **Push cart** (set piece) | Stop behind → hold Shift → push 35–50 m → auto lane change | Other lanes blocked by flank obstacles during push; wheels rotate `step/radius` | mine cart, sleigh, brick cart, wafer sled |
| **Smashable crates** | Run through (+score) | Shatter on contact, slight slowdown 65% | SMASH crates |
| **Combo pattern** | Mixed | e.g. jump-lane + duck-lane + blocked lane — each lane needs a different action | Squid "every lane one action" |
| **Boss / chase** (level finale) | Survive 20–30 s | Big enemy behind/ahead throwing projectiles into lanes (telegraphed 1 s with red ground marker) | Thanos / Ultron / giant rat |

### 9.2 Fairness & readability rules
1. **Hitbox = visual.** Har obstacle ka `bounds` mesh se hi aaye (build time par `Box3().setFromObject` se ek dafa nikal ke local offset store karo; per frame sirf translate). Templates mein visual 1.9 m / hitbox 1.45 m jaise mismatch the — ban.
2. Obstacle **first visible ≥ 1.5 s pehle** (fog se nikalta hua). Spawn at `player.z − (speed × 5.5)`.
3. Minimum gap `speed × 1.3 s`; after set-piece `≥ 45 m` breathing room.
4. Har row mein **kam az kam ek solvable path** (algorithmic check: har lane ke liye allowed actions set; empty set → re-roll).
5. Telegraph: duck obstacles par downward chevrons/red lights, jump par upward chevrons, smash walls par glowing crack hint + "Shift" icon (icon, text nahi).
6. Collision player box: width 0.8, **feet-based** (y from `feet` to `feet+1.8`, ducking 0.9). Eye = feet + 1.7.
7. Hit → 1.2 s invulnerability + red vignette flash + shake 0.5 + hit sound + obstacle bounce/knock away (clean screen mein bhi feedback zaroori).
8. Destroyed obstacle ka hitbox turant disable.

### 9.3 Spawner (pattern-based, not pure random)
```js
// config.js
levels[i].patterns = [
  { w: 3, rows: [['jump','jump','jump']] },                 // full-width hurdle
  { w: 3, rows: [['block','free','block']] },               // dodge to middle
  { w: 2, rows: [['duck','duck','duck']] },
  { w: 2, rows: [['jump','block','duck']] },                // combo
  { w: 1, rows: [['block','free','free'], ['free','free','block']], gap: 12 }, // zig-zag
  { w: 1, setPiece: 'smashWall' },
  { w: 1, setPiece: 'pushCart' },
];
```
- Weighted pick, **no same pattern twice in a row**, set-pieces with cooldown (≥ 250 m).
- Scripted beats per level: first 8 s empty (intro), smash wall at ~40%, push cart at ~70%, finale at 90%.

### 9.4 Obstacle construction quality
- Har obstacle 6–20 parts: base + main body + trim/bevel + accent color + small details (bolts, rivets, stickers) + contact shadow + (optional) emissive light.
- Soft edges: beveled box helper (rounded-rect `Shape` → `ExtrudeGeometry({bevelEnabled:true, bevelSegments:2, bevelSize:0.04})`, **ek dafa** build, share).
- Organic: displaced icosahedron (`IcosahedronGeometry(r,3)` + 3-octave sin noise + `computeVertexNormals`) for rocks/boulders.
- Idle animation jahan fit ho (spin, bob, blink lights).
- **Pool** har obstacle type (8 instances each), reuse; materials/geometries shared.

---

## 10. Levels & progression

Templates mein real levels nahi the. **Default: 3 levels + ending** (user "endless" bole to endless with zones).

### 10.1 Default level plan
| | Level 1 — Intro | Level 2 — Rising | Level 3 — Finale |
|---|---|---|---|
| Length | 90 s (~1.4 km) | 120 s (~2.2 km) | 150 s (~3.2 km) |
| Speed | 14 → 16 m/s | 16 → 19 | 19 → 22 |
| Obstacle gap | 34 m | 30 m | 26 m |
| Types | jump, dodge (single lane) | + duck, 2-lane blocks, moving hazards, smash wall | + combos, pits, push cart, boss chase last 25 s |
| Time of day | Bright noon | Golden hour | Sunset / night / storm |
| Location | Theme area A | Theme area B | Theme area C (climax spot) |
| Landmark | small, far | medium | **approaches & you run through/under it at the end** |

### 10.2 Level flow
1. Start screen (icon play button, blurred live scene behind).
2. **Level intro**: 2 s cinematic — camera slight fly-in + big level emblem icon (no/low text) + whoosh.
3. Gameplay with scripted beats (9.3).
4. **Finish gate** (themed arch with glowing ring) → slow-mo 0.4× for 1 s, confetti burst, sparkle, level-complete jingle.
5. Level-complete card (stars icon ⭐⭐⭐ based on hits) → auto-continue after 3 s or tap.
6. Transition: fade-to-white 0.5 s → next level palette/world loads (pooled meshes re-skinned, textures pre-generated at boot).
7. After final level: ending scene (landmark close-up, characters celebrating, fireworks) → replay icon.

### 10.3 Difficulty knobs (config.js mein)
`speed`, `gap`, `patternWeights`, `movingHazardSpeed`, `setPieceCount`, `bossDuration`. Speed ramp: `speed = lerp(v0, v1, levelProgress)`.

### 10.4 Landmark approach
Landmark ko `z = levelEndZ − 40` par real world position do (skybox-lock nahi); fog far se bahar ho to scale + fog:false layer
se dikhao, jab paas aaye to real geometry. Finish gate uske base par.

---

## 11. Theme research, characters & landmarks

### 11.1 Research procedure
1. WebSearch: `"<theme>" iconic locations`, `"<theme>" characters colors costume`, `"<theme>" logo symbol props`, `"<theme>" villains minions`.
2. 3 locations choose karo (1 per level), 4–6 hero characters, 1–2 enemy types (minions = obstacles), 1 boss, 1 landmark per level.
3. Har character ke liye: **silhouette (body shape)**, **3 signature colors (hex)**, **1–2 iconic props**, **glow parts**.

### 11.2 `art-bible.md` template (game folder mein likho)
```md
# <Game Name> — Art Bible
Theme summary: …
Palette: primary #…, secondary #…, accent #…, neutrals #… #…, glow #…
Levels: 1) <location> – <time of day> – landmark: …  2) …  3) …
Track surface per level: …
Near-rhythm props (L2): …        Mid scenery (L3): …        Far (L4): …        Sky life (L5): …
Characters: <name> – silhouette – colors – props – where it appears – animation
Enemies/obstacles: <name> → action (jump/duck/dodge/smash/push) – look
Set pieces: smash wall = …, push cart = …, boss = …
Particles: …   Music mood: … BPM …
Assumptions made: …
```

### 11.3 Characters from primitives (no downloaded models)
- **Build order:** silhouette first (capsule/box proportions), phir color blocking (3 colors), phir signature prop, phir emissive details.
- Proportions stylized: head 1/5 of height, big hands/feet, chunky = readable at distance.
- Rig: `Group` hierarchy with pivots at shoulders/hips/knees → run cycle `limb.rotation.x = ±sin(t*speed)*0.8`, bob `|sin(2t)|*0.1`.
- Limbs between two points: `mesh.quaternion.setFromUnitVectors(UP, dir)` (cheese spider technique).
- Emblems: canvas-drawn decal on a plane slightly in front of chest.
- **Where characters appear in FPP** (player khud nazar nahi aata):
  1. **Allies flying/running alongside** (Iron Man flyby with thruster glow + trail particles; Hulk leaping in background; Spider-Man web-swinging between buildings).
  2. **Enemies as obstacles** (minions in lanes — dodge/smash them; knock-back animation on hit).
  3. **Boss** in level 3 (ahead of player, throwing telegraphed attacks).
  4. **Statues/billboards/murals** of heroes along L2/L3.
  5. **FPP hands** (Section 12.5) — player hero ke gloves/gauntlet (e.g. Iron Man gauntlet repulsor glow on Shift).
  6. **Finale celebration** — sab heroes finish gate par pose.
- IP note: characters **original low-poly fan-art style** mein banao (colors + props se pehchaan), official logos/models copy mat karo. Monetized use ka IP risk user ka decision hai — deliver karte waqt 1 line mein mention karo.

### 11.4 Reference image se game
1. Read tool se image dekho. Python PIL se top palette nikalo:
   ```python
   from PIL import Image; im = Image.open(p).convert('RGB').resize((120,120)).quantize(8)
   pal = im.getpalette()[:24]; counts = sorted(im.getcolors(), reverse=True)
   ```
2. Composition copy karo: vanishing point par kya hai → landmark; sides par kya repeat → L2/L3; sky kaisa → sky preset.
3. Materials: shiny/matte, outlines/no outlines, flat/soft shading → material settings.
4. Image mein jo cheezen hain un sab ko art-bible mein list karo; first screenshot ko reference ke side-by-side compare karo.

---

## 12. Camera feel & juice

```js
// player.update(dt) ke end mein
const d = (k) => 1 - Math.exp(-k * dt);
this.x += (this.targetX - this.x) * d(14);
this.roll += (-(this.targetX - this.x) * 0.06 - this.roll) * d(12);         // bank into lane change
const grounded = !this.jumping && !this.ducking;
if (grounded) this.bobPhase += dt * this.speed * 0.65;                        // accumulate phase (no chirp)
const bobY = grounded ? Math.abs(Math.sin(this.bobPhase)) * 0.06 : 0;
const bobX = grounded ? Math.cos(this.bobPhase * 0.5) * 0.035 : 0;
const pitchT = this.ducking ? -0.08 : (this.jumping ? (this.vy / this.jumpV) * 0.05 : 0);
this.pitch += (pitchT - this.pitch) * d(10);
// trauma shake (0..1), decays
this.trauma = Math.max(0, this.trauma - dt * 1.8);
const sh = this.trauma * this.trauma;
const shX = (Math.random() - 0.5) * sh * 0.25, shY = (Math.random() - 0.5) * sh * 0.25;
camera.position.set(this.x + bobX + shX, this.feetY + this.eye + bobY + shY, this.z + this.punchZ);
camera.rotation.set(this.pitch + sh * 0.02 * (Math.random() - 0.5), 0, this.roll);
// FOV kick with speed + events
const fovT = 72 + (this.speed - 14) * 0.9 + this.fovPunch;
camera.fov += (fovT - camera.fov) * d(6); camera.updateProjectionMatrix();
this.fovPunch *= Math.exp(-6 * dt); this.punchZ *= Math.exp(-14 * dt);
```
Physics defaults: gravity −34, jumpV 11.5 (apex ≈1.9 m, air 0.68 s), duck 0.75 s (duck in air → vy = −18 fast-fall),
lane lerp 14/s, eye 1.7, duck eye 0.75. Landing: trauma += 0.12, tiny dust puff. Footstep sound synced to bob phase.

### 12.5 FPP hands (optional premium)
Two low-poly arms parented to camera at (±0.35, −0.35, −0.6), sway with bob, punch forward on Shift (0.12 s out, 0.2 s back),
theme-colored gloves with emissive detail. `renderOrder` high + `depthTest` normal; small FOV-independent scale.

### 12.6 Event juice table
| Event | Shake (trauma) | FOV punch | Other |
|---|---|---|---|
| Jump | – | +2 | whoosh, dust puff on takeoff |
| Land | 0.12 | – | dust ring |
| Lane change | – | – | roll, left/right voice |
| Hit | 0.5 | −4 | red vignette flash 0.25 s, hit sound, obstacle knock-back |
| Smash 1/2 | 0.3 / 0.45 | +3 / +5 | crack decal, chips, camera punchZ −0.3 |
| Smash 3 (break) | 0.7 | +10 | debris 60–100, shockwave ring, white flash 0.12 s, slow-mo 0.5× for 0.3 s |
| Push start | 0.15 | +2 | push voice, wheel sparks |
| Finish gate | – | +8 | slow-mo, confetti, jingle |

---

## 13. VFX

### 13.1 Ambient particles (always on, theme-based)
`THREE.Points` (600–2500) or `InstancedMesh` (≤ 600) in a box around camera: x ±25, y 0–20, z player+15 → player−120.
World-space (camera se glued nahi — warna speed feel nahi hoti); wrap in **x and z**. Sprite = radial gradient,
`depthWrite:false`, additive for glowy (fireflies, embers, sparkles), normal for snow/leaves/dust.
Themes: snow, cherry petals (pink quads tumbling), leaves, desert dust, embers + ash (battle), fireflies, bubbles (underwater), sparkles (magic/candy), rain streaks.

### 13.2 Debris / shatter (smash walls, crates)
Pre-build 80 debris meshes (shared geometry: box/tetra/dodeca) in a pool. On break: pieces at wall's grid positions,
`v = (x*1.5 ± 6, 4–14, −6…−20)`, spin ±9, gravity −26, ground bounce `vy *= −0.35`, friction 0.8, life 2 s, shrink last 0.5 s.
Half pieces wall color, some accent/emissive. **Also fly a few toward camera** (vz +4…+10) — FPP mein best lagta hai.

### 13.3 Shockwave & flashes
- Ring: `RingGeometry(0.2, 0.45, 32)` additive, scale += 18·dt, opacity −= 2.2·dt.
- Screen flash: fullscreen div, set color, `opacity:1` → transition 0.15 s back to 0 (re-trigger with `void el.offsetWidth`).
- Damage vignette: `radial-gradient(circle, transparent 55%, rgba(255,20,20,.7))`.

### 13.4 Fake bloom / glow (default)
Har emissive light source (lanterns, eyes, repulsors, portal, sun) ke peeche ek **additive Sprite** halo (radial gradient
canvas), scale 3–6× object, `depthWrite:false`, `fog:false` for sun. Sun: 3 sprites (core 20, corona 54, halo 110 @0.35) — cherry blossom trick.

### 13.5 Speed lines
2D canvas overlay, 35–50 radial lines from screen center, length & alpha ∝ (speed − 14)/8; each line stores its own width
(templates mein har frame random width se flicker hota tha). Hide when stopped.

### 13.6 Trails
Iron-Man/rocket/fast flyers: ribbon trail (last 20 positions → `BufferGeometry` line strip, additive, fading alpha) or sprite puffs.

---

## 14. Audio & UI

### 14.1 Audio
- **Voice cues:** `_game_kit/sounds/set-A-default/` (short) ya `set-B-long/` (longer + `run-loop.mp3`) → `sounds/` mein copy.
  Pool of 4 `Audio` per sound, 80 ms per-key throttle, unlock on first input. Filenames lowercase (Linux-safe).
  | Event | File |
  |---|---|
  | jump | `jump.mp3` |
  | duck | `duck.mp3` |
  | lane left/right | `left.mp3` / `right.mp3` |
  | hit (obstacle + 1st smash) | `hit.mp3` |
  | push cart | `push.mp3` |
  | wall break | `smash.mp3` |
- **SFX synthesized (WebAudio):** whoosh, land thud, shatter = noise burst → bandpass 400→80 Hz + saw 140→40 Hz, confetti chime (C-E-G-C arpeggio), shockwave boom.
  Master gain → `DynamicsCompressor` → destination.
- **Music:** WebAudio step sequencer with **lookahead scheduling** (`ctx.currentTime` + 0.1 s, not setInterval). 120–140 BPM,
  bass + kick + hat + simple lead in theme mood (heroic = major, minor for spooky). Per level intensity up. Mute key M.

### 14.2 UI (clean-screen default)
- **Start screen:** blurred live 3D scene behind (`backdrop-filter: blur(16px)`), glass card, big round icon play button
  (CSS triangle), game logo drawn with CSS gradient text (theme title allowed on start screen), small icon hints for controls.
- **Pause / restart / level complete:** icon-only glass cards (▶, ↻, ⭐⭐⭐).
- **Gameplay:** no text. Only: mute + fullscreen tiny icons (top-right, 40% opacity), mobile touch buttons (jump/duck/smash) when `pointer:coarse`.
- **Optional HUD** (`?hud=1`): distance, level progress bar, hearts — `font-variant-numeric: tabular-nums`, glass pills.
- CSS pieces that looked best: glass card `linear-gradient(135deg, rgba(30,41,59,.85), rgba(15,23,42,.95))`, radius 24,
  `box-shadow: 0 24px 64px rgba(0,0,0,.6), 0 0 40px <theme-glow>`; entrance `cubic-bezier(.16,1,.3,1)` translateY 20px scale .95→1;
  3D-lip buttons `border-bottom: 4px solid <darker>`; gradient title `background-clip:text`.
- Fonts (Google): theme-fit — heroic: "Bangers"/"Luckiest Guy"; sci-fi: "Orbitron"; cute: "Fredoka"; spooky: "Creepster".
- Canvas text: `await document.fonts.ready` before drawing.

---

## 15. Performance & bug blacklist

### Budgets (1080p, mid laptop, 60 fps)
Draw calls < 350 (`renderer.info.render.calls`), triangles < 600k, shadow casters: only obstacles + near props,
textures generated once at boot (show a tiny loading shimmer), zero allocations per frame in hot loops (reuse Vector3s).

### Rules
- Materials/geometries/CanvasTextures **shared & cached**; kabhi per-spawn `new Material` mat karo.
- Obstacles & debris **pooled**; jo remove ho uska `dispose()` (sirf agar pool se bahar ho).
- InstancedMesh for anything repeated ≥ 10 times. Merge static segment geometry.
- Fixed light count. Emissive + halo sprites instead of per-object PointLights.
- Transparent objects minimal; `alphaTest` for foliage/fences instead of `transparent`.
- `pixelRatio ≤ 2`, shadow map 2048 max, shadow camera ±30 following player.

### Known bugs from the 35 templates — kabhi repeat mat karna
1. Sun/shadow camera static → shadows vanish after ~50 m. (Fix: Section 5, add `sun.target` to scene.)
2. Fog color ≠ sky → visible horizon band; fog too thin → world end visible, pop-in.
3. Lights re-added on every restart (`reset()` → `initLighting()`) → scene brighter + slower each restart.
4. Undefined helper/material references (`createBeveledBoxGeometry`, `this.redFrameMat`, `gravelBedMat`) swallowed by try/catch → obstacles silently missing.
5. Game-over writes to deleted DOM ids → TypeError → loop freezes. (Null-check every DOM lookup.)
6. Hitbox ≠ visual (full-width duck hitbox on 1-lane hurdle; collider centered on eye so low hurdles never hit; destroyed wall still collides; rolling boulder hitbox static).
7. Obstacles built with local `zPos` but `group.position.z = 0` → culled same frame.
8. Frame-rate dependent decays (`*= 0.88`, `lerp 0.15`), unclamped lerps overshooting at low fps.
9. Camera roll/bob computed but overwritten with `rotation.set(0,0,0)`.
10. Screen-space `scene.background` sky texture (stretches, no parallax) — use sky dome.
11. Metalness without env map → black/muddy metals. Emissive without glow → flat.
12. Snow/particles glued to camera → no speed feel; particles not wrapped on x → thinning.
13. Same key triggers action 2–3× (touchstart + touchend + click; mouseup + click). Use pointer events once.
14. Shift without touch equivalent → mobile soft-lock.
15. `ctx.roundRect` without fallback (old browsers crash) — use own rounded-rect path helper.
16. Mixed-case sound filenames (`LEft.MP3`, `Rightt.mp3`) — lowercase everything.
17. Chunk rebuild every recycle + per-chunk canvas textures → GPU leak + hitches.
18. Scenery beyond camera far plane → clipped towers.
19. ~60% dead code per file — **delete unused builders**; keep files lean.

---

## 16. QA / self-test

1. Server: `powershell -ExecutionPolicy Bypass -File start-server.ps1 -Port 8090` (background) — ya `python -m http.server 8090`.
2. Built-in browser (`mcp__Claude_Browser__*`), viewport 1280×720 (and one mobile 375×812 check).
3. Screenshots: menu · t=3 s · t=15 s · t=60 s (shadows still there?) · each level start · smash wall sequence · push cart · finish gate.
   Tip: `window.app` expose karo aur debug hooks do: `app.debug.jumpToLevel(n)`, `app.debug.spawn('smashWall')`, `app.debug.setTime(s)`.
4. Console: zero errors (`read_console_messages onlyErrors`).
5. Performance: `renderer.info.render.calls`, `.triangles` log karo; fps meter (`?debug=1`).
6. Checklist:
   - [ ] Premium Visual Checklist (3.3) sab ticked
   - [ ] Horizon seamless, no pop-in, no visible world end
   - [ ] Har obstacle type spawn hua aur uska action se clear hota hai; hitbox = visual
   - [ ] Smash wall 3 stages + debris; push cart works; mobile buttons work
   - [ ] Sounds fire on every action once
   - [ ] Level complete → next level palette change → ending
   - [ ] Restart 3× → brightness/perf same
   - [ ] Screenshot ko top template (cherry blossom / sky bridge) se compare — **better lagna chahiye**
7. Jo kharab lage use fix karo, dobara screenshot. Deliver tab karo jab satisfied ho.

---

## 17. Theme cookbook

Quick presets — research ke baad refine karo.

### Avengers (example of full mapping)
- **Levels:** L1 New York street battle (noon, Avengers Tower landmark) · L2 Wakanda jungle/vibranium city (golden hour, Wakanda towers + waterfall) · L3 Titan / Chitauri space battlefield (twilight/storm, giant portal in sky).
- **Palette:** Iron red `#b3121b`, gold `#e8b923`, Cap blue `#1f4e9c`, white, Hulk green `#4f9a2e`, Thor lightning cyan `#7fd8ff`, Thanos purple `#6a3d9a`.
- **Allies:** Iron Man flybys (repulsor + boot thruster glow, trail), Thor with hammer (lightning bolt arcs = additive line segments), Hulk leaping between buildings, Cap shield spinning past, Black Panther statues in Wakanda.
- **Obstacles:** crashed taxis (dodge), Chitauri foot soldiers (dodge/smash), energy barrier gates (duck), rubble/concrete slabs (jump), broken road chasm (jump), vibranium crystal clusters (jump/dodge), Ultron drones hovering (duck).
- **Smash wall:** S.H.I.E.L.D. blast door (hex panels, crack with blue glow). **Push cart:** S.H.I.E.L.D. supply crate cart / Wakandan hover sled.
- **Boss (L3):** giant purple titan throwing meteors into lanes (red telegraph circles).
- **Particles:** embers + ash (NY), leaves + fireflies (Wakanda), purple sparks + space dust (Titan).
- **FPP hands:** Iron gauntlet (red/gold, palm repulsor glow on Shift).

### Other presets
| Theme | Track | L2 rhythm | Landmark | Life | Obstacles | Particles |
|---|---|---|---|---|---|---|
| Spider-Man city | rooftop path / street | water towers, antennas, billboards | Oscorp tower | Spidey web-swinging, pigeons, helicopters | AC units, vents, taxis, drones | wind streaks |
| Jungle temple | wooden bridge / stone path | torch pillars, vine arches | step pyramid temple | parrots, monkeys, waterfall | totems, logs, spike traps, rolling boulder | fireflies, leaves |
| Candy land | fondant track | lollipop lamps, cupcake arches | cake castle | balloons, gummy birds | macaron stacks, choco bars, candy canes | sprinkles |
| Space station | metal catwalk | ring frames with neon | planet + station | ships, asteroids | lasers (duck), cargo pods, airlocks | stars streaks |
| Halloween | graveyard path | lantern posts, dead trees | haunted mansion + moon | bats, ghosts | tombstones, pumpkins, skeleton hands | fog wisps, embers |
| Minecraft/voxel | grass block path | torches, fences | castle / mountain | chickens, clouds | TNT (smash), creepers, lava gap | block particles |
| Egypt | cobblestone causeway | obelisks, palm pairs | giant pyramid + sphinx | camels, birds | sarcophagus, snakes, sand pits | dust, sand gusts |
| Winter | icy cobble road | snowy pines, lamp posts | ice castle | reindeer, snowmen | ice spikes, logs, snowballs rolling | snow |
| Underwater | glass tunnel / reef sand | hoops, coral arches | sunken ship / portal | whales, sharks, fish schools (boids) | jellyfish (duck), crabs, mines | bubbles |
| Squid Game | dorm corridor / playground | bunk beds, guards | giant doll | guards patrolling | beds, guards, glass bridge gaps | none/ confetti |

---

### Kit contents (`E:\Claud in ssd\games\_game_kit\`)
- `lib/three.r128.min.js` — local Three.js (templates wala hi version)
- `sounds/set-A-default/` — jump, duck, left, right, hit, push, smash (sab se zyada use hone wala user voice set)
- `sounds/set-B-long/` — castle-runner wala lamba set + `run-loop.mp3`
- `start-server.ps1` — generic local server (`-Port` param)
- Original templates: `All Games Tamplates\*.rar` (reference ke liye; extract karke specific builder dekh sakte ho — e.g. cherry blossom `world.js` for torii/sakura, sky bridge `world.js` for balloons/zeppelins/islands, pyramid `textures.js` for textures, city `obstacles.js` for police character run-cycle)

# IMMERSIVE INTERACTIVE WARM-UP — PROJECT MASTER DOCUMENT

> **Purpose:** Complete reference for the YouTube FPP runner game series.  
> Author: @veerg2192@gmail.com | AI Build Partner: Claude Sonnet 4.6  
> Last updated: 2026-09-26  
> GitHub-ready — paste this into your repo README or `/docs` folder.

---

## TABLE OF CONTENTS

1. [What Is This Project](#1-what-is-this-project)
2. [All 22 Games Built](#2-all-22-games-built)
3. [Research Methodology](#3-research-methodology)
4. [The Engagement Formula](#4-the-engagement-formula)
5. [How Each Game Was Built (Workflow)](#5-how-each-game-was-built-workflow)
6. [Tech Stack & Architecture](#6-tech-stack--architecture)
7. [Common Bugs Found & Fixed](#7-common-bugs-found--fixed)
8. [File Structure (Per Game)](#8-file-structure-per-game)
9. [Google Drive Links](#9-google-drive-links)
10. [Next Steps — Advanced Games Plan](#10-next-steps--advanced-games-plan)

---

## 1. WHAT IS THIS PROJECT

**Niche:** "Immersive Interactive Warm-Up / Brain Break" on YouTube.  
**Format:** First-person-perspective (FPP) 3D runner browser game recorded as a YouTube video.  
Teachers use these as classroom brain breaks; kids play along by mimicking the player's moves (jump, duck, punch, pose).

**Data (Sep 2026):**  
- 1,586 videos, 156M total views in the last 100 days  
- Demon Slayer runner (benchmark): **321K median views** — our all-time top performer  
- Fastest-growing sub-niche on the platform right now  

**YouTube title template:**  
`4K Immersive Interactive Warm Up | 🎮 [GAME NAME] | Fun Workout | Full Body #N`

**Channel strategy:** 1–2 uploads/week, follow the upload calendar, series numbering (#N in title) = 5× higher median.

---

## 2. ALL 22 GAMES BUILT

| # | Game Name | Folder | EXE | Port | Boss | Upload Timing | Drive Link |
|---|-----------|--------|-----|------|------|---------------|------------|
| 0 | Demon Slayer: Infinity Castle Run | `demon-slayer-infinity-run` | DemonSlayerRun.exe | 8090 | Upper Moon Boss | Anytime (evergreen) | [Drive](https://drive.google.com/open?id=1MvxgqDJUgXRFxTT6uZtdZjyUfxsp3NqP) |
| 0b | Attack on Titan Run | `attack-on-titan-run` | AttackOnTitanRun.exe | 8100 | Beast Titan | Anytime (evergreen) | [Drive](https://drive.google.com/open?id=1K1crkw9LujAVchwF8b1os2HAq6ym1NAe) |
| 01 | Haunted Halloween Escape | `haunted-halloween-escape` | HalloweenEscape.exe | 8101 | Pumpkin King | 1–15 Oct ⭐ | [Drive](https://drive.google.com/open?id=1iBCOyW0Fs3zhjDR3TeTIqBDTCuti_nQI) |
| 02 | Roblox Obby Keyboard Escape | `roblox-obby-keyboard-escape` | ObbyEscape.exe | 8102 | Obby Admin | Anytime | [Drive](https://drive.google.com/open?id=1CEakn7kgAvd7fkPSpWiQkrkRP7BzcKGT) |
| 03 | Spider-Man City Run | `spider-man-city-run` | SpiderManRun.exe | 8103 | Green Goblin | Anytime | [Drive](https://drive.google.com/open?id=1525ilIVrGaw2Paypoqyy0ipHHBcSDHrZ) |
| 04 | Pokémon Adventure Run | `pokemon-adventure-run` | PokemonRun.exe | 8104 | Meowth Mech | Anytime | [Drive](https://drive.google.com/open?id=1vKc_I5ixIobphlJp1hD8L3bIKhUhP0hf) |
| 05 | Super Mario Galaxy Run | `super-mario-galaxy-run` | MarioGalaxyRun.exe | 8105 | Bowser | Anytime | [Drive](https://drive.google.com/open?id=19qaBOsdFDtH5Si2X7IEKOz7RqTgOijGk) |
| 06 | Toy Story 5 Run | `toy-story-5-run` | ToyStoryRun.exe | 8106 | Emperor Zurg | Anytime | [Drive](https://drive.google.com/open?id=1d5xM2roRxlEyMMvESnGh2-SKF4owEDuM) |
| 07 | Grinch Christmas Chase | `grinch-christmas-chase` | GrinchChase.exe | 8107 | The Grinch | 1–10 Nov ⭐ | [Drive](https://drive.google.com/open?id=1-yUN0tDYrU6fClP-IbUdLcM1-k3YRsCQ) |
| 08 | Avengers Doomsday Run | `avengers-doomsday-run` | AvengersRun.exe | 8108 | Doctor Doom | 25 Nov–5 Dec ⭐ | [Drive](https://drive.google.com/open?id=1wDM4yRSHlkNSDAyyEuoqNdrOJlWJJcRb) |
| 09 | Temple Run Jungle Escape | `temple-run-jungle-escape` | TempleRun.exe | 8109 | Giant Demon Ape | Anytime | [Drive](https://drive.google.com/open?id=1HRoDMQcHR3_fEzk_rDI6QHCs7UY66l2j) |
| 10 | Paw Patrol Rescue Run | `paw-patrol-rescue-run` | PawPatrolRun.exe | 8110 | Mayor Humdinger | Anytime | [Drive](https://drive.google.com/open?id=1BkkPU9b908d85m2yZM-Tb9TL0xdo4Plp) |
| 11 | SpongeBob Bikini Bottom Run | `spongebob-bikini-bottom-run` | SpongeBobRun.exe | 8111 | Chum Bucket Mech | Anytime | [Drive](https://drive.google.com/open?id=1WZGkummCazBYXKtjnaglrTPDIW9G7lgl) |
| 12 | Digital Circus Escape | `digital-circus-escape` | DigitalCircusEscape.exe | 8112 | The Abstracted | Anytime | [Drive](https://drive.google.com/open?id=1kDgVGcrUc8V9Qb1Nb1SZfezdlQWZJWTV) |
| 13 | Moana Ocean Run | `moana-ocean-run` | MoanaRun.exe | 8113 | Te Ka / Te Fiti | Anytime | [Drive](https://drive.google.com/open?id=1vys2PlyCrBP9qq54N3glOmqXtaevGDUV) |
| 14 | Lilo & Stitch Hawaii Run | `lilo-stitch-hawaii-run` | StitchRun.exe | 8114 | Captain Gantu | Anytime (movie) | [Drive](https://drive.google.com/open?id=161k5-a38a37azly4ITQ9r1AZRhk7ZFIb) |
| 15 | Squid Game Survival | `squid-game-survival` | SquidGameRun.exe | 8115 | Front Man | Anytime | [Drive](https://drive.google.com/open?id=1SPo1AYOa8tW9wrnayx4grQF2dvXF6vt5) |
| 16 | Poppy Playtime Factory | `poppy-playtime-factory` | PoppyPlaytimeRun.exe | 8116 | Mommy Long Legs | Oct | [Drive](https://drive.google.com/open?id=1cwPxNUytHaM8gYVa8QPFpgGepNobbZgH) |
| 17 | Backrooms Escape | `backrooms-escape` | BackroomsEscape.exe | 8117 | The Entity | Oct | [Drive](https://drive.google.com/open?id=146iZFBRgxBGn5EQgn_5L5RbFm2r2R16Y) |
| 18 | Wizard School Run | `wizard-school-run` | WizardSchoolRun.exe | 8118 | The Dark Lord | Anytime | [Drive](https://drive.google.com/open?id=1u4F0lDJ_gLKGg8tLaecj6Id0jbfKKe40) |
| 19 | Cars Radiator Springs Run | `cars-radiator-springs-run` | CarsRun.exe | 8119 | Chick Hicks | Anytime | [Drive](https://drive.google.com/open?id=1ZKrmog51rQCF9RTCNL1-Wuh-4vAnYny7) |
| 20 | One Piece Pirate Run | `one-piece-pirate-run` | OnePieceRun.exe | 8120 | Kaido (dragon) | Anytime | [Drive](https://drive.google.com/open?id=1qE2RHtlqPTRG4lSgy5MqLwYVTgAApGNe) |

**Full Drive folder:** https://drive.google.com/open?id=1IXKOhxWsrtoW1brPcP70KiOy_LDjBl7V  
**Google Sheet (links + metadata):** https://docs.google.com/spreadsheets/d/1Mn3ZmWLHGMWEADG_g-l_Ic1awuNfUJj5/edit?gid=1887247309

---

## 3. RESEARCH METHODOLOGY

### 3.1 YouTube Niche Research (Nexlev data)
Every game choice is backed by real YouTube data. Research process:

1. **Pull last-100-days data** from Nexlev for "Immersive Interactive Warm Up" niche  
2. **Key metrics used:**
   - `med` = median views per video (the "typical" result for a NEW channel)
   - `n` = number of competing videos (low n = less competition)
   - `top` = the highest-performing single video (proof of ceiling)
3. **Decision rule:** med > 20K AND n < 20 = green light to build

### 3.2 Why Certain Games Were Chosen

| Theme | Why Chosen |
|-------|-----------|
| Spider-Man | med 82K, only n=9, *Brand New Day* film year |
| Temple Run | med 141K (highest of any theme), only n=4 |
| Paw Patrol | med 92K, n=4 — classroom favourite with almost no supply |
| Moana | 1 video = 315K, live-action film year |
| Lilo & Stitch | 1 video = 203K, Stitch is huge with kids |
| Toy Story 5 | 16.2M total views, med 19.5K — biggest single-IP hit |
| One Piece | Demon Slayer anime proved the formula (321K med) |

### 3.3 What Was Deliberately Skipped

| Theme | Reason |
|-------|--------|
| Subway Surfers | Oversaturated, med 0.7K |
| Human Tetris | n=703 videos, zero gap |
| Minecraft | med 1.9K, ImmerZone dominates |
| KPop Demon Hunters | ImmerZone owns this niche |
| Sonic | med 4.7K, not worth it |

### 3.4 Upload Calendar (FOLLOW THIS)

| When | Games to Upload |
|------|----------------|
| **Oct 1–15** | 01 Halloween, 16 Poppy, 17 Backrooms |
| **Oct–Nov** | 02 Roblox, 03 Spider-Man, 04 Pokémon, 06 Toy Story, 09 Temple Run |
| **Nov 1–10** | 07 Grinch |
| **Nov 25 – Dec 5** | 08 Avengers Doomsday |
| **Dec–Feb** | 05, 10–15, 18–20 (fill in the calendar) |

**Pace:** 1–2 uploads per week max. Don't dump everything at once.

---

## 4. THE ENGAGEMENT FORMULA

Every game must have ALL 8 of these elements (proven from Demon Slayer):

1. **YOU ARE INSIDE THE STORY** — FPP as a new member of the team. Famous characters run next to you and react.
2. **LEVELS = THE IP'S 3 MOST FAMOUS PLACES** — A fan recognizes them in 1 second.
3. **THE IP'S SIGNATURE POWER IS YOUR MOVE** — In Level 3: katana slash → web shot, gum-gum pistol, spell. "I can do it too!" moment.
4. **POSE WALLS USE ICONIC CHARACTER POSES** — Viewers physically copy these; most relatable moment.
5. **A MISSION WITH HEART** — Protect or rescue someone fans love. Push them in the cart set piece.
6. **THE VILLAIN EVERYONE KNOWS** — As boss, with health bar, 3 rounds, and FINAL BLOW moment (slow motion + glow).
7. **RISING INTENSITY** — L1: calm & beautiful → L2: tension → L3: fastest + signature move → L4: epic boss.
8. **PAYOFF CELEBRATION** — All heroes together, confetti/fireworks, sun rising. Always kid-safe.

### Level Structure (Every Game)
```
Level 1: [Famous calm location] — Jump/Duck/Dodge obstacles, SET PIECE cart push
Level 2: [Famous dramatic location] — 5 POSE WALLS (iconic character poses)
Level 3: [Most intense/famous location] — SIGNATURE MOVE (Shift key), fastest speed
Level 4: BOSS BATTLE — 3 rounds, 3 attack patterns, FINAL BLOW, CELEBRATION
```

---

## 5. HOW EACH GAME WAS BUILT (WORKFLOW)

### 5.1 Build Steps
1. **Read spec** from `GAME_PLANS/NN-gamename.md`
2. **Copy base engine** from `demon-slayer-infinity-run/` into new folder
3. **Re-theme** — change: `worlds.js`, `characters.js`, obstacle builders, `config.js`, labels, color palette
4. **Build exe** using PowerShell: `powershell -ExecutionPolicy Bypass -File _game_kit\launcher\build-exe.ps1 -GameDir "<folder>" -Name "<GameName>"`
5. **Test in browser** — screenshot proof before delivery
6. **Write GUIDE.md** — same 8-section format as reference game

### 5.2 The Base Engine (demon-slayer-infinity-run)
This is the "gold standard" game. Every new game is built from it. Do NOT modify this folder — it is the reference.

Key systems:
- `js/main.js` — Game loop, renderer, lighting, level management, pause/settings menus
- `js/obstacles.js` — Procedural obstacle spawner (jump/duck/dodge lanes)
- `js/characters.js` — Companion characters (NPC runners beside player)
- `js/worlds.js` — Procedural environment builder per level
- `js/boss.js` — Boss battle system (health bar, 3 attack patterns, round tracking)
- `js/ui.js` — HUD, pose wall prompts, shout text, score display
- `js/audio.js` — Sound system (Web Audio API)
- `js/config.js` — All tunable values (speeds, colors, text labels)

### 5.3 How Claude Builds (Per Chat)
Each game was built in its own Claude Code session (20 separate chats as per master plan). Key commands used:
```
@GAME_PLANS/00_MASTER_PLAN.md @GAME_PLANS/NN-gamename.md
Build this game exactly as the spec says. Follow section 3 of the master plan.
```

---

## 6. TECH STACK & ARCHITECTURE

```
Engine:        Three.js r128 (pinned — do NOT upgrade)
Language:      Vanilla JavaScript (no bundler, no TypeScript)
Renderer:      WebGL via Three.js
Audio:         Web Audio API
Server:        Node.js http-server (served locally)
Launcher:      C# WinForms exe (opens Edge/Chrome in app-mode fullscreen)
Build tool:    PowerShell + Roslyn (csc.exe)
Platform:      Windows 11 (player records with OBS or Xbox Game Bar)
```

### Architecture Diagram
```
index.html
├── style.css (fullscreen canvas, UI overlays)
└── js/
    ├── config.js       ← all magic numbers and text strings
    ├── main.js         ← init, game loop, renderer, lighting, level flow
    ├── worlds.js       ← procedural geometry per level (no image assets)
    ├── characters.js   ← FPP player arms + companion NPCs
    ├── obstacles.js    ← spawn/despawn lanes, collision AABB
    ├── boss.js         ← boss battle (health, attacks, rounds, final blow)
    ├── ui.js           ← HUD, pose walls, shout text, intro/outro cards
    └── audio.js        ← sound loader, Web Audio API
```

### Design Rules
- **No image assets** — all geometry is procedural Three.js
- **No background music** — user adds music in video editing
- **No intro/level cards** — added in video editing
- **Fullscreen always** — games are recorded, not played in a browser tab
- **Each game = one folder** — completely self-contained

---

## 7. COMMON BUGS FOUND & FIXED

These are bugs discovered during build and user QA sessions. Some apply to all games (inherited from base engine), some are game-specific.

---

### BUG 01 — AudioContext Silent on Chrome (ALL GAMES)
**Problem:** Web Audio API's `AudioContext` is created at game start but Chrome suspends it until a user gesture. All voice cues and sound effects were silently failing.  
**Fix:** Add `ctx.resume()` call inside the first user click/keydown handler.
```javascript
// In audio.js — add this inside your click handler
document.addEventListener('click', () => { if (ctx.state === 'suspended') ctx.resume(); }, { once: true });
```
**Affects:** All 22 games (base engine issue)

---

### BUG 02 — Obstacle Exception Swallowed Silently (ALL GAMES)
**Problem:** The obstacle update was wrapped in `try/catch` that only `console.error`'d the error and continued. Result: player saw no obstacles at all (the loop kept running with a broken obstacle state).
```javascript
// BAD — was doing this
try { obstacles.update(delta, speed); } catch(e) { console.error(e); }
```
**Fix:** Let it crash so you see the real error, OR validate obstacle state before the call.
```javascript
// GOOD
if (obstacles && obstacles.update) obstacles.update(delta, speed);
```
**Affects:** All games (base engine)

---

### BUG 03 — Memory Leak in buildEnv (ALL GAMES)
**Problem:** `buildEnv()` creates new `THREE.Mesh` and `THREE.Material` objects on every level transition but never disposes the old ones. After 3–4 level restarts, WebGL runs out of memory and the game crashes or slows to a crawl.  
**Fix:** Dispose old geometry and material before creating new ones.
```javascript
function buildEnv() {
  // Dispose old
  if (envMesh) { envMesh.geometry.dispose(); envMesh.material.dispose(); scene.remove(envMesh); }
  // Create new
  const geo = new THREE.PlaneGeometry(...);
  const mat = new THREE.MeshLambertMaterial({...});
  envMesh = new THREE.Mesh(geo, mat);
  scene.add(envMesh);
}
```
**Affects:** All games — especially noticeable after level 3 boss restart

---

### BUG 04 — setTimeout Fires After Game Already Ended (ALL GAMES)
**Problem:** `releaseStop()` and `endLevel()` use `setTimeout` without checking if the game is still in the same state. If user returns to menu during the delay, `startLevel(next)` fires unexpectedly — starting a new game while on the menu screen.
```javascript
// BAD
setTimeout(() => startLevel(nextLevel), 350);

// GOOD — check state first
setTimeout(() => { if (G.state === 'playing') startLevel(nextLevel); }, 350);
```
**Affects:** All games

---

### BUG 05 — arc() Angle Bug in Procedural Textures (ALL GAMES)
**Problem:** `ctx.arc(x, y, r, 0, 7)` uses `7` as end angle. Since 2π ≈ 6.28, this draws slightly more than a full circle — producing a tiny overlap seam in canvas textures.  
**Fix:** Use `Math.PI * 2`
```javascript
// BAD
ctx.arc(x, y, radius, 0, 7);
// GOOD
ctx.arc(x, y, radius, 0, Math.PI * 2);
```
**Affects:** All games (obstacles.js)

---

### BUG 06 — Debug Hooks Exposed on window.game (ALL GAMES)
**Problem:** `G.step`, `G.press`, `G.start`, `G.release`, `G.hold` are assigned to the global `window.game` object in every shipped game. Anyone in browser console can skip levels or inject inputs.  
**Impact:** Low security risk for a game, but looks unprofessional if discovered.  
**Fix:** Remove or guard with a debug flag:
```javascript
if (typeof DEBUG !== 'undefined' && DEBUG) { window.game = G; }
```

---

### BUG 07 — No Window Resize Handler (ALL GAMES)
**Problem:** Camera aspect and renderer size are set once at initialization. If the window is resized (common during dev/testing), the canvas stretches.  
**Fix:** Add resize listener
```javascript
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```
**Affects:** All games — doesn't matter for fullscreen recording, but matters for testing

---

### BUG 08 — Pose Wall Hit Detection Too Strict (MULTIPLE GAMES)
**Problem:** Pose wall collision checked if the player was in an exact pixel position. Players at 60fps might jump over the trigger zone, causing the pose wall to never trigger.  
**Fix:** Widen the trigger zone and add a "just passed" flag to prevent double-trigger.
```javascript
// Check if obstacle z has CROSSED the player (not exact match)
if (obs.z > -0.5 && obs.z < 1.5 && !obs.triggered) {
  obs.triggered = true;
  triggerPoseWall(obs.type);
}
```
**Affects:** Games 01, 03, 05, 07, 08

---

### BUG 09 — Boss Attack Pattern Skips Round 3 (MULTIPLE GAMES)
**Problem:** Boss health bar goes from Round 2 to "defeated" without entering Round 3. Caused by a rounding error in the health threshold check.
```javascript
// BAD — floating point issue
if (boss.health <= 0.33) enterRound3();
// GOOD — use integer rounds
if (boss.health <= Math.ceil(boss.maxHealth / 3)) enterRound3();
```
**Affects:** Games 03, 05, 08, 10

---

### BUG 10 — Companion Characters Run Through Obstacles (MULTIPLE GAMES)
**Problem:** NPC companion characters (Zoro, Pikachu, etc.) have no collision detection — they run straight through obstacles instead of reacting, which looks wrong on camera.  
**Fix:** Add simple dodge animation for companions when an obstacle is in their lane.
```javascript
// In characters.js — simple dodge
if (obstacleAhead(companion.lane, companion.z)) {
  companion.mesh.position.y = lerp(companion.mesh.position.y, 0.8, 0.15); // bob up
}
```
**Affects:** All games — partially implemented, needs polish in future versions

---

### BUG 11 — Cart Set Piece Doesn't End (GAME-SPECIFIC)
**Problem:** In the cart push set piece (Level 1), the cart sometimes doesn't reach the finish line because the physics delta accumulates incorrectly on low-FPS machines. The set piece hangs indefinitely.  
**Fix:** Add a maximum time fallback.
```javascript
let cartTimer = 0;
function updateCart(delta) {
  cartTimer += delta;
  cart.z -= cartSpeed * delta;
  if (cart.z < CART_FINISH_Z || cartTimer > 8) endCartSetPiece();
}
```
**Affects:** Games where cart set piece was implemented

---

### BUG 12 — Signature Move Fires Multiple Times (GAME-SPECIFIC)
**Problem:** Shift key held down triggers the signature move (slash, web shot, etc.) repeatedly every frame instead of once per press.  
**Fix:** Use a `keydown` event (fires once) and a cooldown flag.
```javascript
let sigMoveCooldown = false;
document.addEventListener('keydown', (e) => {
  if (e.code === 'ShiftLeft' && !sigMoveCooldown && G.level === 3) {
    fireSignatureMove();
    sigMoveCooldown = true;
    setTimeout(() => sigMoveCooldown = false, 1200);
  }
});
```
**Affects:** Games with Level 3 signature move (all games have this)

---

### BUG 13 — Colors Wrong on Different Monitor Profiles (VISUAL)
**Problem:** Procedural colors (using Three.js hex values) looked correct on the dev monitor but washed out or too dark on different screens.  
**Fix:** Increase ambient light intensity in `config.js` and use `THREE.sRGBEncoding` on the renderer.
```javascript
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
```
**Affects:** All games (visual quality issue)

---

### BUG 14 — exe Opens Wrong Port (LAUNCHER)
**Problem:** The launcher `.exe` hardcodes port 8090. When a second game was opened simultaneously, it failed to start because port 8090 was already in use.  
**Fix:** Each game gets its own port (8090, 8100–8120). The build script passes the port as a parameter.  
**Rule:** Never reuse a port across games. Keep the port table in this document.

---

### BUG 15 — Sound Files Not Found After Copying (ALL GAMES)
**Problem:** When copying the base engine to a new folder, the `sounds/` path references broke if the folder structure changed.  
**Fix:** All sound paths in `audio.js` must use relative paths starting from the HTML file location.
```javascript
// BAD
const soundPath = 'E:/Claud in ssd/games/sounds/jump.mp3';
// GOOD
const soundPath = './sounds/jump.mp3';
```
**Affects:** All games during initial setup

---

## 8. FILE STRUCTURE (PER GAME)

Every game folder must have ALL of these:

```
<game-folder>/
├── index.html              ← Entry point (just loads js/)
├── style.css               ← Fullscreen canvas, overlay styles
├── GUIDE.md                ← Player guide (controls, levels, boss)
├── ABOUT_SCRIPT.txt        ← YouTube script, thumbnail prompts, research
├── icon.ico                ← Custom icon for the exe
├── <GameName>.exe          ← Built launcher exe
├── start-server.ps1        ← Quick-start PowerShell script
├── js/
│   ├── config.js
│   ├── main.js
│   ├── worlds.js
│   ├── characters.js
│   ├── obstacles.js
│   ├── boss.js
│   ├── ui.js
│   └── audio.js
├── sounds/                 ← WAV/MP3 sound effects
│   ├── jump.wav
│   ├── land.wav
│   ├── punch.wav
│   ├── boss_hit.wav
│   └── ... (8–12 files)
└── tools/
    ├── Launcher.cs         ← C# source for the exe
    └── build-exe.ps1       ← Script to rebuild exe
```

---

## 9. GOOGLE DRIVE LINKS

All files are uploaded to Google Drive via rclone (`gdrive:` remote).  
**Master folder:** `gdrive:Claud in ssd/games/`  
**Public folder link:** https://drive.google.com/open?id=1IXKOhxWsrtoW1brPcP70KiOy_LDjBl7V

To re-upload or sync:
```powershell
rclone copy "E:\Claud in ssd\games" "gdrive:Claud in ssd/games" --progress
```

To get a link for any specific game folder:
```powershell
rclone link "gdrive:Claud in ssd/games/<folder-name>"
```

---

## 10. NEXT STEPS — ADVANCED GAMES PLAN

### 10.1 Remaining from the 20-Game Plan
Games not yet built or needing review — build these next:

| Priority | Why |
|----------|-----|
| Upload calendar games first | Halloween window closes Oct 15 |
| Verify each game's boss round 3 | Bug 09 affects 4 known games |
| Add window resize handler to all | Quick fix, 5 minutes per game |

### 10.2 Advanced Features for Next Generation Games

The next batch of games (Game 21+) should include:

**Visual upgrades:**
- Post-processing: Bloom, God rays, Motion blur (Three.js `EffectComposer`)
- Particle systems: Confetti, fire, magic sparks (custom Three.js particle systems)
- Dynamic shadows that change as levels progress (day → dusk → night → dawn)
- Procedural crowd in the background (low-poly instanced geometry)

**Gameplay upgrades:**
- **Rhythm punching:** Boss attacks sync to a beat (detected via audio `AnalyserNode`)
- **Combo system:** Chain successful inputs for score multiplier (shows on HUD)
- **Crossover games:** Two IP worlds merged (`Mario × Pokémon RUN`)
- **Branching paths:** Dodge left/right to choose a lane (not just left/right dodge)
- **Co-op mode (recorded):** Two player arms on screen, both must do the same pose

**Production upgrades:**
- Pre-generate thumbnail frames (the game pauses at peak visual moments)
- Auto-generate the YouTube title + description from `config.js`
- Batch QA: automated screenshot at each level transition point

### 10.3 Cloud Credits Strategy ($250 Available)

Claude Code cloud sessions can run multiple advanced games **simultaneously in parallel** using the Workflow tool:

```
Workflow: 10 games in parallel
- Each cloud agent gets its own game spec
- Agent reads GAME_PLANS/NN-*.md
- Agent copies demon-slayer base engine
- Agent builds, tests, and delivers the complete game
- All 10 run at the same time → 10 games in ~2 hours
```

**Recommended use of $250:**
1. Build the remaining 3-5 games from the plan (small workflows, ~$5 each)
2. Build "Next Gen" advanced games with bloom + particles + rhythm boss (~$20 each)
3. Build crossover games (Mario × Pokémon, etc.) — 2 worlds need double research (~$30 each)

**To trigger a cloud build:** User says `"use a workflow"` or `"use ultracode"` and provides the game number(s).

### 10.4 Crossover Game Ideas (Post-20-Plan)

| Crossover | Why It Wins |
|-----------|------------|
| Mario × Pokémon RUN | 655K top performer already exists; two built worlds |
| Demon Slayer × One Piece | Both assets built; anime crossovers trend |
| Squid Game × Roblox Obby | "Obby but deadly" concept; both worlds built |
| Halloween × Backrooms | October window; both horror worlds built |

---

## APPENDIX — CONTROLS (ALL GAMES)

| Key | Action |
|-----|--------|
| **W** or **↑** or **Space** | Jump |
| **S** or **↓** | Duck / Slide |
| **A** or **←** | Dodge left |
| **D** or **→** | Dodge right |
| **Shift** (Level 3 only) | Signature Move |
| **P** or **Esc** | Pause |
| **R** | Restart (on game over) |

---

## APPENDIX — THUMBNAIL PROMPT FORMULA

Each game's `ABOUT_SCRIPT.txt` has a full AI image prompt. General formula:

```
Center frame: first-person view showing [IP character]-style arms,
performing [signature move]. [Hero companion] runs ahead.
Background: [Level 4 / most dramatic scene].
Style: [IP's art style] fan-art, 16:9 ratio, vibrant colors, epic scale.
Text overlay: "[GAME NAME]" in [IP logo style] + "[action tagline]"
```

---

*Document generated by Claude Sonnet 4.6 | Project: Immersive Interactive Warm-Up YouTube Series*  
*All game assets are self-contained in `E:\Claud in ssd\games\`*

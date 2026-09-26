# Demon Slayer: Infinity Castle Run — Complete Guide

Fan-made first-person (FPP) runner / "immersive interactive warm-up" game. Built with **Three.js r128** (local copy, no install needed).
Everything is inside this one folder: source code, sounds, icon, the launcher `.exe`, and the exe's own source code.

---

## 1. Play
1. Double-click **`DemonSlayerRun.exe`** (keep the exe inside this folder).
   - It opens the game in its own fullscreen window (Edge or Chrome app-mode). Close the window (or **Alt+F4**) to exit.
   - First run: if Windows shows "Windows protected your PC" → **More info → Run anyway** (the exe is not code-signed).
2. Alternative without the exe: `powershell -ExecutionPolicy Bypass -File start-server.ps1` then open `http://localhost:8090/`.
   (Do not open `index.html` by double-click — browsers block the sound files from `file://`.)

**Another computer:** copy the **whole folder**. Needs Windows 10/11 with Edge or Chrome. Internet is only used for the two title fonts (without it a fallback font is used).

## 2. Controls
| Key | Action |
|---|---|
| A / D, ← / → | Change lane (voice: left / right) |
| W / Space / ↑ | Jump (voice: jump) |
| S / ↓ | Duck (voice: duck) · in the air = fast-fall |
| **Shift** (or E / Enter) | Katana **slash** (train) · **smash** wall ×3 · **push** cart (hold) · **break** pose wall · boss cross-slash / **FINAL BLOW** |
| 1 – 4 | Jump straight to level 1–4 |
| P / Esc | **Pause menu** (resume, restart, levels, settings, main menu) |
| H | Hide/show HUD · **M** mute · **F** fullscreen |

Boss (level 4): **A** = slash left blue orb, **D** = slash right blue orb, **Shift** = pink X orb, **S** = duck under the red shockwave ring.
Touch/mobile: swipe left/right/up/down, tap = Shift (buttons appear on touch screens; see Settings).

## 3. Menu & Settings
Start screen: Play · Level 1–4 · **⚙ Settings** · Fullscreen. Pause menu (P): Resume · Restart level · Levels · Settings · Main menu.
Settings are saved automatically:
- **Guide & HUD:** move-cue icons on/off, **guide text size (Off/Small/Medium/Large)**, guide position (Bottom/Center), progress bar, speed lines, touch buttons.
- **Gameplay:** game speed (Slow/Normal/Fast), pose walls break automatically.
- **Camera:** field of view, camera shake, head bob.
- **Sound:** master / voice / effects volume.
- **Graphics:** High / Low (for slower PCs).

## 4. Levels (≈4 min total; ~1.4 s black fade between levels = your cut point for intro/level cards in editing)
| # | World | Length | What happens |
|---|---|---|---|
| 1 | **Wisteria Forest** (moonlit night, wisteria trees, stone lanterns, Tanjiro runs ahead) | ~48 s | jump fallen logs · duck shimenawa rope · dodge demons · **push cart with Nezuko's box** · **smash wall ×3** |
| 2 | **Infinity Castle** (red torii, shoji walls, floating rooms, Inosuke ahead) | ~50 s | jump tatami · duck noren beam · dodge sliding shoji · **5 POSE WALLS** (stop → 3-2-1 hold pose → Shift) · smash wall |
| 3 | **Night Train rooftop** (Mugen-train vibe, Zenitsu ahead) | ~50 s | **NEW: katana SLASH** on flesh tentacles (Water Breathing trail) · jump flesh ridge · duck steel bridge · dodge vents · flesh wall |
| 4 | **Upper Moon Boss** (floating tatami arena, snowflake aura) | ~70 s | 3 rhythm rounds (orbs + shockwaves, combo counter, PERFECT/GOOD/MISS) → **FINAL BLOW** → sunrise → Tanjiro, Nezuko, Zenitsu, Inosuke celebrate |

Unlimited lives: a mistake = red flash + shake, the run continues (good for recording). No background music (add it in editing).

## 5. Folder structure (what every file does)
```
demon-slayer-infinity-run/
  DemonSlayerRun.exe   launcher (serves this folder + opens the game window)
  index.html           page: canvas, HUD, menus (start / pause / settings)
  style.css            all UI styling (HUD, guide pill, menus, settings)
  icon.ico             exe icon
  GUIDE.md             this file
  start-server.ps1     optional local server (alternative to the exe)
  tools/
    Launcher.cs        source code of the exe (C#)
    build-exe.ps1      rebuilds the exe
  sounds/              voice cues: jump, duck, left, right, hit, push, smash (.mp3)
  js/
    three.min.js       Three.js r128 (3D engine)
    util.js            helpers: colors, canvas textures, halos, meshes, RNG
    config.js          LEVEL SCRIPT: obstacle order/timing, speeds, durations  ← edit gameplay here
    settings.js        settings menu definitions (add a new option = 1 line)
    figures.js         stick-figure silhouettes (cue icons, pose walls)
    audio.js           voice-cue MP3 loader + synthesized sound effects
    fx.js              particles: debris, sparks, shockwave rings
    worlds.js          the 4 environments + lighting/sky presets
    characters.js      katana (FPP), demons, tentacle, boss, heroes, crow
    obstacles.js       obstacle models, collisions, push cart / smash wall / pose wall logic
    boss.js            boss rhythm fight, rounds, final blow, dawn
    ui.js              HUD: cue icon, guide pill, boss bar, combo, flashes, speed lines
    main.js            renderer, sky shader, camera, player physics, input, level flow, menus
```

## 6. Customize
- **Obstacles / timing / length:** `js/config.js` → each level has `seq: [[seconds, 'kind', value], ...]`.
  Kinds: `jump`, `duck`, `left`, `right`, `cart`, `wall`, `pose` (value = `star|tree|warrior|kick|tpose|crane|sidebend|xarms`), `slash` (value = `left|right|x`).
- **Speed:** `speed` per level in `config.js` (or the Settings → Game speed).
- **Voice sounds:** replace the MP3s in `sounds/` (same file names). Extra cues: add e.g. `slash.mp3`, `pose.mp3`, `finalblow.mp3` and list them in `config.js → extraSounds`.
- **Banner text in the castle:** `config.js → bannerText`.
- **New setting:** add one line to `DEFS` in `js/settings.js`, read it anywhere with `DS.Settings.get('key')`.
- After editing files just run the exe again — no rebuild needed.

## 7. Rebuild the exe (only if `tools/Launcher.cs` or the icon changes)
```
powershell -ExecutionPolicy Bypass -File tools\build-exe.ps1 -GameDir . -Name DemonSlayerRun
```
Uses Windows' built-in C# compiler (.NET Framework 4, no downloads). Add `-Embed` to pack all files inside a single portable exe.

## 8. Recording tips
- Press **F** (or it starts fullscreen from the exe), then record with OBS/Xbox Game Bar at 60 fps.
- Use keys **1–4** to record each level separately; the black fade between levels is the cut point for your intro/level cards.
- Settings → Guide text **Small** or **Off** for a cleaner video; cue icons can stay for the viewers.

## 9. Notes
- Characters are original low-poly fan-art built from primitives (no ripped models/logos). Demon Slayer is a copyrighted franchise — monetization/claim risk is the channel owner's decision.
- Debug helpers (browser console): `game.start(0..3)`, `game.step(seconds)`, `game.press('jump')`.

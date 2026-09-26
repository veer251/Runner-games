# Games workspace

User builds first-person (FPP) 3D runner browser games (Three.js r128, procedural, no image assets).
User writes in Roman Urdu — reply in simple Roman Urdu/English mix.

## When the user names a game from GAME_PLANS (e.g. "05", "Mario", "Halloween wali game bnao")
Match it to `GAME_PLANS\NN-*.md`, read `GAME_PLANS\00_MASTER_PLAN.md` + that spec, and **start building immediately — no questions**. Follow master plan §3 exactly and deliver the game's own folder + exe.

## When the user gives a game idea / theme / reference image
1. **Read `GAME_BUILDER_GUIDE.md` fully first** — it is the build spec (workflow, house style, visuals, levels, obstacles, QA).
2. Ask **at most 5 questions total** (bundle them in one AskUserQuestion call; zero if the idea is clear). Decide everything else yourself.
3. Research the theme yourself (WebSearch/WebFetch), then build in its OWN folder `E:\Claud in ssd\games\<slug>\` (one game = one folder, next game = next folder).
4. **Base engine = `demon-slayer-infinity-run\`** (approved reference: settings menu, pause menu, small bottom guide pill, set pieces, boss rhythm, launcher). Copy that whole folder and re-theme it (worlds.js, characters.js, obstacle builders, config.js, labels, icon, GUIDE.md). 20 ready game specs + build rules + per-chat prompt: `GAME_PLANS\00_MASTER_PLAN.md` and `GAME_PLANS\NN-*.md`.
   Every game folder must contain EVERYTHING: `GUIDE.md` (full guide, same sections as the reference), full source (`index.html`, `style.css`, `js/`), `sounds/`, `icon.ico`, `start-server.ps1`, `tools/` (Launcher.cs + build-exe.ps1) and the built `<GameName>.exe`.
5. Self-QA in the built-in browser with screenshots before delivering; send the best screenshots to the user.
6. Deliver the game folder (files stay SEPARATE and editable) **plus a launcher .exe inside that folder** (user plays + records with it):
   `powershell -ExecutionPolicy Bypass -File _game_kit\launcher\build-exe.ps1 -GameDir "<game folder>" -Name "<GameName>"`
   The exe serves the files next to it and opens Edge/Chrome app-mode fullscreen. Put an `icon.ico` in the game folder for a custom icon.
   Do NOT embed files by default (`-Embed` only if the user asks for a portable single file).
   Games are PLAYABLE keyboard games (like the old templates), not autopilot videos. No background music (user adds it in editing); intro/level cards are added in editing too.

## Layout
- `All Games Tamplates\*.rar` — 35 older games (reference only; don't modify). Best visuals: cherry blossom, Sky bridge, castle runner, subwaysurf city.
- `_game_kit\` — reusable three.js, sounds (`set-A-default`, `set-B-long`), `start-server.ps1`.
- `GAME_BUILDER_GUIDE.md` — master guide.
- `GAME_PLANS\` — 00_MASTER_PLAN.md (research, engagement formula, build rules, chat prompt) + 20 full game specs (01–20), one per chat.
- `demon-slayer-infinity-run\` — finished reference game / base engine for all new games.
- `VIRAL_DNA.md` — frame-by-frame breakdown of 10 viral videos: exact level timings, cards, gimmicks (pose walls, freeze, boss rounds, rhythm punches), UI grammar, story/audio patterns, and the blueprint + engine feature list every new game must follow.
- `YOUTUBE_VIRAL_RESEARCH.md` — niche research (immersive interactive warm-up / brain break): what goes viral, gaps, format rules, title/description templates, content calendar. Games are made for these YouTube videos — follow its §7 format rules.

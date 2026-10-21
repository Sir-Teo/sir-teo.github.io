# Project hover previews

The pills open anchored cards with lightweight interactions and links to the full projects. Keyboard focus and touch are supported. Cards stay within the viewport; game canvases also shrink for short landscape screens.

## Playable game scenes

`app/components/GamePreview.tsx` and `app/lib/game-previews/` implement original, self-contained 2D mini-games inspired by each project's core interaction. They do not embed the full games or import their code, artwork, audio, engines, or saved games.

- **Crown & Clan — Pocket raid:** deploy four barbarians and four archers along the village edge. Units choose targets, move into range and attack; cannons return fire. Destroy the village for three stars. Touch/click places troops; arrows move the deployment cursor and Enter deploys.
- **Summoner’s Rift — Volley practice:** drag and release to aim a seven-arrow frost volley at moving minions. Projectiles have collision, one hit per target per volley, a cooldown and respawning targets. Clear six targets. W fires; left/right arrows or held touch buttons move the archer.
- **San Andreas — Sunset drive:** accelerate, steer and reverse a car through four ordered checkpoints. Road/grass speed, inertia and building collisions are simulated. Arrows/WASD or simultaneous held touch controls drive.

All graphics are drawn with Canvas 2D, without external assets or new dependencies. A single optional chunk contains all three scenes; it is fetched only when a game card opens. The board-analysis component is separately lazy-loaded. Replacing the previous SVG illustrations also removes their unused styles and animations.

The October 21 build measured about **8 KB gzip** for all three scenes. Initial page scripts decreased from about **213 KB to 188 KB gzip**. These are local compression measurements, not a claim about a particular CDN transfer. `npm run build` enforces a **12 KiB gzip / 32 KiB raw** game-chunk budget and checks that the chunk is absent from the initial HTML's script list. Recheck with `npm run check:preview-size` after building.

Simulation starts only after Play. It draws at up to 30 fps, caps pixel density at 2× and bounds troops, projectiles and effects. HUD updates are throttled separately. Close, focus leaving the game, page hiding and window blur pause it and release held input. Reopening retains the current session, paused; Resume is explicit. No storage or background timers are needed. Reduced motion removes decorative hit effects; user-started gameplay remains functional.

## Board games

Web Chess, Web Xiangqi and Web KaTrain open directly into playable analysis boards. Select a piece and a legal destination, place a Go stone, or click an engine suggestion. Undo, Reset, Go passes, chess promotion and arrow-key navigation work. These are live local searches: Stockfish, Pikafish and the Web KaTrain neural/MCTS worker. See [`../live-engines/README.md`](../live-engines/README.md) for sources and the small Go model's limits.

## Explainers

The thumbnail list selects nine-second silent excerpts from Teo’s local `explainer-videos/renders/{llm,quantum,relativity}.mp4` renders. Starts: 10:20, 22:50 and 19:05. YouTube IDs: `o0ENWGEVJm0`, `aaPbLBw0ZYc`, `vdroXP5hjjQ`. WebP posters come from the same first frames. Clips are 640px H.264, 24 fps, no audio. Only the selected clip is mounted; it pauses when closed or hidden. Reduced-motion users get a still frame with an explicit Play control.

The previous screenshot assets remain in this directory but are not fetched by game cards. Everything deploys through the existing GitHub Pages workflow; no new workflows or scheduled jobs are introduced.

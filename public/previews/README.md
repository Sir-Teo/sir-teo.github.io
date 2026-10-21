# Project hover previews

The pills open anchored cards with lightweight interactions and links to the full projects. Keyboard focus and touch are supported. Cards stay within the viewport. Portrait layouts stack the scene and controls; short landscape screens use a wider card with the scene beside the controls.

## Playable game scenes

`app/components/GamePreview.tsx` and `app/lib/game-previews/` implement original, self-contained 2D mini-games inspired by each project's core interaction. They do not embed the full games or import their code, artwork, audio, engines, or saved games.

- **Crown & Clan — Village raid:** an isometric village with raised buildings, depth-sorted troops, arcing projectiles and destructible defenses. Deploy four barbarians and four archers outside the walls. A targeted lightning spell damages nearby buildings and stuns cannons. Visual coordinates are inverse-projected for placement; spell targeting also accepts a tap on the visible roof. Arrows move the placement cursor; Enter deploys.
- **Summoner’s Rift — Skillshot lab:** switch between Ashe's frost volleys/crystal arrow and Lux's binding/final spark. Drag and release to aim and cast the selected ability, with real projectile collisions, freezing/rooting, separate cooldowns and eight takedowns to finish. Arrow keys aim, A/D move, W/Q casts the basic skill and R casts the ultimate. Switching champions preserves shared cooldowns and clears in-flight projectiles.
- **San Andreas — Coast run:** a perspective highway through palms and a Los Santos sunset. Drag or hold arrow controls to steer; acceleration is automatic. Dodge traffic, earn overtakes/close calls and use regenerating nitro (Space or the button). Down/S brakes. A 600 m route ends with the overtake and near-miss totals. Collisions reduce speed; roadside driving also slows the car.

All graphics are drawn with Canvas 2D, without external assets or new dependencies. A single optional chunk contains all three scenes; it is fetched only when a game card opens. The board-analysis component is separately lazy-loaded. No additional media downloads are required.

The October 21 build measured about **11 KiB gzip** for all three scenes. Initial page scripts decreased from about **213 KB to 188 KB gzip**. These are local compression measurements, not a claim about a particular CDN transfer. `npm run build` enforces a **12 KiB gzip / 32 KiB raw** game-chunk budget and checks that the chunk is absent from the initial HTML's script list. Recheck with `npm run check:preview-size` after building.

Simulation starts only after Play. It draws at up to 30 fps, caps pixel density at 2× and bounds troops, projectiles and effects. HUD updates are throttled separately. Close, focus leaving the game, page hiding and window blur pause it and release held input. Reopening retains the current session, paused; Resume is explicit. No storage or background timers are needed. Reduced motion removes decorative movement, nitro flames, and hit effects; user-started gameplay remains functional.

## Board games

Web Chess, Web Xiangqi and Web KaTrain open directly into playable analysis boards. Select a piece and a legal destination, place a Go stone, or click an engine suggestion. Undo, Reset, Go passes, chess promotion and arrow-key navigation work. These are live local searches: Stockfish, Pikafish and the Web KaTrain neural/MCTS worker. See [`../live-engines/README.md`](../live-engines/README.md) for sources and the small Go model's limits.

## Explainers

The thumbnail list selects nine-second silent excerpts from Teo’s local `explainer-videos/renders/{llm,quantum,relativity}.mp4` renders. Starts: 10:20, 22:50 and 19:05. YouTube IDs: `o0ENWGEVJm0`, `aaPbLBw0ZYc`, `vdroXP5hjjQ`. WebP posters come from the same first frames. Clips are 640px H.264, 24 fps, no audio. Only the selected clip is mounted; it pauses when closed or hidden. Reduced-motion users get a still frame with an explicit Play control.

The previous screenshot assets remain in this directory but are not fetched by game cards. Everything deploys through the existing GitHub Pages workflow; no new workflows or scheduled jobs are introduced.

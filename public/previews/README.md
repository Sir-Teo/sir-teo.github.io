# Project hover previews

The pills open anchored cards with lightweight interactions and links to the full projects. Keyboard focus and touch are supported. Cards stay within the viewport. Portrait layouts stack the scene and controls; short landscape screens use a wider card with the scene beside the controls.

## Actual game previews

`app/components/GamePreview.tsx` displays real app captures. Switch scenes, use **Look closer** to magnify, then move the pointer, drag on touch, or use arrow keys to inspect. Images are identified as captures; they do not simulate gameplay. Only the selected image is mounted. There are no animation loops or automatic game downloads.

- **Crown & Clan:** village and Goblin Forest raid.
- **Summoner’s Rift:** Ashe and Lux in the real textured production map.
- **San Andreas:** CJ on foot and driving a Greenwood, with native terrain and the actual HUD.

**Play here** opens the deployed app in `GameWindow.tsx`, a native modal dialog with an iframe. The game receives its real viewport and native controls. It uses its normal browser saves. Reload and Open tab remain available. Closing unmounts the frame, restores page scrolling, and returns focus to the project pill. Keyboard users can close from the toolbar; Escape inside a game belongs to that game's pause menu. Small screens get a full-viewport window, while the hover card itself stays anchored and clamped. Rift's live game requires a mouse and keyboard; the capture controls work on touch.

The October 21 build measures **2.3 KiB gzip** for the two optional UI chunks combined, and **273.6 KiB** for all six captures. Initial scripts are **184.2 KiB gzip**. These are local compression measurements. A hover downloads only its selected capture; Play here downloads the full game's own assets separately, which can be substantial. Nothing from those engines or asset packs is copied into the homepage build.

`npm run build` checks separate lazy chunks, a combined **8 KiB gzip / 20 KiB raw** UI limit, **96 KiB per capture / 384 KiB total**, and absence of these chunks and captures from initial HTML. The original simulated mini-games have been removed.

### Capture provenance

- `crown-clan.webp` and `summoners-rift.webp`: existing captures of the deployed projects, retained after checking against current app rendering.
- `crown-raid.webp`: `coc.teozeng.dev`, Goblin Forest deployment screen, captured October 21, 2026.
- `rift-lux.webp`: `teozeng.dev/web-lol`, production Lux practice, captured October 21, 2026.
- `gta-grove.webp`: `teozeng.dev/web-gta`, CJ on foot after the introduction, captured October 21, 2026.
- `gta-driving.webp`: `web-gta/artifacts/native-world-driving.png`, actual browser gameplay.

New captures are encoded as 1000px-wide WebP at quality 72. Artwork belongs to the source projects and their respective rights holders.

## Board games

Web Chess, Web Xiangqi and Web KaTrain open directly into playable analysis boards. Select a piece and a legal destination, place a Go stone, or click an engine suggestion. Undo, Reset, Go passes, chess promotion and arrow-key navigation work. These are live local searches: Stockfish, Pikafish and the Web KaTrain neural/MCTS worker. See [`../live-engines/README.md`](../live-engines/README.md) for sources and the small Go model's limits.

## Explainers

The thumbnail list selects nine-second silent excerpts from Teo’s local `explainer-videos/renders/{llm,quantum,relativity}.mp4` renders. Starts: 10:20, 22:50 and 19:05. YouTube IDs: `o0ENWGEVJm0`, `aaPbLBw0ZYc`, `vdroXP5hjjQ`. WebP posters come from the same first frames. Clips are 640px H.264, 24 fps, no audio. Only the selected clip is mounted; it pauses when closed or hidden. Reduced-motion users get a still frame with an explicit Play control.

Other previously captured assets remain in this directory. Everything deploys through the existing GitHub Pages workflow; no new workflows or scheduled jobs are introduced.

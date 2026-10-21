# Project hover previews

Project pills open anchored cards with keyboard and touch support. Cards stay within the viewport, including small portrait and short landscape screens.

## Game films

Each game has one nine-second silent loop of actual gameplay, using the same `PreviewFilm.tsx` surface as the explainers. The card contains a title, film, small pause/play control and **Open game** link. Scene tabs, magnification, embedded games and their launch controls have been removed.

- **Crown & Clan:** deploying barbarians and archers in a Goblin Forest raid.
- **Summoner’s Rift:** Ashe attacking a target dummy and casting Volley on the production map.
- **San Andreas:** CJ leaving the starting alley and exploring East Los Santos on foot.

Recorded through the deployed apps on October 21, 2026: `coc.teozeng.dev`, `teozeng.dev/web-lol`, and `teozeng.dev/web-gta`. Frames retain capture timestamps before conversion to 640 × 360 H.264 at 24 fps, CRF 28–29, with no audio and fast-start metadata. WebP posters come from the recordings. Artwork belongs to the source projects and their respective rights holders.

Only the open card mounts its clip. Closing unmounts and pauses it; hidden tabs pause playback. Reduced-motion users see the poster until they press Play, with `preload="none"` preventing automatic video downloads. Media errors retain a still preview and the external game link. No game engines, iframe windows, or asset packs are loaded by these previews.

The three clips and posters total approximately **716 KiB**. `npm run build` checks a lazy game-film chunk capped at **4 KiB gzip / 8 KiB raw**, **600 KiB per clip / 50 KiB per poster / 1600 KiB combined**, and absence of game films and their UI chunk from the initial HTML. Replaced screenshot assets have been removed.

## Board games

Web Chess, Web Xiangqi and Web KaTrain open directly into playable analysis boards. Select a piece and a legal destination, place a Go stone, or click an engine suggestion. Undo, Reset, Go passes, chess promotion and arrow-key navigation work. These are live local searches: Stockfish, Pikafish and the Web KaTrain neural/MCTS worker. See [`../live-engines/README.md`](../live-engines/README.md) for sources and the small Go model's limits.

## Explainers

The thumbnail list selects nine-second silent excerpts from Teo’s local `explainer-videos/renders/{llm,quantum,relativity}.mp4` renders. Starts: 10:20, 22:50 and 19:05. YouTube IDs: `o0ENWGEVJm0`, `aaPbLBw0ZYc`, `vdroXP5hjjQ`. WebP posters come from the same first frames. Clips are 640px H.264, 24 fps, no audio. Only the selected clip is mounted; it pauses when closed or hidden. Reduced-motion users get a still frame with an explicit Play control.

Everything deploys through the existing GitHub Pages workflow; no new workflows or scheduled jobs are introduced.

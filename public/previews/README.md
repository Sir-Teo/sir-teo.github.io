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

## Single-game board reviews

Each board pill opens one complete game from the blog's interactive review figures:

- **Chess:** Club vs Intermediate, 57 half-moves, recorded Stockfish 18 Lite analysis at depth 16. Opens on 19…Kf8, the game's blunder.
- **Xiangqi:** Easy vs Medium, 100 half-moves, recorded Pikafish analysis at depth 16. Opens on the largest winning-chance loss.
- **Go:** the blog's 9×9 self-play game, 72 moves, 200-visit neural/MCTS analysis with the small bundled model. Opens on move 37, explicitly labeled as a planted slip. These are demonstration-model estimates.

Use previous/play/next, keyboard arrows, or the draggable evaluation curve to navigate. Home/End jump to the first/last position; file/rank labels orient the board to the notation. Hover, focus or tap one of three candidate lines to see its first two arrows (chess/xiangqi) or up to four numbered stones (Go). The board stays at the recorded game position; these markings preview continuations. State is retained across incidental hover closures. Replay is opt-in, pauses when the tab hides, and stops on unmount. Desktop and short landscape cards place controls beside the board; phone cards stack them.

Evaluations and candidate lines come from the apps' actual offline engine runs already used by the blog. They are labeled as recorded analysis, not fresh searches. Scores identify the favored color (W/B/R in candidate chips). The curve uses the blog's White/Red winning-chance formula for chess/xiangqi and Black's neural win estimate for Go. No engine, rules library, model, or iframe is loaded by these previews. The full apps remain available through **Open app**.

`ReviewPreview.tsx` loads only the selected game's JSON. The three records plus the blog's Cburnett chess pieces total about **144 KiB**, with a roughly **3.6 KiB gzip** UI chunk. Build checks cap the UI at 8 KiB gzip, each record at 80 KiB, and total review assets at 160 KiB, all excluded from initial loading. `scripts/sync-review-previews.mjs [path/to/blogs]` regenerates the checked-in records from the sibling blog's data and notation/score helpers; normal builds do not require that repository. Each record includes its source path and SHA-256. See [reviews/README.md](reviews/README.md) for provenance.

## Explainers

The thumbnail list selects nine-second silent excerpts from Teo’s local `explainer-videos/renders/{llm,quantum,relativity}.mp4` renders. Starts: 10:20, 22:50 and 19:05. YouTube IDs: `o0ENWGEVJm0`, `aaPbLBw0ZYc`, `vdroXP5hjjQ`. WebP posters come from the same first frames. Clips are 640px H.264, 24 fps, no audio. Only the selected clip is mounted; it pauses when closed or hidden. Reduced-motion users get a still frame with an explicit Play control.

Everything deploys through the existing GitHub Pages workflow; no new workflows or scheduled jobs are introduced.

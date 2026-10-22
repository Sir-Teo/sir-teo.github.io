# Project hover previews

Project pills open anchored cards with keyboard and touch support. Cards stay within the viewport, including small portrait and short landscape screens.

All hover cards share a compact header with icon-only open/copy and close actions.
Header targets are 32px on desktop and 44px on touch devices, with accessible
names, tooltips and visible keyboard focus. Repeated subtitles and project
footers are omitted. Profile cards retain readable stat labels and values, with
one small freshness/source line; exact timestamps remain in the tooltip.

The shared card interface and stats refresh code load on the first open, in a
5.5 KiB gzip chunk. The 10.5 KiB terminal waits for its first click and retains
its session after closing. No optional interface is warmed during page idle.
Initial scripts total about 180.6 KiB gzip (down from 185.0 KiB), with a 184 KiB
build budget. The build also verifies that cards, terminal, review and game
chunks remain outside the initial scripts. All pills share one hover media
listener; only changed pills rerender, and card geometry is measured at most
once per animation frame while scrolling or resizing.

## FinOS AgentLab

FinOS uses the same `PreviewFilm.tsx` player as the games: one ten-second silent
loop captured inside the actual archived app, opening an AAPL deep-research
report, showing its source links, and scrolling through the report. It replaces
the custom illustrated workflow and adds no separate animation code or styles.

Captured on October 22, 2026 from the committed read-only export in
`FinOS-AgentLab/deploy/static/site`, served locally without changing its source or
running its backend. The session is the archived AAPL research conversation
`fe0f75f64072` from the September 2026 snapshot. The visible data and research are
recorded, not live. No private portfolio or account screen is included.

Browser frames retain capture timestamps, then encode to 640 × 360 H.264 at
24 fps, CRF 25, with no audio and fast-start metadata. The WebP poster comes from
the same recording at 2.4 seconds. Clip and poster total about **130 KiB**. The
existing build guard caps them at 250 KiB and 50 KiB respectively and verifies
that they are absent from the initial page. Only the open card loads the clip;
hidden tabs pause playback and reduced-motion users see the poster until Play.

## Game films

Each game has one nine-second silent loop of actual gameplay, using the same `PreviewFilm.tsx` surface as the explainers. The card contains a title, film, small pause/play control and an external-link icon in the header. Scene tabs, magnification, embedded games and their launch controls have been removed.

- **Crown & Clan:** deploying barbarians and archers in a Goblin Forest raid.
- **Summoner’s Rift:** Ashe attacking a target dummy and casting Volley on the production map.
- **San Andreas:** CJ leaving the starting alley and exploring East Los Santos on foot.

Recorded through the deployed apps on October 21, 2026: `coc.teozeng.dev`, `teozeng.dev/web-lol`, and `teozeng.dev/web-gta`. Frames retain capture timestamps before conversion to 640 × 360 H.264 at 24 fps, CRF 28–29, with no audio and fast-start metadata. WebP posters come from the recordings. Artwork belongs to the source projects and their respective rights holders.

Only the open card mounts its clip. Closing unmounts and pauses it; hidden tabs pause playback. Reduced-motion users see the poster until they press Play, with `preload="none"` preventing automatic video downloads. Media errors retain a still preview and the external game link. Both film types use an inset rounded frame, a 44px play/pause target and a subtle loop-progress line; the footage has no overlaid labels during normal playback. No game engines, iframe windows, or asset packs are loaded by these previews.

The three clips and posters total approximately **716 KiB**. `npm run build` checks a lazy game-film chunk capped at **4 KiB gzip / 8 KiB raw**, **600 KiB per clip / 50 KiB per poster / 1600 KiB combined**, and absence of game films and their UI chunk from the initial HTML. Replaced screenshot assets have been removed.

## Single-game board reviews

Each board pill opens one complete game from the blog's interactive review figures:

- **Chess:** Club vs Intermediate, 57 half-moves, recorded Stockfish 18 Lite analysis at depth 16. Opens on 19…Kf8, the game's blunder.
- **Xiangqi:** Easy vs Medium, 100 half-moves, recorded Pikafish analysis at depth 16. Opens on the largest winning-chance loss.
- **Go:** the blog's 9×9 self-play game, 72 moves, 200-visit neural/MCTS analysis with the small bundled model. Opens on move 37, explicitly labeled as a planted slip. These are demonstration-model estimates.

Use previous/play/next, keyboard arrows, or the draggable evaluation curve to navigate. Home/End jump to the first/last position; file/rank labels orient the board to the notation. Hover, focus or tap one of three candidate lines to see its first two arrows (chess/xiangqi) or up to four numbered stones (Go). The board stays at the recorded game position; these markings preview continuations. State is retained across incidental hover closures. Replay is opt-in, pauses when the tab hides, and stops on unmount. Desktop and short landscape cards place controls beside the board; phone cards stack them.

Evaluations and candidate lines come from the apps' actual offline engine runs already used by the blog. They are labeled as recorded analysis, not fresh searches. The move, score and quality badge share one line; scores identify the favored color (W/B/R). Candidate controls keep full continuation text in accessible labels and tooltips. The compact engine credit retains the game title and engine details in its tooltip. The curve uses the blog's White/Red winning-chance formula for chess/xiangqi and Black's neural win estimate for Go. No engine, rules library, model, or iframe is loaded by these previews. The full apps remain available through the header's external-link icon.

`ReviewPreview.tsx` loads only the selected game's JSON. The three records plus the blog's Cburnett chess pieces total about **144 KiB**, with a roughly **3.6 KiB gzip** UI chunk. Build checks cap the UI at 8 KiB gzip, each record at 80 KiB, and total review assets at 160 KiB, all excluded from initial loading. `scripts/sync-review-previews.mjs [path/to/blogs]` regenerates the checked-in records from the sibling blog's data and notation/score helpers; normal builds do not require that repository. Each record includes its source path and SHA-256. See [reviews/README.md](reviews/README.md) for provenance.

## Explainers

The thumbnail list selects nine-second silent excerpts from Teo’s local `explainer-videos/renders/{llm,quantum,relativity}.mp4` renders. Starts: 10:20, 22:50 and 19:05. YouTube IDs: `o0ENWGEVJm0`, `aaPbLBw0ZYc`, `vdroXP5hjjQ`. WebP posters come from the same first frames. Clips are 640px H.264, 24 fps, no audio. Only the selected clip is mounted; it pauses when closed or hidden. Reduced-motion users get a still frame with an explicit Play control.

The gallery remembers a manual pause while changing clips, holds the poster until the next clip is ready, and lets Up/Down or Home/End select videos. A short hover delay avoids flickering through rows when crossing the list. Rows use one short title, with full video titles retained in accessible labels. Playback, selection and watch-link targets are at least 44px; header controls use the shared desktop/touch sizing. Narrow phones stack the film above the list; short landscape screens put them side by side. The three clips and posters total **229 KiB**; the build caps them at 500 KiB total (250 KiB per clip, 50 KiB per poster) and checks they stay out of initial loading.

Everything deploys through the existing GitHub Pages workflow; no new workflows or scheduled jobs are introduced.

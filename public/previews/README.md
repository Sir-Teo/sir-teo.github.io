# Project hover media

The game-art pills reveal original, interactive SVG illustrations from `app/components/ProjectIllustration.tsx`. The cards stay anchored to their pills while the artwork responds to the pointer. Click, tap, Enter, or Space activates each object's small interaction; arrow keys also move the artwork. The footer opens the full project in another tab.

-   Crown & Clan: a faceted gold crown, ribbons, and a sparkle animation.
-   Summoner’s Rift: a frost crystal that launches and reforms inside arcane rings.
-   San Andreas: a Los Santos postcard with layered palms and a sunset/night switch.
-   Web Chess, Web Xiangqi, and Web KaTrain now open directly into playable analysis boards. Select a piece and a legal destination, place a Go stone, or click an engine suggestion. Undo, Reset, Go passes, chess promotion, and arrow-key navigation work. These are live local searches: Stockfish, Pikafish, and the Web KaTrain neural/MCTS worker. No Explore tab or preset positions remain. See [`../live-engines/README.md`](../live-engines/README.md) for engine sources, loading, and the small Go model's limits.
-   Explainers: nine-second silent excerpts from Teo’s local `explainer-videos/renders/{llm,quantum,relativity}.mp4` renders. Starts: 10:20, 22:50, and 19:05. Corresponding YouTube IDs: `o0ENWGEVJm0`, `aaPbLBw0ZYc`, `vdroXP5hjjQ`. WebP posters come from the same first frames. Clips are 640px H.264, 24 fps, no audio. Only the selected clip is mounted; it pauses when the card closes or the page is hidden. Reduced-motion users get a still frame and can explicitly press Play.

The explainer card has a thumbnail list: hovering, focusing, or tapping a row selects its clip. Each row also links directly to its full YouTube video. The selected clip can be paused. The previous screenshot assets remain in this directory but are not loaded by the new illustrated cards.

Media was prepared October 21, 2026. Illustrations and clips are served from GitHub Pages without API keys or third-party embed requests. Reduced motion disables illustration movement and automatic video playback. No new build jobs or scheduled refreshes are needed.

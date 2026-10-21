# Project hover media

The project pills reveal original, interactive SVG illustrations from `app/components/ProjectIllustration.tsx`. The cards stay anchored to their pills while the artwork responds to the pointer. Click, tap, Enter, or Space activates each object's small interaction; arrow keys also move the artwork. The footer opens the full project in another tab.

-   Crown & Clan: a faceted gold crown, ribbons, and a sparkle animation.
-   Summoner’s Rift: a frost crystal that launches and reforms inside arcane rings.
-   San Andreas: a Los Santos postcard with layered palms and a sunset/night switch.
-   Web Chess: an ivory/ebony knight that turns when activated.
-   Web Xiangqi: carved wooden pieces; the central piece cycles through 帥, 炮, and 馬.
-   Web KaTrain: Go stones with an ink-circle backdrop and a stone-drop ripple.
-   Chess, Xiangqi, and KaTrain also have an **Analyze** view. Hover, focus, or tap a continuation to move the pieces or show a numbered Go variation. These are curated legal example positions, labeled as examples, without invented engine evaluations or rankings. The linked applications provide actual local analysis: Stockfish, Pikafish, and browser-native KataGo-style neural-network evaluation respectively. The preview never downloads those engines or models.
-   Explainers: nine-second silent excerpts from Teo’s local `explainer-videos/renders/{llm,quantum,relativity}.mp4` renders. Starts: 10:20, 22:50, and 19:05. Corresponding YouTube IDs: `o0ENWGEVJm0`, `aaPbLBw0ZYc`, `vdroXP5hjjQ`. WebP posters come from the same first frames. Clips are 640px H.264, 24 fps, no audio. Only the selected clip is mounted; it pauses when the card closes or the page is hidden. Reduced-motion users get a still frame and can explicitly press Play.

The explainer card has a thumbnail list: hovering, focusing, or tapping a row selects its clip. Each row also links directly to its full YouTube video. The selected clip can be paused. The previous screenshot assets remain in this directory but are not loaded by the new illustrated cards.

Media was prepared October 21, 2026. Illustrations and clips are served from GitHub Pages without API keys or third-party embed requests. Reduced motion disables illustration movement and automatic video playback. No new build jobs or scheduled refreshes are needed.

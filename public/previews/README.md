# Real project previews

Cover images come from the projects' own running interfaces, captured on
2026-10-21 and encoded as 840 × 525 WebP. Hovering loads only the cover; clicking
its launch button mounts the deployed application in an expandable iframe.
Closing the window or returning to the cover unmounts the app.

App frames use `credentialless` to isolate their storage from real saved games.
Browsers without that capability get an ordinary link to the full project.
Video frames use YouTube's privacy-enhanced embed domain and start only after a
click. No project engines or third-party frames load on an incidental hover.

-   `crown-clan.webp`: Crown & Clan home village, from its local production build.
-   `summoners-rift.webp`: Ashe practice mode at the blue fountain.
-   `san-andreas.webp`: Los Santos in the browser recreation's opening sequence.
-   `chess.webp`: Queen's Gambit position, move arrows, and Stockfish analysis.
    The live preview uses the app's native game share link for the first 8 moves.
-   `xiangqi.webp`: Central Cannon opening, book continuations, and move tree.
    The live preview uses the app's native share link for the first 4 plies.
-   `katrain.webp`: Gu Li vs Lee Sedol, 10th LG Cup semi-final, move 120.
    The live preview opens an explicitly labeled 120-move excerpt from the app's
    bundled `__go4go_20051019_Gu-Li_Lee-Sedol.sgf`, with its result left unknown.
-   `video-llm.webp`, `video-quantum.webp`, `video-relativity.webp`: Original
    thumbnails from `explainer-videos/renders/youtube/`. Their actual YouTube IDs
    and titles are in `app/data/profile.ts`.
-   `explainers.webp`: Earlier original thumbnail for _Analysis, Built — Part 9:
    Distributions and the Fourier Transform_, retained as an available asset.

To refresh a cover, capture the relevant interface, keep the subject recognizable
at card size, and replace its WebP. URLs, launch labels, and video selections live
in `app/data/profile.ts`.

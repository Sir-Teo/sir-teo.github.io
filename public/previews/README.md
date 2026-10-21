# Project preview images

Captured from the project's own running interfaces on 2026-10-21, then cropped
and encoded as 840 × 525 WebP images. These are static screenshots, not embedded
games: opening a preview does not start a game, engine, or third-party iframe.

- `crown-clan.webp`: Crown & Clan home village, from the local production build.
- `summoners-rift.webp`: Ashe practice mode at the blue fountain.
- `san-andreas.webp`: Los Santos in the browser recreation's opening sequence.
- `chess.webp`: Queen's Gambit position, move arrows, and Stockfish analysis.
- `xiangqi.webp`: Central Cannon opening, book continuations, and move tree.
- `katrain.webp`: Gu Li vs Lee Sedol, 10th LG Cup semi-final, move 120.
- `explainers.webp`: Original thumbnail for *Analysis, Built — Part 9:
  Distributions and the Fourier Transform*, from the explainer-videos repository.

To refresh a cover, capture the relevant interface, keep the subject recognizable
at card size, and replace its WebP. The content and action labels live in
`app/data/profile.ts`. Images are fetched only when their preview opens.

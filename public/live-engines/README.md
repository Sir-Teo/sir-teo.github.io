# Live portfolio analysis

`StudyPreview.tsx` supplies compact legal boards; `app/lib/live-analysis/` owns rules, worker lifecycle, and real suggestions. No keys, services, embeds, scheduled tasks, or new Actions workflow are required. Static files deploy through the existing Pages workflow.

- **Chess:** chess.js 1.4.0 rules; Stockfish 18 Lite single-thread from the user's deployed [`web-chess/engine/`](https://teozeng.dev/web-chess/engine/) assets. Stockfish source and GPL notices are maintained in [Web Chess](https://github.com/Sir-Teo/web-chess).
- **Xiangqi:** rules copied from the user's Web Xiangqi source, with its revision in the file header. Pikafish's single-thread wrapper, core, WASM and NNUE are loaded from the user's deployed [`web-xiangqi/`](https://teozeng.dev/web-xiangqi/). The NNUE is about 54 MB; the card reports actual download progress. Source and GPL notices remain in [Web Xiangqi](https://github.com/Sir-Teo/web-xiangqi).
- **Go:** the browser-native KataGo-style neural/MCTS worker from [Web KaTrain](https://github.com/Sir-Teo/web-katrain), built and served locally under `go/`. It uses single-thread TensorFlow.js WASM, a 9×9 board, Japanese rules, 6.5 komi, at most 64 visits / a 1.6-second search budget. The ~3.8 MB compressed `g170-b6c96-s175395328-d26788732` test network is a **small demonstration model, not strong Go analysis**; the UI calls these quick hints. It is the same bundled model as Web KaTrain; use that full app to select stronger weights. The score label names the leading color; win estimates are Black's perspective.

Each card waits 300 ms before starting its worker. Only the open card loads engine assets. Closing the card or hiding the page terminates the worker (including active model downloads); returning to the page reinitializes it. Board moves survive closing/reopening for the current page session. Search results are removed immediately when the position changes. UCI searches use a stop/bestmove barrier and complete MultiPV iterations; Go results are matched by request ID. No fabricated evaluations or fallback presets are used. A failed load leaves the playable board available and offers Retry.

Chess and Xiangqi each search for 900 ms, with one thread, a 16 MB hash, and up to three lines. Scores are from the side-to-move's perspective, explicitly labeled. Browser caches can reuse engine downloads. Single-thread builds work on ordinary GitHub Pages without cross-origin-isolation headers.

## Rebuilding vendored Go assets and rules

Normal site builds use the checked-in assets. To update from local sibling checkouts with their dependencies installed:

```sh
node scripts/sync-preview-engines.mjs [path/to/web-katrain] [path/to/web-xiangqi]
```

The script does not alter either source repository. `go/provenance.json` records the source revision. The small network source is [KataGo's test model](https://github.com/lightvector/KataGo/blob/master/cpp/tests/models/g170-b6c96-s175395328-d26788732.bin.gz). Web KaTrain's MIT license, KataGo's license, TensorFlow's Apache 2.0 license, and bundled JS license comments are included alongside the worker.

Validation: game rules (castling, en passant, promotions, checkmate, Xiangqi legal moves, Go captures/suicide/ko/passes), stale search cancellation, MultiPV ranking consistency, worker teardown, boot timeout, plus actual browser searches and move interactions for all three engines. The existing site build and tests run without access to sibling repositories.

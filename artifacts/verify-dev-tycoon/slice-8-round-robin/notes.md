# Slice-8 LearnRunner round-robin — live HUD evidence

- **Tip verified:** `1b87338` (branch `cursor/learn-runner-round-robin-9588`, PR #21). Rotation is keyed by `lastPaidSlotIdByLocation`. The first verification was on `2417ebe`, in evidence commit `1008eeb`.
- **Run:** 2026-10-05 11:20–11:21 CEST, headless Chrome (Playwright, SwiftShader WebGL), viewport 1280×720. I restarted `python3 -m http.server 8772` on the new tip and used a fresh browser context with a reload.
- **Runtime check:** `gameManager.learnRunner.lastPaidSlotIdByLocation` is a Map, and the old `lastPaidSlotIndexByLocation` is absent. After the design payout the map was `[["downtown:starter-home","home-design-1"]]`.
- **Force harness / `?hudEvidence`:** No. Plain `http://localhost:8772/`
- **Game-logic edits:** None. The working tree was clean at the tip.
- **Controls panel visible:** N. `#controls-hint` was hidden with `style.display='none'` (styling only). Pointer lock is not available headless.
- **Console errors:** N for the game. The only console error was the browser's automatic `GET /favicon.ico` → 404 from the static server. There were no pageerrors and no failed game/script requests.
- **Method:** I walked from spawn (0,0) to the Your Apartment door using real keyboard input only: held `S` (+Z) to z≈28.5, then held `D` (+X) to x≈20. **No teleport.** All interactions used real `E` key presses. Each practice ran its full 20 s `durationHint` with no early-complete E press.

## Unit tests at 1b87338 (run from repo root)

| Test | Result |
|------|--------|
| `node test-learn-round-robin.js` | 19/19 passed |
| `node test-slice-4-logic.js` | 16/16 passed |
| `node test-freelance-logic.js` | 5/5 passed |
| `node test-career-logic.js` | 16/16 passed |

`test-learn-round-robin.js` gets `LearnRunner` from `test-shim.js`. The shim reads the real `src/systems/learn-runner.js` (and `src/core/city-module.js`) with `fs.readFileSync` and evaluates it with `new Function`. The test file has no inline copy of LearnRunner. Mutation check: I changed the rotation line in a throwaway copy of the real `src/systems/learn-runner.js`, and the suite dropped to 11/19 passing.

## Sequence (HUD text read from the DOM at capture time)

| # | Action | HUD | XP (coding/design) | PNG |
|---|--------|-----|--------------------|-----|
| 1 | Enter (E) | `E — Practice coding (+5 coding XP)` | 0/0 | (not kept) |
| 2 | Accept (E), wait 20 s | `+5 coding XP` | 5/0 | `hud-design-coding-paid.png` |
| 3 | Exit (E, during the payout flash), wait 2 s, re-enter (E) | `E — Practice design (+5 design XP)` | 5/0 | `hud-design-offer.png` |
| 4 | Accept (E), wait 20 s | `+5 design XP` | 5/5 | `hud-design-paid.png` |
| 5 | Exit (E), wait 2.4 s, re-enter (E) | `E — Practice coding (+5 coding XP)` (wrap) | 5/5 | `hud-design-wrap.png` |

Note: `hud-design-coding-paid.png` and `hud-design-paid.png` came out byte-identical to the 2417ebe captures. The interior scene and HUD text are static and rendering is deterministic, so git shows no diff for those two files.

Note: if the player stays inside for more than 1.6 s after a payout, `jobPaid` → `setTimeout(checkAndOfferJob, 1600)` shows the next offer in the room. While an offer is up, `E` accepts it instead of exiting. To follow exit → re-enter, the exit has to happen during the 1.5 s payout flash. This is existing game-manager behavior and Slice-8 did not change it.

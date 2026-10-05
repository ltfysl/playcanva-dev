# Slice-8 LearnRunner round-robin — live HUD evidence

- **Tip verified:** `2417ebe` (branch `cursor/learn-runner-round-robin-9588`, PR #21)
- **Run:** 2026-10-05 09:11–09:12 CEST, headless Chrome (Playwright, SwiftShader WebGL), viewport 1280×720, served via `python3 -m http.server 8772`
- **Force harness / `?hudEvidence`:** No. Plain `http://localhost:8772/`
- **Game-logic edits:** None. The working tree was clean at the tip.
- **Controls panel visible:** N. `#controls-hint` was hidden with `style.display='none'` (styling only). Pointer lock is not available headless, so the in-game auto-hide could not fire.
- **Console errors:** N for the game. The only console error was the browser's automatic `GET /favicon.ico` → 404 from the static server, which comes from the server, not the game. There were no pageerrors and no failed game/script requests.
- **Method:** I walked from spawn (0,0) to the Your Apartment door using real keyboard input only: held `S` (+Z) to z≈28.6, then held `D` (+X) to x≈20. **No teleport.** All interactions used real `E` key presses. Each practice ran its full 20 s `durationHint` with no early-complete E press.

## Sequence (HUD text read from the DOM at capture time)

| # | Action | HUD | XP (coding/design) | PNG |
|---|--------|-----|--------------------|-----|
| 1 | Enter (E) | `E — Practice coding (+5 coding XP)` | 0/0 | (not kept) |
| 2 | Accept (E), wait 20 s | `+5 coding XP` | 5/0 | `hud-design-coding-paid.png` |
| 3 | Exit (E, during the payout flash), wait 2 s, re-enter (E) | `E — Practice design (+5 design XP)` | 5/0 | `hud-design-offer.png` |
| 4 | Accept (E), wait 20 s | `+5 design XP` | 5/5 | `hud-design-paid.png` |
| 5 | Exit (E), wait 2.4 s, re-enter (E) | `E — Practice coding (+5 coding XP)` (wrap) | 5/5 | `hud-design-wrap.png` |

Note: if the player stays inside for more than 1.6 s after a payout, `jobPaid` → `setTimeout(checkAndOfferJob, 1600)` shows the next offer in the room. While an offer is up, `E` accepts it instead of exiting. To follow exit → re-enter, the exit has to happen during the 1.5 s payout flash. This is existing game-manager behavior and Slice-8 did not change it.

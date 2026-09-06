# Screenshot Placeholders

This directory should contain verification screenshots. Since this is running in a headless cloud environment, screenshots must be taken manually during review.

## Required Screenshots

### 1. exterior-cafe.png
**Description**: Outside view of The Bean Café building
**Expected content**:
- Brown/tan cafe building
- Flat roof
- Position: (-20, 0, 30) relative to spawn
- Door and porch visible
- Size: 10x8x10 units

### 2. interior-cafe.png
**Description**: Inside The Bean Café
**Expected content**:
- Work desk at position (-3, 0.85, -3)
- 4 desk legs visible
- Warm orange/yellow lighting
- Walls, floor, ceiling
- Player viewpoint

### 3. hud-job-offer.png
**Description**: Sol HUD showing job offer
**Expected content**:
- Text: "E — Accept: Quick bugfix (+$50)"
- Below location indicator
- Semi-transparent background
- White text

### 4. hud-in-progress.png
**Description**: Sol HUD showing job in progress
**Expected content**:
- Text: "Fixing…"
- Same position as offer
- Same styling

### 5. hud-payout.png
**Description**: Sol HUD showing payout
**Expected content**:
- Text: "+$50"
- Flash state (visible ~1.5s)
- Same styling

## Manual Screenshot Instructions

1. Open http://localhost:8080 in browser
2. Open browser DevTools (F12)
3. Check console for errors (should be none)
4. Take screenshot of cafe exterior (WASD to navigate)
5. Press E to enter cafe
6. Take screenshot of interior
7. Take screenshot of job offer HUD
8. Press E to accept job
9. Take screenshot of "Fixing…" HUD
10. Wait for completion or press E
11. Take screenshot of "+$50" payout HUD (must be quick, only 1.5s)

## Alternative: Console Verification

If screenshots are not possible, verify via console:

```javascript
// Check if systems are initialized
console.log(window.gameManager.freelanceSystem); // Should be FreelanceSystem instance
console.log(window.gameManager.solHUD); // Should be SolHUD instance

// Check current job
console.log(window.gameManager.freelanceSystem.getCurrentJob());

// Check cash balance
console.log(window.gameManager.freelanceSystem.getCashBalance());
```

## Notes

- Server must be running: `python3 -m http.server 8080`
- Browser must support WebGL
- Cursor lock required (click canvas)
- WASD for movement
- E for interaction

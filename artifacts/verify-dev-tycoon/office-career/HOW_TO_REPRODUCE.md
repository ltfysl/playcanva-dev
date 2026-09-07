# How to Reproduce - Office Career Feature

This document explains how to run and test the office career feature locally.

## Prerequisites

- Git
- Python 3 (for local HTTP server)
- Modern web browser (Chrome/Firefox/Edge)

## Setup

### 1. Clone and Checkout Branch

```bash
git clone https://github.com/ltfysl/playcanva-dev.git
cd playcanva-dev
git checkout cursor/office-career-ticket-runner-8250
```

### 2. Start Local Server

```bash
python3 -m http.server 8000
```

Keep this terminal running.

### 3. Open in Browser

Navigate to: http://localhost:8000

## Testing the Feature

### Quick Test Path (Assuming Fresh Start)

#### Phase 1: Build Coding XP to 15

1. **Start Game**: Click canvas to lock cursor
2. **Navigate to Apartment**: WASD to move east (or follow minimap)
3. **Enter**: Get close to door, press E
4. **Practice Coding**: Accept "Practice coding" when offered
5. **Wait**: 20 seconds for completion → +5 coding XP
6. **Repeat**: Exit (E), re-enter (E), accept again → total 10 XP after 2 rounds

7. **Exit Apartment**: Press E
8. **Navigate to Café**: WASD to move southwest (look for small brown building)
9. **Enter Café**: Press E at door
10. **Quick Bugfix**: Accept "Quick bugfix" (+$50, +10 coding XP)
11. **Wait**: 30 seconds for completion → now at 20 coding XP

#### Phase 2: Test Office Career

12. **Exit Café**: Press E
13. **Navigate to Office**: WASD to move northwest (look for large gray building)
14. **Location Check**: Top-left should show "Downtown Office" when near door
15. **Enter Office**: Press E

**Expected**: HUD shows `E — Accept: Fix production ticket (+$120)`

16. **Accept Job**: Press E
17. **Wait**: ~40 seconds, watch HUD show "Working…"
18. **Completion**: HUD shows `+$120 · +20 coding XP`

**Console Log** (F12):
```
Career job paid: 120 XP awarded: { skill: 'coding', amount: 20 } New balance: 120
```

#### Phase 3: Verify One-Shot Behavior

19. **Wait**: ~1.5s for HUD to clear
20. **Exit Office**: Press E
21. **Re-Enter Office**: Press E again

**Expected**: No HUD offer (job not repeatable)

### Testing Locked State

If you want to test the locked state:

1. Start fresh (or reset skills to < 15 XP)
2. Enter office with coding XP < 15

**Expected**: HUD shows `Locked — coding XP n/15` where n is your current XP

## Verification Checklist

- [ ] Office building visible in downtown (northwest)
- [ ] Office interior loads with desk and warm lighting
- [ ] Locked state shows when coding < 15
- [ ] Offer state shows when coding ≥ 15
- [ ] Job completes after 40 seconds
- [ ] Payout shown: +$120 · +20 coding XP
- [ ] Console logs job paid event
- [ ] Re-entering office shows no offer (one-shot)

## Troubleshooting

**Office not found?**
- Check minimap (bottom-right) for building dots
- Office is northwest from spawn point
- Large gray building with flat roof

**HUD not showing?**
- Check browser console (F12) for errors
- Verify coding XP is ≥ 15 for offer
- Make sure you're inside the building (not just near door)

**Job not completing?**
- Wait full 40 seconds
- Check console for errors
- Try exiting and re-entering (should auto-complete on exit)

**Console errors?**
- Check all script files loaded (Network tab in F12)
- Verify no syntax errors in console
- Check `career-runner.js` and `office-interior.js` loaded

## Files to Inspect

If debugging:

- `src/systems/career-runner.js` - Main career logic
- `src/buildings/office-interior.js` - Office interior rendering
- `src/city/city-generator.js` - Office building creation
- `src/core/game-manager.js` - CareerRunner integration
- `test-career-logic.js` - Unit tests (run with `node test-career-logic.js`)

## Expected Console Output

```
Dev Tycoon - City Hub initialized
Ammo physics ready: true
Click to lock cursor, WASD to move, E to interact
Generating city...
...
Downtown office created at Vec3(-40, 0, -30)
...
[On entering office]
[On accepting job]
[After 40s]
Career job paid: 120 XP awarded: { skill: 'coding', amount: 20 } New balance: 120
```

## Running Unit Tests

```bash
cd playcanva-dev
node test-career-logic.js
```

Expected output:
```
=== Career Runner Logic Tests ===
...
✅ All tests passed!
Passed: 16
Failed: 0
```

## Screenshots

When capturing evidence, screenshot:

1. Office exterior (before entering)
2. Office interior (desk visible)
3. HUD locked state (if XP < 15)
4. HUD offer state (+$120)
5. HUD working state
6. HUD payout state (+$120 · +20 coding XP)
7. Re-enter with no offer (one-shot verified)

Save to: `artifacts/verify-dev-tycoon/office-career/`

## Next Steps

After manual testing:
1. Update `VERIFICATION_PLAN.md` with PASS/FAIL results
2. Add screenshots + console logs to artifacts
3. Commit evidence to branch
4. Update PR with verification results

---

**Branch**: cursor/office-career-ticket-runner-8250
**PR**: https://github.com/ltfysl/playcanva-dev/pull/16

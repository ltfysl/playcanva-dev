# Verification Plan - Office Career Ticket

**Date**: 2026-09-07
**Branch**: cursor/office-career-ticket-runner-8250
**Commit**: 01962de

## Implementation Checklist

### Building
- [x] Downtown office building created with `BuildingKind.OFFICE`
- [x] Building state: `UnlockState.AVAILABLE`
- [x] Office location: `(-GameConfig.city.blockSize * 2, 0, -GameConfig.city.blockSize * 1.5)`
- [x] Building is enterable (presence integration)
- [x] Minimal interior stub with warm lighting and desk

### ActivitySlot
- [x] Slot ID: `office-ticket-1`
- [x] Name: `Fix production ticket`
- [x] skillTags: `['coding']`
- [x] unlockRule: `{ skill: 'coding', minXp: 15 }`
- [x] durationHint: `40` seconds
- [x] kind: `career`
- [x] payoutStub: `{ currency: 'cash', amount: 120 }`
- [x] xpStub: `{ amount: 20 }`

### CareerRunner
- [x] Registered on `RunnerRegistry.register('career', ...)`
- [x] Uses same JobRun state machine as freelance/learn
- [x] Presence at office triggers checkAndOfferJob via enter listener
- [x] Shows Locked HUD when coding < 15
- [x] Shows offer when unlocked: `E — Accept: Fix production ticket (+$120)`
- [x] Shows Working state during progress
- [x] Complete → cash + XP via stubs using skillTags[0]
- [x] One-shot behavior: slot marked as PAID and not re-offered
- [x] E-seam: accept/complete before exit when offered/inProgress

### HUD Integration
- [x] Locked state: `Locked — coding XP n/15`
- [x] Offer state: `E — Accept: Fix production ticket (+$120)`
- [x] Working state: `Working…` (reuses existing showInProgress)
- [x] Payout state: `+$120 · +20 coding XP`

### Dispatch Pattern
- [x] Uses `RunnerRegistry.get(slot.kind)` in game-manager
- [x] No parallel cafe/home-only hardcodes in interaction logic

## Logic Tests

Run with: `node test-career-logic.js`

All 16 tests passed:
- ✅ Career ticket slot configuration
- ✅ Unlock gating at coding XP 15
- ✅ One-shot after PAID behavior
- ✅ RunnerRegistry career kind
- ✅ Cash payout ($120)
- ✅ XP award (20 coding XP)
- ✅ Slot not repeatable after paid

## Manual Verification Steps

### Prerequisites
- Start from a clean save or reset skills
- Have at least 15 coding XP (complete home practice + cafe freelance jobs)

### Test 1: Locked State
1. Start game with < 15 coding XP
2. Navigate to downtown office building (northwest from spawn)
3. Approach door (E prompt should appear)
4. Press E to enter
5. **Expected**: HUD shows `Locked — coding XP n/15` where n < 15
6. Press E to exit
7. Complete home practice + cafe jobs until coding XP >= 15

### Test 2: Unlock and Accept
1. Enter office with coding XP >= 15
2. **Expected**: HUD shows `E — Accept: Fix production ticket (+$120)`
3. Press E to accept
4. **Expected**: Job starts, HUD shows `Working…` or equivalent
5. **Expected**: Progress bar or timer advances over 40 seconds

### Test 3: Complete and Payout
1. Wait for job to complete (or press E if manual complete is enabled)
2. **Expected**: HUD shows `+$120 · +20 coding XP`
3. **Expected**: Console logs show cash balance update and XP award
4. **Expected**: HUD clears after ~1.5s

### Test 4: One-Shot Behavior
1. After completing ticket once, exit and re-enter office
2. **Expected**: No offer shown (job not repeatable)
3. **Expected**: No HUD state (or blank if implemented)

### Test 5: E-Seam (Exit During States)
1. Enter office, accept ticket
2. Exit immediately without waiting for completion
3. **Expected**: Job completes and pays out on exit
4. Re-enter office
5. **Expected**: No offer (job already paid)

## Evidence to Collect

When running manual tests, capture:

1. **Screenshots**:
   - `office-exterior.png` - Office building in downtown
   - `office-interior.png` - Inside office with desk and lighting
   - `locked-state.png` - HUD showing locked state with XP progress
   - `offer-state.png` - HUD showing accept prompt with $120
   - `working-state.png` - HUD during job progress
   - `payout-state.png` - HUD showing +$120 and +20 XP
   - `one-shot-verify.png` - Re-entering office after completion (no offer)

2. **Console Logs**:
   - `console-log.txt` - Full console output showing:
     - Office creation log
     - CareerRunner registration
     - Enter/exit presence events
     - Job state transitions
     - Cash and XP awards

3. **Code Review**:
   - All contracts from requirements matched
   - No new HUD chrome or panels added (reuses Sol HUD)
   - Minimal focused diffs following existing patterns

## Notes

- **Live HUD PNGs**: Per requirements, actual HUD state PNGs will be added by Pike before ready-for-review. Current verification uses browser rendering only.
- **Interior**: Minimal stub as specified - warm light + desk only.
- **No cowork/hire**: Out of scope per requirements.
- **No second ticket**: Out of scope per requirements.

## Manual Test Status

**Status**: ⏱️ Pending Manual Verification

Once manual tests are run:
- Update this document with PASS/FAIL for each test
- Add evidence files to `artifacts/verify-dev-tycoon/office-career/`
- Commit evidence to the PR

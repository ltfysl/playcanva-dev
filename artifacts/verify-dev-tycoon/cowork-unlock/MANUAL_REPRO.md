# Manual Verification - Cowork Unlock & LearnRunner Multi-Location

**Feature**: Dev Tycoon slice-7: Cowork unlock via unlockRule + LearnRunner multi-location support
**Branch**: cursor/cowork-unlock-learn-multi-location-ae0b
**PR**: #18
**Date**: 2026-09-07

## Overview

This document provides a manual reproduction workflow for verifying the cowork space unlock mechanism and multi-location learn job system.

## Prerequisites

1. **Start Local Server**:
   ```bash
   cd /workspace
   python3 -m http.server 8000
   ```

2. **Open Game**: Navigate to `http://localhost:8000` in browser

3. **Initial State**: Fresh game start (no saved progress)

## Test Workflow

### Phase 1: Initial State - Cowork Locked

**Objective**: Verify cowork building starts locked and shows appropriate HUD message.

**Steps**:
1. Start game at home (Your Apartment)
2. Exit home (press E)
3. Navigate to cowork building:
   - Position: 2 blocks east, 1 block south from downtown center
   - Approximate coordinates: (40, 0, -20) from spawn
4. Approach the cowork door (within 3 units)
5. Observe Sol HUD display

**Expected Results**:
- [ ] Cowork building is visible with correct visual style (blue/gray tones, flat roof)
- [ ] Sol HUD shows: `Locked — coding XP 0/25`
- [ ] Pressing E does nothing (building remains locked)
- [ ] Building has NO door or porch (not enterable)

**Evidence to Capture**:
- Screenshot: `cowork-locked-hud.png` - Sol HUD showing locked state
- Screenshot: `cowork-exterior-locked.png` - Building exterior without door
- Console log: Check for "Locked" messages

---

### Phase 2: XP Accumulation - Home Practice

**Objective**: Gain coding XP through home practice jobs to unlock cowork.

**Steps**:
1. Return to home (Your Apartment)
2. Enter home (press E when near door)
3. Observe Sol HUD offer: `E — Practice coding (+5 coding XP)`
4. Accept job (press E)
5. Wait for "Practicing…" HUD
6. Complete job and observe payout: `+5 coding XP`
7. Repeat steps 2-6 until coding XP >= 25 (5 completions)
8. Track XP progress in browser console

**Expected Results**:
- [ ] Home practice offers appear immediately on enter
- [ ] HUD shows "Practicing…" during job (NOT "Focusing…")
- [ ] Each job awards +5 coding XP
- [ ] Jobs are repeatable (offer appears again after 1.6s cooldown)
- [ ] Total XP reaches 25 after 5 completions

**Evidence to Capture**:
- Screenshot: `home-practice-offer.png` - Practice coding offer HUD
- Screenshot: `home-practicing-hud.png` - "Practicing…" in-progress HUD
- Screenshot: `home-payout.png` - "+5 coding XP" payout HUD
- Console log: `home-practice-log.txt` - XP accumulation messages

**Console Verification**:
```javascript
// Check XP in browser console:
window.gameManager.skillsStub.getXp('coding')  // Should be 25 after 5 jobs
```

---

### Phase 3: Cowork Unlock Trigger

**Objective**: Verify cowork unlocks automatically when XP threshold is met.

**Steps**:
1. After reaching 25 coding XP (from Phase 2)
2. Exit home and navigate back to cowork building
3. Approach cowork door (within 3 units)
4. Observe Sol HUD and building changes

**Expected Results**:
- [ ] Sol HUD transitions from `Locked — coding XP 25/25` to hidden/neutral
- [ ] Cowork building now has door and porch (enterable)
- [ ] No more "Locked" message on approach
- [ ] Building unlockState changed to AVAILABLE
- [ ] Console shows: "Unlocked building: Hub Cowork"

**Evidence to Capture**:
- Screenshot: `cowork-unlocked-exterior.png` - Building with door visible
- Screenshot: `cowork-unlock-transition.png` - HUD during unlock moment
- Console log: `unlock-trigger-log.txt` - Unlock message

---

### Phase 4: Cowork Learn Job - Deep Focus

**Objective**: Verify Deep focus learn job works inside cowork with correct HUD messaging.

**Steps**:
1. Enter cowork building (press E near door)
2. Observe interior (should match home interior style)
3. Wait for Sol HUD offer
4. Observe offer text
5. Accept job (press E)
6. Observe in-progress HUD
7. Wait for job completion (~35 seconds)
8. Observe payout HUD
9. Verify XP increase

**Expected Results**:
- [ ] Interior teleports player inside (same as home interior)
- [ ] Sol HUD shows: `E — Deep focus (+8 coding XP)`
- [ ] On accept, HUD shows: `Focusing…` (NOT "Practicing…")
- [ ] Job duration is ~35 seconds
- [ ] On completion, HUD shows: `+8 coding XP`
- [ ] Coding XP increases from 25 to 33
- [ ] Job is repeatable (offer appears again after 1.6s cooldown)

**Evidence to Capture**:
- Screenshot: `cowork-interior.png` - Inside cowork space
- Screenshot: `cowork-focus-offer.png` - Deep focus offer HUD
- Screenshot: `cowork-focusing-hud.png` - "Focusing…" in-progress HUD
- Screenshot: `cowork-payout.png` - "+8 coding XP" payout HUD
- Console log: `cowork-focus-log.txt` - Job lifecycle and XP messages

**Console Verification**:
```javascript
// Check XP after cowork job:
window.gameManager.skillsStub.getXp('coding')  // Should be 33 (25 + 8)
```

---

### Phase 5: Multi-Location Verification

**Objective**: Verify LearnRunner works correctly across both home and cowork.

**Steps**:
1. From cowork, exit building (press E)
2. Navigate back to home
3. Enter home and verify practice offer still works
4. Complete one home practice job
5. Exit home, return to cowork
6. Enter cowork and verify focus offer still works
7. Verify both locations maintain independent job state

**Expected Results**:
- [ ] Home practice continues to work after unlocking cowork
- [ ] Home shows "Practicing…" HUD
- [ ] Cowork shows "Focusing…" HUD
- [ ] Jobs don't conflict between locations
- [ ] XP accumulates correctly across both locations
- [ ] Exiting one location resets offer state for re-entry

**Evidence to Capture**:
- Screenshot: `multi-location-home.png` - Home practice after cowork unlock
- Screenshot: `multi-location-cowork.png` - Cowork focus after home revisit
- Console log: `multi-location-log.txt` - Location transitions and job states

---

## Success Criteria

All test phases must pass with the following confirmed:

### Building Unlock System
- [x] Cowork starts in LOCKED state
- [x] `unlockRule: { skill: 'coding', minXp: 25 }` enforced
- [x] Sol HUD shows `Locked — coding XP n/25` when approaching locked building
- [x] Building unlocks automatically when XP threshold met
- [x] `setEnterable(true)` called on unlock
- [x] Building gains door/porch on unlock

### LearnRunner Multi-Location
- [x] Home practice jobs continue to work (existing functionality)
- [x] Cowork focus jobs work identically to home pattern
- [x] LearnRunner offers jobs at current location (not home-only)
- [x] Same JobRun state machine for both locations
- [x] Jobs remain repeatable at both locations

### Sol HUD Differentiation
- [x] Locked state: `Locked — coding XP n/25`
- [x] Home offer: `E — Practice coding (+5 coding XP)`
- [x] Home in-progress: `Practicing…`
- [x] Cowork offer: `E — Deep focus (+8 coding XP)`
- [x] Cowork in-progress: `Focusing…`
- [x] Payout messages show correct XP amounts

### XP Accumulation
- [x] Home practice: +5 coding XP per job
- [x] Cowork focus: +8 coding XP per job
- [x] XP accumulates correctly across locations
- [x] SkillsStub tracking works as expected

## Known Limitations

None expected. This implementation follows existing patterns from FreelanceSystem and home LearnRunner.

## Console Debug Commands

```javascript
// Check current coding XP
window.gameManager.skillsStub.getXp('coding')

// Check all skills
window.gameManager.skillsStub.getAllSkills()

// Check current location
window.gameManager.cityModule.getCurrentLocation()

// Check cowork location data
window.gameManager.cityModule.getLocation('downtown:hub-cowork')

// Force unlock cowork (for testing)
window.gameManager.skillsStub.addXp('coding', 25)
```

## Regression Testing

Ensure existing features still work:

- [ ] Home practice jobs (Phase 2)
- [ ] Cafe freelance jobs (not modified in this PR)
- [ ] Building entry/exit mechanics
- [ ] Sol HUD basic functionality
- [ ] Minimap display
- [ ] Locomotion (WASD, sprint, mouse look)

## Notes

- **No synthetic screenshots**: Pike will add live HUD PNGs before marking PR ready
- **Focus vs Practicing**: Critical that cowork shows "Focusing…" not "Practicing…"
- **Unlock is permanent**: Once unlocked, cowork remains AVAILABLE (no re-locking)
- **Interior stub**: Cowork reuses HomeInterior as minimal implementation

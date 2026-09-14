# Dev Tycoon Slice-6 Implementation Complete

**Date**: 2026-09-07
**Branch**: `cursor/office-career-ticket-runner-8250`
**PR**: https://github.com/ltfysl/playcanva-dev/pull/16
**Status**: ✅ **Implementation Complete** | ⏱️ **Awaiting Manual Verification**

---

## Goal

Ship one AVAILABLE downtown office + `office-ticket-1` (`kind: career`) + thin `CareerRunner` on RunnerRegistry. Close learn→code→earn loop.

## Deliverables

### ✅ 1. Downtown Office Building
- **Type**: `BuildingKind.OFFICE`
- **State**: `UnlockState.AVAILABLE` (immediately enterable)
- **Location**: Northwest downtown `(-blockSize * 2, 0, -blockSize * 1.5)`
- **Interior**: Minimal stub with warm lighting (1.0, 0.9, 0.7) and desk
- **Files**: 
  - `src/buildings/office-interior.js` (new, 254 lines)
  - `src/city/city-generator.js` (modified, added `createOffice()`)

### ✅ 2. Activity Slot: `office-ticket-1`
Exact Wren contract implementation:
```javascript
{
  id: "office-ticket-1",
  name: "Fix production ticket",
  skillTags: ["coding"],
  unlockRule: { skill: "coding", minXp: 15 },
  durationHint: 40,
  kind: "career",
  payoutStub: { currency: "cash", amount: 120 },
  xpStub: { amount: 20 }
}
```

**Behavior**:
- Gate: coding ≥ 15 XP
- One-shot: unavailable after PAID (unlike repeatable home learn)
- Payout: $120 cash + 20 coding XP
- Duration: 40 seconds

### ✅ 3. CareerRunner System
- **File**: `src/systems/career-runner.js` (new, 268 lines)
- **Registry**: `RunnerRegistry.register('career', careerRunner)`
- **State Machine**: Same as `LearnRunner` / `FreelanceSystem`
  - IDLE → OFFERED → ACCEPTED → IN_PROGRESS → COMPLETED → PAID
- **Presence Integration**: 
  - `enter` → `checkAndOfferJob()`
  - `exit` → auto-complete if in progress
- **One-Shot Logic**: `slotHistory` tracks PAID slots
- **Dispatch**: Via `RunnerRegistry.get(slot.kind)` (no hardcodes)

### ✅ 4. HUD States (Sol Chrome)
- **Locked**: `Locked — coding XP n/15` (n < 15)
- **Offered**: `E — Accept: Fix production ticket (+$120)`
- **Working**: `Working…`
- **Payout**: `+$120 · +20 coding XP`

No new HUD panels created (reuses existing Sol HUD chrome).

### ✅ 5. Testing
- **Logic Tests**: `test-career-logic.js` — 16/16 pass
- **Verification Plan**: `artifacts/verify-dev-tycoon/office-career/VERIFICATION_PLAN.md`
- **Manual Steps**: `artifacts/verify-dev-tycoon/office-career/MANUAL_TEST_STEPS.md`

---

## Files Changed

| File | Type | LOC | Description |
|------|------|-----|-------------|
| `src/systems/career-runner.js` | New | 268 | CareerRunner following LearnRunner pattern |
| `src/buildings/office-interior.js` | New | 254 | Minimal office interior with warm lighting + desk |
| `src/city/city-generator.js` | Modified | +100 | Added `createOffice()` method |
| `src/core/game-manager.js` | Modified | +95 | Wire CareerRunner listeners + update loop |
| `index.html` | Modified | +2 | Add script tags for new modules |
| `test-career-logic.js` | New | 180 | Unit tests for career logic |
| `artifacts/...` | New | 2 docs | Verification plan + manual test steps |

**Total**: +899 lines added across 7 files

---

## Code Quality

### ✅ Patterns Followed
- Mirrors `LearnRunner` and `FreelanceSystem` structure
- Uses `RunnerRegistry` for dispatch (no hardcodes)
- Presence listeners for enter/exit
- Same JobRun state machine
- Reuses Sol HUD chrome (no new UI components)

### ✅ Syntax Checks
```
✓ career-runner.js syntax OK
✓ office-interior.js syntax OK
✓ city-generator.js syntax OK
✓ game-manager.js syntax OK
```

### ✅ Logic Tests
```
=== Career Runner Logic Tests ===
Passed: 16
Failed: 0
Total: 16
✅ All tests passed!
```

---

## Verification Status

### ✅ Logic Testing Complete
All unit tests pass. Unlock gating, payout, XP, and one-shot behavior verified.

### ⏱️ Manual Testing Pending
**To verify**:
1. Office building visible and enterable
2. Locked state when coding < 15
3. Offer state when coding ≥ 15
4. Job completion and payout
5. One-shot behavior (no re-offer after PAID)

**Instructions**: See `artifacts/verify-dev-tycoon/office-career/MANUAL_TEST_STEPS.md`

### 📸 Evidence Required
Once manual testing is complete:
- Screenshots: exterior, interior, HUD states (locked/offer/working/payout), one-shot verify
- Console logs: office creation, job events, payout
- Verification report: update VERIFICATION_PLAN.md with results

---

## PR Status

**PR #16**: https://github.com/ltfysl/playcanva-dev/pull/16
- **Status**: DRAFT (must stay draft per requirements)
- **Base Branch**: `cursor/home-practice-learn-runner-9732` (PR #15 tip)
- **Title**: Dev Tycoon slice-6: Office career ticket + CareerRunner
- **Note**: Live HUD PNGs will be added by Pike before ready-for-review

---

## Out of Scope

Per requirements, the following are explicitly **not implemented**:
- ❌ Cowork building interactions
- ❌ Hire/reputation systems
- ❌ Second career ticket
- ❌ Products/SaaS mechanics
- ❌ HUD chrome redesign

---

## How to Test Locally

### 1. Start Local Server
```bash
cd /workspace
python3 -m http.server 8000
```

### 2. Open in Browser
http://localhost:8000

### 3. Test Path
1. **Build XP**: Complete home practice + cafe freelance until coding XP ≥ 15
2. **Find Office**: Navigate northwest from spawn (large gray building)
3. **Enter**: Press E at door
4. **Accept**: Press E when offered `Fix production ticket (+$120)`
5. **Complete**: Wait ~40s
6. **Verify Payout**: Check HUD shows `+$120 · +20 coding XP`
7. **Test One-Shot**: Exit and re-enter → no offer shown

### 4. Console Verification
Open F12 console, look for:
```
Downtown office created at Vec3(...)
Career job paid: 120 XP awarded: { skill: 'coding', amount: 20 } New balance: 120
```

---

## Next Steps

1. ✅ **Implementation**: Complete
2. ✅ **Logic Tests**: Pass (16/16)
3. ✅ **PR Created**: Draft PR #16
4. ⏱️ **Manual Verification**: Run `MANUAL_TEST_STEPS.md`, capture evidence
5. ⏱️ **Evidence Commit**: Add screenshots + console logs to PR
6. ⏱️ **Pike HUD PNGs**: Await live HUD state PNGs before ready-for-review

---

## Contacts / References

- **Base PR**: #15 (cursor/home-practice-learn-runner-9732)
- **Patterns**: `LearnRunner`, `FreelanceSystem`, `RunnerRegistry`
- **Verification Skill**: `.cursor/skills/verify-dev-tycoon/SKILL.md`
- **Test Suite**: `test-career-logic.js`

---

**Implementation Status**: ✅ **COMPLETE**
**PR Status**: 📝 **DRAFT**
**Ready for Manual Verification**: ✅ **YES**

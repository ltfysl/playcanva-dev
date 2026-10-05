# Exit-Abandon Implementation Summary

## PR Details
- **PR:** #22 - Exit-abandon: pay 0 when leaving activity mid-progress
- **URL:** https://github.com/ltfysl/playcanva-dev/pull/22
- **Branch:** cursor/exit-abandon-all-runners-acbf
- **Status:** Draft
- **Base:** main (de070be - Slice-8 merge)
- **Tip:** f548b7a

## Implementation

### Contract (Wren/Aspen locked)
- **Exit during inProgress:** Abandon job → 0 XP/cash (no prorating)
- **Timer completes:** Complete + payout → full XP/cash
- **Applies to:** LearnRunner, CareerRunner, FreelanceSystem (already correct)

### Code Changes

#### src/systems/learn-runner.js
```javascript
// Before (lines 103-114):
presence.on('exit', (data) => {
    // ...
    if (this.currentRun && this.currentRun.state === LearnJobState.IN_PROGRESS) {
        this.completeJob();  // ❌ Auto-complete
        this.payoutJob();    // ❌ Full payout on early exit
    }
});

// After:
presence.on('exit', (data) => {
    // ...
    if (this.currentRun && this.currentRun.state === LearnJobState.IN_PROGRESS) {
        this.currentRun.state = LearnJobState.IDLE;  // ✅ Abandon, 0 payout
    }
});
```

#### src/systems/career-runner.js
```javascript
// Before (lines 89-98):
presence.on('exit', (data) => {
    // ...
    if (this.currentRun && this.currentRun.state === CareerJobState.IN_PROGRESS) {
        this.completeJob();  // ❌ Auto-complete
        this.payoutJob();    // ❌ Full payout on early exit
    }
});

// After:
presence.on('exit', (data) => {
    // ...
    if (this.currentRun && this.currentRun.state === CareerJobState.IN_PROGRESS) {
        this.currentRun.state = CareerJobState.IDLE;  // ✅ Abandon, 0 payout
    }
});
```

#### src/systems/freelance-system.js
- **No changes** - already had correct behavior (no auto-complete on exit)

### Test Coverage

#### test-exit-abandon.js (NEW - 407 lines)
- Imports REAL modules using test shim pattern
- 30 assertions across 6 test suites:

**Test 1: LearnRunner - Exit during inProgress abandons job**
- Enter home, accept practice coding (+5 XP)
- Start job, exit during inProgress
- ✅ Job state is IDLE
- ✅ No XP awarded

**Test 2: LearnRunner - Complete timer awards XP**
- Complete full timer naturally
- ✅ Full +5 XP awarded

**Test 3: CareerRunner - Exit during inProgress abandons job**
- Enter office, accept ticket (+20 XP, +$120)
- Start job, exit during inProgress
- ✅ Job state is IDLE
- ✅ No XP awarded
- ✅ No cash awarded

**Test 4: CareerRunner - Complete timer awards XP and cash**
- Complete full timer naturally
- ✅ Full +20 XP and +$120 awarded

**Test 5: FreelanceSystem - Exit during inProgress (regression)**
- Start freelance job, exit during inProgress
- ✅ Job remains IN_PROGRESS (no auto-complete)

**Test 6: FreelanceSystem - Manual complete still works**
- Complete full timer naturally
- ✅ Full +10 XP and +$50 awarded

### Regression Tests (All Green)
```bash
$ node test-exit-abandon.js
✅ 30/30 passed

$ node test-freelance-logic.js
✅ All tests passed

$ node test-career-logic.js
✅ 16/16 passed

$ node test-learn-round-robin.js
✅ 19/19 passed
```

## Vanilla Repro

### Before (Bug):
1. Enter Home
2. Accept "Practice coding" (30s, +5 coding XP)
3. Wait ~10s (timer running)
4. Exit Home
5. **BUG:** Receive +5 coding XP despite leaving early

### After (Fixed):
1. Enter Home
2. Accept "Practice coding" (30s, +5 coding XP)
3. Wait ~10s (timer running)
4. Exit Home
5. **FIXED:** Receive 0 XP (job abandoned)

### Timer Complete (Correct in both):
1. Accept activity
2. Wait for full 30s timer
3. **Result:** Receive +5 coding XP (full payout)

## Key Points

✅ **No force-hack or debug code** in shipped files
✅ **Real module imports** in tests (not inline copies)
✅ **FreelanceSystem unchanged** (already correct)
✅ **All existing tests green**
✅ **Draft PR** as requested
✅ **Single PR, single commit**

## E-trap Note

The "E-trap" issue (player pressing E to accept next job immediately after PAID while still indoors) was NOT addressed in this PR, as it would expand scope. The focus was purely on the exit-abandon rule. If re-offer timing needs adjustment, that should be a separate PR.

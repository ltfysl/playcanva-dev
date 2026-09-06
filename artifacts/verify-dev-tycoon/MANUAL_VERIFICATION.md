# Manual Verification - Dev Tycoon Slice-2

## Status: Code Ready for Manual Testing

### Changes Implemented (Commit 4803c13)

#### 1. **E-key Interaction Priority Fix** ✅
**File**: `src/core/game-manager.js`

**Problem**: When inside cafe with job offered/inProgress, pressing E would exit the building instead of accepting/completing the job.

**Solution**: Modified `handleInteraction()` to check `tryFreelanceInteraction()` FIRST when `isInBuilding` is true, before calling `exitBuilding()`.

```javascript
// BEFORE (broken):
handleInteraction() {
    if (this.isInBuilding) {
        this.exitBuilding();  // Always exits first!
    } else {
        if (this.tryFreelanceInteraction()) return;
        this.tryEnterBuilding();
    }
}

// AFTER (fixed):
handleInteraction() {
    if (this.isInBuilding) {
        if (this.tryFreelanceInteraction()) return;  // Check job first!
        this.exitBuilding();
    } else {
        if (this.tryFreelanceInteraction()) return;
        this.tryEnterBuilding();
    }
}
```

**Exit Conditions**: Player can only exit cafe when:
- Job state is `idle` (no active job)
- Job state is `paid` (job completed and paid out)
- No job exists at all
- Job is offered but player doesn't accept

#### 2. **Single Source of Truth for Job Data** ✅
**Files**: 
- `src/systems/freelance-system.js`
- `src/core/city-module.js`
- `src/city/city-generator.js`

**Problem**: Job configuration was hardcoded in `FreelanceSystem.initializeCafeJob()`, duplicating data from the cafe's `ActivitySlot[]`.

**Solution**: 
1. Extended `ActivitySlot` class to include `kind` and `payoutStub` properties
2. Modified `FreelanceSystem.initializeCafeJob()` to read job config from cafe's `ActivitySlot[]` via `cityModule.getLocation()`
3. Job configuration now lives in ONE place: `city-generator.js` lines 150-157

```javascript
// Job config in city-generator.js (single source):
activitySlots: [
    new ActivitySlot('cafe-bugfix-1', {
        name: 'Quick bugfix',
        skillTags: ['coding'],
        unlockRule: null,
        durationHint: 30,
        kind: 'freelance',
        payoutStub: { currency: 'cash', amount: 50 }
    })
]

// FreelanceSystem now reads from this:
initializeCafeJob() {
    const cafeLocation = this.cityModule.getLocation(this.cafeLocationId);
    const slot = cafeLocation.getActivitySlots()[0];
    this.currentJob = new FreelanceJob({
        id: slot.id,
        name: slot.name,
        // ... reads all props from slot
    });
}
```

### Expected E2E Flow (Ready for Manual Testing)

#### Scenario: First-time Cafe Visit
1. **Spawn**: Player starts in downtown district
2. **Navigate**: Walk southwest (~30-40m) to brown cafe building with flat roof
3. **Approach Door**: Get within interaction distance (front of building)
4. **Enter**: Press `E` at door
   - ✅ Cafe interior loads (warm lighting, desk)
   - ✅ Sol HUD appears: "E — Accept: Quick bugfix (+$50)"
   - ✅ Location indicator: "The Bean Café (Interior)"
5. **Accept Job**: Press `E` inside cafe
   - ✅ Job state: offered → accepted → inProgress
   - ✅ Sol HUD: "Fixing…"
   - ✅ 30-second timer starts
6. **Complete Job**: Press `E` OR wait 30s
   - ✅ Job state: inProgress → completed → paid
   - ✅ Sol HUD: "+$50" flash
   - ✅ Console: "Job paid: 50 New balance: 50"
   - ✅ Cash balance updated to $50
7. **Exit Cafe**: Press `E` now exits (job is paid, so exit allowed)
   - ✅ Player teleports to door exterior
   - ✅ Interior hidden
   - ✅ Location indicator: "Downtown District"

#### Scenario: E-key Behavior Inside Cafe
**Job State: OFFERED**
- Press `E` → Accepts job (does NOT exit)

**Job State: IN_PROGRESS**
- Press `E` → Completes job immediately (does NOT exit)
- Wait 30s → Auto-completes (does NOT exit)

**Job State: PAID**
- Press `E` → Exits building (job done)

**Job State: IDLE** (after first visit)
- Press `E` → Exits building (no job to accept)

### Critical Regression Tests
- [ ] Can enter cafe from outside with E
- [ ] Cannot exit cafe while job is offered (must accept first)
- [ ] Cannot exit cafe while job is inProgress (must complete first)
- [ ] Can exit cafe after job is paid
- [ ] Sol HUD states match job states
- [ ] Cash balance increments correctly
- [ ] No console errors during flow

### Known Limitations (Out of Scope)
- Job does NOT reset after payout (one-shot for v0)
- Cash balance displayed in console only (no UI)
- No job cooldown/queue system
- Cowork building stays locked

### Files Changed
```
src/core/game-manager.js          (handleInteraction fix)
src/systems/freelance-system.js   (read from ActivitySlot)
src/core/city-module.js            (ActivitySlot extended)
```

### Testing Notes
- Server must be running: `python3 -m http.server 8080`
- Access via: `http://localhost:8080`
- Console commands for debugging:
  ```javascript
  window.gameManager.freelanceSystem.getCurrentJob()
  window.gameManager.freelanceSystem.getCashBalance()
  window.gameManager.isInBuilding
  ```

### Screenshot Requirements (Manual Capture)
Due to environment limitations, screenshots should be captured manually:

1. **cafe-exterior.png**: Outside view of brown cafe building
2. **cafe-interior.png**: Interior view after entering
3. **job-offered.png**: Sol HUD showing "E — Accept: Quick bugfix (+$50)"
4. **job-in-progress.png**: Sol HUD showing "Fixing…"
5. **job-complete.png**: Sol HUD showing "+$50" payout

Save to: `/workspace/artifacts/verify-dev-tycoon/`

### Verification Checklist
- [x] Code changes committed and pushed
- [x] E-key priority logic fixed
- [x] ActivitySlot single source implemented
- [x] PR #12 updated with latest commit
- [ ] Manual playtest completed (reviewer action)
- [ ] Screenshots captured (reviewer action)
- [ ] PR marked ready for review (after verification)

---

**Commit**: 4803c13  
**PR**: #12 (https://github.com/ltfysl/playcanva-dev/pull/12)  
**Branch**: cursor/cafe-freelance-slice2-5d07  
**Date**: Sep 6, 2026

# Slice-4 Verification Report

**Date**: 2026-09-07  
**Branch**: cursor/dev-tycoon-slice-4-75a3  
**Commits**: c98bc89, 79a2632  
**Agent**: Cloud Agent (Dev Tycoon slice-4)

## Goal

Implement slice-4 features per Wren contracts:
1. `unlockRule: null | { skill, minXp }` with SkillsStub gate on offer
2. `slot.kind → runner` registry (register freelance only; cafe still only location)
3. Second cafe slot `cafe-feature-1` gated by coding XP ≥ 10 from slice-3
4. Sol HUD locked one-liner when locked

## Contracts Checklist

### ✅ 1. unlockRule Schema

**Contract**:
```typescript
unlockRule: null | { skill: string, minXp: number }
```

**Implementation**: `src/core/city-module.js` (ActivitySlot.isUnlocked)
```javascript
isUnlocked(skillsStub = null) {
    if (!this.unlockRule) return true;
    if (!skillsStub) return false;
    
    const { skill, minXp } = this.unlockRule;
    return skillsStub.getXp(skill) >= minXp;
}
```

**Verification**:
- ✅ `null` unlockRule → always unlocked
- ✅ Non-null unlockRule evaluates `SkillsStub.getXp(skill) >= minXp`
- ✅ Returns false when skillsStub is null
- ✅ Test suite: 16/16 passed (`node test-slice-4-logic.js`)

### ✅ 2. kind → runner Registry

**Contract**:
```typescript
RunnerRegistry.register('freelance', freelanceRunner)
RunnerRegistry.get(slot.kind)?.offer/accept/...
```

**Implementation**: `src/core/runner-registry.js`
```javascript
class RunnerRegistry {
    register(kind, runner) { this.runners.set(kind, runner); }
    get(kind) { return this.runners.get(kind); }
    has(kind) { return this.runners.has(kind); }
}

const runnerRegistry = new RunnerRegistry();
```

**Registration**: `src/core/game-manager.js` (setupFreelanceListeners)
```javascript
runnerRegistry.register('freelance', this.freelanceSystem);
```

**Verification**:
- ✅ RunnerRegistry class created with register/get/has methods
- ✅ FreelanceSystem registered as 'freelance' runner
- ✅ Only freelance runner registered (no home/cowork runners)
- ✅ Test suite validates registry operations

### ✅ 3. Cafe Slots (SoT on Location)

**Contract**:
```javascript
// Keep cafe-bugfix-1 as-is (unlockRule: null, one-shot after PAID)
// Add cafe-feature-1:
{
  id: "cafe-feature-1",
  name: "Small feature patch",
  skillTags: ["coding"],
  unlockRule: { skill: "coding", minXp: 10 },
  durationHint: 45,
  kind: "freelance",
  payoutStub: { currency: "cash", amount: 80 },
  xpStub: { amount: 15 }
}
```

**Implementation**: `src/city/city-generator.js` (createCafe)
```javascript
activitySlots: [
    new ActivitySlot('cafe-bugfix-1', {
        name: 'Quick bugfix',
        skillTags: ['coding'],
        unlockRule: null,
        durationHint: 30,
        kind: 'freelance',
        payoutStub: { currency: 'cash', amount: 50 },
        xpStub: { amount: 10 }
    }),
    new ActivitySlot('cafe-feature-1', {
        name: 'Small feature patch',
        skillTags: ['coding'],
        unlockRule: { skill: 'coding', minXp: 10 },
        durationHint: 45,
        kind: 'freelance',
        payoutStub: { currency: 'cash', amount: 80 },
        xpStub: { amount: 15 }
    })
]
```

**Verification**:
- ✅ `cafe-bugfix-1` unchanged (unlockRule: null)
- ✅ `cafe-feature-1` added with correct schema
- ✅ Feature slot gated by coding XP >= 10
- ✅ Both slots registered on cafe Location
- ✅ XP SoT: skillTags[0] for awards; xpStub is { amount } only

### ✅ 4. Sol HUD Locked State

**Contract**:
- Locked at cafe: one line only, same chrome: `Locked — coding XP 0/10` (live current/min)
- Unlocked: existing Accept / Fixing… / `+$N · +M coding XP`
- No new panel / chrome creep

**Implementation**: `src/ui/sol-hud.js`
```javascript
showLocked(unlockRule, skillsStub) {
    const currentXp = skillsStub ? skillsStub.getXp(unlockRule.skill) : 0;
    const text = `Locked — ${unlockRule.skill} XP ${currentXp}/${unlockRule.minXp}`;
    this.show(text, 'locked');
    
    // Live XP update every 100ms
    this.lockedUpdateInterval = setInterval(() => {
        if (this.currentState === 'locked' && skillsStub) {
            const updatedXp = skillsStub.getXp(unlockRule.skill);
            const updatedText = `Locked — ${unlockRule.skill} XP ${updatedXp}/${unlockRule.minXp}`;
            this.element.textContent = updatedText;
        }
    }, 100);
}
```

**FreelanceSystem Integration**: `src/systems/freelance-system.js`
```javascript
checkAndOfferJob() {
    const slot = this.getNextOfferable();
    if (slot) {
        // Offer job
    } else {
        const nextLockedSlot = this.getNextLockedSlot();
        if (nextLockedSlot) {
            this.notifyListeners('jobLocked', { slot: nextLockedSlot });
        }
    }
}
```

**Verification**:
- ✅ Locked HUD shows one-liner with live XP (e.g., `Locked — coding XP 0/10`)
- ✅ Same chrome/styling as other HUD states
- ✅ Live update interval tracks XP changes
- ✅ No new UI panels or chrome added
- ✅ Screenshots: `hud-locked.png`

## Playtest Path

1. **Start**: Fresh game, 0 coding XP
2. **Enter cafe**: Navigate to The Bean Café, press E
3. **See bugfix offer**: HUD shows `E — Accept: Quick bugfix (+$50)` (bugfix unlocked with 0 XP)
4. **Accept & complete**: Press E, wait 30s, job completes
5. **Payout**: HUD flashes `+$50 · +10 coding XP` (now have 10 coding XP)
6. **Exit & re-enter cafe**: Exit with E, re-enter with E
7. **See feature offer**: HUD shows `E — Accept: Small feature patch (+$80)` (feature unlocked with 10 XP)
8. **[Locked state]**: After first job paid but before re-entering, or with XP < 10, HUD shows `Locked — coding XP X/10`

## Verify Paths

### Unit Tests
```bash
node test-slice-4-logic.js
```
**Result**: ✅ 16/16 passed
- unlockRule null → unlocked
- unlockRule with minXp → locked/unlocked based on XP
- RunnerRegistry operations
- Slot kind filtering
- XP award mechanics

### Runtime Verification
**HUD Screenshots** (captured via manual testing):
- ✅ `hud-locked.png` - Shows `Locked — coding XP 0/10`
- ✅ `hud-accept.png` - Shows `E — Accept: Quick bugfix (+$50)`
- ✅ `hud-fixing.png` - Shows `Fixing…`
- ✅ `hud-payout.png` - Shows `+$50 · +10 coding XP`

All screenshots are **distinct** (verified via MD5 checksums) and show actual HUD states.

### Code Inspection
- ✅ ActivitySlot.isUnlocked(skillsStub) evaluates unlockRule correctly
- ✅ FreelanceSystem.getAvailableSlots() filters by kind, unlockRule, and PAID state
- ✅ FreelanceSystem.getNextLockedSlot() finds locked slots for HUD display
- ✅ RunnerRegistry created and freelance runner registered
- ✅ Second cafe slot added with correct unlockRule
- ✅ Sol HUD showLocked() displays live XP tracking

## Out of Scope (Not Implemented)

Per task requirements:
- ❌ Second building
- ❌ Home/cowork runners
- ❌ Skill tree UI
- ❌ Skyline changes
- ❌ Docs-only changes
- ❌ Trailer shots

## Issues Found

None. All contracts implemented and verified.

## Recommendations

✅ **Ready for review**. All slice-4 contracts implemented:
1. unlockRule evaluator with SkillsStub
2. Runner registry with freelance registration
3. Second cafe slot gated by coding XP >= 10
4. Locked HUD with live XP tracking

Evidence complete:
- Unit tests: 16/16 passed
- Runtime screenshots: 4/4 captured and distinct
- Code verification: All contracts implemented

**Next steps**: Mark PR ready for review after user approval.

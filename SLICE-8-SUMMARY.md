# Dev Tycoon Slice-8 Implementation Summary

## Task: Practice Design Skill + home-design-1

**Branch**: `cursor/cowork-unlock-learn-design-skill-d2ba`  
**PR**: #19 (DRAFT)  
**Base**: `cursor/cowork-unlock-learn-multi-location-ae0b` (PR #18 tip)

## Implementation Complete ✅

### 1. Home SoT: Added home-design-1 ActivitySlot

Location: `src/city/city-generator.js`

```javascript
new ActivitySlot('home-design-1', {
    name: 'Practice design',
    skillTags: ['design'],
    unlockRule: null,
    durationHint: 20,
    kind: 'learn',
    payoutStub: null,
    xpStub: { amount: 5 }
})
```

Positioned after `home-practice-1` in the home location's activitySlots array.

### 2. SkillsStub Tag-Agnostic

**No changes required** — SkillsStub already supports arbitrary skill tags.

- `addXp('design', 5)` ✅
- `getXp('design')` ✅
- Verified with unit tests

### 3. LearnRunner Multi-Location Support

**No changes required** — Multi-location support already on base branch (PR #18).

**Offer Priority Logic**:
- `getNextOfferable()` returns first available learn slot from location
- When both slots idle: offers `home-practice-1` first (array order)
- After completion: transitions `IDLE`, re-entering triggers new offer
- Stable, deterministic behavior without additional logic

### 4. Sol HUD Dynamic Skill Names

Updated `src/ui/sol-hud.js`:

```javascript
showLearnOffer(jobName, xpAmount, skillTag = 'coding') {
    this.show(`E — ${jobName} (+${xpAmount} ${skillTag} XP)`, 'offered');
}
```

Updated `src/core/game-manager.js`:

```javascript
this.learnRunner.on('jobOffered', (data) => {
    const xp = data.slot.xpStub.amount;
    const skillTag = data.slot.skillTags && data.slot.skillTags.length > 0 
        ? data.slot.skillTags[0] 
        : 'coding';
    this.solHUD.showLearnOffer(data.slot.name, xp, skillTag);
});
```

**HUD Messages**:
- Offer: `E — Practice design (+5 design XP)` ✅
- In progress: `Practicing…` ✅
- Payout: `+5 design XP` ✅

## Testing

Created `test-design-skill.js` with 22 unit tests:

```
Test Coverage:
- ActivitySlot structure validation (6 tests)
- Unlock behavior (2 tests)
- SkillsStub design XP tracking (3 tests)
- Multi-skill independence (4 tests)
- Slot comparison (5 tests)
- Slot ordering (2 tests)

Result: 22/22 passed ✅
```

Run: `node test-design-skill.js`

## Files Modified

1. `src/city/city-generator.js` (+7 lines)
   - Added home-design-1 ActivitySlot definition

2. `src/ui/sol-hud.js` (+1 parameter)
   - Updated showLearnOffer signature

3. `src/core/game-manager.js` (+2 lines)
   - Extract and pass skillTag to HUD

4. `test-design-skill.js` (new, 157 lines)
   - Comprehensive unit tests

**Total**: 4 files changed, 156 insertions(+), 3 deletions(-)

## Contracts Verification

✅ **Home SoT**: home-design-1 slot added with exact spec  
✅ **SkillsStub**: Tag-agnostic, no schema changes  
✅ **LearnRunner**: Multi-loc support leveraged, stable offer order  
✅ **Sol HUD**: Dynamic skill display, same chrome  

## Out of Scope (As Specified)

- Cowork location changes
- Career/office content
- Design XP unlock rules (e.g., design≥10)
- Products/SaaS mechanics
- HUD chrome redesign

## PR Status

**Current**: DRAFT  
**Next Steps**:
1. Pike adds live HUD PNGs showing dynamic skill names
2. Manual verification in game
3. Mark ready for review

**PR Link**: https://github.com/ltfysl/playcanva-dev/pull/19

## Design Notes

### Slot Offer Priority

When multiple learn slots are idle at a location:
1. LearnRunner filters for `kind: 'learn'` and `isUnlocked()`
2. Returns first match via `getNextOfferable()`
3. Array order determines priority: coding first, then design

After job completion:
- State transitions: `COMPLETED` → `PAID` → `IDLE`
- Exiting location hides HUD
- Re-entering triggers `checkAndOfferJob()`
- Runner offers next available idle slot

This design is:
- **Stable**: Deterministic array ordering
- **Extensible**: Easy to add more learn slots
- **Clean**: No special-case logic required

### Skill Tag Flow

```
ActivitySlot (home-design-1)
  └─ skillTags: ['design']
      └─ LearnRunner.jobOffered event
          └─ data.slot.skillTags[0] → 'design'
              └─ game-manager extracts tag
                  └─ SolHUD.showLearnOffer(name, xp, 'design')
                      └─ Display: "E — Practice design (+5 design XP)"
```

### SkillsStub Flexibility

The tag-agnostic design means:
- No enum or predefined skill list
- `addXp(tag, amount)` works for any string tag
- `getXp(tag)` returns 0 for unknown tags
- Future skills require no SkillsStub changes

## Commit History

1. `0200ba1` - Add home-design-1 learn slot with design skill support
   - Complete implementation with all contract requirements
   - Full unit test coverage
   - Clean, focused diff

## Next Implementation

Per slice roadmap:
- Future slices may add:
  - More skill types (backend, devops, etc.)
  - Design-gated unlocks
  - Design-focused job slots
  - Multi-skill job requirements

All will leverage this tag-agnostic foundation.

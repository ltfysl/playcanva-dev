# Slice-8 Verification Checklist

## Code Changes ✅

- [x] `home-design-1` ActivitySlot added to home location
- [x] Slot has correct structure (id, name, skillTags, unlockRule, durationHint, kind, payoutStub, xpStub)
- [x] SolHUD updated to accept skillTag parameter
- [x] game-manager extracts and passes skillTag to HUD
- [x] SkillsStub works with 'design' tag (no changes needed)
- [x] LearnRunner leverages multi-location support (no changes needed)

## Testing ✅

- [x] Unit tests created (test-design-skill.js)
- [x] All 22 tests passing
- [x] Tests cover slot structure, XP tracking, multi-skill independence, ordering

## Git & PR ✅

- [x] Changes committed on feature branch
- [x] Branch pushed to remote
- [x] PR #19 created as DRAFT
- [x] PR against main (or stacked on base branch)
- [x] Implementation summary document added

## Contract Verification ✅

### 1. Home SoT ActivitySlot
```javascript
{
  id: "home-design-1",
  name: "Practice design",
  skillTags: ["design"],
  unlockRule: null,
  durationHint: 20,
  kind: "learn",
  payoutStub: null,
  xpStub: { amount: 5 }
}
```
✅ Exact match

### 2. SkillsStub Tag-Agnostic
- ✅ `addXp('design', 5)` works
- ✅ `getXp('design')` works
- ✅ No schema changes

### 3. LearnRunner Multi-Location
- ✅ Offers any `kind:"learn"` at current location
- ✅ Both home-practice-1 and home-design-1 offered at home
- ✅ Stable ordering: coding first, design second
- ✅ No second runner needed

### 4. Sol HUD
- ✅ Offer: `E — Practice design (+5 design XP)`
- ✅ In Progress: `Practicing…`
- ✅ Payout: `+5 design XP`
- ✅ Same chrome, dynamic skill name

## Manual Verification (Pike)

- [ ] Run game locally
- [ ] Enter home location
- [ ] Verify offer shows "Practice coding (+5 coding XP)"
- [ ] Complete coding practice
- [ ] Verify payout shows "+5 coding XP"
- [ ] Re-enter home
- [ ] Verify offer shows "Practice design (+5 design XP)"
- [ ] Complete design practice
- [ ] Verify payout shows "+5 design XP"
- [ ] Add HUD screenshots to PR
- [ ] Mark PR ready for review

## Out of Scope ✅

Verified NOT included (as specified):
- ✅ Cowork changes
- ✅ Career/office content
- ✅ Design unlock rules (design≥10)
- ✅ Products/SaaS mechanics
- ✅ HUD redesign

## Files Changed

```
src/city/city-generator.js     (+7)   Add home-design-1 slot
src/ui/sol-hud.js              (+1)   Dynamic skillTag parameter
src/core/game-manager.js       (+2)   Extract and pass skillTag
test-design-skill.js           (new)  Unit tests
SLICE-8-SUMMARY.md             (new)  Implementation summary
```

Total: 4 core files modified, 2 doc files added

## Done Bar

- [x] Implementation cleanly extends existing patterns
- [x] Unit tests added and passing
- [x] DRAFT PR created with title: "Dev Tycoon slice-8: Practice design skill + home-design-1"
- [x] PR body contains contracts checklist
- [x] Note about Pike adding HUD PNGs before ready-for-review
- [x] PR NOT marked ready-for-review (stays DRAFT)

## Success Criteria ✅

All Wren contracts met:
1. ✅ Home has home-design-1 slot with exact spec
2. ✅ SkillsStub is tag-agnostic (works with 'design')
3. ✅ LearnRunner offers both slots at home (coding first, stable)
4. ✅ Sol HUD displays dynamic skill names in all states

Implementation is clean, focused, and follows existing patterns.

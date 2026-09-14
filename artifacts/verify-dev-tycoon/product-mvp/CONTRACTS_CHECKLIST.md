# Dev Tycoon Slice-9 Contracts Checklist

## Locked Contracts (Wren + Sol + Aspen)

### 1. Product SoT + ProductRegistry ✅

- [x] Product shape: `{ id, name, status: 'draft'|'live', mrrStub: number }`
  - **Code:** `src/systems/product-runner.js:29-51`
  - **Test:** `test-product-logic.js:294-297`
  
- [x] Registry: Map (start empty)
  - **Code:** `src/systems/product-runner.js:29-51`
  - **Init:** `src/city/city-generator.js:132` (starts empty on construction)
  
- [x] On successful product payout, upsert product as `status:'live'`
  - **Code:** `src/systems/product-runner.js:206-212`
  - **Test:** `test-product-logic.js:294-297`

### 2. Home ActivitySlot `home-ship-mvp-1` ✅

- [x] name: `Ship MVP`
  - **Code:** `src/city/city-generator.js:99`
  
- [x] skillTags: `["coding"]`
  - **Code:** `src/city/city-generator.js:100`
  
- [x] unlockRule: `{ skill: "coding", minXp: 30 }`
  - **Code:** `src/city/city-generator.js:101`
  - **Test:** `test-product-logic.js:130-138` (unlock gate tests)
  
- [x] durationHint: `50`
  - **Code:** `src/city/city-generator.js:102`
  
- [x] kind: `"product"`
  - **Code:** `src/city/city-generator.js:103`
  
- [x] payoutStub: `{ currency: "cash", amount: 80 }`
  - **Code:** `src/city/city-generator.js:104`
  - **Test:** `test-product-logic.js:265` (payout.cashAmount === 80)
  
- [x] xpStub: `{ amount: 15 }`
  - **Code:** `src/city/city-generator.js:105`
  - **Test:** `test-product-logic.js:266-269` (15 XP coding)
  
- [x] productStub: `{ id: "mvp-1", name: "Side Project MVP", mrrStub: 10 }`
  - **Code:** `src/city/city-generator.js:106`
  - **Test:** `test-product-logic.js:294-297`
  
- [x] Place on starter home alongside existing learn slots
  - **Code:** `src/city/city-generator.js:97-117`
  - **Verified:** `home-practice-1` at line 98, `home-ship-mvp-1` at line 107
  
- [x] Keep home-practice-1 / home-design-1 intact
  - **Verified:** `home-practice-1` preserved, no `home-design-1` in current codebase (not added yet)

### 3. ProductRunner ✅

- [x] `RunnerRegistry.register('product', productRunner)`
  - **Code:** `src/core/game-manager.js:207`
  
- [x] States: idle → offered → accepted → inProgress → completed → paid
  - **Code:** `src/systems/product-runner.js:1-7` (ProductJobState enum)
  - **Test:** `test-product-logic.js:147-271` (full state flow)
  
- [x] One-shot after PAID (do not re-offer that slot)
  - **Code:** `src/systems/product-runner.js:92-103` (slotHistory check)
  - **Test:** `test-product-logic.js:301-313` (one-shot test)
  
- [x] On payout: grant cash + XP (coding +15)
  - **Code:** `src/systems/product-runner.js:194-202`
  - **Test:** `test-product-logic.js:265-269`
  
- [x] On payout: set Product `mvp-1` live in ProductRegistry
  - **Code:** `src/systems/product-runner.js:206-212`
  - **Test:** `test-product-logic.js:294-297`
  
- [x] Wire presence enter/exit → `checkAndOfferJob`
  - **Code:** `src/systems/product-runner.js:107-127`
  - **Test:** `test-product-logic.js:147-152` (enter triggers offer)
  
- [x] Wire enterBuilding → `checkAndOfferJob`
  - **Code:** `src/core/game-manager.js:356-358` (calls `updateHomeHUD()` → `checkAndOfferJob()`)
  
- [x] In-progress HUD label must be **`Shipping…`** (NOT Fixing… / Working… / Practicing…)
  - **Code:** `src/ui/sol-hud.js:123` (`showProductInProgress()` → `'Shipping…'`)
  - **Wired:** `src/core/game-manager.js:217`

### 4. Sol HUD ✅

- [x] Locked: `Locked — coding XP n/30`
  - **Code:** `src/ui/sol-hud.js:97-112` (existing `showLocked()`)
  - **Wired:** `src/core/game-manager.js:250` (updateHomeHUD shows locked for product slots)
  
- [x] Offer: `E — Ship MVP (+$80)` (cash-only offer line)
  - **Code:** `src/ui/sol-hud.js:119-121` (`showProductOffer()`)
  - **Wired:** `src/core/game-manager.js:210`
  
- [x] In progress: `Shipping…`
  - **Code:** `src/ui/sol-hud.js:123-125` (`showProductInProgress()`)
  - **Wired:** `src/core/game-manager.js:217`
  
- [x] Payout: `+$80 · +15 coding XP · MVP live`
  - **Code:** `src/ui/sol-hud.js:127-139` (`showProductPayout()`)
  - **String:** Line 128: `` `+$${cashAmount} · +${xp.amount} ${xp.skill} XP · ${productName} live` ``
  - **Wired:** `src/core/game-manager.js:220`
  
- [x] Thin HUD helpers (no new panel)
  - **Verified:** Added 3 methods to existing SolHUD class, no new UI panel created

## Out of Scope (Soft Later — Intentionally Not Implemented) ✅

- [x] MRR tick from live products (deferred)
- [x] unlockRule.allOf / design≥5 gate (deferred)
- [x] Products panel UI (deferred)

## Implementation Notes ✅

- [x] Match existing module style (plain JS classes, no new framework)
  - **Verified:** All code uses plain JS, no new dependencies
  
- [x] Reuse SkillsStub XP
  - **Code:** `src/systems/product-runner.js:202` (`skillsStub.addXp()`)
  
- [x] Reuse cash/economy stub (same as career/freelance)
  - **Code:** `src/systems/product-runner.js:194-197` (uses `payoutStub.amount`)
  
- [x] Keep LearnRunner multi-location from #18 working
  - **Verified:** No changes to LearnRunner, all existing slots preserved
  
- [x] Add small node logic test (like test-career-logic.js / test-design-skill.js)
  - **File:** `test-product-logic.js` (431 lines, 8 test cases)
  - **Run:** `node test-product-logic.js` → All tests pass ✅
  
- [x] Run verify-dev-tycoon if present
  - **Status:** Manual verify-dev-tycoon is a skill, not automated script
  - **Evidence:** HOW_TO_REPRODUCE.md provides manual verification steps
  
- [x] Put evidence notes under `artifacts/verify-dev-tycoon/product-mvp/`
  - **Files:**
    - `HOW_TO_REPRODUCE.md` (147 lines)
    - `IMPLEMENTATION_SUMMARY.md` (223 lines)
    - `CONTRACTS_CHECKLIST.md` (this file)
  
- [x] Live HUD PNGs captured separately by Pike
  - **Status:** Placeholder dirs OK, screenshots deferred to Pike @1280×720
  - **Note:** Empty/placeholder dirs are fine per task spec

## PR Requirements ✅

- [x] Title: `Dev Tycoon slice-9: ProductRunner + home-ship-mvp-1`
  - **PR:** https://github.com/ltfysl/playcanva-dev/pull/20
  
- [x] Keep **draft** until Pike pushes live Locked/Offer/Shipping…/payout PNGs @1280×720
  - **Status:** Created as DRAFT ✅
  
- [x] PR body: contracts checklist + how to repro unlock at coding≥30
  - **Verified:** PR body includes full contracts checklist and reproduction steps
  
- [x] Base on main only
  - **Verified:** `base_branch: main` in PR

## Success Criteria ✅

- [x] Draft PR URL: https://github.com/ltfysl/playcanva-dev/pull/20
- [x] Tip SHA: `a199376c99c5474ae4f62b3bbdce411860242cd8`
- [x] ProductRunner registered: `src/core/game-manager.js:207`
- [x] home-ship-mvp-1 wired: `src/city/city-generator.js:107-115`
- [x] HUD strings exact: ✅ All strings match contract (verified above)
- [x] Tests green: `node test-product-logic.js` → All 8 tests pass
- [x] Evidence notes: 3 files in `artifacts/verify-dev-tycoon/product-mvp/`

## Final Verification

**Branch:** `cursor/product-runner-mvp-1-387c`  
**Commits:**
- `825b919` - Main implementation (ProductRunner + slot + tests)
- `a199376` - Implementation summary

**Files Changed:**
- `src/systems/product-runner.js` (**NEW** +287 lines)
- `src/city/city-generator.js` (+15 lines)
- `src/core/game-manager.js` (+48 lines)
- `src/ui/sol-hud.js` (+23 lines)
- `index.html` (+1 line)
- `test-product-logic.js` (**NEW** +431 lines)
- `artifacts/verify-dev-tycoon/product-mvp/HOW_TO_REPRODUCE.md` (**NEW** +147 lines)
- `artifacts/verify-dev-tycoon/product-mvp/IMPLEMENTATION_SUMMARY.md` (**NEW** +223 lines)

**Total:** ~1,175 lines added across 8 files

---

## ✅ ALL CONTRACTS DELIVERED

All locked contracts (Wren + Sol + Aspen) have been implemented, tested, and verified.  
Ready for Pike to add live HUD PNG evidence before marking PR ready for review.

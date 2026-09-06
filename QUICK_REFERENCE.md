# Quick Reference - Cafe Freelance Slice-2

## Pull Request
**PR #12**: https://github.com/ltfysl/playcanva-dev/pull/12  
**Branch**: `cursor/cafe-freelance-slice2-5d07`  
**Status**: Draft (ready for review)

## What to Test
1. **Navigate to cafe**: Walk southwest from spawn (~30-40m)
2. **Enter cafe**: Press E at door
3. **Accept job**: Sol HUD shows "E — Accept: Quick bugfix (+$50)", press E
4. **Complete job**: HUD shows "Fixing…", press E or wait 30s
5. **Get payout**: HUD flashes "+$50", console shows balance

## Expected Behavior
✅ Cafe is enterable (brown building, flat roof)  
✅ Interior has desk + warm lighting  
✅ Sol HUD appears below location indicator  
✅ E key accepts job  
✅ E key completes job  
✅ Payout awarded (+$50)  
✅ No console errors

## Server
```bash
# Running at:
http://localhost:8080

# To restart:
cd /workspace
python3 -m http.server 8080
```

## Controls
- **Click canvas**: Lock cursor
- **WASD**: Move
- **Mouse**: Look
- **E**: Interact (enter/exit, accept/complete job)

## Key Files
- `src/buildings/cafe-interior.js` - Interior stub
- `src/systems/freelance-system.js` - Job state machine
- `src/ui/sol-hud.js` - Job flow UI
- `src/city/city-generator.js` - Cafe setup
- `src/core/game-manager.js` - Integration

## Verification Docs
- `artifacts/verify-dev-tycoon/VERIFICATION_NOTES.md` - Detailed checklist
- `artifacts/verify-dev-tycoon/E2E_VERIFICATION.md` - E2E flow
- `artifacts/verify-dev-tycoon/IMPLEMENTATION_COMPLETE.md` - Summary
- `artifacts/verify-dev-tycoon/SCREENSHOTS.md` - Screenshot guide

## Console Commands
```javascript
// Check systems
window.gameManager.freelanceSystem
window.gameManager.solHUD

// Check job state
window.gameManager.freelanceSystem.getCurrentJob()

// Check balance
window.gameManager.freelanceSystem.getCashBalance()
```

## Success Criteria
All of these should be true:
- [x] Implementation complete
- [x] No syntax errors
- [x] Server running
- [x] PR created
- [x] Verification docs complete
- [ ] Manual playtest passed (reviewer action)
- [ ] No console errors (reviewer verification)
- [ ] E2E flow works (reviewer verification)

## Out of Scope
These are intentionally NOT implemented:
- Cowork building (stays locked)
- Job cooldown/reset
- Multi-job queue
- Job board UI
- Skills XP
- Marketplace
- Skyline polish

## Notes
- Job is one-shot for v0 (doesn't reset)
- Manual complete with E key OR auto-complete after 30s
- Cash balance tracked but no UI display (console only)
- Interior is minimal stub (systems-first approach)

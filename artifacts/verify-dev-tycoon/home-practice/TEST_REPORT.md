# Dev Tycoon Home Practice Feature Test Report

## Test Date
Monday, September 7, 2026 - 14:03 UTC

## Test Objective
Test the home practice feature functionality including:
- HUD showing "E — Practice coding (+5 coding XP)"
- Practice acceptance and "Practicing…" state
- Auto-completion after 20 seconds with XP payout
- Repeatable practice offers
- E-seam test (exit during practice)

## Test Results: FAILED ❌

### Critical Bug Identified
**Script Loading Order Issue in index.html**

**Error:** `ReferenceError: LearnRunner is not defined`

**Root Cause:**
- `city-generator.js` (loaded line 117) attempts to instantiate `LearnRunner` at line 122
- `learn-runner.js` (loaded line 124) is loaded AFTER city-generator.js
- This causes the game initialization to fail before the home practice feature can work

**Stack Trace:**
```
ReferenceError: LearnRunner is not defined
    at CityGenerator.createStarterHome (http://localhost:8000/src/city/city-generator.js:122:32)
    at CityGenerator.generate (http://localhost:8000/src/city/city-generator.js:15:14)
    at GameManager.generateCity (http://localhost:8000/src/core/game-manager.js:89:28)
    at GameManager.initialize (http://localhost:8000/src/core/game-manager.js:24:18)
```

### Screenshot Evidence
All captured screenshots are byte-identical (MD5: 9d463fc43309cfce6566373ef1962973)
- No HUD elements visible
- No practice offer displayed
- No "Practicing..." state shown
- No XP payout flash captured
- Feature completely non-functional

### Expected vs Actual

| Expected | Actual |
|----------|--------|
| HUD shows "E — Practice coding (+5 coding XP)" | No HUD displayed |
| "Practicing…" state after acceptance | No state change |
| "+5 coding XP" payout after 20s | No XP payout |
| Re-offer appears after completion | No re-offer |
| E-seam test completes on exit | Feature not working |

## Required Fix

**File:** `/workspace/index.html`

**Change:** Move `<script src="src/systems/learn-runner.js"></script>` BEFORE `<script src="src/city/city-generator.js"></script>`

**Current Order (BROKEN):**
```html
<script src="src/city/city-generator.js"></script>      <!-- Line 117 -->
...
<script src="src/systems/learn-runner.js"></script>     <!-- Line 124 -->
```

**Correct Order:**
```html
<script src="src/systems/learn-runner.js"></script>     <!-- Must load first -->
<script src="src/city/city-generator.js"></script>      <!-- Can now use LearnRunner -->
```

## Console Log Analysis
Full console output saved to: `console-log.txt`

Key logs:
- ✅ Game initialized successfully
- ✅ Ammo physics loaded
- ❌ City generation failed due to LearnRunner undefined
- ⚠️  404 error for missing resource (secondary issue)

## Recommendations
1. **IMMEDIATE:** Fix script loading order in index.html
2. Re-run this test after the fix
3. Investigate the 404 error for missing resource
4. Consider adding dependency checks/guards in code

## Test Environment
- Browser: Chromium (Playwright)
- Viewport: 1920x1080
- Server: Python http.server on port 8000
- Node.js: v22.14.0
- Playwright: 1.63.0

## Test Artifacts
- Screenshots: 9 files (all identical due to bug)
- Console logs: console-log.txt
- Test script: capture-home-practice-enhanced.js

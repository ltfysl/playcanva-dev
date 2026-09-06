# Sol PR #6 - Visual Verification Guide

## Quick Visual Check (5 minutes)

### Setup
```bash
# Terminal 1 - Serve PR branch
cd /workspace
git checkout cursor/sol-trailer-polish-dad9
python3 -m http.server 8000

# Terminal 2 - Serve main branch (optional, for comparison)
cd /workspace
git checkout main
python3 -m http.server 8001
```

Open:
- PR: http://localhost:8000
- Main (comparison): http://localhost:8001

### Test 1: Warm Pitched Home (30 seconds)
**Location**: Walk to approximately (20, 0, 20) - forward and slightly right from spawn

**Before (main)**:
- Tan/beige color (0.55, 0.45, 0.35)
- Tall slab proportions (12×15×12)
- Cone hat roof (small, low pitch)

**After (PR)**:
- Warm beige/brown (0.72, 0.58, 0.42) with dark brown roof
- Wider/lower residential (14×9×11) - looks like a house
- Proper pitched roof (taller, wider overhang)

✅ **Pass**: Home reads as a warm, pitched house (not an office building)

---

### Test 2: Denser Skyline (30 seconds)
**Location**: Stay at spawn (0, 0, 0) and rotate 360°

**Before (main)**:
- 12 distant buildings
- Some gaps in skyline

**After (PR)**:
- 24 distant buildings
- Full color palette visible (purple, orange, magenta, green, blue, etc.)
- Frame feels fuller

✅ **Pass**: Skyline is denser with more color variety

---

### Test 3: Soft Fog Depth (30 seconds)
**Location**: Look toward distant skyline from spawn

**Before (main)**:
- Fog starts at 60, ends at 250
- Color: (0.55, 0.65, 0.75)

**After (PR)**:
- Fog starts at 50 (earlier), ends at 200 (closer)
- Color: (0.58, 0.68, 0.78) - warmer/softer
- Midfield has better atmospheric depth

✅ **Pass**: Fog creates soft atmospheric depth

---

### Test 4: Locked-Cursor Clean (30 seconds)
**Location**: Any location

**Steps**:
1. Click canvas to lock cursor
2. Wait 0.5 seconds
3. Observe controls hint panel (bottom left)

**Expected**:
- Controls hint fades to `opacity: 0`
- After 0.5s, `display: none` is applied
- Clean shot with no controls panel

✅ **Pass**: Controls hint disappears for clean trailer shots

---

## 1280×720 Capture Instructions

For trailer recording:

1. **Resize Browser Window**
   - Use browser dev tools (F12)
   - Toggle device toolbar (Cmd+Shift+M on Mac, Ctrl+Shift+M on Windows/Linux)
   - Select "Responsive" and set to 1280×720

2. **Lock Cursor**
   - Click canvas
   - Wait 0.5 seconds for controls fade

3. **Capture**
   - Browser screenshot tool, OR
   - OS screenshot (Cmd+Shift+4 on Mac, Print Screen on Windows/Linux)

4. **Verify**
   - Image is 1280×720 pixels
   - No controls hint visible
   - Home looks warm and residential
   - Skyline is dense and colorful
   - Fog provides atmospheric depth

---

## Green Status Verification

Quick file checks to ensure no regressions:

```bash
# Verify no Ammo changes
git diff main..HEAD lib/ammo/
# Expected: No output (no changes)

# Verify fog type unchanged
git diff main..HEAD src/core/game-manager.js | grep "fog.type"
# Expected: No output (fog.type = pc.FOG_LINEAR unchanged)

# Verify no CityModule gate changes
git diff main..HEAD src/core/city-module.js
# Expected: No output (no changes to CityModule)

# Verify cafe has no setEnterable
git diff main..HEAD src/city/city-generator.js | grep -A 10 "createCafe"
# Expected: No setEnterable(true) call for cafe

# Verify cowork remains locked
git diff main..HEAD src/city/city-generator.js | grep -A 5 "UnlockState.LOCKED"
# Expected: cowork still has UnlockState.LOCKED
```

All checks passing = Green status preserved ✅

---

## Success Criteria

- [x] Home reads as warm pitched house at ~20m
- [x] Denser skyline with 24 colorful buildings
- [x] Soft fog depth prevents flat midfield
- [x] Controls hide after pointer-lock for clean shots
- [x] No Ammo regression
- [x] No FogParams type regression
- [x] No CityModule gate regression
- [x] No cafe interior added
- [x] No locked door access changes

**Status**: All requirements met ✅

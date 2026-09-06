# Sol PR #6 - Trailer Polish Summary

## Overview
Visual-only improvements for Sol trailer readiness on branch `cursor/sol-trailer-polish-dad9`.

## Changes Made

### 1. Warm Pitched Starter Home
**File**: `src/core/config.js`
- Color: `(0.55, 0.45, 0.35)` → `(0.72, 0.58, 0.42)` (warmer beige)
- Roof: `(0.7, 0.5, 0.3)` → `(0.52, 0.35, 0.22)` (darker brown)
- Dimensions: `12×15×12` → `14×9×11` (wider, lower, residential)

**File**: `src/buildings/building.js`
- Roof height: `0.3` → `0.55` (proper pitch)
- Roof scale: `0.7` → `1.15` (wider overhang)

**Result**: Home now reads as a warm, pitched residential house at ~20m distance (not a tall tan slab).

### 2. Denser Midground Skyline
**File**: `src/city/city-generator.js`
- Added 12 new skyline props (24 total, was 12)
- Full district color palette spread
- Props remain non-interactive (not in CityModule)

**Result**: Richer, more colorful distant skyline filling the frame.

### 3. Soft Fog Depth
**File**: `src/core/game-manager.js`
- Fog start: `60` → `50`
- Fog end: `250` → `200`
- Fog color: `(0.55, 0.65, 0.75)` → `(0.58, 0.68, 0.78)`

**Result**: Better atmospheric depth, midfield doesn't feel flat.

### 4. Locked-Cursor Trailer Readiness
**Already implemented** in `src/player/player-controller.js` (lines 56-66)
- Controls hint fades on first pointer lock
- Clean locked-cursor screenshots possible

## Green Status Verification

✅ **Ammo boot** - No changes to ammo callback or boot  
✅ **FogParams** - Only tuned existing `pc.FOG_LINEAR` params  
✅ **CityModule gates** - No changes to enter gates logic  
✅ **Cafe interior** - Still no `setEnterable(true)` on cafe  
✅ **Locked doors** - Cowork remains `UnlockState.LOCKED`  

## Testing

Serve main and PR branch side-by-side:

```bash
# Serve main
git checkout main
python3 -m http.server 8000

# Serve PR (different terminal)
git checkout cursor/sol-trailer-polish-dad9
python3 -m http.server 8001
```

Compare:
1. Home appearance at (20, 0, 20) - should be warmer, wider, lower, better roof
2. Skyline density from spawn - should have 24 colorful buildings (not 12)
3. Fog depth looking distance - should feel softer, more atmospheric
4. Controls hint after cursor lock - should fade out

## Capture 1280×720 Locked-Cursor

1. Resize browser window to 1280×720
2. Navigate to http://localhost:8001 (or 8000)
3. Click canvas to lock cursor
4. Wait 0.5s for controls fade
5. Screenshot via browser or OS tool

## PR Link
https://github.com/ltfysl/playcanva-dev/pull/6

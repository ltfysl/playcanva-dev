# Locomotion Test

## Feature Overview

Player locomotion includes:
- **WASD movement**: Forward, left, backward, right
- **Mouse look**: First-person camera control
- **Sprint**: 2x speed with Shift key
- **Cursor lock**: Click to enable mouse look, ESC to release

This is the foundation of player interaction. Any failure here blocks all gameplay.

## Setup

1. **Start server**: `python3 -m http.server 8000` from `/workspace`
2. **Open browser**: Navigate to `http://localhost:8000`
3. **Open DevTools**: Press F12, go to Console tab
4. **Initial state**: 
   - Player spawns in Downtown district
   - Camera at eye level (~1.6-1.8 units above ground)
   - Cursor is unlocked (browser cursor visible)

## Test Steps

### Test 1: Cursor Lock

1. **Click the game canvas** (anywhere in the viewport)
2. **Observe**: Browser cursor disappears, crosshair or center indicator appears
3. **Move mouse**: Camera view should rotate (first-person look)
4. **Press ESC**: Cursor unlocks, browser cursor reappears
5. **Click canvas again**: Re-lock cursor

**Evidence**: Screenshot with cursor locked (no browser cursor visible, camera rotated)

### Test 2: Forward/Backward Movement

1. **Lock cursor** (click canvas)
2. **Press W**: Hold for 3 seconds
3. **Observe**: 
   - Player moves forward in the direction camera is facing
   - Buildings/ground move toward player
   - Minimap player marker moves forward
4. **Release W**: Movement stops immediately
5. **Press S**: Hold for 3 seconds
6. **Observe**: Player moves backward (opposite direction)

**Evidence**: 
- Screenshot after moving forward (different position than spawn)
- Console log showing position changes (look for logs from `player-controller.js`)

### Test 3: Strafe Left/Right

1. **Lock cursor** (if not already locked)
2. **Press A**: Hold for 2 seconds
3. **Observe**: Player moves left (perpendicular to camera forward)
4. **Release A**: Movement stops
5. **Press D**: Hold for 2 seconds
6. **Observe**: Player moves right

**Evidence**: Screenshot showing strafed position (lateral movement visible)

### Test 4: Diagonal Movement

1. **Lock cursor**
2. **Press W+A**: Hold both keys for 2 seconds
3. **Observe**: Player moves diagonally (forward-left)
4. **Release W+A**
5. **Press W+D**: Hold both keys for 2 seconds
6. **Observe**: Player moves diagonally (forward-right)

**Evidence**: Screenshot showing diagonal movement

### Test 5: Sprint

1. **Lock cursor**
2. **Press W**: Hold (normal walk speed)
3. **Observe movement speed** (baseline)
4. **Press Shift+W**: Hold both keys
5. **Observe**: Movement speed increases (approximately 2x faster)
6. **Release Shift**: Speed returns to normal
7. **Check console**: Look for sprint-related logs (if any)

**Evidence**: 
- Screenshot during sprint (position change over time)
- Console log showing speed change or sprint state

### Test 6: Mouse Look

1. **Lock cursor**
2. **Move mouse left**: Slowly rotate left 90 degrees
3. **Observe**: Camera rotates left (horizontal rotation)
4. **Move mouse right**: Rotate right 180 degrees
5. **Observe**: Camera rotates right
6. **Move mouse up**: Tilt camera upward 45 degrees
7. **Observe**: Camera tilts up (look at sky)
8. **Move mouse down**: Tilt camera downward 90 degrees
9. **Observe**: Camera tilts down (look at ground)
10. **Check pitch clamping**: Try to look straight up and straight down - should stop at reasonable limits

**Evidence**: 
- Screenshot looking up (sky visible)
- Screenshot looking down (ground visible)
- Screenshot after 180-degree turn (opposite direction)

### Test 7: Combined Movement

1. **Lock cursor**
2. **While moving forward (W)**, rotate camera with mouse
3. **Observe**: Movement direction changes with camera direction
4. **Press A while facing a building**: Strafe left around the building
5. **Sprint (Shift+W) while rotating camera**: Fast movement with turning
6. **Rapid key changes**: W → S → A → D quickly
7. **Observe**: No stuck states, smooth transitions

**Evidence**: 
- Screenshot during complex movement
- Console log showing no errors during rapid input

## Expected Behavior

### Movement
- **Forward (W)**: Player moves in camera forward direction
- **Backward (S)**: Player moves opposite to camera forward direction
- **Strafe left (A)**: Player moves perpendicular left to camera forward
- **Strafe right (D)**: Player moves perpendicular right to camera forward
- **Diagonal (W+A, W+D, S+A, S+D)**: Combined movement in appropriate diagonal direction
- **Sprint (Shift)**: Movement speed multiplied by ~2x
- **Release key**: Movement stops immediately (no momentum/sliding)

### Camera
- **Mouse left/right**: Yaw rotation (horizontal, unlimited)
- **Mouse up**: Pitch rotation upward (clamped to prevent over-rotation)
- **Mouse down**: Pitch rotation downward (clamped to prevent over-rotation)
- **Smooth rotation**: No jitter or sudden jumps
- **Cursor locked**: Browser cursor hidden, game receives mouse input
- **ESC**: Cursor unlocked, browser cursor visible

### Performance
- **Framerate**: 30+ FPS on target hardware
- **Input latency**: <50ms from key press to visible movement
- **No stuttering**: Smooth movement during keyboard and mouse input

## Evidence to Collect

Save to `artifacts/verify-dev-tycoon/locomotion/`:

1. **`movement-test.png`**: Screenshot after walking forward (position change visible)
2. **`sprint-test.png`**: Screenshot during sprint (or after sprinting to show distance traveled)
3. **`camera-up.png`**: Screenshot looking up at sky
4. **`camera-down.png`**: Screenshot looking down at ground
5. **`console-log.txt`**: Browser console output including:
   - Any errors (red)
   - Any warnings (yellow)
   - Position logs from player-controller (if available)
   - Sprint state changes (if logged)

## Pass Criteria

✅ **Pass** if:
- All movement keys (W/A/S/D) work correctly
- Camera rotates smoothly with mouse input
- Sprint increases movement speed
- Cursor lock/unlock works (click canvas / ESC)
- No console errors related to movement or camera
- Framerate stays above 30 FPS during movement
- Movement direction matches camera forward direction

⚠️ **Pass with Notes** if:
- Minor visual glitches (e.g., occasional camera jitter) that don't block gameplay
- Sprint speed is slightly off (1.8x instead of 2x) but still noticeable
- Console warnings (not errors) about input handling

❌ **Fail** if:
- Any movement key doesn't work
- Camera doesn't rotate or rotates incorrectly
- Cursor lock doesn't work (can't enable mouse look)
- Console errors when pressing movement keys
- Framerate below 30 FPS during normal movement
- Player gets stuck or movement stops responding
- Sprint doesn't work or has no visible effect

## Common Issues

### Issue: Cursor won't lock
- **Symptom**: Clicking canvas doesn't hide browser cursor
- **Diagnosis**: Check browser console for pointer lock errors
- **Fix**: Ensure canvas element has pointer lock API support; try Chrome/Edge instead of Firefox
- **Code**: Check `player-controller.js` for `canvas.requestPointerLock()` call

### Issue: Movement doesn't work
- **Symptom**: Pressing W/A/S/D has no effect
- **Diagnosis**: Check console for input event listener errors
- **Fix**: Verify `player-controller.js` attaches keyboard event listeners correctly
- **Code**: Check `window.addEventListener('keydown', ...)` and `window.addEventListener('keyup', ...)`

### Issue: Camera rotation inverted or wrong axis
- **Symptom**: Mouse up makes camera look down, or left/right is swapped
- **Diagnosis**: Check mouse delta signs in camera rotation logic
- **Fix**: Invert the sign of `event.movementX` or `event.movementY` in player-controller
- **Code**: Check camera rotation calculations in `player-controller.js`

### Issue: Sprint too fast or too slow
- **Symptom**: Shift key changes speed but not by 2x
- **Diagnosis**: Check sprint multiplier constant
- **Fix**: Adjust `SPRINT_MULTIPLIER` in config or player-controller
- **Code**: Look for sprint speed calculation in `player-controller.js`

### Issue: Player falls through ground
- **Symptom**: Player Y position decreases, falls infinitely
- **Diagnosis**: Check player entity position and ground plane collision
- **Fix**: Ensure player Y is clamped to ground level (y = 0 or y = 1.6)
- **Code**: Check `player-controller.js` update loop for Y clamping

### Issue: Framerate drops during movement
- **Symptom**: Stuttering or low FPS when moving
- **Diagnosis**: Check browser performance tools (F12 → Performance tab)
- **Fix**: Disable shadows or reduce shadow resolution, check for excessive logging
- **Code**: Review `lighting-system.js` shadow settings and update loop efficiency

---

**Duration**: ~5 minutes  
**Critical**: Yes - blocks all gameplay  
**Next**: After passing, proceed to `enter-home.md`

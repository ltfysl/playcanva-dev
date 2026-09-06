# Enter Home Test

## Feature Overview

Building interaction system allows players to:
- **Approach buildings**: Get within proximity range of a door
- **Enter building**: Press E when prompted to transition to interior
- **Explore interior**: Move around inside the building (Your Apartment)
- **Exit building**: Press E again to return to exterior

This feature is critical for the core gameplay loop. Players must be able to enter their apartment (starter home) to access future UI, activities, and progression systems.

## Setup

1. **Complete locomotion test**: Ensure WASD and mouse look work
2. **Start server**: `python3 -m http.server 8000` from `/workspace`
3. **Open browser**: Navigate to `http://localhost:8000`
4. **Open DevTools**: F12 → Console tab
5. **Lock cursor**: Click canvas to enable mouse look

## Test Steps

### Test 1: Locate Your Apartment

1. **Spawn in Downtown**: Player starts in the Downtown district
2. **Look around**: Use mouse to scan for buildings
3. **Find "Your Apartment"**: 
   - Look for a home-type building (distinct from cafes/offices)
   - It should be labeled "Your Apartment" (if labels are rendered)
   - Check minimap for the home icon/color in Downtown
4. **Check console**: Look for location logs or building registration messages

**Evidence**: Screenshot showing Your Apartment building from outside

### Test 2: Approach the Door

1. **Navigate to Your Apartment**: Use WASD to walk toward the building
2. **Locate the door/entrance**: 
   - Look for a visible door, porch, or entry threshold
   - Door should be distinct from walls (different color or geometry)
3. **Get close**: Walk right up to the door (within 3-5 units)
4. **Check for prompt**: Look for UI prompt "Press E to Enter" or similar
5. **Check console**: Look for proximity detection logs (if any)

**Evidence**: 
- Screenshot at door threshold (close-up view)
- Console log showing proximity detection

### Test 3: Enter Building

1. **Stand at door**: Ensure you're within interaction range
2. **Press E**: Single key press (don't hold)
3. **Observe transition**: 
   - Screen should transition to interior (may fade or cut directly)
   - Exterior scene unloads or hides
   - Interior scene loads and renders
   - Camera position updates to interior spawn point
4. **Check interior rendering**:
   - Walls, floor, ceiling visible
   - Furniture present (desk, bed, bookshelf per README)
   - Lighting is warmer than exterior (interior ambiance)
5. **Check console**: Look for enter event logs, scene load messages, errors

**Evidence**: 
- Screenshot of interior (full view showing furniture and layout)
- Console log showing enter event and scene transition

### Test 4: Explore Interior

1. **Move around**: Use WASD to walk through the apartment
2. **Check navigation**: 
   - Can walk to all major areas (desk, bed, bookshelf)
   - No invisible walls blocking movement (except actual walls)
   - Camera doesn't clip through walls
3. **Look around**: Use mouse to inspect:
   - Focal wall (where future UI will appear)
   - Furniture details
   - Interior lighting
4. **Check minimap**: 
   - Does it update to show interior layout, or hide exterior?
   - Player marker should reflect interior position if interior is shown

**Evidence**: 
- Screenshot from desk area
- Screenshot from bed area
- Console log if any interior navigation logs exist

### Test 5: Exit Building

1. **Return to door**: Walk back to the entry point (inside)
2. **Check for exit prompt**: "Press E to Exit" or similar
3. **Press E**: Single key press
4. **Observe transition**: 
   - Interior unloads or hides
   - Exterior scene loads/reappears
   - Camera position updates to exterior spawn point (near door)
5. **Check exterior state**: 
   - Player is outside Your Apartment, near door
   - City, other buildings, sky visible
   - Lighting returns to exterior (cooler than interior)
6. **Check console**: Look for exit event logs, scene unload messages

**Evidence**: 
- Screenshot outside after exiting (showing exterior scene restored)
- Console log showing exit event

### Test 6: Re-Enter Building

1. **Approach door again**: Walk up to Your Apartment door
2. **Press E**: Enter the building a second time
3. **Observe**: 
   - Transition works again (same as Test 3)
   - Interior state is consistent (furniture in same positions)
   - No errors on second entry
4. **Exit again**: Press E inside to exit
5. **Check console**: Verify no errors on repeated enter/exit cycles

**Evidence**: 
- Screenshot of second interior visit
- Console log showing multiple enter/exit events without errors

### Test 7: Edge Cases

1. **Attempt to enter from far away**: 
   - Stand 10+ units from door
   - Press E
   - **Expected**: Nothing happens (out of range)
2. **Walk away mid-approach**: 
   - Approach door, get prompt
   - Walk away before pressing E
   - **Expected**: Prompt disappears, no stuck state
3. **Press E rapidly**: 
   - Stand at door, press E 5 times quickly
   - **Expected**: Only one transition, no duplicate enters or errors
4. **Check console**: Verify no errors during edge case tests

**Evidence**: Console log showing edge case handling (or lack of errors)

## Expected Behavior

### Proximity Detection
- **Within range** (3-5 units): Prompt appears, E key is active
- **Out of range**: No prompt, E key does nothing
- **Smooth detection**: Prompt appears/disappears as player crosses threshold

### Enter Transition
- **E key press**: Initiates transition
- **Scene change**: Exterior hides/unloads, interior loads/shows
- **Camera update**: Player spawns at interior entry point
- **No errors**: Console shows no errors during transition
- **Consistent state**: Interior looks the same on every entry

### Interior Navigation
- **Full movement**: WASD works inside, player can reach all areas
- **Wall collision**: Player cannot walk through walls
- **Camera freedom**: Mouse look works, no clipping through geometry
- **Lighting**: Interior lighting is warmer/different from exterior

### Exit Transition
- **E key press inside**: Initiates exit transition
- **Scene change**: Interior hides/unloads, exterior loads/shows
- **Camera update**: Player spawns outside near door
- **No errors**: Console shows no errors during exit
- **Consistent state**: Exterior scene looks the same as before entry

### Repeated Entry/Exit
- **Multiple cycles**: Can enter and exit repeatedly without issues
- **State consistency**: Each enter/exit behaves the same
- **No memory leaks**: Performance doesn't degrade after multiple cycles

## Evidence to Collect

Save to `artifacts/verify-dev-tycoon/enter-home/`:

1. **`approach-door.png`**: Screenshot at door threshold (outside, before entering)
2. **`inside-apartment.png`**: Screenshot of interior (showing furniture and layout)
3. **`desk-area.png`**: Screenshot from desk area inside apartment
4. **`exit-successful.png`**: Screenshot outside after exiting
5. **`console-log.txt`**: Browser console output including:
   - Proximity detection messages
   - Enter event logs
   - Exit event logs
   - Any errors (red) or warnings (yellow)
   - Scene load/unload messages

## Pass Criteria

✅ **Pass** if:
- Can approach Your Apartment door and see prompt
- Pressing E enters the building smoothly
- Interior scene renders correctly (furniture, walls, lighting)
- Can move around inside with WASD
- Pressing E inside exits the building smoothly
- Exterior scene restores correctly after exit
- Can enter and exit multiple times without errors
- No console errors during any transition

⚠️ **Pass with Notes** if:
- Minor visual glitches during transition (brief flicker, z-fighting)
- Prompt doesn't appear but E key still works
- Interior lighting slightly off but still visibly different from exterior
- Console warnings (not errors) about scene state

❌ **Fail** if:
- Cannot enter building (E key has no effect)
- Console errors during enter transition
- Interior doesn't render (black screen, missing geometry)
- Cannot move inside or camera is stuck
- Cannot exit building (stuck inside)
- Console errors during exit transition
- Exterior doesn't restore (black screen after exit)
- Repeated entry/exit causes errors or crashes

## Common Issues

### Issue: Can't enter building (E key does nothing)
- **Symptom**: Press E at door, no transition occurs
- **Diagnosis**: Check console for event listener errors or proximity detection logs
- **Fix**: Verify interaction range in `building.js`, check E key event listener
- **Code**: Review `building.js` proximity detection and enter method

### Issue: Interior is black or doesn't render
- **Symptom**: Enter transition works but interior scene is not visible
- **Diagnosis**: Check console for scene load errors, lighting errors
- **Fix**: Verify interior scene entities exist, check interior light sources
- **Code**: Review `home-interior.js` scene creation and lighting setup

### Issue: Can't exit building
- **Symptom**: Press E inside, no transition back to exterior
- **Diagnosis**: Check console for exit event errors
- **Fix**: Verify exit trigger exists inside, check E key event listener scope
- **Code**: Review `building.js` or `home-interior.js` exit method

### Issue: Exterior doesn't restore after exit
- **Symptom**: Exit building, but exterior scene is missing or broken
- **Diagnosis**: Check console for scene unload errors, entity disable errors
- **Fix**: Verify exterior scene entities are re-enabled on exit, not destroyed
- **Code**: Review `building.js` exit method, check entity enable/disable logic

### Issue: Player spawns in wrong location after enter/exit
- **Symptom**: Enter building, spawn inside wall; exit building, spawn far from door
- **Diagnosis**: Check spawn point coordinates in enter/exit methods
- **Fix**: Adjust spawn positions to be inside clear floor space (interior) or near door (exterior)
- **Code**: Review `building.js` enter/exit spawn point calculations

### Issue: Camera clips through walls inside
- **Symptom**: Move camera inside, can see through walls or outside the building
- **Diagnosis**: Collision detection missing or wall geometry has gaps
- **Fix**: Add wall collision detection or increase wall thickness
- **Code**: Review `home-interior.js` wall creation and collision setup

### Issue: Multiple enter/exit cycles cause errors
- **Symptom**: First enter/exit works, but second or third cycle fails or logs errors
- **Diagnosis**: Scene state not properly reset on each transition
- **Fix**: Ensure scene load/unload is idempotent, reset state on each transition
- **Code**: Review `building.js` enter/exit methods for state management bugs

---

**Duration**: ~5 minutes  
**Critical**: Yes - required for core gameplay loop  
**Dependencies**: Locomotion test must pass first  
**Next**: After passing, proceed to `minimap.md`

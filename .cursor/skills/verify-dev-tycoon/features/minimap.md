# Minimap Test

## Feature Overview

The minimap provides spatial awareness and navigation assistance:
- **District layout**: Shows the 9 districts of the city
- **Building markers**: Dots or icons representing buildings, colored by kind
- **Player position**: Marker showing player location and facing direction
- **Visual design**: Rounded panel in bottom-right corner, readable layout

This feature enhances navigation but is not gameplay-blocking. A broken minimap is annoying but doesn't prevent playing.

## Setup

1. **Complete locomotion test**: Ensure movement works
2. **Start server**: `python3 -m http.server 8000` from `/workspace`
3. **Open browser**: Navigate to `http://localhost:8000`
4. **Open DevTools**: F12 → Console tab
5. **Lock cursor**: Click canvas to enable mouse look

## Test Steps

### Test 1: Minimap Visibility

1. **Load game**: Wait for full scene load
2. **Check bottom-right corner**: Look for minimap panel
3. **Observe rendering**:
   - Rounded panel or rectangular with rounded corners
   - Clear background (solid color or semi-transparent)
   - Visible district boundaries or layout
   - Dots/icons for buildings
4. **Check console**: Look for minimap initialization logs or errors

**Evidence**: 
- Screenshot showing minimap in bottom-right corner
- Console log of minimap initialization

### Test 2: District Layout

1. **Examine minimap**: Focus on the district grid
2. **Count districts**: Should see 9 districts (3x3 grid per README)
3. **Check district boundaries**: 
   - Lines or color separation between districts
   - Clear visual distinction
4. **Identify districts** (if labeled):
   - Downtown (player spawn location)
   - Residential North, Residential South
   - Tech Hub, Industrial Zone
   - Startup Alley, Corporate Park
   - Creative Quarter, Dev District
5. **Check console**: Look for district data logs

**Evidence**: 
- Screenshot of minimap showing full district layout
- Console log of district registration (if available)

### Test 3: Building Markers

1. **Examine building dots/icons**: 
   - Look for colored dots on minimap
   - Each dot represents one building
2. **Check building kinds** (by color):
   - **Home** (Your Apartment): One color/icon
   - **Cafe** (The Bean Café): Different color/icon
   - **Cowork** (Hub Cowork): Different color/icon
   - Other building types should have distinct colors
3. **Count buildings**: 
   - Downtown should have at least 3 buildings (home, cafe, cowork per README)
   - Other districts should have placeholder buildings
4. **Check marker size**: Dots should be visible but not overlapping excessively

**Evidence**: 
- Screenshot showing building markers with distinct colors
- Console log of building registration on minimap

### Test 4: Player Position Marker

1. **Locate player marker**: Look for a distinct marker on minimap (different from building dots)
2. **Check marker design**:
   - Should be more prominent than building dots
   - May be a different shape (arrow, circle with pointer, etc.)
   - Should indicate facing direction if possible
3. **Verify position accuracy**:
   - Player marker should be in Downtown district (spawn location)
   - Marker position on minimap should roughly match player position in world
4. **Check console**: Look for player position update logs

**Evidence**: 
- Screenshot with player marker clearly visible
- Console log showing player position updates

### Test 5: Player Movement Tracking

1. **Lock cursor** and **press W**: Walk forward for 5 seconds
2. **Observe minimap**: Player marker should move on minimap
3. **Verify direction**: 
   - Marker moves in the direction player is walking
   - Movement on minimap matches movement in world
4. **Walk to different district**: 
   - Navigate to a neighboring district (e.g., Residential North)
   - Check if marker crosses district boundary on minimap
5. **Strafe and move backward**: 
   - Press A (left), observe marker move left
   - Press S (backward), observe marker move backward
6. **Check console**: Look for position update logs, no errors

**Evidence**: 
- Screenshot after moving to a new location (marker in different position)
- Console log showing position tracking

### Test 6: Facing Direction Indicator

1. **Stand still** (release all keys)
2. **Rotate camera left** (move mouse left): 
   - Observe player marker on minimap
   - If marker has a facing indicator (arrow, pointer), it should rotate
3. **Rotate camera right**: Facing indicator should rotate right
4. **Do a 360-degree turn**: Facing indicator should rotate smoothly
5. **Check console**: Look for rotation update logs

**Evidence**: 
- Screenshot showing facing indicator (if present)
- Console log of rotation updates (if logged)

**Note**: If the marker is just a dot with no facing indicator, this test is not applicable. Document in notes.

### Test 7: Minimap Clarity and Readability

1. **Check visual hierarchy**:
   - Player marker stands out from building dots
   - District boundaries are clear
   - Colors are distinct and readable
2. **Check scale**:
   - Minimap shows enough area to be useful (at least current district + neighbors)
   - Not too zoomed in (can't see surroundings) or too zoomed out (too small to read)
3. **Check UI placement**:
   - Bottom-right corner, doesn't obscure critical game view
   - Size is reasonable (not too large or too small)
4. **Check text labels** (if present):
   - District names or building names on minimap
   - Legible font size and color

**Evidence**: Screenshot showing overall minimap clarity and design

### Test 8: Performance

1. **Move continuously**: Walk around for 30 seconds with minimap visible
2. **Check framerate**: 
   - Open browser performance tools (F12 → Performance → Record)
   - Or observe visual smoothness
3. **Expected**: Minimap updates should not cause framerate drops
4. **Check console**: Look for excessive update logs or errors

**Evidence**: Console log showing no performance issues

## Expected Behavior

### Minimap Panel
- **Position**: Bottom-right corner of screen
- **Shape**: Rounded rectangle or rounded panel
- **Size**: Readable but not obstructive (~10-15% of screen width)
- **Background**: Solid or semi-transparent, contrasts with map content

### District Layout
- **9 districts visible**: 3x3 grid layout
- **Clear boundaries**: Visual separation between districts
- **Labeled or color-coded**: Can distinguish districts

### Building Markers
- **One dot/icon per building**: All buildings in view range are shown
- **Color-coded by kind**: Different colors for home, cafe, cowork, office, etc.
- **Readable**: Dots are visible and don't overlap excessively

### Player Marker
- **Distinct from buildings**: Different shape, size, or color
- **Position accuracy**: Marker position on minimap matches player world position
- **Facing direction**: Marker shows facing direction (optional but recommended)
- **Updates in real-time**: Marker moves as player moves

### Performance
- **No framerate impact**: Minimap updates don't cause stuttering or FPS drops
- **Efficient updates**: Position updates only when player moves

## Evidence to Collect

Save to `artifacts/verify-dev-tycoon/minimap/`:

1. **`minimap-overview.png`**: Screenshot showing full minimap with all elements (districts, buildings, player marker)
2. **`player-marker.png`**: Close-up screenshot highlighting player marker
3. **`district-colors.png`**: Screenshot showing building dots color-coded by kind
4. **`movement-tracking.png`**: Screenshot after moving to a different location (marker in new position)
5. **`console-log.txt`**: Browser console output including:
   - Minimap initialization messages
   - District/building registration logs
   - Player position update logs (if verbose, copy a sample)
   - Any errors (red) or warnings (yellow)

## Pass Criteria

✅ **Pass** if:
- Minimap panel is visible in bottom-right corner
- Districts are laid out and visually separated
- Building markers are present and color-coded by kind
- Player marker is visible and distinct from building dots
- Player marker updates position as player moves
- Minimap is readable and doesn't obstruct gameplay
- No console errors related to minimap rendering
- No performance impact from minimap updates

⚠️ **Pass with Notes** if:
- Minimap is functional but visual design could be improved
- Facing direction indicator missing (just a dot, no arrow)
- Some building colors are similar but still distinguishable
- Console warnings (not errors) about minimap updates
- Minor visual glitches (e.g., marker flickers occasionally)

❌ **Fail** if:
- Minimap doesn't appear or is invisible
- Console errors during minimap initialization
- Player marker missing or not visible
- Player marker doesn't update when player moves
- Building markers missing or all the same color
- Minimap is unreadable (too small, colors blend, etc.)
- Minimap causes framerate drops or stuttering

## Common Issues

### Issue: Minimap doesn't appear
- **Symptom**: Bottom-right corner is empty, no minimap panel
- **Diagnosis**: Check console for minimap.js load errors or initialization errors
- **Fix**: Verify `minimap.js` is loaded in `index.html`, check `app.root.findByName('Minimap')` or similar
- **Code**: Review `minimap.js` initialization and UI entity creation

### Issue: Player marker missing
- **Symptom**: Minimap shows districts and buildings but no player marker
- **Diagnosis**: Check console for player marker creation errors
- **Fix**: Verify player marker entity is created and added to minimap UI
- **Code**: Review `minimap.js` player marker creation and update loop

### Issue: Player marker doesn't move
- **Symptom**: Marker is visible but stays in same position when player moves
- **Diagnosis**: Check console for position update logs or errors
- **Fix**: Verify minimap update loop is running and reading player position correctly
- **Code**: Review `minimap.js` update method, check player position tracking

### Issue: Building markers all the same color
- **Symptom**: All building dots are the same color, can't distinguish kinds
- **Diagnosis**: Check building kind registration in minimap code
- **Fix**: Verify building kind is passed to minimap and mapped to correct color
- **Code**: Review `minimap.js` building marker creation, check color mapping logic

### Issue: Minimap is too small or too large
- **Symptom**: Minimap is unreadable (too small) or obstructs view (too large)
- **Diagnosis**: Check minimap panel size settings
- **Fix**: Adjust minimap panel width/height in minimap.js or config.js
- **Code**: Review `minimap.js` panel creation, look for size constants

### Issue: Districts not visible or boundaries unclear
- **Symptom**: Minimap shows buildings but no district layout or separation
- **Diagnosis**: Check district rendering logic
- **Fix**: Add district boundary lines or background colors to distinguish districts
- **Code**: Review `minimap.js` district rendering, add boundary drawing if missing

### Issue: Minimap causes framerate drops
- **Symptom**: FPS drops when minimap is visible or updating
- **Diagnosis**: Check browser performance tools, look for excessive minimap update calls
- **Fix**: Throttle minimap updates (e.g., update every 100ms instead of every frame)
- **Code**: Review `minimap.js` update loop, add throttling or optimization

### Issue: Facing direction indicator doesn't rotate
- **Symptom**: Player marker has an arrow/pointer but it doesn't rotate with camera
- **Diagnosis**: Check player rotation tracking in minimap code
- **Fix**: Pass player camera rotation (yaw) to minimap update method
- **Code**: Review `minimap.js` player marker rotation, check camera rotation input

---

**Duration**: ~5 minutes  
**Critical**: Medium - enhances navigation but not gameplay-blocking  
**Dependencies**: Locomotion test should pass (to test movement tracking)  
**Next**: After passing, proceed to `day-night.md`

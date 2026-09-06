# Day/Night Cycle Test

## Feature Overview

The day/night cycle provides dynamic lighting and atmosphere:
- **Dynamic sun position**: Directional light rotates to simulate sun movement
- **Color temperature**: Warm daylight key + cool fill light
- **Shadows**: Sun casts shadows that rotate with sun position
- **Ambient lighting**: Background lighting adjusts for day/night
- **Visual progression**: Smooth transitions from day → dusk → night → dawn → day

This feature enhances visual quality and atmosphere but is not gameplay-blocking. A broken lighting system affects aesthetics but doesn't prevent playing.

## Setup

1. **Start server**: `python3 -m http.server 8000` from `/workspace`
2. **Open browser**: Navigate to `http://localhost:8000`
3. **Open DevTools**: F12 → Console tab
4. **Lock cursor**: Click canvas to enable mouse look
5. **Position camera**: Look at buildings to observe shadows

**Time requirement**: This test requires ~10 minutes to observe a full lighting cycle or significant portion.

## Test Steps

### Test 1: Initial Lighting State

1. **Load game**: Wait for full scene load
2. **Observe initial lighting**:
   - Sky color (blue for day, orange/red for dusk, dark for night)
   - Sun position (directional light angle)
   - Shadow direction (shadows cast by buildings)
   - Overall scene brightness
3. **Check console**: Look for lighting-system.js initialization logs

**Evidence**: 
- Screenshot of initial lighting state
- Console log showing lighting system init

### Test 2: Sun Position and Direction

1. **Locate the sun**: 
   - Look up at the sky (tilt camera upward)
   - Identify light source direction (where light is coming from)
2. **Observe shadow direction**:
   - Look at building shadows on the ground
   - Shadows point away from sun
3. **Wait 2-3 minutes**: Let time progress
4. **Observe sun movement**:
   - Sun position should change (rotate across sky)
   - Shadow direction should rotate accordingly
5. **Check console**: Look for sun position update logs (if any)

**Evidence**: 
- Screenshot at time T=0 showing sun position and shadows
- Screenshot at time T=3min showing changed sun position and shadows
- Console log of sun rotation updates

### Test 3: Daylight Phase

1. **Identify daylight phase**: 
   - Sky is blue or light blue
   - Scene is bright, colors are vibrant
   - Shadows are clearly visible
2. **Check light colors**:
   - Primary light (sun) is warm (yellowish or white)
   - Fill light (if visible) is cooler (blueish)
3. **Observe scene visibility**: All buildings and details are clearly visible
4. **Check console**: Look for "daylight" or "day" phase logs

**Evidence**: 
- Screenshot of daylight phase (bright scene, clear shadows)
- Console log showing day phase

### Test 4: Dusk Phase

1. **Wait for dusk transition**: 
   - Sky color shifts to orange, red, or purple
   - Scene brightness decreases slightly
   - Shadows become longer (sun near horizon)
2. **Observe transition smoothness**: 
   - No sudden jumps in lighting
   - Gradual color temperature shift
3. **Check light intensity**: 
   - Dimmer than daylight but not dark
4. **Check console**: Look for "dusk" or "sunset" phase logs

**Evidence**: 
- Screenshot of dusk phase (orange/red sky, long shadows)
- Console log showing dusk phase

### Test 5: Night Phase

1. **Wait for night transition**: 
   - Sky becomes dark blue or black
   - Scene is dim, ambient lighting dominates
   - Shadows are very faint or invisible
2. **Observe ambient light**: 
   - Scene should still be visible (not pitch black)
   - Buildings and ground are lit by ambient/fill light
3. **Check visual quality**: 
   - Can still navigate (not too dark to play)
   - Colors are muted but distinguishable
4. **Check console**: Look for "night" phase logs

**Evidence**: 
- Screenshot of night phase (dark sky, dim scene, visible structures)
- Console log showing night phase

### Test 6: Dawn Phase (Optional)

1. **Wait for dawn transition**: 
   - Sky begins to lighten (dark → blue gradient)
   - Sun rises (light comes from opposite direction than sunset)
   - Shadows reappear and lengthen
2. **Observe transition back to day**: 
   - Cycle returns to daylight phase
3. **Check console**: Look for "dawn" or "sunrise" phase logs

**Evidence**: 
- Screenshot of dawn phase (if time permits)
- Console log showing dawn phase

**Note**: If time is limited, skip this test. The transition from day → dusk → night is sufficient.

### Test 7: Shadow Quality

1. **During daylight**: Stand near a building
2. **Observe shadow details**:
   - Shadows are cast under buildings (soft AO-style shadows per README)
   - Shadow edges are reasonably smooth (not too jagged)
   - Shadows move as sun moves
3. **Check shadow resolution**: 
   - Look for pixelation or low-res artifacts
   - Shadows should be 2048 resolution per README
4. **Check console**: Look for shadow rendering errors

**Evidence**: 
- Screenshot showing building shadows with clear edges
- Console log of shadow setup (if logged)

### Test 8: Lighting Performance

1. **Move around during different phases**: Walk through city for 1 minute
2. **Observe framerate**: 
   - Should remain 30+ FPS during lighting updates
   - No stuttering when sun position changes
3. **Check console performance**: 
   - Look for excessive lighting update logs
   - Check for rendering errors during transitions
4. **Browser performance tools**: 
   - F12 → Performance → Record for 30 seconds
   - Check for lighting system bottlenecks

**Evidence**: 
- Console log showing no performance issues
- Note framerate observations in VERIFICATION.md

### Test 9: Interior vs Exterior Lighting

1. **Enter Your Apartment**: Follow enter-home test to go inside
2. **Observe interior lighting**:
   - Should be warmer than exterior (per README)
   - Interior has point lights or different ambient light
   - Interior lighting should be independent of time of day (constant brightness)
3. **Exit apartment**: Return to exterior
4. **Observe exterior lighting**: Should match current time of day phase

**Evidence**: 
- Screenshot of interior lighting (warm, constant)
- Screenshot of exterior lighting (changes with time of day)

### Test 10: Lighting Cycle Timing

1. **Measure cycle duration**: 
   - Note start time (e.g., daylight phase)
   - Wait for full cycle (day → dusk → night → dawn → day)
   - Note end time
2. **Calculate cycle length**: 
   - Expected: 5-10 minutes for a full cycle (estimate)
   - Actual: [measure and document]
3. **Check consistency**: 
   - Cycle should loop smoothly (no pause at end)
   - Transitions should be evenly paced

**Evidence**: 
- Console log with timestamps showing phase transitions
- Note cycle timing in VERIFICATION.md

**Note**: If cycle is too long (20+ minutes), measure a partial cycle (day → night) and extrapolate.

## Expected Behavior

### Sun Position
- **Rotates continuously**: Sun position changes over time
- **Smooth movement**: No sudden jumps or teleports
- **Full rotation**: Cycles from sunrise → zenith → sunset → below horizon → sunrise

### Light Color
- **Day**: Warm white or yellow sun, cool blue fill light
- **Dusk**: Orange/red sun, darkening sky
- **Night**: Very dim or no sun, cool ambient light
- **Dawn**: Lightening sky, warm sun reappearing

### Shadows
- **Cast by sun**: Buildings cast shadows from directional light
- **Rotate with sun**: Shadow direction changes as sun moves
- **Smooth edges**: Shadows are not excessively jagged
- **Visible during day**: Shadows are clear in daylight, faint at dusk/dawn, invisible at night

### Scene Brightness
- **Day**: Bright, high visibility
- **Dusk**: Medium brightness, warm colors
- **Night**: Dim but still navigable
- **Smooth transitions**: No sudden brightness jumps

### Performance
- **No framerate impact**: Lighting updates don't cause stuttering
- **Efficient updates**: Sun position and colors update smoothly

## Evidence to Collect

Save to `artifacts/verify-dev-tycoon/day-night/`:

1. **`daylight.png`**: Screenshot during daylight phase (bright, clear shadows)
2. **`dusk.png`**: Screenshot during dusk phase (orange sky, long shadows)
3. **`night.png`**: Screenshot during night phase (dark sky, dim scene)
4. **`dawn.png`**: Screenshot during dawn phase (optional, if observed)
5. **`shadows-detail.png`**: Close-up screenshot showing shadow quality
6. **`interior-lighting.png`**: Screenshot inside apartment showing warm lighting
7. **`console-log.txt`**: Browser console output including:
   - Lighting system initialization
   - Phase transition logs (day → dusk → night)
   - Sun position/rotation updates (if logged)
   - Any errors (red) or warnings (yellow)

## Pass Criteria

✅ **Pass** if:
- Sun position rotates over time
- Shadows cast by buildings and rotate with sun
- Day/dusk/night phases are visibly distinct
- Light color changes (warm day, cool night)
- Transitions are smooth (no sudden jumps)
- Scene is navigable during all phases (not too dark)
- No console errors related to lighting
- No framerate drops during lighting updates

⚠️ **Pass with Notes** if:
- Lighting cycle works but timing is off (too fast or too slow)
- Minor shadow artifacts (slight pixelation, Z-fighting)
- Color temperature shifts are subtle but present
- Console warnings (not errors) about lighting updates
- Dawn phase missing or not distinct from day

❌ **Fail** if:
- Sun doesn't move (static lighting)
- No shadows or shadows don't rotate
- Day/night phases are identical (no color change)
- Console errors during lighting updates
- Scene is too dark to navigate at night
- Lighting causes framerate drops or stuttering
- Sudden jumps in brightness or sun position

## Common Issues

### Issue: Sun doesn't move
- **Symptom**: Sun position stays fixed, shadows don't rotate
- **Diagnosis**: Check console for lighting-system.js update errors
- **Fix**: Verify lighting system update loop is running and rotating directional light
- **Code**: Review `lighting-system.js` update method, check sun rotation logic

### Issue: No shadows visible
- **Symptom**: Buildings don't cast shadows or shadows are invisible
- **Diagnosis**: Check shadow settings on directional light
- **Fix**: Ensure directional light has `castShadows: true` and shadow resolution is set
- **Code**: Review `lighting-system.js` light creation, check shadow map settings

### Issue: Lighting doesn't change (always day or always night)
- **Symptom**: Sky color, brightness, and sun position don't change over time
- **Diagnosis**: Check if lighting cycle time progression is working
- **Fix**: Verify time variable increments in update loop, check phase transition logic
- **Code**: Review `lighting-system.js` time progression and phase calculation

### Issue: Sudden lighting jumps
- **Symptom**: Light color or sun position jumps abruptly instead of smooth transition
- **Diagnosis**: Check interpolation or delta-time calculation
- **Fix**: Use smooth interpolation for sun rotation and color changes
- **Code**: Review `lighting-system.js` update method, add interpolation if missing

### Issue: Too dark at night (unplayable)
- **Symptom**: Night phase is pitch black, can't see anything
- **Diagnosis**: Check ambient light intensity at night
- **Fix**: Increase ambient light level or add fill light during night phase
- **Code**: Review `lighting-system.js` night phase setup, increase ambient intensity

### Issue: Shadows are jagged or pixelated
- **Symptom**: Shadow edges are blocky or have aliasing artifacts
- **Diagnosis**: Check shadow map resolution setting
- **Fix**: Increase shadow resolution (e.g., from 1024 to 2048 per README)
- **Code**: Review `lighting-system.js` shadow map resolution, increase if too low

### Issue: Lighting cycle too fast or too slow
- **Symptom**: Full day/night cycle completes in <2 minutes (too fast) or >20 minutes (too slow)
- **Diagnosis**: Check cycle duration constant
- **Fix**: Adjust cycle time constant to reasonable duration (5-10 minutes)
- **Code**: Review `lighting-system.js` time progression rate, adjust multiplier

### Issue: Interior lighting changes with time of day
- **Symptom**: Inside apartment, lighting gets darker at night
- **Diagnosis**: Interior lights are affected by global lighting system
- **Fix**: Separate interior lighting from exterior; use point lights in interior
- **Code**: Review `home-interior.js` lighting setup, ensure interior lights are independent

---

**Duration**: ~10 minutes (to observe significant cycle portion)  
**Critical**: Low - visual quality feature but not gameplay-blocking  
**Dependencies**: None (can test independently)  
**Next**: After all feature tests pass, compile VERIFICATION.md

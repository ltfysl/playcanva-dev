# Feature Test Procedures

This directory contains detailed manual test procedures for Dev Tycoon's core gameplay features.

## Test Structure

Each feature test file follows this structure:

1. **Feature Overview**: What this feature does
2. **Setup**: Prerequisites and initial state
3. **Test Steps**: Specific actions to perform
4. **Expected Behavior**: What should happen at each step
5. **Evidence to Collect**: Screenshots, logs, measurements to capture
6. **Pass Criteria**: When to mark the test as passing
7. **Common Issues**: Known problems and how to diagnose them

## Available Tests

### Core Gameplay

- **`locomotion.md`**: Player movement, camera, sprint, cursor lock
  - **When to run**: Changes to `player-controller.js`, camera logic, input handling
  - **Time**: ~5 minutes
  - **Critical**: Yes - blocks player from exploring the world

- **`enter-home.md`**: Building interaction and interior transitions
  - **When to run**: Changes to `building.js`, `home-interior.js`, proximity detection
  - **Time**: ~5 minutes
  - **Critical**: Yes - core gameplay loop requires building entry

### UI Systems

- **`minimap.md`**: Minimap rendering, player position, district visualization
  - **When to run**: Changes to `minimap.js`, district layout, camera tracking
  - **Time**: ~5 minutes
  - **Critical**: Medium - navigation aid but not blocking

### Environmental Systems

- **`day-night.md`**: Lighting cycle, shadows, color temperature
  - **When to run**: Changes to `lighting-system.js`, directional light, shadow settings
  - **Time**: ~10 minutes (need to observe time progression)
  - **Critical**: Low - visual quality but not gameplay-blocking

## Running Tests

### Run All Features (Complete Verification)

Use this for major refactors, engine upgrades, or pre-release checks:

```bash
# 1. Start server
cd /workspace
python3 -m http.server 8000

# 2. Open http://localhost:8000 in browser

# 3. Execute each test in order:
# - locomotion.md
# - enter-home.md
# - minimap.md
# - day-night.md

# 4. Collect evidence for all features

# 5. Document results in artifacts/verify-dev-tycoon/VERIFICATION.md
```

**Total time**: ~25 minutes

### Run Targeted Features (PR-Specific)

Use this for focused changes:

```bash
# Example: PR changes player-controller.js
# → Run locomotion.md only

# Example: PR changes minimap.js and lighting-system.js
# → Run minimap.md and day-night.md

# Example: PR changes building.js
# → Run enter-home.md
```

## Evidence Requirements

Each test specifies what evidence to collect. General guidelines:

### Screenshots (PNG, 1920x1080+)
- Clear view of the tested feature
- Include relevant UI elements
- Show browser console if checking for errors
- Use descriptive filenames: `feature-test-step.png`

### Console Logs (TXT)
- Copy from browser DevTools (F12 → Console)
- Include timestamps if available
- Capture errors (red), warnings (yellow), and relevant info logs
- Name files: `feature-console-log.txt`

### Measurements (TXT or JSON)
- Performance metrics (FPS, frame time)
- Position coordinates from console logs
- Timing measurements (e.g., day/night cycle duration)
- Name files: `feature-measurements.txt`

## Pass/Fail Criteria

### ✅ Pass
- All test steps executed successfully
- Expected behavior observed at each step
- No console errors related to the feature
- Performance within acceptable range (30+ FPS on target hardware)

### ⚠️ Pass with Notes
- Test steps executed successfully
- Minor visual glitches that don't block gameplay
- Console warnings (not errors) that don't affect functionality
- Performance acceptable but could be optimized

### ❌ Fail
- Test steps cannot be completed
- Expected behavior not observed
- Console errors that block functionality
- Game crashes or becomes unresponsive
- Performance below minimum threshold (<30 FPS)

## Troubleshooting

### Game Won't Load
1. Check browser console for errors
2. Verify `index.html` loads correctly
3. Check PlayCanvas CDN is reachable
4. Try a different browser (Chrome/Edge recommended)

### Feature Doesn't Work
1. Check the feature's source file for syntax errors: `node -c src/path/to/file.js`
2. Look for console errors specific to that feature
3. Verify dependencies are loaded (check Network tab)
4. Try a hard refresh (Ctrl+Shift+R)

### Poor Performance
1. Check browser hardware acceleration is enabled
2. Close other tabs and applications
3. Try a different browser
4. Check console for excessive logging

### Screenshots Too Large
1. Use PNG compression tools
2. Crop to relevant area (game canvas + console)
3. Max size: 5MB per screenshot

## Adding New Feature Tests

When adding new gameplay features, create a new test file:

```markdown
# Feature Name

## Feature Overview
[What this feature does]

## Setup
[Prerequisites and initial state]

## Test Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
- Step 1: [Expected result]
- Step 2: [Expected result]
- Step 3: [Expected result]

## Evidence to Collect
- Screenshot: [What to capture]
- Console log: [What to check for]
- Measurements: [What to measure]

## Pass Criteria
[When to mark as passing]

## Common Issues
- Issue 1: [Description and fix]
- Issue 2: [Description and fix]
```

Save to `features/feature-name.md` and update this README's index.

---

**Next**: Read a specific feature test file and execute its procedures.

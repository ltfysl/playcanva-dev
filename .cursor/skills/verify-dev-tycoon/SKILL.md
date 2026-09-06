---
description: Manual verification workflow for Dev Tycoon runtime changes
globs: ["**/*"]
alwaysApply: false
---

# Verify Dev Tycoon

**Use this skill when runtime code changes need verification before merging.**

This skill provides manual testing procedures for Dev Tycoon's core gameplay features. PRs that modify gameplay, rendering, or player interaction MUST include verification evidence in `artifacts/verify-dev-tycoon/`.

## When to Use

Run this skill when:
- Player locomotion code changes (movement, camera, sprint, cursor lock)
- Building interaction changes (enter/exit, proximity detection)
- Minimap rendering or player position tracking changes
- Day/night cycle or lighting system changes
- Any change that affects runtime behavior visible to players

## Verification Workflow

### 1. Pre-Flight Doctor Check

Before manual testing, verify the codebase is ready:

```bash
cd /workspace

# Check critical files exist
test -f index.html && echo "✓ index.html"
test -f src/core/game-manager.js && echo "✓ game-manager.js"
test -f src/player/player-controller.js && echo "✓ player-controller.js"
test -f src/city/city-generator.js && echo "✓ city-generator.js"
test -f src/ui/minimap.js && echo "✓ minimap.js"
test -f src/systems/lighting-system.js && echo "✓ lighting-system.js"

# Check for syntax errors in changed files
# (Add specific file checks based on PR changes)
node -c src/core/game-manager.js 2>&1 && echo "✓ Syntax OK" || echo "✗ Syntax error"
```

### 2. Launch Local Server

```bash
cd /workspace
python3 -m http.server 8000
```

Keep this running in a dedicated terminal. The game will be available at `http://localhost:8000`.

### 3. Run Feature Tests

Execute feature-specific tests from the `features/` directory:

- **Locomotion**: `features/locomotion.md` - WASD movement, mouse look, sprint, cursor lock
- **Enter Home**: `features/enter-home.md` - Approach apartment, enter with E, exit with E
- **Minimap**: `features/minimap.md` - District layout, building dots, player indicator
- **Day/Night**: `features/day-night.md` - Lighting cycle, shadow behavior, color temperature

Each feature file contains:
- **Setup**: What to do before testing
- **Steps**: Specific actions to perform
- **Expected**: What should happen
- **Evidence**: What to capture (screenshots, console logs, measurements)

### 4. Collect Evidence

Save verification artifacts to `artifacts/verify-dev-tycoon/<feature-name>/`:

```
artifacts/verify-dev-tycoon/
├── locomotion/
│   ├── movement-test.png
│   ├── sprint-test.png
│   └── console-log.txt
├── enter-home/
│   ├── approach-door.png
│   ├── inside-apartment.png
│   └── exit-successful.png
├── minimap/
│   ├── minimap-overview.png
│   ├── player-marker.png
│   └── district-colors.png
└── day-night/
    ├── daylight.png
    ├── dusk.png
    ├── night.png
    └── console-log.txt
```

**Screenshot Guidelines**:
- PNG format, 1920x1080 or higher
- Capture the game canvas plus browser console if relevant
- Include timestamp in console or filename
- Show player position, UI elements, and relevant scene state

**Console Log Guidelines**:
- Copy the browser console output (F12 → Console)
- Include warnings and errors (red/yellow text)
- Include relevant info logs from game systems
- Save as `.txt` with feature name

### 5. Document Results

After completing feature tests, create `artifacts/verify-dev-tycoon/VERIFICATION.md`:

```markdown
# Verification Results - [PR Title or Feature Name]

**Date**: YYYY-MM-DD
**Agent/Tester**: [Agent ID or Name]
**Branch**: cursor/<branch-name>-0924
**Commit**: [short SHA]

## Features Tested

- [x] Locomotion
- [x] Enter Home
- [x] Minimap
- [x] Day/Night Cycle

## Results Summary

### Locomotion
- **Status**: ✅ Pass / ⚠️ Pass with notes / ❌ Fail
- **Notes**: [Any observations, issues, or edge cases]
- **Evidence**: `locomotion/movement-test.png`, `locomotion/console-log.txt`

### Enter Home
- **Status**: ✅ Pass / ⚠️ Pass with notes / ❌ Fail
- **Notes**: [Any observations]
- **Evidence**: `enter-home/approach-door.png`, `enter-home/inside-apartment.png`

### Minimap
- **Status**: ✅ Pass / ⚠️ Pass with notes / ❌ Fail
- **Notes**: [Any observations]
- **Evidence**: `minimap/minimap-overview.png`

### Day/Night Cycle
- **Status**: ✅ Pass / ⚠️ Pass with notes / ❌ Fail
- **Notes**: [Any observations]
- **Evidence**: `day-night/daylight.png`, `day-night/night.png`

## Issues Found

1. [Issue description - or "None"]
2. [Issue description]

## Recommendations

- [Recommendation for merge, additional testing, or fixes needed]
```

### 6. Cleanup

**DO NOT delete evidence artifacts.** These must persist in the PR for review.

Stop the local server (Ctrl+C) and clean up any temporary files:

```bash
# Stop python server (Ctrl+C in the terminal)

# Do NOT delete artifacts/verify-dev-tycoon/
# These must be committed to the PR

# Clean up any temp files if you created them
rm -f /tmp/dev-tycoon-*.log
```

### 7. Commit Evidence

Add the verification artifacts to the PR:

```bash
cd /workspace
git add artifacts/verify-dev-tycoon/
git commit -m "Add verification evidence for [feature name]"
git push
```

## Quality Gates

A PR with runtime changes **MUST** include:

1. ✅ **Doctor check passed** - All critical files present, no syntax errors
2. ✅ **Feature tests completed** - All relevant feature files executed
3. ✅ **Evidence collected** - Screenshots and logs saved to `artifacts/`
4. ✅ **Verification doc** - `VERIFICATION.md` documents results
5. ✅ **Evidence committed** - Artifacts pushed to the branch

**If any test fails**, document the failure in `VERIFICATION.md` and either:
- Fix the issue and re-verify
- Note the issue as "known limitation" if intentional
- Block the PR from merging until resolved

## Notes

- **No CI/CD**: This is a manual testing workflow. No GitHub Actions or automated checks.
- **Agent-Driven**: Cloud agents should execute this skill when instructed or when making runtime changes.
- **Evidence is Required**: PRs without verification evidence may be rejected.
- **Feature Coverage**: Only test features affected by the PR changes (or all features for large refactors).

## Feature Test Index

| Feature | File | Focus |
|---------|------|-------|
| **Locomotion** | `features/locomotion.md` | WASD, mouse look, sprint, cursor lock |
| **Enter Home** | `features/enter-home.md` | Building proximity, E to enter/exit |
| **Minimap** | `features/minimap.md` | District layout, player marker, building colors |
| **Day/Night** | `features/day-night.md` | Lighting cycle, shadows, color temperature |

---

**Next Steps**: Read the appropriate feature file(s) from `features/` and execute the test procedures.

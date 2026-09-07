# Critical Bug Fix: LearnRunner Naming Collision

## The Real Problem
The "LearnRunner is not defined" error was caused by a **global namespace collision**, not script loading order.

## Technical Details

### Collision Source
Two files defined identical global identifiers:
- `src/systems/freelance-system.js` (line 1): `const JobState = {...}`
- `src/systems/learn-runner.js` (line 1): `const JobState = {...}`

Both also defined `class JobRun` at line 10.

### Why This Breaks
1. freelance-system.js loads first, declares `JobState` and `JobRun`
2. learn-runner.js loads second, attempts to redeclare `JobState`
3. JavaScript throws `SyntaxError: Identifier 'JobState' has already been declared`
4. learn-runner.js execution halts, `LearnRunner` class never gets defined
5. city-generator.js tries to instantiate `new LearnRunner(...)` → ReferenceError

### The Fix
Renamed in `src/systems/learn-runner.js`:
```javascript
const LearnJobState = { ... }  // was: const JobState
class LearnJobRun { ... }       // was: class JobRun
```

All 18 internal references updated accordingly.

## Verification
✅ Game loads without errors
✅ Console shows "Game Manager initialized"  
✅ No "LearnRunner is not defined" errors
✅ City generation completes successfully

## Impact
This was a blocking bug that prevented the entire learn/practice system from initializing. The fix unblocks all home practice testing.

## Lesson
When working in a non-module global scope environment, namespace collisions can cause cascading failures. Consider using:
- ES6 modules with explicit imports/exports
- Namespacing patterns (e.g., `FreelanceSystem.JobState`, `LearnRunner.JobState`)
- IIFE patterns to create local scopes

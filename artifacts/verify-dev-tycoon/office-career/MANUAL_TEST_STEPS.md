# Manual Test Instructions - Office Career Feature

## Quick Start

1. **Launch local server**:
   ```bash
   cd /workspace
   python3 -m http.server 8000
   ```

2. **Open in browser**: http://localhost:8000

3. **Click canvas** to lock cursor

## Test Scenario: Full Career Path

### Phase 1: Build Up XP (if starting fresh)

1. Navigate to **Your Apartment** (east from spawn)
2. Enter with E
3. Accept "Practice coding" when offered
4. Wait 20s for completion
5. Repeat 1-2 more times to get coding XP to 10+

6. Exit apartment, navigate to **The Bean Café** (southwest from spawn)
7. Enter with E
8. Accept "Quick bugfix" (+$50, +10 XP)
9. Wait 30s for completion
10. You should now have 15+ coding XP

### Phase 2: Test Office Career (Unlocked)

11. Exit café, navigate to **Downtown Office** (northwest from spawn, large gray building)
12. Approach door - you should see location indicator change to "Downtown Office"
13. Press **E** to enter
14. **VERIFY**: HUD shows `E — Accept: Fix production ticket (+$120)`
15. Press **E** to accept
16. **VERIFY**: HUD shows `Working…` or similar
17. Wait ~40 seconds
18. **VERIFY**: HUD shows `+$120 · +20 coding XP`
19. **VERIFY**: Console shows:
    - `Career job paid: 120 XP awarded: { skill: 'coding', amount: 20 } New balance: 120`

### Phase 3: Test One-Shot Behavior

20. Wait for HUD to clear (~1.5s after payout)
21. Press **E** to exit office
22. Press **E** to re-enter office
23. **VERIFY**: No HUD shown (job not repeatable)
24. Exit office

### Phase 4: Test Locked State (Optional - requires reset)

If you can reset skills or start fresh:

25. Start with < 15 coding XP
26. Enter office
27. **VERIFY**: HUD shows `Locked — coding XP n/15` where n is your current XP

## Console Verification

Open browser console (F12) and check for:

```
Downtown office created at Vec3(...)
Career job paid: 120 XP awarded: { skill: 'coding', amount: 20 } New balance: 120
```

## Common Issues

- **Office not visible**: Check you're in downtown, northwest quadrant
- **Door not working**: Get closer, look for "Downtown Office" in location indicator
- **HUD not showing**: Check console for errors
- **Job not completing**: Wait full 40s, or check console for errors

## Screenshots to Capture

1. Office exterior (before entering)
2. Office interior (desk + lighting)
3. HUD: Offer state (+$120)
4. HUD: Working state
5. HUD: Payout state (+$120 · +20 coding XP)
6. Re-enter: No offer (one-shot verified)

Save as PNG to: `artifacts/verify-dev-tycoon/office-career/`

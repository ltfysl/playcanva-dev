# Slice-11 Design Gate Verification

## Evidence

Three PlayCanvas screenshots at 1280×720 captured via automated Playwright harness:

1. **`locked-5-of-10.png`** — Locked chip: "Locked — design XP 5/10"
2. **`offer-unlocked.png`** — Unlocked offer: "E — Accept: Small feature patch (+$120)"
3. **`payout-flash.png`** — Payout flash: "+$120 · +15 coding XP"

## Normal Play Path

1. Start at home, design XP = 0
2. Complete "Practice design" at home (+5 design XP) → 5/10
3. Visit café → locked chip shows for 2s, then Quick bugfix offer (+$50)
4. Complete bugfix → +$50 · +10 coding XP
5. Exit and re-enter café → locked chip shows again (every entry), then bugfix offer (repeatable)
6. Complete "Practice design" again (+5 design XP) → 10/10
7. Visit café → "Small feature patch" offer at $120 (priority, no locked chip)
8. Complete → +$120 · +15 coding XP
9. Re-enter café → bugfix offered (feature is one-shot)

## Implementation

- **After PAID → back to IDLE**: Freelance runner resets `currentRun.state` to IDLE after payout, allowing immediate re-offer.
- **Repeatable flag**: `ActivitySlot.repeatable` (default false). cafe-bugfix-1 has `repeatable: true`.
- **Priority**: `ActivitySlot.offerPriority` (default 0). cafe-feature-1 has `offerPriority: 10`.
- **Data-driven locked chip**: Shows first unpaid slot with unlockRule (not hardcoded to cafe-feature-1).
- **2s timeout**: Locked chip displays for 2s, then offers next available gig. Timeout is cancelled on exit.
- **E key handling**: E press during locked chip (HUD state='locked') does nothing (stays in building).

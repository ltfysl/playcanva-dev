# Product MVP Verification - How to Reproduce

## Prerequisites
- Repository: https://github.com/ltfysl/playcanva-dev
- Branch: `cursor/product-runner-mvp-1-387c`
- Local dev server running

## Step-by-Step Reproduction

### 1. Start Local Server
```bash
cd /workspace
python3 -m http.server 8000
```

### 2. Open Game
- Navigate to: http://localhost:8000
- Wait for "Dev Tycoon - City Hub initialized" in console
- Click canvas to lock cursor

### 3. Navigate to Home
- Use WASD to move to the home building (starter apartment)
- Location: near (blockSize, 0, blockSize) - typically northeast quadrant
- Look for a building labeled "Your Apartment"
- Press E to enter when near

### 4. Initial State - Locked (Coding XP < 30)
**Expected HUD:**
```
Locked — coding XP 0/30
```
- HUD should update dynamically as XP increases
- Product slot `home-ship-mvp-1` is locked at this point

### 5. Gain Coding XP (Reach 30)
**Method A: Practice coding slot (home-practice-1)**
- Already in home interior
- If offered, press E to accept "Practice coding" (+5 coding XP)
- Wait ~20 seconds for completion
- Repeat 6 times to reach 30 XP (6 × 5 = 30)

**Method B: Console (faster for testing)**
```javascript
gameManager.skillsStub.addXp('coding', 30);
```

### 6. Trigger Product Offer
- Exit home (press E)
- Re-enter home (press E near building)
- HUD should now show:
```
E — Ship MVP (+$80)
```

### 7. Accept Product Job
- Press E to accept
- HUD immediately changes to:
```
Shipping…
```

### 8. Wait for Completion
- Duration: 50 seconds
- Job auto-completes on timer
- Payout displays:
```
+$80 · +15 coding XP · Side Project MVP live
```

### 9. Verify One-Shot Behavior
- Exit home (press E)
- Re-enter home (press E)
- `home-ship-mvp-1` should NOT be offered again
- Slot is permanently completed after first payout

### 10. Verify Product Registry
**Console check:**
```javascript
gameManager.productRegistry.get('mvp-1')
// Should return:
// { id: 'mvp-1', name: 'Side Project MVP', status: 'live', mrrStub: 10 }
```

## Expected HUD States (Exact Strings)

1. **Locked:** `Locked — coding XP n/30`
2. **Offer:** `E — Ship MVP (+$80)`
3. **In Progress:** `Shipping…`
4. **Payout:** `+$80 · +15 coding XP · Side Project MVP live`

## Success Criteria

- ✅ Unlock gate at coding XP ≥ 30
- ✅ Offer on home entry when unlocked and not paid
- ✅ "Shipping…" HUD during in-progress state
- ✅ Payout: $80 cash + 15 coding XP
- ✅ Product `mvp-1` set to `status: 'live'` in ProductRegistry
- ✅ One-shot: slot not re-offered after paid
- ✅ No interference with existing home-practice-1 slot

## Known Limitations

- MRR tick from live products not implemented (deferred)
- No Products panel UI (deferred)
- HUD screenshots pending - Pike will capture live @1280×720

## Test Coverage

Node logic test: `test-product-logic.js`
```bash
node test-product-logic.js
```
All 8 test cases pass ✅

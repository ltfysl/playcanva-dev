#!/bin/bash
# Mutation testing script for slice-11 design gate
# Tests that each mutation causes the expected test to fail

set -e

echo "=== Mutation Testing for Slice-11 Design Gate ==="
echo ""

# Save original files
cp src/systems/freelance-system.js src/systems/freelance-system.js.backup
cp src/city/city-generator.js src/city/city-generator.js.backup

restore_files() {
    mv src/systems/freelance-system.js.backup src/systems/freelance-system.js
    mv src/city/city-generator.js.backup src/city/city-generator.js
}

trap restore_files EXIT

echo "Mutation (a): Remove 'currentRun.state = IDLE' after payout"
echo "Expected: test-freelance-re-offer.js fails (Test 3c or re-offer logic)"
sed -i '/After payout, reset to IDLE/,+1d' src/systems/freelance-system.js
if node test-freelance-re-offer.js > /tmp/mutation-a.log 2>&1; then
    echo "❌ MUTATION (a) FAILED: Test should have failed but passed"
    cat /tmp/mutation-a.log
    exit 1
else
    echo "✅ MUTATION (a) PASSED: test-freelance-re-offer.js correctly failed"
    grep -A2 "Failed:" /tmp/mutation-a.log | head -3
fi
echo ""
git checkout src/systems/freelance-system.js

echo "Mutation (b): Change feature unlockRule from design to coding"
echo "Expected: test-slice-11-design-gate.js fails (gate logic broken)"
sed -i "s/unlockRule: { skill: 'design', minXp: 10 }/unlockRule: { skill: 'coding', minXp: 10 }/" src/city/city-generator.js
if node test-slice-11-design-gate.js > /tmp/mutation-b.log 2>&1; then
    echo "❌ MUTATION (b) FAILED: Test should have failed but passed"
    cat /tmp/mutation-b.log
    exit 1
else
    echo "✅ MUTATION (b) PASSED: test-slice-11-design-gate.js correctly failed"
    grep -A2 "Failed:" /tmp/mutation-b.log | head -3
fi
echo ""
git checkout src/city/city-generator.js

echo "Mutation (c): Set bugfix repeatable to false"
echo "Expected: test-freelance-re-offer.js fails (re-offer test breaks)"
sed -i "s/repeatable: true/repeatable: false/" src/city/city-generator.js
if node test-freelance-re-offer.js > /tmp/mutation-c.log 2>&1; then
    echo "❌ MUTATION (c) FAILED: Test should have failed but passed"
    cat /tmp/mutation-c.log
    exit 1
else
    echo "✅ MUTATION (c) PASSED: test-freelance-re-offer.js correctly failed"
    grep -A2 "Failed:" /tmp/mutation-c.log | head -3
fi
echo ""
git checkout src/city/city-generator.js

echo "Mutation (d): Change payout from 120 to 80"
echo "Expected: test-slice-11-design-gate.js fails (payout assertion)"
sed -i "s/payoutStub: { currency: 'cash', amount: 120 }/payoutStub: { currency: 'cash', amount: 80 }/" src/city/city-generator.js
if node test-slice-11-design-gate.js > /tmp/mutation-d.log 2>&1; then
    echo "❌ MUTATION (d) FAILED: Test should have failed but passed"
    cat /tmp/mutation-d.log
    exit 1
else
    echo "✅ MUTATION (d) PASSED: test-slice-11-design-gate.js correctly failed"
    grep -A2 "Failed:" /tmp/mutation-d.log | head -3
fi
echo ""
git checkout src/city/city-generator.js

echo "Mutation (e): Remove offerPriority sort"
echo "Expected: test-freelance-re-offer.js fails (priority test breaks)"
sed -i '/Sort by offerPriority/,/return 0;/d' src/systems/freelance-system.js
if node test-freelance-re-offer.js > /tmp/mutation-e.log 2>&1; then
    echo "❌ MUTATION (e) FAILED: Test should have failed but passed"
    cat /tmp/mutation-e.log
    exit 1
else
    echo "✅ MUTATION (e) PASSED: test-freelance-re-offer.js correctly failed"
    grep -A2 "Failed:" /tmp/mutation-e.log | head -3
fi
echo ""
git checkout src/systems/freelance-system.js

echo "Mutation (f): Change hasPendingLockedWindow() to return false"
echo "Expected: test-real-freelance-pending-window.js fails (method not working)"
sed -i 's/return !!this\.lockedChipTimeout;/return false;/' src/systems/freelance-system.js
if node test-real-freelance-pending-window.js > /tmp/mutation-f.log 2>&1; then
    echo "❌ MUTATION (f) FAILED: Test should have failed but passed"
    cat /tmp/mutation-f.log
    exit 1
else
    echo "✅ MUTATION (f) PASSED: test-real-freelance-pending-window.js correctly failed"
    grep -A2 "Failed:" /tmp/mutation-f.log | head -3
fi
echo ""
git checkout src/systems/freelance-system.js

echo "Mutation (g): Restore global locked guard (no hasPendingLockedWindow check)"
echo "Expected: test-e-key-locked-chip.js fails (office test breaks)"
cp src/core/game-manager.js src/core/game-manager.js.tmp
sed -i '/Don'\''t exit during timed locked chip window/,/if (this\.tryRunnerInteraction/c\
            // Don'\''t exit during locked chip display (wait for actual offer)\
            const hudState = this.solHUD ? this.solHUD.getCurrentState() : null;\
            if (hudState === '\''locked'\'') {\
                return;\
            }\
            \
            if (this.tryRunnerInteraction' src/core/game-manager.js
if node test-e-key-locked-chip.js > /tmp/mutation-g.log 2>&1; then
    echo "❌ MUTATION (g) FAILED: Test should have failed but passed"
    cat /tmp/mutation-g.log
    exit 1
else
    echo "✅ MUTATION (g) PASSED: test-e-key-locked-chip.js correctly failed"
    grep -A2 "Failed:" /tmp/mutation-g.log | head -3
fi
echo ""
mv src/core/game-manager.js.tmp src/core/game-manager.js

echo "Mutation (h): Remove locked guard entirely"
echo "Expected: test-real-freelance-pending-window.js fails (café test breaks)"
sed -i '/Don'\''t exit during timed locked chip window/,/}/d' src/core/game-manager.js
if node test-real-freelance-pending-window.js > /tmp/mutation-h.log 2>&1; then
    echo "❌ MUTATION (h) FAILED: Test should have failed but passed"
    cat /tmp/mutation-h.log
    exit 1
else
    echo "✅ MUTATION (h) PASSED: test-real-freelance-pending-window.js correctly failed"
    grep -A2 "Failed:" /tmp/mutation-h.log | head -3
fi
echo ""
git checkout src/core/game-manager.js

echo ""
echo "=== All Mutation Tests Passed ==="
echo "All 8 mutations correctly caused their expected tests to fail."

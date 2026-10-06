#!/bin/bash
# Mutation testing script for slice-11 design gate
# Tests that each mutation causes the expected test to fail with real assertion failures

set -e

echo "=== Mutation Testing for Slice-11 Design Gate ==="
echo ""

restore_files() {
    rm -f src/systems/freelance-system.js.backup
    rm -f src/city/city-generator.js.backup
    rm -f src/core/game-manager.js.backup
}

trap restore_files EXIT

abort_mutation() {
    echo "❌ MUTATION FAILED: $1"
    exit 1
}

# Mutation (a): Remove 'currentRun.state = IDLE' after payout
echo "Mutation (a): Remove 'currentRun.state = IDLE' after payout"
echo "Expected: test-freelance-re-offer.js fails with assertion failures"

# Check string exists
grep -q "After payout, reset to IDLE so next gig can be offered" src/systems/freelance-system.js || abort_mutation "(a) target string not found"

# Apply mutation
sed -i '/After payout, reset to IDLE/,+1d' src/systems/freelance-system.js

# Syntax check
node --check src/systems/freelance-system.js || abort_mutation "(a) produced invalid JS (SyntaxError)"

# Run test and check for assertion failures
if node test-freelance-re-offer.js > /tmp/mutation-a.log 2>&1; then
    abort_mutation "(a) test passed when it should have failed"
fi

# Verify real assertion failures (not just a crash)
if ! grep -q "Failed: [1-9]" /tmp/mutation-a.log; then
    abort_mutation "(a) no assertion failures detected"
fi

FAILED_A=$(grep "Failed:" /tmp/mutation-a.log | awk '{print $2}')
echo "  ✅ PASSED - node --check OK, $FAILED_A assertion failures"
echo ""
git checkout src/systems/freelance-system.js

# Mutation (b): Change feature unlockRule from design to coding
echo "Mutation (b): Change feature unlockRule from design to coding"
echo "Expected: test-slice-11-design-gate.js fails with assertion failures"

# Check string exists
grep -q "unlockRule: { skill: 'design', minXp: 10 }" src/city/city-generator.js || abort_mutation "(b) target string not found"

# Apply mutation
sed -i "s/unlockRule: { skill: 'design', minXp: 10 }/unlockRule: { skill: 'coding', minXp: 10 }/" src/city/city-generator.js

# Syntax check
node --check src/city/city-generator.js || abort_mutation "(b) produced invalid JS (SyntaxError)"

# Run test and check for assertion failures
if node test-slice-11-design-gate.js > /tmp/mutation-b.log 2>&1; then
    abort_mutation "(b) test passed when it should have failed"
fi

if ! grep -q "Failed: [1-9]" /tmp/mutation-b.log; then
    abort_mutation "(b) no assertion failures detected"
fi

FAILED_B=$(grep "Failed:" /tmp/mutation-b.log | awk '{print $2}')
echo "  ✅ PASSED - node --check OK, $FAILED_B assertion failures"
echo ""
git checkout src/city/city-generator.js

# Mutation (c): Set bugfix repeatable to false
echo "Mutation (c): Set bugfix repeatable to false"
echo "Expected: test-freelance-re-offer.js fails with assertion failures"

# Check string exists (in bugfix slot)
grep -q "repeatable: true" src/city/city-generator.js || abort_mutation "(c) target string not found"

# Apply mutation (only first occurrence - bugfix)
sed -i '0,/repeatable: true/s//repeatable: false/' src/city/city-generator.js

# Syntax check
node --check src/city/city-generator.js || abort_mutation "(c) produced invalid JS (SyntaxError)"

# Run test and check for assertion failures
if node test-freelance-re-offer.js > /tmp/mutation-c.log 2>&1; then
    abort_mutation "(c) test passed when it should have failed"
fi

if ! grep -q "Failed: [1-9]" /tmp/mutation-c.log; then
    abort_mutation "(c) no assertion failures detected"
fi

FAILED_C=$(grep "Failed:" /tmp/mutation-c.log | awk '{print $2}')
echo "  ✅ PASSED - node --check OK, $FAILED_C assertion failures"
echo ""
git checkout src/city/city-generator.js

# Mutation (d): Change payout from 120 to 80
echo "Mutation (d): Change payout from 120 to 80"
echo "Expected: test-slice-11-design-gate.js fails with assertion failures"

# Check string exists (in feature slot)
grep -q "payoutStub: { currency: 'cash', amount: 120 }" src/city/city-generator.js || abort_mutation "(d) target string not found"

# Apply mutation
sed -i "s/payoutStub: { currency: 'cash', amount: 120 }/payoutStub: { currency: 'cash', amount: 80 }/" src/city/city-generator.js

# Syntax check
node --check src/city/city-generator.js || abort_mutation "(d) produced invalid JS (SyntaxError)"

# Run test and check for assertion failures
if node test-slice-11-design-gate.js > /tmp/mutation-d.log 2>&1; then
    abort_mutation "(d) test passed when it should have failed"
fi

if ! grep -q "Failed: [1-9]" /tmp/mutation-d.log; then
    abort_mutation "(d) no assertion failures detected"
fi

FAILED_D=$(grep "Failed:" /tmp/mutation-d.log | awk '{print $2}')
echo "  ✅ PASSED - node --check OK, $FAILED_D assertion failures"
echo ""
git checkout src/city/city-generator.js

# Mutation (e): Replace offerPriority sort body with return 0;
echo "Mutation (e): Replace offerPriority sort body with return 0;"
echo "Expected: test-freelance-re-offer.js fails with assertion failures"

# Check string exists
grep -q "if (a.offerPriority !== b.offerPriority)" src/systems/freelance-system.js || abort_mutation "(e) target string not found"

# Apply mutation - replace the entire if block with just return 0;
sed -i '/if (a\.offerPriority !== b\.offerPriority) {/,/}/c\            return 0;' src/systems/freelance-system.js

# Syntax check
node --check src/systems/freelance-system.js || abort_mutation "(e) produced invalid JS (SyntaxError)"

# Run test and check for assertion failures
if node test-freelance-re-offer.js > /tmp/mutation-e.log 2>&1; then
    abort_mutation "(e) test passed when it should have failed"
fi

if ! grep -q "Failed: [1-9]" /tmp/mutation-e.log; then
    abort_mutation "(e) no assertion failures detected"
fi

FAILED_E=$(grep "Failed:" /tmp/mutation-e.log | awk '{print $2}')
echo "  ✅ PASSED - node --check OK, $FAILED_E assertion failures"
echo ""
git checkout src/systems/freelance-system.js

# Mutation (f): Change hasPendingLockedWindow() to return false
echo "Mutation (f): Change hasPendingLockedWindow() to return false"
echo "Expected: test-real-freelance-pending-window.js fails with assertion failures"

# Check string exists
grep -q "return !!this.lockedChipTimeout;" src/systems/freelance-system.js || abort_mutation "(f) target string not found"

# Apply mutation
sed -i 's/return !!this\.lockedChipTimeout;/return false;/' src/systems/freelance-system.js

# Syntax check
node --check src/systems/freelance-system.js || abort_mutation "(f) produced invalid JS (SyntaxError)"

# Run test and check for assertion failures
if node test-real-freelance-pending-window.js > /tmp/mutation-f.log 2>&1; then
    abort_mutation "(f) test passed when it should have failed"
fi

if ! grep -q "Failed: [1-9]" /tmp/mutation-f.log; then
    abort_mutation "(f) no assertion failures detected"
fi

FAILED_F=$(grep "Failed:" /tmp/mutation-f.log | awk '{print $2}')
echo "  ✅ PASSED - node --check OK, $FAILED_F assertion failures"
echo ""
git checkout src/systems/freelance-system.js

# Mutation (g): Restore global locked guard
echo "Mutation (g): Restore global locked guard (no hasPendingLockedWindow check)"
echo "Expected: test-e-key-locked-chip.js fails with assertion failures"

# Check string exists
grep -q "if (this.freelanceSystem && typeof this.freelanceSystem.hasPendingLockedWindow === 'function' && this.freelanceSystem.hasPendingLockedWindow()) {" src/core/game-manager.js || abort_mutation "(g) target string not found"

# Apply mutation - make it always block
sed -i "s/if (this\.freelanceSystem && typeof this\.freelanceSystem\.hasPendingLockedWindow === 'function' && this\.freelanceSystem\.hasPendingLockedWindow()) {/if (true) {/" src/core/game-manager.js

# Syntax check
node --check src/core/game-manager.js || abort_mutation "(g) produced invalid JS (SyntaxError)"

# Run test and check for assertion failures
if node test-e-key-locked-chip.js > /tmp/mutation-g.log 2>&1; then
    abort_mutation "(g) test passed when it should have failed"
fi

if ! grep -q "Failed: [1-9]" /tmp/mutation-g.log; then
    abort_mutation "(g) no assertion failures detected"
fi

FAILED_G=$(grep "Failed:" /tmp/mutation-g.log | awk '{print $2}')
echo "  ✅ PASSED - node --check OK, $FAILED_G assertion failures"
echo ""
git checkout src/core/game-manager.js

# Mutation (h): Remove locked guard entirely
echo "Mutation (h): Remove locked guard entirely"
echo "Expected: test-real-freelance-pending-window.js fails with assertion failures"

# Check string exists
grep -q "if (hudState === 'locked') {" src/core/game-manager.js || abort_mutation "(h) target string not found"

# Apply mutation - make it never block
sed -i "s/if (hudState === 'locked') {/if (false) {/" src/core/game-manager.js

# Syntax check
node --check src/core/game-manager.js || abort_mutation "(h) produced invalid JS (SyntaxError)"

# Run test and check for assertion failures
if node test-real-freelance-pending-window.js > /tmp/mutation-h.log 2>&1; then
    abort_mutation "(h) test passed when it should have failed"
fi

if ! grep -q "Failed: [1-9]" /tmp/mutation-h.log; then
    abort_mutation "(h) no assertion failures detected"
fi

FAILED_H=$(grep "Failed:" /tmp/mutation-h.log | awk '{print $2}')
echo "  ✅ PASSED - node --check OK, $FAILED_H assertion failures"
echo ""
git checkout src/core/game-manager.js

# Verify src/ tree is clean
if ! git diff --quiet src/; then
    echo "❌ Git tree is not clean after mutations"
    git status src/
    exit 1
fi

echo ""
echo "=== All Mutation Tests Passed ==="
echo "All 8 mutations produced valid JS and caused real assertion failures:"
echo "  (a) $FAILED_A failures"
echo "  (b) $FAILED_B failures"
echo "  (c) $FAILED_C failures"
echo "  (d) $FAILED_D failures"
echo "  (e) $FAILED_E failures"
echo "  (f) $FAILED_F failures"
echo "  (g) $FAILED_G failures"
echo "  (h) $FAILED_H failures"

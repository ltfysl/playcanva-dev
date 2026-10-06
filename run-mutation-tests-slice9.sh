#!/bin/bash
# Mutation testing for Slice-9: ProductRunner + Ship MVP
# Run with: bash run-mutation-tests-slice9.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Store original files
restore_files() {
    git checkout -- src/
}

# Set up trap to restore files on exit, interrupt, or terminate
trap restore_files EXIT
trap 'restore_files; exit 130' INT
trap 'restore_files; exit 143' TERM

echo "=== Slice-9 Mutation Testing ==="
echo ""

# Counter for mutations
total_mutations=0
passed_mutations=0
failed_mutations=0

# Helper function to run a mutation
run_mutation() {
    local mutation_name="$1"
    local file_path="$2"
    local test_file="$3"
    local old_string="$4"
    local new_string="$5"
    
    total_mutations=$((total_mutations + 1))
    echo -e "${YELLOW}Mutation ${total_mutations}: ${mutation_name}${NC}"
    echo "  File: ${file_path}"
    echo "  Test: ${test_file}"
    
    # Apply mutation
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/${old_string}/${new_string}/g" "${file_path}"
    else
        sed -i "s/${old_string}/${new_string}/g" "${file_path}"
    fi
    
    # Check syntax
    if ! node --check "${file_path}" 2>/dev/null; then
        echo -e "  ${RED}✗ INVALID: Mutation produced invalid JS${NC}"
        echo ""
        restore_files
        return 1
    fi
    
    # Run test
    if node "${test_file}" > /dev/null 2>&1; then
        echo -e "  ${RED}✗ FAILED: Test still passed (mutation not caught)${NC}"
        failed_mutations=$((failed_mutations + 1))
        echo ""
        restore_files
        return 1
    else
        # Check if it failed with at least 1 failed test
        local failed_count=$(node "${test_file}" 2>&1 | grep -o 'Failed: [0-9]*' | grep -o '[0-9]*' | head -1)
        if [[ -n "$failed_count" ]] && [[ "$failed_count" -ge 1 ]]; then
            echo -e "  ${GREEN}✓ PASSED: Test failed with ${failed_count} failure(s) (mutation caught)${NC}"
            passed_mutations=$((passed_mutations + 1))
            echo ""
            restore_files
            return 0
        else
            echo -e "  ${RED}✗ FAILED: Test crashed or didn't report failures correctly${NC}"
            failed_mutations=$((failed_mutations + 1))
            echo ""
            restore_files
            return 1
        fi
    fi
}

# Mutation 1: Payout amount 80→60
run_mutation \
    "Payout 80→60" \
    "src/city/city-generator.js" \
    "test-slice-9-product-runner.js" \
    "type: 'cash', amount: 80" \
    "type: 'cash', amount: 60"

# Mutation 2: Unlock minXp 30→20
run_mutation \
    "Unlock minXp 30→20" \
    "src/city/city-generator.js" \
    "test-slice-9-product-runner.js" \
    "skill: 'coding', minXp: 30" \
    "skill: 'coding', minXp: 20"

# Mutation 3: Remove registry upsert
run_mutation \
    "Remove registry upsert" \
    "src/systems/product-runner.js" \
    "test-slice-9-product-runner.js" \
    "productRegistry.upsert(product);" \
    "\/\/ productRegistry.upsert(product);"

# Mutation 4: Status 'live'→'draft'
run_mutation \
    "Product status 'live'→'draft'" \
    "src/systems/product-runner.js" \
    "test-slice-9-product-runner.js" \
    "status: 'live'" \
    "status: 'draft'"

# Mutation 5: repeatable false→true (remove one-shot guard)
run_mutation \
    "Repeatable false→true" \
    "src/city/city-generator.js" \
    "test-slice-9-e-priority.js" \
    "repeatable: false" \
    "repeatable: true"

# Mutation 6: Remove PAID check (allow re-offer)
run_mutation \
    "Remove PAID history check" \
    "src/systems/product-runner.js" \
    "test-slice-9-e-priority.js" \
    "if (history && history.state === ProductJobState.PAID) {" \
    "if (false && history \&\& history.state === ProductJobState.PAID) {"

# Mutation 7: Remove abandon pay-0 guard (exit sets PAID instead of IDLE)
run_mutation \
    "Exit sets PAID instead of IDLE" \
    "src/systems/product-runner.js" \
    "test-slice-9-product-runner.js" \
    "this.currentRun.state = ProductJobState.IDLE;" \
    "this.currentRun.state = ProductJobState.PAID;"

# Mutation 8: hasPendingLockedWindow returns false
run_mutation \
    "hasPendingLockedWindow always false" \
    "src/systems/product-runner.js" \
    "test-slice-9-e-priority.js" \
    "return this.currentRun && this.currentRun.lockedChipTimeout !== null;" \
    "return false;"

# Mutation 9: XP amount 15→10
run_mutation \
    "XP amount 15→10" \
    "src/city/city-generator.js" \
    "test-slice-9-product-runner.js" \
    "skill: 'coding', amount: 15" \
    "skill: 'coding', amount: 10"

echo ""
echo "=== Mutation Testing Summary ==="
echo -e "Total mutations: ${total_mutations}"
echo -e "${GREEN}Passed (caught): ${passed_mutations}${NC}"
echo -e "${RED}Failed (not caught): ${failed_mutations}${NC}"
echo ""

if [[ ${failed_mutations} -eq 0 ]]; then
    echo -e "${GREEN}✓ All mutations were caught by tests!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some mutations were not caught${NC}"
    exit 1
fi

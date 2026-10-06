#!/bin/bash
# Mutation testing for Slice-9: ProductRunner + Ship MVP

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

restore_files() {
    git checkout -- src/
}

trap restore_files EXIT
trap 'restore_files; exit 130' INT
trap 'restore_files; exit 143' TERM

echo "=== Slice-9 Mutation Testing ==="
echo ""

total_mutations=0
passed_mutations=0
failed_mutations=0

run_mutation() {
    local mutation_name="$1"
    local file_path="$2"
    local test_file="$3"
    local line_num="$4"
    local old_value="$5"
    local new_value="$6"
    
    total_mutations=$((total_mutations + 1))
    echo -e "${YELLOW}Mutation ${total_mutations}: ${mutation_name}${NC}"
    echo "  File: ${file_path}:${line_num}"
    echo "  Test: ${test_file}"
    
    # Apply mutation using sed on specific line
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "${line_num}s/${old_value}/${new_value}/g" "${file_path}"
    else
        sed -i "${line_num}s/${old_value}/${new_value}/g" "${file_path}"
    fi
    
    if ! node --check "${file_path}" 2>/dev/null; then
        echo -e "  ${RED}✗ INVALID: Mutation produced invalid JS${NC}"
        echo ""
        restore_files
        return 1
    fi
    
    if node "${test_file}" > /dev/null 2>&1; then
        echo -e "  ${RED}✗ FAILED: Test still passed (mutation not caught)${NC}"
        failed_mutations=$((failed_mutations + 1))
        echo ""
        restore_files
        return 1
    else
        local failed_count=$(node "${test_file}" 2>&1 | grep -o 'Failed: [0-9]*' | grep -o '[0-9]*' | head -1)
        if [[ -n "$failed_count" ]] && [[ "$failed_count" -ge 1 ]]; then
            echo -e "  ${GREEN}✓ PASSED: Test failed with ${failed_count} failure(s)${NC}"
            passed_mutations=$((passed_mutations + 1))
            echo ""
            restore_files
            return 0
        else
            echo -e "  ${RED}✗ FAILED: Test crashed without reporting failures${NC}"
            failed_mutations=$((failed_mutations + 1))
            echo ""
            restore_files
            return 1
        fi
    fi
}

# Mutation 1: Payout amount 80→60 (line 117)
run_mutation "Payout 80→60" "src/city/city-generator.js" "test-slice-9-product-runner.js" 117 "amount: 80" "amount: 60"

# Mutation 2: Unlock minXp 30→20 (line 114)
run_mutation "Unlock minXp 30→20" "src/city/city-generator.js" "test-slice-9-product-runner.js" 114 "minXp: 30" "minXp: 20"

# Mutation 3: Remove registry upsert (line 223)
run_mutation "Remove registry upsert" "src/systems/product-runner.js" "test-slice-9-product-runner.js" 223 "productRegistry.upsert(product);" "\/\/ productRegistry.upsert(product);"

# Mutation 4: Status 'live'→'draft' (line 219)
run_mutation "Product status 'live'→'draft'" "src/systems/product-runner.js" "test-slice-9-product-runner.js" 219 "status: 'live'" "status: 'draft'"

# Mutation 5: repeatable false→true (line 120)
run_mutation "Repeatable false→true" "src/city/city-generator.js" "test-slice-9-e-priority.js" 120 "repeatable: false" "repeatable: true"

# Mutation 6: Remove PAID check (line 69)
run_mutation "Remove PAID history check" "src/systems/product-runner.js" "test-slice-9-e-priority.js" 69 "if (history && history.state === ProductJobState.PAID)" "if (false)"

# Mutation 7: Exit sets PAID instead of IDLE (line 235)
run_mutation "Exit sets PAID instead of IDLE" "src/systems/product-runner.js" "test-slice-9-product-runner.js" 235 "this.currentRun.state = ProductJobState.IDLE;" "this.currentRun.state = ProductJobState.PAID;"

# Mutation 8: hasPendingLockedWindow always false (line 154)
run_mutation "hasPendingLockedWindow always false" "src/systems/product-runner.js" "test-slice-9-e-priority.js" 154 "return this.currentRun && this.currentRun.lockedChipTimeout !== null;" "return false;"

# Mutation 9: XP amount 15→10 (line 118)
run_mutation "XP amount 15→10" "src/city/city-generator.js" "test-slice-9-product-runner.js" 118 "amount: 15" "amount: 10"

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

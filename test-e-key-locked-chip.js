// Test E key during 2s locked chip window
// E must do nothing (or wait for offer), not exit building
// Run with: node test-e-key-locked-chip.js

const path = require('path');

// Mock classes for testing
class MockSolHUD {
    constructor() {
        this.state = null;
    }
    
    getCurrentState() {
        return this.state;
    }
    
    showLocked() {
        this.state = 'locked';
    }
    
    show() {
        this.state = 'offered';
    }
    
    hide() {
        this.state = null;
    }
}

class MockGameManager {
    constructor() {
        this.solHUD = new MockSolHUD();
        this.isInBuilding = false;
        this.exitCalled = false;
    }
    
    handleInteraction() {
        if (this.isInBuilding) {
            // Don't exit during locked chip display (wait for actual offer)
            const hudState = this.solHUD ? this.solHUD.getCurrentState() : null;
            if (hudState === 'locked') {
                return;
            }
            
            if (this.tryRunnerInteraction()) {
                return;
            }
            this.exitBuilding();
        }
    }
    
    tryRunnerInteraction() {
        // Simplified - just check if HUD is offered
        return this.solHUD.getCurrentState() === 'offered';
    }
    
    exitBuilding() {
        this.exitCalled = true;
        this.isInBuilding = false;
    }
}

console.log('=== E Key During Locked Chip Test ===\n');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ ${testName}`);
        passed++;
    } else {
        console.log(`❌ ${testName}`);
        failed++;
    }
}

console.log('Test 1: E key during locked chip does nothing (stays in building)');
const gm = new MockGameManager();
gm.isInBuilding = true;
gm.solHUD.showLocked();

assert(gm.isInBuilding === true, '1a: Initially in building');
assert(gm.solHUD.getCurrentState() === 'locked', '1b: HUD showing locked chip');

gm.handleInteraction(); // E key pressed

assert(gm.isInBuilding === true, '1c: Still in building after E press');
assert(gm.exitCalled === false, '1d: exitBuilding was not called');

console.log('\nTest 2: E key during offered state does trigger interaction');
gm.exitCalled = false;
gm.isInBuilding = true;
gm.solHUD.show(); // Now showing offer

assert(gm.solHUD.getCurrentState() === 'offered', '2a: HUD showing offered');

const interactionTriggered = gm.tryRunnerInteraction();
assert(interactionTriggered === true, '2b: tryRunnerInteraction returns true for offered');

console.log('\nTest 3: E key with no HUD state (normal exit)');
const gm2 = new MockGameManager();
gm2.isInBuilding = true;
gm2.solHUD.hide();

assert(gm2.solHUD.getCurrentState() === null, '3a: HUD state is null');

gm2.handleInteraction(); // E key pressed

assert(gm2.isInBuilding === false, '3b: Exited building');
assert(gm2.exitCalled === true, '3c: exitBuilding was called');

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
}

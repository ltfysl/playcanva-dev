// Test E key during locked chip: blocks ONLY if 2s timer is pending
// Office (no timer): E exits. Café (2s timer): E blocked.
// Uses REAL GameManager.handleInteraction via .call() and REAL SolHUD
// Run with: node test-e-key-locked-chip.js

const fs = require('fs');

// Minimal DOM stubs for SolHUD
global.document = {
    createElement: (tag) => ({
        id: null,
        style: {
            cssText: '',
            opacity: '0'
        },
        textContent: '',
        appendChild: () => {}
    }),
    getElementById: (id) => {
        if (id === 'ui-overlay') {
            return {
                appendChild: () => {}
            };
        }
        if (id === 'sol-hud') {
            return global.testHudElement;
        }
        return null;
    }
};

global.testHudElement = null;

global.pc = {
    Vec3: class Vec3 {
        constructor(x, y, z) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
        }
    }
};

function loadModule(path, exportNames) {
    const code = fs.readFileSync(path, 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', 'pc', 'document', `
        ${code}
        ${exportNames.map(name => `sandbox.${name} = ${name};`).join('\n')}
    `);
    wrapper(sandbox, global.pc, global.document);
    return sandbox;
}

const solHudModule = loadModule('./src/ui/sol-hud.js', ['SolHUD']);
const { SolHUD } = solHudModule;

const gameManagerModule = loadModule('./src/core/game-manager.js', ['GameManager']);
const { GameManager } = gameManagerModule;

console.log('=== E Key During Locked Chip Test (Real GameManager.handleInteraction) ===\n');

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

console.log('Test 1: Office locked chip (no timer) - E exits building');

const solHUD1 = new SolHUD();
global.testHudElement = solHUD1.element;

const fakeThis1 = {
    isInBuilding: true,
    solHUD: solHUD1,
    exitCalled: false,
    tryRunnerInteractionCalled: false,
    tryEnterBuildingCalled: false,
    freelanceSystem: null,
    
    exitBuilding() {
        this.exitCalled = true;
        this.isInBuilding = false;
    },
    
    tryRunnerInteraction() {
        this.tryRunnerInteractionCalled = true;
        return false;
    },
    
    tryEnterBuilding() {
        this.tryEnterBuildingCalled = true;
    }
};

solHUD1.showLocked({ skill: 'coding', minXp: 15 }, { getXp: () => 0 });

assert(fakeThis1.isInBuilding === true, '1a: Initially in office building');
assert(solHUD1.getCurrentState() === 'locked', '1b: HUD showing locked chip (coding XP 0/15)');
assert(solHUD1.element.style.opacity === '1', '1c: HUD visible');

GameManager.prototype.handleInteraction.call(fakeThis1);

assert(fakeThis1.tryRunnerInteractionCalled === true, '1d: tryRunnerInteraction was called (no pending window)');
assert(fakeThis1.isInBuilding === false, '1e: Exited building after E press');
assert(fakeThis1.exitCalled === true, '1f: exitBuilding was called');

console.log('\nTest 2: Café locked chip (2s timer pending) - E blocked');

const solHUD2 = new SolHUD();
global.testHudElement = solHUD2.element;

const mockFreelanceWithTimer = {
    hasPendingLockedWindow() {
        return true;
    }
};

const fakeThis2 = {
    isInBuilding: true,
    solHUD: solHUD2,
    exitCalled: false,
    tryRunnerInteractionCalled: false,
    freelanceSystem: mockFreelanceWithTimer,
    
    exitBuilding() {
        this.exitCalled = true;
        this.isInBuilding = false;
    },
    
    tryRunnerInteraction() {
        this.tryRunnerInteractionCalled = true;
        return false;
    },
    
    tryEnterBuilding() {}
};

solHUD2.showLocked({ skill: 'design', minXp: 10 }, { getXp: () => 5 });

assert(fakeThis2.isInBuilding === true, '2a: Initially in café building');
assert(solHUD2.getCurrentState() === 'locked', '2b: HUD showing locked chip (design XP 5/10)');
assert(mockFreelanceWithTimer.hasPendingLockedWindow() === true, '2c: 2s timer is pending');

GameManager.prototype.handleInteraction.call(fakeThis2);

assert(fakeThis2.isInBuilding === true, '2d: Still in building after E press (timer blocks)');
assert(fakeThis2.exitCalled === false, '2e: exitBuilding was NOT called');
assert(fakeThis2.tryRunnerInteractionCalled === false, '2f: tryRunnerInteraction was NOT called (blocked early)');

console.log('\nTest 3: Café after 2s timer expires - E exits');

const solHUD3 = new SolHUD();
global.testHudElement = solHUD3.element;

const mockFreelanceNoTimer = {
    hasPendingLockedWindow() {
        return false;
    }
};

const fakeThis3 = {
    isInBuilding: true,
    solHUD: solHUD3,
    exitCalled: false,
    tryRunnerInteractionCalled: false,
    freelanceSystem: mockFreelanceNoTimer,
    
    exitBuilding() {
        this.exitCalled = true;
        this.isInBuilding = false;
    },
    
    tryRunnerInteraction() {
        this.tryRunnerInteractionCalled = true;
        return false;
    },
    
    tryEnterBuilding() {}
};

solHUD3.showLocked({ skill: 'design', minXp: 10 }, { getXp: () => 5 });

assert(mockFreelanceNoTimer.hasPendingLockedWindow() === false, '3a: 2s timer expired (no pending window)');
assert(solHUD3.getCurrentState() === 'locked', '3b: HUD still showing locked chip');

GameManager.prototype.handleInteraction.call(fakeThis3);

assert(fakeThis3.tryRunnerInteractionCalled === true, '3c: tryRunnerInteraction was called');
assert(fakeThis3.isInBuilding === false, '3d: Exited building (timer not blocking)');
assert(fakeThis3.exitCalled === true, '3e: exitBuilding was called');

console.log('\nTest 4: E key during offered state - runner handles it');

const solHUD4 = new SolHUD();
global.testHudElement = solHUD4.element;

const fakeThis4 = {
    isInBuilding: true,
    solHUD: solHUD4,
    exitCalled: false,
    tryRunnerInteractionCalled: false,
    freelanceSystem: null,
    
    exitBuilding() {
        this.exitCalled = true;
        this.isInBuilding = false;
    },
    
    tryRunnerInteraction() {
        this.tryRunnerInteractionCalled = true;
        return true;
    },
    
    tryEnterBuilding() {}
};

solHUD4.showJobOffer('Quick bugfix', 50);

assert(solHUD4.getCurrentState() === 'offered', '4a: HUD showing offered');

GameManager.prototype.handleInteraction.call(fakeThis4);

assert(fakeThis4.tryRunnerInteractionCalled === true, '4b: tryRunnerInteraction was called');
assert(fakeThis4.exitCalled === false, '4c: exitBuilding was NOT called (runner handled it)');
assert(fakeThis4.isInBuilding === true, '4d: Still in building (runner accepted job)');

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All tests passed!');
    console.log('\nUsing REAL SolHUD from src/ui/sol-hud.js');
    console.log('Using REAL GameManager.prototype.handleInteraction via .call()');
    console.log('\n=== Mutation checks ===');
    console.log('Test 1 FAILS if: locked chip blocks exit even without pending window');
    console.log('Test 2 FAILS if: hasPendingLockedWindow() check is removed');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
}

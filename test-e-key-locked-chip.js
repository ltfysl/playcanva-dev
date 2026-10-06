// Test E key during 2s locked chip window
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

console.log('Test 1: E key during locked chip does nothing (stays in building)');

const solHUD1 = new SolHUD();
global.testHudElement = solHUD1.element;

const fakeThis1 = {
    isInBuilding: true,
    solHUD: solHUD1,
    exitCalled: false,
    tryRunnerInteractionCalled: false,
    tryEnterBuildingCalled: false,
    
    exitBuilding() {
        this.exitCalled = true;
        this.isInBuilding = false;
    },
    
    tryRunnerInteraction() {
        this.tryRunnerInteractionCalled = true;
        return false; // No runner wants to handle it
    },
    
    tryEnterBuilding() {
        this.tryEnterBuildingCalled = true;
    }
};

solHUD1.showLocked({ skill: 'design', minXp: 10 }, { getXp: () => 5 });

assert(fakeThis1.isInBuilding === true, '1a: Initially in building');
assert(solHUD1.getCurrentState() === 'locked', '1b: HUD showing locked chip');
assert(solHUD1.element.style.opacity === '1', '1c: HUD visible');

// Call the REAL handleInteraction with our fake context
GameManager.prototype.handleInteraction.call(fakeThis1);

assert(fakeThis1.isInBuilding === true, '1d: Still in building after E press');
assert(fakeThis1.exitCalled === false, '1e: exitBuilding was not called');
assert(fakeThis1.tryRunnerInteractionCalled === false, '1f: tryRunnerInteraction was not called (blocked by locked check)');
assert(solHUD1.getCurrentState() === 'locked', '1g: HUD state still locked');

console.log('\nTest 2: E key during offered state does call tryRunnerInteraction');

const solHUD2 = new SolHUD();
global.testHudElement = solHUD2.element;

const fakeThis2 = {
    isInBuilding: true,
    solHUD: solHUD2,
    exitCalled: false,
    tryRunnerInteractionCalled: false,
    
    exitBuilding() {
        this.exitCalled = true;
        this.isInBuilding = false;
    },
    
    tryRunnerInteraction() {
        this.tryRunnerInteractionCalled = true;
        return true; // Runner handled it
    },
    
    tryEnterBuilding() {}
};

solHUD2.showJobOffer('Quick bugfix', 50);

assert(solHUD2.getCurrentState() === 'offered', '2a: HUD showing offered');
assert(solHUD2.element.style.opacity === '1', '2b: HUD visible');

GameManager.prototype.handleInteraction.call(fakeThis2);

assert(fakeThis2.tryRunnerInteractionCalled === true, '2c: tryRunnerInteraction was called');
assert(fakeThis2.exitCalled === false, '2d: exitBuilding was not called (runner handled it)');

console.log('\nTest 3: E key with no HUD state (normal exit)');

const solHUD3 = new SolHUD();
global.testHudElement = solHUD3.element;

const fakeThis3 = {
    isInBuilding: true,
    solHUD: solHUD3,
    exitCalled: false,
    tryRunnerInteractionCalled: false,
    
    exitBuilding() {
        this.exitCalled = true;
        this.isInBuilding = false;
    },
    
    tryRunnerInteraction() {
        this.tryRunnerInteractionCalled = true;
        return false; // No runner wants to handle it
    },
    
    tryEnterBuilding() {}
};

solHUD3.hide();

assert(solHUD3.getCurrentState() === null, '3a: HUD state is null');
assert(solHUD3.element.style.opacity === '0', '3b: HUD hidden');

GameManager.prototype.handleInteraction.call(fakeThis3);

assert(fakeThis3.tryRunnerInteractionCalled === true, '3c: tryRunnerInteraction was called');
assert(fakeThis3.isInBuilding === false, '3d: Exited building');
assert(fakeThis3.exitCalled === true, '3e: exitBuilding was called');

console.log('\nTest 4: Not in building calls tryEnterBuilding');

const solHUD4 = new SolHUD();
global.testHudElement = solHUD4.element;

const fakeThis4 = {
    isInBuilding: false,
    solHUD: solHUD4,
    tryEnterBuildingCalled: false,
    tryRunnerInteractionCalled: false,
    
    tryRunnerInteraction() {
        this.tryRunnerInteractionCalled = true;
        return false;
    },
    
    tryEnterBuilding() {
        this.tryEnterBuildingCalled = true;
    },
    
    exitBuilding() {}
};

GameManager.prototype.handleInteraction.call(fakeThis4);

assert(fakeThis4.tryRunnerInteractionCalled === true, '4a: tryRunnerInteraction called first');
assert(fakeThis4.tryEnterBuildingCalled === true, '4b: tryEnterBuilding was called');

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All tests passed!');
    console.log('\nUsing REAL SolHUD from src/ui/sol-hud.js');
    console.log('Using REAL GameManager.prototype.handleInteraction via .call()');
    console.log('\nMutation check: This test FAILS if the hudState === \'locked\' guard');
    console.log('is removed from GameManager.handleInteraction in src/core/game-manager.js');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
}

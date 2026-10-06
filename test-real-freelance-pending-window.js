// Test REAL FreelanceSystem.hasPendingLockedWindow() with REAL GameManager.handleInteraction
// Uses fake timers to advance through 2s locked chip window
// Run with: node test-real-freelance-pending-window.js

const fs = require('fs');

// Minimal stubs for PlayCanvas and DOM
global.pc = {
    Vec3: class Vec3 {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        toString() {
            return `(${this.x}, ${this.y}, ${this.z})`;
        }
    },
    Application: class Application {},
    Entity: class Entity {
        addComponent() {}
        addChild() {}
        setLocalScale() {}
        setLocalPosition() {}
        setLocalEulerAngles() {}
    }
};

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

// Fake timers
let fakeTimerId = 1;
const fakeTimers = new Map();
let fakeNow = 1000000;

global.setTimeout = (fn, delay) => {
    const id = fakeTimerId++;
    fakeTimers.set(id, { fn, fireAt: fakeNow + delay });
    return id;
};

global.clearTimeout = (id) => {
    fakeTimers.delete(id);
};

global.Date = {
    now: () => fakeNow
};

function advanceTime(ms) {
    fakeNow += ms;
    const fired = [];
    for (const [id, timer] of fakeTimers.entries()) {
        if (timer.fireAt <= fakeNow) {
            fired.push({ id, fn: timer.fn });
        }
    }
    for (const { id, fn } of fired) {
        fakeTimers.delete(id);
        fn();
    }
}

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

// Load real modules
const skillsModule = loadModule('./src/core/skills-stub.js', ['SkillsStub']);
const { SkillsStub } = skillsModule;

const cityModuleFile = loadModule('./src/core/city-module.js', [
    'LocationId', 'LocationData', 'ActivitySlot', 'CityModule',
    'BuildingKind', 'UnlockState'
]);
const { LocationId, LocationData, ActivitySlot, CityModule, BuildingKind, UnlockState } = cityModuleFile;

const freelanceModule = loadModule('./src/systems/freelance-system.js', ['FreelanceSystem']);
const { FreelanceSystem } = freelanceModule;

const solHudModule = loadModule('./src/ui/sol-hud.js', ['SolHUD']);
const { SolHUD } = solHudModule;

const gameManagerModule = loadModule('./src/core/game-manager.js', ['GameManager']);
const { GameManager } = gameManagerModule;

console.log('=== Real FreelanceSystem.hasPendingLockedWindow() Test ===\n');

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

// Setup
const skillsStub = new SkillsStub();
const cityModule = new CityModule();
const districtId = 'downtown';
const cafeLocationId = new LocationId(districtId, 'the-bean-cafe');

const bugfixSlot = new ActivitySlot('cafe-bugfix-1', {
    name: 'Quick bugfix',
    skillTags: ['coding'],
    unlockRule: null,
    durationHint: 30,
    kind: 'freelance',
    payoutStub: { currency: 'cash', amount: 50 },
    xpStub: { amount: 10 },
    repeatable: true
});

const featureSlot = new ActivitySlot('cafe-feature-1', {
    name: 'Small feature patch',
    skillTags: ['coding'],
    unlockRule: { skill: 'design', minXp: 10 },
    durationHint: 45,
    kind: 'freelance',
    payoutStub: { currency: 'cash', amount: 120 },
    xpStub: { amount: 15 },
    offerPriority: 10
});

const cafeLocation = new LocationData(cafeLocationId, BuildingKind.CAFE, {
    name: 'The Bean Café',
    unlockState: UnlockState.AVAILABLE,
    position: new pc.Vec3(-10, 0, 15),
    activitySlots: [bugfixSlot, featureSlot]
});

cityModule.registerLocation(cafeLocation);

const freelanceSystem = new FreelanceSystem(cityModule, cafeLocationId, skillsStub);

const solHUD = new SolHUD();
global.testHudElement = solHUD.element;

// Set up listeners like GameManager does
freelanceSystem.on('jobLocked', (data) => {
    if (data.slot.unlockRule) {
        solHUD.showLocked(data.slot.unlockRule, skillsStub);
    }
});

freelanceSystem.on('jobOffered', (data) => {
    const payout = data.slot.payoutStub.amount;
    solHUD.showJobOffer(data.slot.name, payout);
});

console.log('Test 1: Enter café with design XP < 10');
skillsStub.addXp('design', 5);
const presence = cityModule.getPresence();
presence.enter(cafeLocationId);

// Locked chip should be shown, timer starts
assert(solHUD.getCurrentState() === 'locked', '1a: HUD showing locked chip');
assert(freelanceSystem.hasPendingLockedWindow() === true, '1b: hasPendingLockedWindow() returns true');
assert(fakeTimers.size === 1, '1c: One timer is pending');
console.log();

console.log('Test 2: E key during pending window - calls REAL GameManager.handleInteraction');
const fakeThis = {
    isInBuilding: true,
    solHUD: solHUD,
    exitCalled: false,
    tryRunnerInteractionCalled: false,
    freelanceSystem: freelanceSystem,
    
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

GameManager.prototype.handleInteraction.call(fakeThis);

assert(fakeThis.isInBuilding === true, '2a: Still in building (blocked by pending window)');
assert(fakeThis.exitCalled === false, '2b: exitBuilding was NOT called');
assert(fakeThis.tryRunnerInteractionCalled === false, '2c: tryRunnerInteraction was NOT called (blocked early)');
console.log();

console.log('Test 3: Advance 2.0s - timer fires, hasPendingLockedWindow() becomes false');
advanceTime(2000);

assert(freelanceSystem.hasPendingLockedWindow() === false, '3a: hasPendingLockedWindow() returns false (timer fired)');
assert(solHUD.getCurrentState() === 'offered', '3b: HUD now showing offered state');
assert(fakeTimers.size === 0, '3c: No pending timers');
console.log();

console.log('Test 4: E key after timer fires - exits building');
const fakeThis2 = {
    isInBuilding: true,
    solHUD: solHUD,
    exitCalled: false,
    tryRunnerInteractionCalled: false,
    freelanceSystem: freelanceSystem,
    
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

// Change HUD state to locked (but no pending window)
solHUD.showLocked({ skill: 'design', minXp: 10 }, skillsStub);

GameManager.prototype.handleInteraction.call(fakeThis2);

assert(fakeThis2.tryRunnerInteractionCalled === true, '4a: tryRunnerInteraction was called');
assert(fakeThis2.isInBuilding === false, '4b: Exited building (no pending window)');
assert(fakeThis2.exitCalled === true, '4c: exitBuilding was called');
console.log();

console.log('Test 5: Exit cancels timer - hasPendingLockedWindow() becomes false');
// Reset and enter again
skillsStub.addXp('design', -5); // Reset to 0
presence.exit(cafeLocationId);
fakeNow += 100;

presence.enter(cafeLocationId);

assert(freelanceSystem.hasPendingLockedWindow() === true, '5a: hasPendingLockedWindow() true on new entry');
assert(fakeTimers.size === 1, '5b: Timer is pending');

presence.exit(cafeLocationId);

assert(freelanceSystem.hasPendingLockedWindow() === false, '5c: hasPendingLockedWindow() false after exit (timer cancelled)');
assert(fakeTimers.size === 0, '5d: Timer was cleared');
console.log();

console.log('=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All tests passed!');
    console.log('\nUsing REAL FreelanceSystem from src/systems/freelance-system.js');
    console.log('Using REAL GameManager.prototype.handleInteraction from src/core/game-manager.js');
    console.log('Using REAL SolHUD from src/ui/sol-hud.js');
    console.log('\nMutation check: This test FAILS if FreelanceSystem.hasPendingLockedWindow()');
    console.log('is changed to `return false;` (Test 1b, 2a-c, 5a fail)');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
}

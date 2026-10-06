// Test E-priority: inProgress > product > career > freelance > learn
// Run with: node test-slice-9-e-priority.js

const fs = require('fs');

global.pc = {
    Vec3: class Vec3 {
        constructor(x, y, z) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
        }
    }
};

function loadCityModule() {
    const cityModuleCode = fs.readFileSync('./src/core/city-module.js', 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', 'pc', `
        ${cityModuleCode}
        sandbox.BuildingKind = BuildingKind;
        sandbox.UnlockState = UnlockState;
        sandbox.LocationId = LocationId;
        sandbox.Presence = Presence;
        sandbox.ActivitySlot = ActivitySlot;
        sandbox.ReputationSurface = ReputationSurface;
        sandbox.LocationData = LocationData;
        sandbox.CityModule = CityModule;
    `);
    wrapper(sandbox, global.pc);
    return sandbox;
}

function loadProductRegistry() {
    const code = fs.readFileSync('./src/systems/product-registry.js', 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', `
        ${code}
        sandbox.ProductRegistry = ProductRegistry;
        sandbox.productRegistry = productRegistry;
    `);
    wrapper(sandbox);
    return sandbox;
}

function loadProductRunner() {
    const productRegistryExports = loadProductRegistry();
    global.productRegistry = productRegistryExports.productRegistry;
    
    const code = fs.readFileSync('./src/systems/product-runner.js', 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', 'productRegistry', `
        ${code}
        sandbox.ProductJobState = ProductJobState;
        sandbox.ProductJobRun = ProductJobRun;
        sandbox.ProductRunner = ProductRunner;
    `);
    wrapper(sandbox, global.productRegistry);
    return sandbox;
}

function loadLearnRunner() {
    const code = fs.readFileSync('./src/systems/learn-runner.js', 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', `
        ${code}
        sandbox.LearnJobState = LearnJobState;
        sandbox.LearnJobRun = LearnJobRun;
        sandbox.LearnRunner = LearnRunner;
    `);
    wrapper(sandbox);
    return sandbox;
}

const cityModuleExports = loadCityModule();
const productRegistryExports = loadProductRegistry();
const productRunnerExports = loadProductRunner();
const learnRunnerExports = loadLearnRunner();

const { CityModule, Presence, LocationId, ActivitySlot, LocationData, BuildingKind, UnlockState } = cityModuleExports;
const { ProductRegistry, productRegistry } = productRegistryExports;
const { ProductRunner, ProductJobState } = productRunnerExports;
const { LearnRunner, LearnJobState } = learnRunnerExports;

class SkillsStub {
    constructor() {
        this.skills = {};
    }
    
    addXp(tag, amount) {
        if (!this.skills[tag]) {
            this.skills[tag] = 0;
        }
        this.skills[tag] += amount;
    }
    
    getXp(tag) {
        return this.skills[tag] || 0;
    }
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`✅ ${testName}`);
        passed++;
    } else {
        console.log(`❌ ${testName}`);
        if (details) console.log(`   ${details}`);
        failed++;
    }
}

console.log('=== Slice-9 E-Priority Test Suite ===\n');

console.log('Test 1: Product offered when both product and learn available');
{
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 35);
    const cityModule = new CityModule();
    
    const homeId = new LocationId('downtown', 'starter-home');
    const homeLocation = new LocationData(
        homeId,
        'Home',
        new pc.Vec3(0, 0, 0),
        BuildingKind.HOME,
        UnlockState.UNLOCKED
    );
    homeLocation.activitySlots = [
        new ActivitySlot('home-practice-1', {
            name: 'Practice coding',
            skillTags: ['coding'],
            unlockRule: null,
            durationHint: 20,
            kind: 'learn',
            payoutStub: null,
            xpStub: { amount: 5 }
        }),
        new ActivitySlot('home-ship-mvp-1', {
            name: 'Ship MVP',
            skillTags: ['coding'],
            unlockRule: { skill: 'coding', minXp: 30 },
            durationHint: 50,
            kind: 'product',
            payoutStub: { type: 'cash', amount: 80 },
            xpStub: { skill: 'coding', amount: 15 },
            productStub: { id: 'mvp-1', name: 'Side Project MVP', mrrStub: 10 },
            repeatable: false,
            offerPriority: 10
        })
    ];
    cityModule.locations.set(homeId.toString(), homeLocation);
    
    const productRunner = new ProductRunner(cityModule, homeId, skillsStub);
    const learnRunner = new LearnRunner(cityModule, homeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(homeId);
    
    assert(productRunner.getCurrentRun() !== null, '1a: Product runner has a run');
    assert(productRunner.getCurrentRun().state === ProductJobState.OFFERED, '1b: Product is OFFERED');
    assert(learnRunner.getCurrentRun() !== null, '1c: Learn runner has a run');
    assert(learnRunner.getCurrentRun().state === LearnJobState.OFFERED, '1d: Learn is also OFFERED');
}
console.log();

console.log('Test 2: Learn offered when product already paid (one-shot)');
{
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 40);
    const cityModule = new CityModule();
    
    const homeId = new LocationId('downtown', 'starter-home');
    const homeLocation = new LocationData(
        homeId,
        'Home',
        new pc.Vec3(0, 0, 0),
        BuildingKind.HOME,
        UnlockState.UNLOCKED
    );
    homeLocation.activitySlots = [
        new ActivitySlot('home-practice-1', {
            name: 'Practice coding',
            skillTags: ['coding'],
            unlockRule: null,
            durationHint: 20,
            kind: 'learn',
            payoutStub: null,
            xpStub: { amount: 5 }
        }),
        new ActivitySlot('home-ship-mvp-1', {
            name: 'Ship MVP',
            skillTags: ['coding'],
            unlockRule: { skill: 'coding', minXp: 30 },
            durationHint: 50,
            kind: 'product',
            payoutStub: { type: 'cash', amount: 80 },
            xpStub: { skill: 'coding', amount: 15 },
            productStub: { id: 'mvp-1', name: 'Side Project MVP', mrrStub: 10 },
            repeatable: false,
            offerPriority: 10
        })
    ];
    cityModule.locations.set(homeId.toString(), homeLocation);
    
    const productRunner = new ProductRunner(cityModule, homeId, skillsStub);
    const learnRunner = new LearnRunner(cityModule, homeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(homeId);
    productRunner.acceptJob();
    productRunner.startJob();
    productRunner.completeJob();
    productRunner.payoutJob();
    
    presence.exit(homeId);
    presence.enter(homeId);
    
    assert(productRunner.getCurrentRun() === null || productRunner.getCurrentRun().state === ProductJobState.IDLE, '2a: Product not re-offered (one-shot)');
    assert(learnRunner.getCurrentRun() !== null, '2b: Learn runner has a run');
    assert(learnRunner.getCurrentRun().state === LearnJobState.OFFERED, '2c: Learn is OFFERED after product PAID');
}
console.log();

console.log('Test 3: hasPendingLockedWindow returns true during 2s window');
{
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 15);
    const cityModule = new CityModule();
    
    const homeId = new LocationId('downtown', 'starter-home');
    const homeLocation = new LocationData(
        homeId,
        'Home',
        new pc.Vec3(0, 0, 0),
        BuildingKind.HOME,
        UnlockState.UNLOCKED
    );
    homeLocation.activitySlots = [
        new ActivitySlot('home-ship-mvp-1', {
            name: 'Ship MVP',
            skillTags: ['coding'],
            unlockRule: { skill: 'coding', minXp: 30 },
            durationHint: 50,
            kind: 'product',
            payoutStub: { type: 'cash', amount: 80 },
            xpStub: { skill: 'coding', amount: 15 },
            productStub: { id: 'mvp-1', name: 'Side Project MVP', mrrStub: 10 },
            repeatable: false,
            offerPriority: 10
        })
    ];
    cityModule.locations.set(homeId.toString(), homeLocation);
    
    const productRunner = new ProductRunner(cityModule, homeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(homeId);
    
    assert(productRunner.hasPendingLockedWindow(), '3a: hasPendingLockedWindow is true during window');
}
console.log();

console.log('=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All E-priority tests passed!');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
}

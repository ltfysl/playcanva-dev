// Test ProductRunner for Slice-9: Ship MVP
// Run with: node test-slice-9-product-runner.js

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

function loadProductRunner(productRegistry) {
    global.productRegistry = productRegistry;
    
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

const cityModuleExports = loadCityModule();
const productRegistryExports = loadProductRegistry();
const productRunnerExports = loadProductRunner(productRegistryExports.productRegistry);

const { CityModule, Presence, LocationId, ActivitySlot, LocationData, BuildingKind, UnlockState } = cityModuleExports;
const { productRegistry } = productRegistryExports;
const { ProductRunner, ProductJobState } = productRunnerExports;

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

console.log('=== Slice-9 ProductRunner Test Suite ===\n');

console.log('Test 1: Locked chip shows when coding < 30');
{
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 20);
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
    
    let lockedEvent = null;
    productRunner.on('jobLocked', (data) => {
        lockedEvent = data;
    });
    
    presence.enter(homeId);
    
    assert(lockedEvent !== null, '1a: jobLocked event fired');
    assert(lockedEvent.slot.unlockRule.skill === 'coding', '1b: Locked due to coding skill');
    assert(lockedEvent.slot.unlockRule.minXp === 30, '1c: Requires 30 XP');
    assert(productRunner.hasPendingLockedWindow(), '1d: Has pending locked window (2.0s timer)');
}
console.log();

console.log('Test 2: Locked window expires after timeout');
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
    assert(productRunner.hasPendingLockedWindow(), '2a: Has pending window initially');
    
    setTimeout(() => {
        assert(!productRunner.hasPendingLockedWindow(), '2b: Window expired after 2s');
    }, 2100);
}
console.log();

console.log('Test 3: Exit cancels locked window timer');
{
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 10);
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
    assert(productRunner.hasPendingLockedWindow(), '3a: Has pending window');
    
    presence.exit(homeId);
    assert(!productRunner.hasPendingLockedWindow(), '3b: Window cancelled on exit');
}
console.log();

console.log('Test 4: Job offered when coding >= 30');
{
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 30);
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
    
    let offeredEvent = null;
    productRunner.on('jobOffered', (data) => {
        offeredEvent = data;
    });
    
    presence.enter(homeId);
    
    assert(offeredEvent !== null, '4a: jobOffered event fired');
    assert(productRunner.getCurrentRun() !== null, '4b: Job was offered');
    assert(productRunner.getCurrentRun().state === ProductJobState.OFFERED, '4c: State is OFFERED');
    assert(!productRunner.hasPendingLockedWindow(), '4d: No pending locked window when offered');
}
console.log();

console.log('Test 5: PAID awards cash, XP, and creates product');
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
    
    let productEvent = null;
    productRunner.on('product', (data) => {
        productEvent = data;
    });
    
    presence.enter(homeId);
    productRunner.acceptJob();
    productRunner.startJob();
    
    const initialXp = skillsStub.getXp('coding');
    const initialCash = productRunner.getCashBalance();
    
    productRunner.completeJob();
    const result = productRunner.payoutJob();
    
    assert(result !== null, '5a: Payout returned result');
    assert(result.payout.amount === 80, '5b: Correct cash amount', `Expected 80, got ${result.payout.amount}`);
    assert(productRunner.getCashBalance() === initialCash + 80, '5c: Cash added to balance', `Expected ${initialCash + 80}, got ${productRunner.getCashBalance()}`);
    assert(result.xp !== null, '5d: XP was awarded');
    assert(result.xp.amount === 15, '5e: Correct XP amount', `Expected 15, got ${result.xp.amount}`);
    assert(skillsStub.getXp('coding') === initialXp + 15, '5f: XP added to skills', `Expected ${initialXp + 15}, got ${skillsStub.getXp('coding')}`);
    assert(productEvent !== null, '5g: Product event fired');
    assert(productEvent.id === 'mvp-1', '5h: Correct product ID');
    assert(productEvent.name === 'Side Project MVP', '5i: Correct product name');
    assert(productEvent.status === 'live', '5j: Product status is live');
    assert(productEvent.mrrStub === 10, '5k: Correct MRR stub');
    assert(productRegistry.get('mvp-1') !== undefined, '5l: Product upserted to registry');
    assert(productRegistry.get('mvp-1').status === 'live', '5m: Registry product is live');
}
console.log();

console.log('Test 6: One-shot - no re-offer after PAID');
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
    productRunner.acceptJob();
    productRunner.startJob();
    productRunner.completeJob();
    productRunner.payoutJob();
    
    presence.exit(homeId);
    presence.enter(homeId);
    
    const availableSlots = productRunner.getAvailableSlots();
    assert(availableSlots.length === 0, '6a: No available slots after PAID (one-shot)', `Expected 0, got ${availableSlots.length}`);
}
console.log();

console.log('Test 7: Exit during inProgress abandons job (no payout)');
{
    productRegistry.products.clear();
    
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 32);
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
    productRunner.acceptJob();
    productRunner.startJob();
    
    assert(productRunner.getCurrentRun().state === ProductJobState.IN_PROGRESS, '7a: Job in progress');
    
    const initialXp = skillsStub.getXp('coding');
    const initialCash = productRunner.getCashBalance();
    
    presence.exit(homeId);
    
    assert(productRunner.getCurrentRun().state === ProductJobState.IDLE, '7b: Job abandoned (state is IDLE)');
    assert(skillsStub.getXp('coding') === initialXp, '7c: No XP awarded on abandon', `Expected ${initialXp}, got ${skillsStub.getXp('coding')}`);
    assert(productRunner.getCashBalance() === initialCash, '7d: No cash awarded on abandon', `Expected ${initialCash}, got ${productRunner.getCashBalance()}`);
    assert(productRegistry.get('mvp-1') === undefined, '7e: No product upserted on abandon');
}
console.log();

console.log('Test 8: E-key abandon via manual state check (simulated)');
{
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 31);
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
    productRunner.acceptJob();
    productRunner.startJob();
    
    const initialXp = skillsStub.getXp('coding');
    const initialCash = productRunner.getCashBalance();
    
    presence.exit(homeId);
    
    assert(productRunner.getCurrentRun().state === ProductJobState.IDLE, '8a: State set to IDLE (simulating E-abandon)');
    assert(skillsStub.getXp('coding') === initialXp, '8b: No XP on E-abandon', `Expected ${initialXp}, got ${skillsStub.getXp('coding')}`);
    assert(productRunner.getCashBalance() === initialCash, '8c: No cash on E-abandon', `Expected ${initialCash}, got ${productRunner.getCashBalance()}`);
}
console.log();

console.log('=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All slice-9 product tests passed!');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
}

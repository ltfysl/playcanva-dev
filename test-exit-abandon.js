// Test exit-abandon behavior for all runners
// Run with: node test-exit-abandon.js

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

function loadLearnRunner() {
    const learnRunnerCode = fs.readFileSync('./src/systems/learn-runner.js', 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', `
        ${learnRunnerCode}
        sandbox.LearnJobState = LearnJobState;
        sandbox.LearnJobRun = LearnJobRun;
        sandbox.LearnRunner = LearnRunner;
    `);
    wrapper(sandbox);
    return sandbox;
}

function loadCareerRunner() {
    const careerRunnerCode = fs.readFileSync('./src/systems/career-runner.js', 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', `
        ${careerRunnerCode}
        sandbox.CareerJobState = CareerJobState;
        sandbox.CareerJobRun = CareerJobRun;
        sandbox.CareerRunner = CareerRunner;
    `);
    wrapper(sandbox);
    return sandbox;
}

function loadFreelanceSystem() {
    const freelanceCode = fs.readFileSync('./src/systems/freelance-system.js', 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', `
        ${freelanceCode}
        sandbox.JobState = JobState;
        sandbox.JobRun = JobRun;
        sandbox.FreelanceSystem = FreelanceSystem;
    `);
    wrapper(sandbox);
    return sandbox;
}

const cityModuleExports = loadCityModule();
const learnRunnerExports = loadLearnRunner();
const careerRunnerExports = loadCareerRunner();
const freelanceExports = loadFreelanceSystem();

const { CityModule, Presence, LocationId, ActivitySlot, LocationData, BuildingKind, UnlockState } = cityModuleExports;
const { LearnRunner, LearnJobState } = learnRunnerExports;
const { CareerRunner, CareerJobState } = careerRunnerExports;
const { FreelanceSystem, JobState } = freelanceExports;

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

console.log('=== Exit-Abandon Test Suite ===\n');

console.log('Test 1: LearnRunner - Exit during inProgress abandons job');
{
    const skillsStub = new SkillsStub();
    const cityModule = new CityModule();
    
    const homeId = new LocationId(BuildingKind.HOME, 0);
    const homeLocation = new LocationData(
        homeId,
        'Home',
        new pc.Vec3(0, 0, 0),
        BuildingKind.HOME,
        UnlockState.UNLOCKED
    );
    homeLocation.activitySlots = [
        new ActivitySlot('home-practice-coding', {
            name: 'Practice coding',
            skillTags: ['coding'],
            unlockRule: null,
            durationHint: 30,
            kind: 'learn',
            payoutStub: null,
            xpStub: { amount: 5 }
        })
    ];
    cityModule.locations.set(homeId.toString(), homeLocation);
    
    const learnRunner = new LearnRunner(cityModule, homeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(homeId);
    assert(learnRunner.getCurrentRun() !== null, '1a: Job offered on enter');
    
    learnRunner.acceptJob();
    assert(learnRunner.getCurrentRun().state === LearnJobState.ACCEPTED, '1b: Job accepted');
    
    learnRunner.startJob();
    assert(learnRunner.getCurrentRun().state === LearnJobState.IN_PROGRESS, '1c: Job started');
    
    const initialXp = skillsStub.getXp('coding');
    
    presence.exit(homeId);
    assert(learnRunner.getCurrentRun().state === LearnJobState.IDLE, '1d: Job abandoned on exit (state is IDLE)');
    assert(skillsStub.getXp('coding') === initialXp, '1e: No XP awarded on abandon', `Expected ${initialXp}, got ${skillsStub.getXp('coding')}`);
}
console.log();

console.log('Test 2: LearnRunner - Complete timer awards XP');
{
    const skillsStub = new SkillsStub();
    const cityModule = new CityModule();
    
    const homeId = new LocationId(BuildingKind.HOME, 0);
    const homeLocation = new LocationData(
        homeId,
        'Home',
        new pc.Vec3(0, 0, 0),
        BuildingKind.HOME,
        UnlockState.UNLOCKED
    );
    homeLocation.activitySlots = [
        new ActivitySlot('home-practice-coding', {
            name: 'Practice coding',
            skillTags: ['coding'],
            unlockRule: null,
            durationHint: 30,
            kind: 'learn',
            payoutStub: null,
            xpStub: { amount: 5 }
        })
    ];
    cityModule.locations.set(homeId.toString(), homeLocation);
    
    const learnRunner = new LearnRunner(cityModule, homeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(homeId);
    learnRunner.acceptJob();
    learnRunner.startJob();
    
    const initialXp = skillsStub.getXp('coding');
    
    learnRunner.completeJob();
    const result = learnRunner.payoutJob();
    
    assert(result !== null, '2a: Payout returned result');
    assert(result.xp !== null, '2b: XP was awarded');
    assert(result.xp.amount === 5, '2c: Correct XP amount', `Expected 5, got ${result.xp.amount}`);
    assert(skillsStub.getXp('coding') === initialXp + 5, '2d: XP added to skills', `Expected ${initialXp + 5}, got ${skillsStub.getXp('coding')}`);
}
console.log();

console.log('Test 3: CareerRunner - Exit during inProgress abandons job');
{
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 15);
    const cityModule = new CityModule();
    
    const officeId = new LocationId(BuildingKind.OFFICE, 0);
    const officeLocation = new LocationData(
        officeId,
        'Office',
        new pc.Vec3(0, 0, 0),
        BuildingKind.OFFICE,
        UnlockState.UNLOCKED
    );
    officeLocation.activitySlots = [
        new ActivitySlot('office-ticket-1', {
            name: 'Fix production ticket',
            skillTags: ['coding'],
            unlockRule: { skill: 'coding', minXp: 15 },
            durationHint: 40,
            kind: 'career',
            payoutStub: { currency: 'cash', amount: 120 },
            xpStub: { amount: 20 }
        })
    ];
    cityModule.locations.set(officeId.toString(), officeLocation);
    
    const careerRunner = new CareerRunner(cityModule, officeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(officeId);
    assert(careerRunner.getCurrentRun() !== null, '3a: Job offered on enter');
    
    careerRunner.acceptJob();
    assert(careerRunner.getCurrentRun().state === CareerJobState.ACCEPTED, '3b: Job accepted');
    
    careerRunner.startJob();
    assert(careerRunner.getCurrentRun().state === CareerJobState.IN_PROGRESS, '3c: Job started');
    
    const initialXp = skillsStub.getXp('coding');
    const initialCash = careerRunner.getCashBalance();
    
    presence.exit(officeId);
    assert(careerRunner.getCurrentRun().state === CareerJobState.IDLE, '3d: Job abandoned on exit (state is IDLE)');
    assert(skillsStub.getXp('coding') === initialXp, '3e: No XP awarded on abandon', `Expected ${initialXp}, got ${skillsStub.getXp('coding')}`);
    assert(careerRunner.getCashBalance() === initialCash, '3f: No cash awarded on abandon', `Expected ${initialCash}, got ${careerRunner.getCashBalance()}`);
}
console.log();

console.log('Test 4: CareerRunner - Complete timer awards XP and cash');
{
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 15);
    const cityModule = new CityModule();
    
    const officeId = new LocationId(BuildingKind.OFFICE, 0);
    const officeLocation = new LocationData(
        officeId,
        'Office',
        new pc.Vec3(0, 0, 0),
        BuildingKind.OFFICE,
        UnlockState.UNLOCKED
    );
    officeLocation.activitySlots = [
        new ActivitySlot('office-ticket-1', {
            name: 'Fix production ticket',
            skillTags: ['coding'],
            unlockRule: { skill: 'coding', minXp: 15 },
            durationHint: 40,
            kind: 'career',
            payoutStub: { currency: 'cash', amount: 120 },
            xpStub: { amount: 20 }
        })
    ];
    cityModule.locations.set(officeId.toString(), officeLocation);
    
    const careerRunner = new CareerRunner(cityModule, officeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(officeId);
    careerRunner.acceptJob();
    careerRunner.startJob();
    
    const initialXp = skillsStub.getXp('coding');
    const initialCash = careerRunner.getCashBalance();
    
    careerRunner.completeJob();
    const result = careerRunner.payoutJob();
    
    assert(result !== null, '4a: Payout returned result');
    assert(result.xp !== null, '4b: XP was awarded');
    assert(result.xp.amount === 20, '4c: Correct XP amount', `Expected 20, got ${result.xp.amount}`);
    assert(skillsStub.getXp('coding') === initialXp + 20, '4d: XP added to skills', `Expected ${initialXp + 20}, got ${skillsStub.getXp('coding')}`);
    assert(result.payout.amount === 120, '4e: Correct cash amount', `Expected 120, got ${result.payout.amount}`);
    assert(careerRunner.getCashBalance() === initialCash + 120, '4f: Cash added to balance', `Expected ${initialCash + 120}, got ${careerRunner.getCashBalance()}`);
}
console.log();

console.log('Test 5: FreelanceSystem - Exit during inProgress abandons job');
{
    const skillsStub = new SkillsStub();
    const cityModule = new CityModule();
    
    const cafeId = new LocationId(BuildingKind.CAFE, 0);
    const cafeLocation = new LocationData(
        cafeId,
        'Cafe',
        new pc.Vec3(0, 0, 0),
        BuildingKind.CAFE,
        UnlockState.UNLOCKED
    );
    cafeLocation.activitySlots = [
        new ActivitySlot('cafe-bugfix-1', {
            name: 'Quick bugfix',
            skillTags: ['coding'],
            unlockRule: null,
            durationHint: 30,
            kind: 'freelance',
            payoutStub: { currency: 'cash', amount: 50 },
            xpStub: { amount: 10 }
        })
    ];
    cityModule.locations.set(cafeId.toString(), cafeLocation);
    
    const freelanceSystem = new FreelanceSystem(cityModule, cafeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(cafeId);
    assert(freelanceSystem.getCurrentRun() !== null, '5a: Job offered on enter');
    
    freelanceSystem.acceptJob();
    freelanceSystem.startJob();
    assert(freelanceSystem.getCurrentRun().state === JobState.IN_PROGRESS, '5b: Job started');
    
    const initialXp = skillsStub.getXp('coding');
    const initialCash = freelanceSystem.getCashBalance();
    
    presence.exit(cafeId);
    assert(freelanceSystem.getCurrentRun().state === JobState.IDLE, '5c: Job abandoned on exit (state is IDLE)');
    assert(skillsStub.getXp('coding') === initialXp, '5d: No XP awarded on abandon', `Expected ${initialXp}, got ${skillsStub.getXp('coding')}`);
    assert(freelanceSystem.getCashBalance() === initialCash, '5e: No cash awarded on abandon', `Expected ${initialCash}, got ${freelanceSystem.getCashBalance()}`);
}
console.log();

console.log('Test 6: LearnRunner - Tick past duration after abandon → still 0 payout');
{
    const skillsStub = new SkillsStub();
    const cityModule = new CityModule();
    
    const homeId = new LocationId(BuildingKind.HOME, 0);
    const homeLocation = new LocationData(
        homeId,
        'Home',
        new pc.Vec3(0, 0, 0),
        BuildingKind.HOME,
        UnlockState.UNLOCKED
    );
    homeLocation.activitySlots = [
        new ActivitySlot('home-practice-coding', {
            name: 'Practice coding',
            skillTags: ['coding'],
            unlockRule: null,
            durationHint: 0.1,
            kind: 'learn',
            payoutStub: null,
            xpStub: { amount: 5 }
        })
    ];
    cityModule.locations.set(homeId.toString(), homeLocation);
    
    const learnRunner = new LearnRunner(cityModule, homeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(homeId);
    learnRunner.acceptJob();
    learnRunner.startJob();
    
    const initialXp = skillsStub.getXp('coding');
    
    presence.exit(homeId);
    assert(learnRunner.getCurrentRun().state === LearnJobState.IDLE, '6a: Job abandoned');
    
    for (let i = 0; i < 10; i++) {
        learnRunner.update(0.05);
    }
    
    assert(learnRunner.getCurrentRun().state === LearnJobState.IDLE, '6b: Still IDLE after ticking past duration');
    assert(skillsStub.getXp('coding') === initialXp, '6c: Still 0 XP after ticking past duration', `Expected ${initialXp}, got ${skillsStub.getXp('coding')}`);
}
console.log();

console.log('Test 7: CareerRunner - Tick past duration after abandon → still 0 payout');
{
    const skillsStub = new SkillsStub();
    skillsStub.addXp('coding', 15);
    const cityModule = new CityModule();
    
    const officeId = new LocationId(BuildingKind.OFFICE, 0);
    const officeLocation = new LocationData(
        officeId,
        'Office',
        new pc.Vec3(0, 0, 0),
        BuildingKind.OFFICE,
        UnlockState.UNLOCKED
    );
    officeLocation.activitySlots = [
        new ActivitySlot('office-ticket-1', {
            name: 'Fix production ticket',
            skillTags: ['coding'],
            unlockRule: { skill: 'coding', minXp: 15 },
            durationHint: 0.1,
            kind: 'career',
            payoutStub: { currency: 'cash', amount: 120 },
            xpStub: { amount: 20 }
        })
    ];
    cityModule.locations.set(officeId.toString(), officeLocation);
    
    const careerRunner = new CareerRunner(cityModule, officeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(officeId);
    careerRunner.acceptJob();
    careerRunner.startJob();
    
    const initialXp = skillsStub.getXp('coding');
    const initialCash = careerRunner.getCashBalance();
    
    presence.exit(officeId);
    assert(careerRunner.getCurrentRun().state === CareerJobState.IDLE, '7a: Job abandoned');
    
    for (let i = 0; i < 10; i++) {
        careerRunner.update(0.05);
    }
    
    assert(careerRunner.getCurrentRun().state === CareerJobState.IDLE, '7b: Still IDLE after ticking past duration');
    assert(skillsStub.getXp('coding') === initialXp, '7c: Still 0 XP after ticking past duration', `Expected ${initialXp}, got ${skillsStub.getXp('coding')}`);
    assert(careerRunner.getCashBalance() === initialCash, '7d: Still 0 cash after ticking past duration', `Expected ${initialCash}, got ${careerRunner.getCashBalance()}`);
}
console.log();

console.log('Test 8: FreelanceSystem - Tick past duration after abandon → still 0 payout');
{
    const skillsStub = new SkillsStub();
    const cityModule = new CityModule();
    
    const cafeId = new LocationId(BuildingKind.CAFE, 0);
    const cafeLocation = new LocationData(
        cafeId,
        'Cafe',
        new pc.Vec3(0, 0, 0),
        BuildingKind.CAFE,
        UnlockState.UNLOCKED
    );
    cafeLocation.activitySlots = [
        new ActivitySlot('cafe-bugfix-1', {
            name: 'Quick bugfix',
            skillTags: ['coding'],
            unlockRule: null,
            durationHint: 0.1,
            kind: 'freelance',
            payoutStub: { currency: 'cash', amount: 50 },
            xpStub: { amount: 10 }
        })
    ];
    cityModule.locations.set(cafeId.toString(), cafeLocation);
    
    const freelanceSystem = new FreelanceSystem(cityModule, cafeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(cafeId);
    freelanceSystem.acceptJob();
    freelanceSystem.startJob();
    
    const initialXp = skillsStub.getXp('coding');
    const initialCash = freelanceSystem.getCashBalance();
    
    presence.exit(cafeId);
    assert(freelanceSystem.getCurrentRun().state === JobState.IDLE, '8a: Job abandoned');
    
    for (let i = 0; i < 10; i++) {
        freelanceSystem.update(0.05);
    }
    
    assert(freelanceSystem.getCurrentRun().state === JobState.IDLE, '8b: Still IDLE after ticking past duration');
    assert(skillsStub.getXp('coding') === initialXp, '8c: Still 0 XP after ticking past duration', `Expected ${initialXp}, got ${skillsStub.getXp('coding')}`);
    assert(freelanceSystem.getCashBalance() === initialCash, '8d: Still 0 cash after ticking past duration', `Expected ${initialCash}, got ${freelanceSystem.getCashBalance()}`);
}
console.log();

console.log('Test 9: FreelanceSystem - Manual complete and payout still works');
{
    const skillsStub = new SkillsStub();
    const cityModule = new CityModule();
    
    const cafeId = new LocationId(BuildingKind.CAFE, 0);
    const cafeLocation = new LocationData(
        cafeId,
        'Cafe',
        new pc.Vec3(0, 0, 0),
        BuildingKind.CAFE,
        UnlockState.UNLOCKED
    );
    cafeLocation.activitySlots = [
        new ActivitySlot('cafe-bugfix-1', {
            name: 'Quick bugfix',
            skillTags: ['coding'],
            unlockRule: null,
            durationHint: 30,
            kind: 'freelance',
            payoutStub: { currency: 'cash', amount: 50 },
            xpStub: { amount: 10 }
        })
    ];
    cityModule.locations.set(cafeId.toString(), cafeLocation);
    
    const freelanceSystem = new FreelanceSystem(cityModule, cafeId, skillsStub);
    const presence = cityModule.getPresence();
    
    presence.enter(cafeId);
    freelanceSystem.acceptJob();
    freelanceSystem.startJob();
    
    const initialXp = skillsStub.getXp('coding');
    const initialCash = freelanceSystem.getCashBalance();
    
    freelanceSystem.completeJob();
    const result = freelanceSystem.payoutJob();
    
    assert(result !== null, '9a: Payout returned result');
    assert(result.xp !== null, '9b: XP was awarded');
    assert(result.xp.amount === 10, '9c: Correct XP amount', `Expected 10, got ${result.xp.amount}`);
    assert(skillsStub.getXp('coding') === initialXp + 10, '9d: XP added to skills', `Expected ${initialXp + 10}, got ${skillsStub.getXp('coding')}`);
    assert(result.payout.amount === 50, '9e: Correct cash amount', `Expected 50, got ${result.payout.amount}`);
    assert(freelanceSystem.getCashBalance() === initialCash + 50, '9f: Cash added to balance', `Expected ${initialCash + 50}, got ${freelanceSystem.getCashBalance()}`);
}
console.log();

console.log('=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All exit-abandon tests passed!');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
}

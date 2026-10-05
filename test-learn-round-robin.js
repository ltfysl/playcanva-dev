// Unit test for LearnRunner round-robin rotation using REAL module
// Run with: node test-learn-round-robin.js

// Load real modules via shim
const {
    LocationId,
    ActivitySlot,
    LocationData,
    CityModule,
    LearnRunner,
    UnlockState
} = require('./test-shim.js');

// Simple SkillsStub for testing
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

// Test Suite
console.log('=== LearnRunner Round-Robin Tests (Real Module) ===\n');

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

// Setup: Create home location with coding and design slots
const homeLocationId = new LocationId('downtown', 'starter-home');
const homeSlots = [
    new ActivitySlot('home-practice-1', {
        name: 'Practice coding',
        skillTags: ['coding'],
        unlockRule: null,
        durationHint: 20,
        kind: 'learn',
        xpStub: { amount: 5 }
    }),
    new ActivitySlot('home-design-1', {
        name: 'Practice design',
        skillTags: ['design'],
        unlockRule: null,
        durationHint: 20,
        kind: 'learn',
        xpStub: { amount: 5 }
    })
];

const homeLocation = new LocationData(homeLocationId, 'home', {
    unlockState: UnlockState.OWNED,
    activitySlots: homeSlots
});

const cityModule = new CityModule();
cityModule.registerLocation(homeLocation);

const skillsStub = new SkillsStub();
const learnRunner = new LearnRunner(cityModule, homeLocationId, skillsStub);

// Test 1: First enter offers coding slot (index 0)
console.log('Test 1: First enter → offers coding slot');
cityModule.enterLocation(homeLocationId);
assert(learnRunner.currentRun !== null, 'Job was offered');
assert(learnRunner.currentRun.slotId === 'home-practice-1', 'Offered home-practice-1 (coding)');
console.log();

// Test 2: Complete coding → exit → re-enter → offers design
console.log('Test 2: coding PAID → re-enter → offers design');
learnRunner.acceptJob();
learnRunner.startJob();
learnRunner.completeJob();
learnRunner.payoutJob();
cityModule.exitLocation(homeLocationId);
cityModule.enterLocation(homeLocationId);
assert(learnRunner.currentRun !== null, 'Job was offered after re-entry');
assert(learnRunner.currentRun.slotId === 'home-design-1', 'Offered home-design-1 (design)');
console.log();

// Test 3: Complete design → exit → re-enter → wraps to coding
console.log('Test 3: design PAID → re-enter → wraps to coding');
learnRunner.acceptJob();
learnRunner.startJob();
learnRunner.completeJob();
learnRunner.payoutJob();
cityModule.exitLocation(homeLocationId);
cityModule.enterLocation(homeLocationId);
assert(learnRunner.currentRun !== null, 'Job was offered after wrap');
assert(learnRunner.currentRun.slotId === 'home-practice-1', 'Wrapped to home-practice-1 (coding)');
console.log();

// Test 4: Slots remain repeatable
console.log('Test 4: Slots remain repeatable');
assert(skillsStub.getXp('coding') === 5, 'Coding XP accumulated (1 completion)');
assert(skillsStub.getXp('design') === 5, 'Design XP accumulated (1 completion)');
learnRunner.acceptJob();
learnRunner.startJob();
learnRunner.completeJob();
learnRunner.payoutJob();
assert(skillsStub.getXp('coding') === 10, 'Coding XP accumulated again (2nd completion)');
console.log();

// Test 5: With locked slot - skip locked in round-robin
console.log('Test 5: Locked slot skipped in round-robin');
const coworkLocationId = new LocationId('downtown', 'hub-cowork');
const coworkSlots = [
    new ActivitySlot('cowork-focus-1', {
        name: 'Deep focus',
        skillTags: ['coding'],
        unlockRule: null,
        kind: 'learn',
        xpStub: { amount: 8 }
    }),
    new ActivitySlot('cowork-advanced-1', {
        name: 'Advanced practice',
        skillTags: ['coding'],
        unlockRule: { skill: 'coding', minXp: 50 },
        kind: 'learn',
        xpStub: { amount: 12 }
    }),
    new ActivitySlot('cowork-workshop-1', {
        name: 'Workshop',
        skillTags: ['design'],
        unlockRule: null,
        kind: 'learn',
        xpStub: { amount: 8 }
    })
];

const coworkLocation = new LocationData(coworkLocationId, 'cowork', {
    unlockState: UnlockState.OWNED,
    activitySlots: coworkSlots
});

cityModule.registerLocation(coworkLocation);
cityModule.exitLocation(homeLocationId);
cityModule.enterLocation(coworkLocationId);

assert(learnRunner.currentRun !== null, 'Cowork job offered');
assert(learnRunner.currentRun.slotId === 'cowork-focus-1', 'Offered cowork-focus-1 (unlocked)');

learnRunner.acceptJob();
learnRunner.startJob();
learnRunner.completeJob();
learnRunner.payoutJob();
cityModule.exitLocation(coworkLocationId);
cityModule.enterLocation(coworkLocationId);

assert(learnRunner.currentRun !== null, 'Second cowork job offered');
assert(learnRunner.currentRun.slotId === 'cowork-workshop-1', 'Skipped locked slot, offered cowork-workshop-1');
console.log();

// Test 6: Different locations have independent rotation
console.log('Test 6: Locations have independent rotation state');
cityModule.exitLocation(coworkLocationId);
cityModule.enterLocation(homeLocationId);
assert(learnRunner.currentRun.slotId === 'home-design-1', 'Home offers design (its next in rotation)');
console.log();

// Test 7a: Inserting a new learn slot before the last-paid one still offers the slot after the last-paid id
console.log('Test 7a: Insert slot before last-paid ID → still offers slot after last-paid ID');
// Current state: home last paid = home-practice-1 (from test 4), next should be home-design-1
// Insert a new slot before home-practice-1
const homeWithNewSlot = new LocationData(homeLocationId, 'home', {
    unlockState: UnlockState.OWNED,
    activitySlots: [
        new ActivitySlot('home-research-1', {
            name: 'Research topics',
            skillTags: ['research'],
            unlockRule: null,
            kind: 'learn',
            xpStub: { amount: 5 }
        }),
        new ActivitySlot('home-practice-1', {
            name: 'Practice coding',
            skillTags: ['coding'],
            unlockRule: null,
            durationHint: 20,
            kind: 'learn',
            xpStub: { amount: 5 }
        }),
        new ActivitySlot('home-design-1', {
            name: 'Practice design',
            skillTags: ['design'],
            unlockRule: null,
            durationHint: 20,
            kind: 'learn',
            xpStub: { amount: 5 }
        })
    ]
});
cityModule.registerLocation(homeWithNewSlot);
cityModule.exitLocation(homeLocationId);
cityModule.enterLocation(homeLocationId);
assert(learnRunner.currentRun.slotId === 'home-design-1', 'Still offers design (next after home-practice-1 by ID)');
console.log();

// Test 7b: Removed last-paid id falls back to index 0
console.log('Test 7b: Last-paid ID removed → falls back to index 0');
// Pay the design slot first
learnRunner.acceptJob();
learnRunner.startJob();
learnRunner.completeJob();
learnRunner.payoutJob();
// Now register location without the last-paid slot (home-design-1 was paid)
const homeAfterRemoval = new LocationData(homeLocationId, 'home', {
    unlockState: UnlockState.OWNED,
    activitySlots: [
        new ActivitySlot('home-research-1', {
            name: 'Research topics',
            skillTags: ['research'],
            unlockRule: null,
            kind: 'learn',
            xpStub: { amount: 5 }
        }),
        new ActivitySlot('home-writing-1', {
            name: 'Practice writing',
            skillTags: ['writing'],
            unlockRule: null,
            kind: 'learn',
            xpStub: { amount: 5 }
        })
    ]
});
cityModule.registerLocation(homeAfterRemoval);
cityModule.exitLocation(homeLocationId);
cityModule.enterLocation(homeLocationId);
assert(learnRunner.currentRun.slotId === 'home-research-1', 'Falls back to index 0 when last-paid ID missing');
console.log();

// Test 7c: Explicit coding->design->coding wrap test
console.log('Test 7c: Coding→Design→Coding wrap cycle');
// Reset to original home location
const originalHome = new LocationData(homeLocationId, 'home', {
    unlockState: UnlockState.OWNED,
    activitySlots: [
        new ActivitySlot('home-practice-1', {
            name: 'Practice coding',
            skillTags: ['coding'],
            unlockRule: null,
            durationHint: 20,
            kind: 'learn',
            xpStub: { amount: 5 }
        }),
        new ActivitySlot('home-design-1', {
            name: 'Practice design',
            skillTags: ['design'],
            unlockRule: null,
            durationHint: 20,
            kind: 'learn',
            xpStub: { amount: 5 }
        })
    ]
});
cityModule.registerLocation(originalHome);
// Clear rotation state for fresh test
const runner2 = new LearnRunner(cityModule, homeLocationId, skillsStub);
cityModule.exitLocation(homeLocationId);
cityModule.enterLocation(homeLocationId);
assert(runner2.currentRun.slotId === 'home-practice-1', 'Wrap test: First offer is coding');
runner2.acceptJob();
runner2.startJob();
runner2.completeJob();
runner2.payoutJob();
cityModule.exitLocation(homeLocationId);
cityModule.enterLocation(homeLocationId);
assert(runner2.currentRun.slotId === 'home-design-1', 'Wrap test: Second offer is design');
runner2.acceptJob();
runner2.startJob();
runner2.completeJob();
runner2.payoutJob();
cityModule.exitLocation(homeLocationId);
cityModule.enterLocation(homeLocationId);
assert(runner2.currentRun.slotId === 'home-practice-1', 'Wrap test: Third offer wraps back to coding');
console.log();

// Summary
console.log('=== Summary ===');
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

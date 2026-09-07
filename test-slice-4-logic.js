// Unit test for slice-4 unlock logic
// Run with: node test-slice-4-logic.js

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

class ActivitySlot {
    constructor(id, config = {}) {
        this.id = id;
        this.name = config.name || id;
        this.skillTags = config.skillTags || [];
        this.unlockRule = config.unlockRule || null;
        this.kind = config.kind || 'activity';
        this.payoutStub = config.payoutStub || null;
        this.xpStub = config.xpStub || null;
    }
    
    isUnlocked(skillsStub = null) {
        if (!this.unlockRule) return true;
        if (!skillsStub) return false;
        
        const { skill, minXp } = this.unlockRule;
        return skillsStub.getXp(skill) >= minXp;
    }
}

class RunnerRegistry {
    constructor() {
        this.runners = new Map();
    }
    
    register(kind, runner) {
        this.runners.set(kind, runner);
    }
    
    get(kind) {
        return this.runners.get(kind);
    }
    
    has(kind) {
        return this.runners.has(kind);
    }
}

// Test Suite
console.log('=== Slice-4 Logic Tests ===\n');

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

// Test 1: unlockRule null → always unlocked
console.log('Test 1: unlockRule null (bugfix slot)');
const bugfixSlot = new ActivitySlot('cafe-bugfix-1', {
    name: 'Quick bugfix',
    skillTags: ['coding'],
    unlockRule: null,
    kind: 'freelance',
    payoutStub: { currency: 'cash', amount: 50 },
    xpStub: { amount: 10 }
});
const skillsStub = new SkillsStub();
assert(bugfixSlot.isUnlocked(skillsStub), 'Bugfix unlocked with 0 XP');
assert(bugfixSlot.isUnlocked(null), 'Bugfix unlocked with null skillsStub');
console.log();

// Test 2: unlockRule with minXp → locked when XP < min
console.log('Test 2: unlockRule { skill: coding, minXp: 10 } (feature slot)');
const featureSlot = new ActivitySlot('cafe-feature-1', {
    name: 'Small feature patch',
    skillTags: ['coding'],
    unlockRule: { skill: 'coding', minXp: 10 },
    kind: 'freelance',
    payoutStub: { currency: 'cash', amount: 80 },
    xpStub: { amount: 15 }
});
assert(!featureSlot.isUnlocked(skillsStub), 'Feature locked with 0 XP');
assert(!featureSlot.isUnlocked(null), 'Feature locked with null skillsStub');
console.log();

// Test 3: Unlock after gaining XP
console.log('Test 3: Unlock progression');
skillsStub.addXp('coding', 5);
assert(!featureSlot.isUnlocked(skillsStub), 'Feature still locked with 5 XP');
skillsStub.addXp('coding', 4);
assert(!featureSlot.isUnlocked(skillsStub), 'Feature still locked with 9 XP');
skillsStub.addXp('coding', 1);
assert(featureSlot.isUnlocked(skillsStub), 'Feature unlocked with 10 XP');
skillsStub.addXp('coding', 5);
assert(featureSlot.isUnlocked(skillsStub), 'Feature still unlocked with 15 XP');
console.log();

// Test 4: Runner Registry
console.log('Test 4: RunnerRegistry');
const registry = new RunnerRegistry();
const mockRunner = { name: 'freelance', offer: () => {} };
registry.register('freelance', mockRunner);
assert(registry.has('freelance'), 'Freelance runner registered');
assert(registry.get('freelance') === mockRunner, 'Freelance runner retrieved');
assert(!registry.has('cafe'), 'Cafe runner not registered');
assert(registry.get('cafe') === undefined, 'Nonexistent runner returns undefined');
console.log();

// Test 5: Slot kind filtering
console.log('Test 5: Slot kind');
assert(bugfixSlot.kind === 'freelance', 'Bugfix slot is freelance kind');
assert(featureSlot.kind === 'freelance', 'Feature slot is freelance kind');
console.log();

// Test 6: XP award from xpStub
console.log('Test 6: XP awards');
const freshSkills = new SkillsStub();
const xpAmount = bugfixSlot.xpStub.amount;
const skillTag = bugfixSlot.skillTags[0];
freshSkills.addXp(skillTag, xpAmount);
assert(freshSkills.getXp('coding') === 10, 'Bugfix awards 10 coding XP');
freshSkills.addXp(skillTag, featureSlot.xpStub.amount);
assert(freshSkills.getXp('coding') === 25, 'Feature awards 15 coding XP (total 25)');
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

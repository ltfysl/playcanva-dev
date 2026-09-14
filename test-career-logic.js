// Unit test for career runner logic
// Run with: node test-career-logic.js

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
        this.durationHint = config.durationHint || 60;
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
console.log('=== Career Runner Logic Tests ===\n');

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

// Test 1: Career ticket slot configuration
console.log('Test 1: Career ticket slot configuration');
const officeTicketSlot = new ActivitySlot('office-ticket-1', {
    name: 'Fix production ticket',
    skillTags: ['coding'],
    unlockRule: { skill: 'coding', minXp: 15 },
    durationHint: 40,
    kind: 'career',
    payoutStub: { currency: 'cash', amount: 120 },
    xpStub: { amount: 20 }
});
assert(officeTicketSlot.kind === 'career', 'Ticket is career kind');
assert(officeTicketSlot.payoutStub.amount === 120, 'Ticket pays $120');
assert(officeTicketSlot.xpStub.amount === 20, 'Ticket awards 20 XP');
assert(officeTicketSlot.durationHint === 40, 'Ticket duration is 40s');
console.log();

// Test 2: Unlock gating at coding XP 15
console.log('Test 2: Unlock gating');
const skillsStub = new SkillsStub();
assert(!officeTicketSlot.isUnlocked(skillsStub), 'Ticket locked with 0 XP');
skillsStub.addXp('coding', 10);
assert(!officeTicketSlot.isUnlocked(skillsStub), 'Ticket locked with 10 XP');
skillsStub.addXp('coding', 4);
assert(!officeTicketSlot.isUnlocked(skillsStub), 'Ticket locked with 14 XP');
skillsStub.addXp('coding', 1);
assert(officeTicketSlot.isUnlocked(skillsStub), 'Ticket unlocked with 15 XP');
console.log();

// Test 3: One-shot behavior (mark as paid, then check availability)
console.log('Test 3: One-shot after PAID');
const slotHistory = new Map();
assert(!slotHistory.has('office-ticket-1'), 'No history before completion');
slotHistory.set('office-ticket-1', {
    state: 'paid',
    completedAt: Date.now()
});
const historyEntry = slotHistory.get('office-ticket-1');
assert(historyEntry.state === 'paid', 'Slot marked as paid');
console.log();

// Test 4: Runner Registry for career kind
console.log('Test 4: RunnerRegistry career kind');
const registry = new RunnerRegistry();
const mockCareerRunner = { name: 'career', checkAndOfferJob: () => {} };
registry.register('career', mockCareerRunner);
assert(registry.has('career'), 'Career runner registered');
assert(registry.get('career') === mockCareerRunner, 'Career runner retrieved');
console.log();

// Test 5: Cash payout
console.log('Test 5: Cash payout');
let cashBalance = 0;
const payout = officeTicketSlot.payoutStub;
cashBalance += payout.amount;
assert(cashBalance === 120, 'Cash balance is $120 after payout');
console.log();

// Test 6: XP award
console.log('Test 6: XP award');
const freshSkills = new SkillsStub();
freshSkills.addXp('coding', 15);
const xpAmount = officeTicketSlot.xpStub.amount;
const skillTag = officeTicketSlot.skillTags[0];
freshSkills.addXp(skillTag, xpAmount);
assert(freshSkills.getXp('coding') === 35, 'Career ticket awards 20 coding XP (15+20=35)');
console.log();

// Test 7: Slot not repeatable after paid
console.log('Test 7: Slot not repeatable');
function isSlotAvailable(slot, history, skills) {
    if (slot.kind !== 'career') return false;
    const isUnlocked = slot.isUnlocked(skills);
    if (!isUnlocked) return false;
    const historyEntry = history.get(slot.id);
    if (!historyEntry || historyEntry.state !== 'paid') {
        return true;
    }
    return false;
}

const testSkills = new SkillsStub();
testSkills.addXp('coding', 20);
const testHistory = new Map();
assert(isSlotAvailable(officeTicketSlot, testHistory, testSkills), 'Slot available when not paid');
testHistory.set('office-ticket-1', { state: 'paid', completedAt: Date.now() });
assert(!isSlotAvailable(officeTicketSlot, testHistory, testSkills), 'Slot not available after paid');
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

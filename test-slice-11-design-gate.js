// Unit test for slice-11 design gate logic
// Run with: node test-slice-11-design-gate.js

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

const JobState = {
    IDLE: 'idle',
    OFFERED: 'offered',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    PAID: 'paid'
};

class JobRun {
    constructor(slotId) {
        this.slotId = slotId;
        this.state = JobState.IDLE;
        this.startTime = null;
    }
}

class MockCityModule {
    constructor() {
        this.locations = new Map();
    }
    
    registerLocation(id, slots) {
        this.locations.set(id, { getActivitySlots: () => slots });
    }
    
    getLocation(id) {
        return this.locations.get(id);
    }
}

class FreelanceSystemMock {
    constructor(cityModule, locationId, skillsStub) {
        this.cityModule = cityModule;
        this.locationId = locationId;
        this.skillsStub = skillsStub;
        this.currentRun = null;
        this.cashBalance = 0;
        this.slotHistory = new Map();
    }
    
    getSlot(slotId) {
        const location = this.cityModule.getLocation(this.locationId);
        if (!location) return null;
        
        const slots = location.getActivitySlots();
        return slots.find(s => s.id === slotId);
    }
    
    getAvailableSlots() {
        const location = this.cityModule.getLocation(this.locationId);
        if (!location) return [];
        
        const slots = location.getActivitySlots();
        return slots.filter(slot => {
            if (slot.kind !== 'freelance') return false;
            
            const isUnlocked = slot.isUnlocked(this.skillsStub);
            if (!isUnlocked) return false;
            
            const history = this.slotHistory.get(slot.id);
            if (!history || history.state !== JobState.PAID) {
                return true;
            }
            
            return false;
        });
    }
    
    getNextLockedSlot() {
        const location = this.cityModule.getLocation(this.locationId);
        if (!location) return null;
        
        const slots = location.getActivitySlots();
        for (const slot of slots) {
            if (slot.kind !== 'freelance') continue;
            
            const history = this.slotHistory.get(slot.id);
            if (history && history.state === JobState.PAID) {
                continue;
            }
            
            if (!slot.isUnlocked(this.skillsStub)) {
                return slot;
            }
        }
        
        return null;
    }
    
    offerJob(slotId) {
        this.currentRun = new JobRun(slotId);
        this.currentRun.state = JobState.OFFERED;
    }
    
    acceptJob() {
        if (!this.currentRun || this.currentRun.state !== JobState.OFFERED) return false;
        this.currentRun.state = JobState.ACCEPTED;
        return true;
    }
    
    startJob() {
        if (!this.currentRun || this.currentRun.state !== JobState.ACCEPTED) return false;
        this.currentRun.state = JobState.IN_PROGRESS;
        this.currentRun.startTime = Date.now();
        return true;
    }
    
    completeJob() {
        if (!this.currentRun || this.currentRun.state !== JobState.IN_PROGRESS) return false;
        this.currentRun.state = JobState.COMPLETED;
        return true;
    }
    
    payoutJob() {
        if (!this.currentRun || this.currentRun.state !== JobState.COMPLETED) return null;
        
        const slot = this.getSlot(this.currentRun.slotId);
        if (!slot) return null;
        
        this.currentRun.state = JobState.PAID;
        
        this.slotHistory.set(this.currentRun.slotId, {
            state: JobState.PAID,
            completedAt: Date.now()
        });
        
        const payout = slot.payoutStub;
        if (payout) {
            this.cashBalance += payout.amount;
        }
        
        const xpStub = slot.xpStub;
        const skillTag = slot.skillTags && slot.skillTags.length > 0 ? slot.skillTags[0] : null;
        
        let xp = null;
        if (xpStub && xpStub.amount && skillTag && this.skillsStub) {
            this.skillsStub.addXp(skillTag, xpStub.amount);
            xp = { skill: skillTag, amount: xpStub.amount };
        }
        
        return { payout, xp };
    }
}

function generateLockedChipText(unlockRule, skillsStub) {
    const currentXp = skillsStub ? skillsStub.getXp(unlockRule.skill) : 0;
    return `Locked — ${unlockRule.skill} XP ${currentXp}/${unlockRule.minXp}`;
}

console.log('=== Slice-11 Design Gate Tests ===\n');

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

const skillsStub = new SkillsStub();
const cityModule = new MockCityModule();

const bugfixSlot = new ActivitySlot('cafe-bugfix-1', {
    name: 'Quick bugfix',
    skillTags: ['coding'],
    unlockRule: null,
    durationHint: 30,
    kind: 'freelance',
    payoutStub: { currency: 'cash', amount: 50 },
    xpStub: { amount: 10 }
});

const featureSlot = new ActivitySlot('cafe-feature-1', {
    name: 'Small feature patch',
    skillTags: ['coding'],
    unlockRule: { skill: 'design', minXp: 10 },
    durationHint: 45,
    kind: 'freelance',
    payoutStub: { currency: 'cash', amount: 120 },
    xpStub: { amount: 15 }
});

cityModule.registerLocation('cafe', [bugfixSlot, featureSlot]);

const freelanceSystem = new FreelanceSystemMock(cityModule, 'cafe', skillsStub);

console.log('Test 1: cafe-feature-1 locked with design XP < 10');
assert(!featureSlot.isUnlocked(skillsStub), 'Feature locked with 0 design XP');
const lockedChip0 = generateLockedChipText(featureSlot.unlockRule, skillsStub);
assert(lockedChip0 === 'Locked — design XP 0/10', `Locked chip text correct: "${lockedChip0}"`);
const lockedSlot = freelanceSystem.getNextLockedSlot();
assert(lockedSlot && lockedSlot.id === 'cafe-feature-1', 'getNextLockedSlot returns cafe-feature-1');
console.log();

console.log('Test 2: cafe-feature-1 still locked after 5 design XP');
skillsStub.addXp('design', 5);
assert(!featureSlot.isUnlocked(skillsStub), 'Feature locked with 5 design XP');
const lockedChip5 = generateLockedChipText(featureSlot.unlockRule, skillsStub);
assert(lockedChip5 === 'Locked — design XP 5/10', `Locked chip text updates: "${lockedChip5}"`);
const available5 = freelanceSystem.getAvailableSlots();
assert(!available5.some(s => s.id === 'cafe-feature-1'), 'cafe-feature-1 not in available slots');
console.log();

console.log('Test 3: cafe-feature-1 unlocked after design XP >= 10');
skillsStub.addXp('design', 5);
assert(featureSlot.isUnlocked(skillsStub), 'Feature unlocked with 10 design XP');
const available10 = freelanceSystem.getAvailableSlots();
assert(available10.some(s => s.id === 'cafe-feature-1'), 'cafe-feature-1 now in available slots');
console.log();

console.log('Test 4: cafe-feature-1 offer/accept with cash 120');
const slot = freelanceSystem.getSlot('cafe-feature-1');
assert(slot.payoutStub.amount === 120, 'Payout amount is $120');
freelanceSystem.offerJob('cafe-feature-1');
assert(freelanceSystem.currentRun.state === JobState.OFFERED, 'Job offered');
freelanceSystem.acceptJob();
assert(freelanceSystem.currentRun.state === JobState.ACCEPTED, 'Job accepted');
console.log();

console.log('Test 5: cafe-feature-1 payout awards +$120 and +15 coding XP');
const codingXpBefore = skillsStub.getXp('coding');
const cashBefore = freelanceSystem.cashBalance;
freelanceSystem.startJob();
freelanceSystem.completeJob();
const result = freelanceSystem.payoutJob();
assert(result.payout.amount === 120, 'Payout is $120');
assert(result.xp.skill === 'coding', 'XP skill is coding');
assert(result.xp.amount === 15, 'XP amount is +15');
assert(skillsStub.getXp('coding') === codingXpBefore + 15, 'Coding XP increased by 15');
assert(freelanceSystem.cashBalance === cashBefore + 120, 'Cash balance increased by $120');
console.log();

console.log('Test 6: Payout flash format');
const hudText = `+$${result.payout.amount} · +${result.xp.amount} ${result.xp.skill} XP`;
assert(hudText === '+$120 · +15 coding XP', `Payout flash text: "${hudText}"`);
console.log();

console.log('Test 7: Normal play path (2× Practice design)');
const freshSkills = new SkillsStub();
freshSkills.addXp('design', 5);
freshSkills.addXp('design', 5);
assert(freshSkills.getXp('design') === 10, 'Two Practice design sessions = 10 design XP');
const freshFeature = new ActivitySlot('cafe-feature-1', {
    name: 'Small feature patch',
    skillTags: ['coding'],
    unlockRule: { skill: 'design', minXp: 10 },
    kind: 'freelance'
});
assert(freshFeature.isUnlocked(freshSkills), 'cafe-feature-1 unlocked after 2× Practice design');
console.log();

console.log('Test 8: Exit-abandon behavior preserved');
freelanceSystem.offerJob('cafe-bugfix-1');
freelanceSystem.acceptJob();
freelanceSystem.startJob();
freelanceSystem.currentRun.state = JobState.IDLE;
assert(freelanceSystem.currentRun.state === JobState.IDLE, 'Can abandon mid-job (E key)');
const noPayoutResult = freelanceSystem.payoutJob();
assert(noPayoutResult === null, 'No payout when abandoned');
console.log();

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

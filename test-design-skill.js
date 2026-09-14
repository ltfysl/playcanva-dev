// Unit test for design skill (slice-8)
// Run with: node test-design-skill.js

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

// Test Suite
console.log('=== Design Skill Tests (Slice-8) ===\n');

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

// Test 1: home-design-1 slot structure
console.log('Test 1: home-design-1 ActivitySlot');
const designSlot = new ActivitySlot('home-design-1', {
    name: 'Practice design',
    skillTags: ['design'],
    unlockRule: null,
    durationHint: 20,
    kind: 'learn',
    payoutStub: null,
    xpStub: { amount: 5 }
});
assert(designSlot.id === 'home-design-1', 'Slot has correct id');
assert(designSlot.name === 'Practice design', 'Slot has correct name');
assert(designSlot.kind === 'learn', 'Slot is learn kind');
assert(designSlot.skillTags[0] === 'design', 'Slot has design skill tag');
assert(designSlot.xpStub.amount === 5, 'Slot awards 5 XP');
assert(designSlot.durationHint === 20, 'Slot has 20s duration hint');
console.log();

// Test 2: Design slot is unlocked (null unlockRule)
console.log('Test 2: Design slot unlock behavior');
const skillsStub = new SkillsStub();
assert(designSlot.isUnlocked(skillsStub), 'Design slot unlocked with 0 XP');
assert(designSlot.isUnlocked(null), 'Design slot unlocked with null skillsStub');
console.log();

// Test 3: SkillsStub works with 'design' tag
console.log('Test 3: SkillsStub design XP tracking');
assert(skillsStub.getXp('design') === 0, 'Initial design XP is 0');
skillsStub.addXp('design', 5);
assert(skillsStub.getXp('design') === 5, 'After first practice: 5 XP');
skillsStub.addXp('design', 5);
assert(skillsStub.getXp('design') === 10, 'After second practice: 10 XP');
console.log();

// Test 4: Coding and design XP are independent
console.log('Test 4: Multiple skills are independent');
const multiSkills = new SkillsStub();
multiSkills.addXp('coding', 10);
multiSkills.addXp('design', 5);
assert(multiSkills.getXp('coding') === 10, 'Coding XP is 10');
assert(multiSkills.getXp('design') === 5, 'Design XP is 5');
multiSkills.addXp('coding', 5);
assert(multiSkills.getXp('coding') === 15, 'Coding XP increases independently');
assert(multiSkills.getXp('design') === 5, 'Design XP unchanged');
console.log();

// Test 5: home-practice-1 slot for comparison
console.log('Test 5: Comparison with home-practice-1');
const codingSlot = new ActivitySlot('home-practice-1', {
    name: 'Practice coding',
    skillTags: ['coding'],
    unlockRule: null,
    durationHint: 20,
    kind: 'learn',
    payoutStub: null,
    xpStub: { amount: 5 }
});
assert(codingSlot.kind === 'learn', 'Coding slot is learn kind');
assert(designSlot.kind === 'learn', 'Design slot is learn kind');
assert(codingSlot.durationHint === designSlot.durationHint, 'Both have same duration');
assert(codingSlot.xpStub.amount === designSlot.xpStub.amount, 'Both award same XP amount');
console.log();

// Test 6: Slot ordering preference
console.log('Test 6: Slot ordering');
const homeSlots = [codingSlot, designSlot];
const availableLearnSlots = homeSlots.filter(s => s.kind === 'learn' && s.isUnlocked(skillsStub));
assert(availableLearnSlots.length === 2, 'Both learn slots are available');
assert(availableLearnSlots[0].id === 'home-practice-1', 'First available is coding practice');
assert(availableLearnSlots[1].id === 'home-design-1', 'Second available is design practice');
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

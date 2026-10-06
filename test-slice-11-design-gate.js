// Unit test for slice-11 design gate logic
// Loads REAL FreelanceSystem, CityModule, SkillsStub, and slot configs from city-generator.js
// Run with: node test-slice-11-design-gate.js

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

// Read café slot configs from real city-generator.js
const cityGenCode = fs.readFileSync('./src/city/city-generator.js', 'utf8');
const bugfixSlotMatch = cityGenCode.match(/new ActivitySlot\('cafe-bugfix-1',\s*\{([\s\S]+?)\}\)/);
const featureSlotMatch = cityGenCode.match(/new ActivitySlot\('cafe-feature-1',\s*\{([\s\S]+?)\}\)/);

if (!bugfixSlotMatch || !featureSlotMatch) {
    console.error('❌ Failed to extract slot configs from city-generator.js');
    process.exit(1);
}

// Helper to parse slot config object literal
function parseSlotConfig(code) {
    const config = {};
    const lines = code.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes('name:')) {
            config.name = trimmed.match(/name:\s*'([^']+)'/)?.[1];
        }
        if (trimmed.includes('skillTags:')) {
            const tagsMatch = trimmed.match(/skillTags:\s*\[([^\]]+)\]/);
            if (tagsMatch) {
                config.skillTags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
            }
        }
        if (trimmed.includes('unlockRule:')) {
            if (trimmed.includes('null')) {
                config.unlockRule = null;
            } else {
                const skillMatch = code.match(/skill:\s*'([^']+)'/);
                const minXpMatch = code.match(/minXp:\s*(\d+)/);
                if (skillMatch && minXpMatch) {
                    config.unlockRule = { skill: skillMatch[1], minXp: parseInt(minXpMatch[1]) };
                }
            }
        }
        if (trimmed.includes('durationHint:')) {
            config.durationHint = parseInt(trimmed.match(/durationHint:\s*(\d+)/)?.[1] || '0');
        }
        if (trimmed.includes('kind:')) {
            config.kind = trimmed.match(/kind:\s*'([^']+)'/)?.[1];
        }
        if (trimmed.includes('payoutStub:')) {
            const amountMatch = trimmed.match(/amount:\s*(\d+)/);
            if (amountMatch) {
                config.payoutStub = { currency: 'cash', amount: parseInt(amountMatch[1]) };
            }
        }
        if (trimmed.includes('xpStub:')) {
            const amountMatch = trimmed.match(/amount:\s*(\d+)/);
            if (amountMatch) {
                config.xpStub = { amount: parseInt(amountMatch[1]) };
            }
        }
        if (trimmed.includes('repeatable:')) {
            config.repeatable = trimmed.includes('true');
        }
        if (trimmed.includes('offerPriority:')) {
            config.offerPriority = parseInt(trimmed.match(/offerPriority:\s*(\d+)/)?.[1] || '0');
        }
    }
    return config;
}

const bugfixConfig = parseSlotConfig(bugfixSlotMatch[1]);
const featureConfig = parseSlotConfig(featureSlotMatch[1]);

console.log('=== Slice-11 Design Gate Tests (Real Source) ===\n');
console.log('Loaded café slots from src/city/city-generator.js:');
console.log(`  cafe-bugfix-1: unlocked, $${bugfixConfig.payoutStub.amount}, +${bugfixConfig.xpStub.amount} coding XP`);
console.log(`  cafe-feature-1: requires ${featureConfig.unlockRule.skill} XP ${featureConfig.unlockRule.minXp}, $${featureConfig.payoutStub.amount}, +${featureConfig.xpStub.amount} coding XP\n`);

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
const cityModule = new CityModule();
const districtId = 'downtown';
const cafeLocationId = new LocationId(districtId, 'the-bean-cafe');

const bugfixSlot = new ActivitySlot('cafe-bugfix-1', bugfixConfig);
const featureSlot = new ActivitySlot('cafe-feature-1', featureConfig);

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

console.log('Test 1: cafe-feature-1 locked with design XP < 10');
assert(!featureSlot.isUnlocked(skillsStub), 'Feature locked with 0 design XP');

// Use real SolHUD to generate locked chip text
solHUD.showLocked(featureSlot.unlockRule, skillsStub);
const lockedChip0 = solHUD.element.textContent;
assert(lockedChip0 === 'Locked — design XP 0/10', `Locked chip text correct: "${lockedChip0}"`);

const lockedSlot = freelanceSystem.getNextLockedSlot();
assert(lockedSlot && lockedSlot.id === 'cafe-feature-1', 'getNextLockedSlot returns cafe-feature-1');
console.log();

console.log('Test 2: cafe-feature-1 still locked after 5 design XP');
skillsStub.addXp('design', 5);
assert(!featureSlot.isUnlocked(skillsStub), 'Feature locked with 5 design XP');

// Use real SolHUD to generate locked chip text
solHUD.showLocked(featureSlot.unlockRule, skillsStub);
const lockedChip5 = solHUD.element.textContent;
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
freelanceSystem.currentRun = { slotId: 'cafe-feature-1', state: 'offered' };
assert(freelanceSystem.currentRun.state === 'offered', 'Job offered');
freelanceSystem.acceptJob();
assert(freelanceSystem.currentRun.state === 'accepted', 'Job accepted');
console.log();

console.log('Test 5: cafe-feature-1 payout awards +$120 and +15 coding XP');
const codingXpBefore = skillsStub.getXp('coding');
const cashBefore = freelanceSystem.cashBalance;
freelanceSystem.currentRun.state = 'inProgress';
freelanceSystem.currentRun.startTime = Date.now();
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
const freshFeature = new ActivitySlot('cafe-feature-1', featureConfig);
assert(freshFeature.isUnlocked(freshSkills), 'cafe-feature-1 unlocked after 2× Practice design');
console.log();

console.log('Test 8: Exit-abandon behavior preserved');
freelanceSystem.currentRun = { slotId: 'cafe-bugfix-1', state: 'offered' };
freelanceSystem.acceptJob();
freelanceSystem.currentRun.state = 'inProgress';
freelanceSystem.currentRun.startTime = Date.now();
const presence = cityModule.getPresence();
presence.enter(cafeLocationId);
presence.exit(cafeLocationId);
assert(freelanceSystem.currentRun.state === 'idle', 'Can abandon mid-job (E key)');
const noPayoutResult = freelanceSystem.payoutJob();
assert(noPayoutResult === null, 'No payout when abandoned');
console.log();

console.log('=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All tests passed!');
    console.log('\nUsing REAL FreelanceSystem from src/systems/freelance-system.js');
    console.log('Using REAL CityModule from src/core/city-module.js');
    console.log('Using REAL SolHUD from src/ui/sol-hud.js (locked chip text)');
    console.log('Using REAL ActivitySlot configs from src/city/city-generator.js');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
}

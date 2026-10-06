// Regression test for freelance re-offer after PAID
// Tests: repeatable flag, offerPriority, locked chip every entry, 2s delay, timeout cancellation
// Loads REAL FreelanceSystem, CityModule, SkillsStub, and slot configs from city-generator.js
// Run with: node test-freelance-re-offer.js

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
    createElement: () => ({}),
    getElementById: () => null
};

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
                const skillMatch = trimmed.match(/skill:\s*'([^']+)'/);
                const minXpMatch = trimmed.match(/minXp:\s*(\d+)/);
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

console.log('=== Freelance Re-Offer Regression Test (Real Source) ===\n');
console.log('Loaded café slots from src/city/city-generator.js:');
console.log(`  cafe-bugfix-1: $${bugfixConfig.payoutStub.amount}, repeatable=${bugfixConfig.repeatable}`);
console.log(`  cafe-feature-1: $${featureConfig.payoutStub.amount}, priority=${featureConfig.offerPriority}, repeatable=${featureConfig.repeatable !== false ? 'default(false)' : false}\n`);

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

// Track events
let lastLockedSlot = null;
let lastOfferedSlot = null;
let offerCount = 0;

freelanceSystem.on('jobLocked', (data) => {
    lastLockedSlot = data.slot;
});

freelanceSystem.on('jobOffered', (data) => {
    lastOfferedSlot = data.slot;
    offerCount++;
});

console.log('Test 1: Enter café at design XP=5 shows locked chip');
skillsStub.addXp('design', 5);
const presence = cityModule.getPresence();
presence.enter(cafeLocationId);

setTimeout(() => {
    assert(lastLockedSlot && lastLockedSlot.id === 'cafe-feature-1', '1a: Locked chip shown for cafe-feature-1');
    assert(lastOfferedSlot === null, '1b: No offer yet (waiting 2s)');
    
    // Wait for 2s timeout
    setTimeout(() => {
        console.log('\nTest 2: After 2s, bugfix is offered');
        assert(lastOfferedSlot && lastOfferedSlot.id === 'cafe-bugfix-1', '2a: Bugfix offered after locked chip delay');
        
        console.log('\nTest 3: Complete and pay bugfix');
        freelanceSystem.acceptJob();
        freelanceSystem.currentRun.state = 'inProgress';
        freelanceSystem.completeJob();
        const result1 = freelanceSystem.payoutJob();
        assert(result1.payout.amount === 50, '3a: Bugfix paid $50');
        assert(result1.xp.amount === 10, '3b: Bugfix gave +10 coding XP');
        assert(freelanceSystem.currentRun.state === 'idle', '3c: After payout, state is IDLE');
        
        console.log('\nTest 4: Exit within 2s cancels timeout');
        presence.exit(cafeLocationId);
        lastOfferedSlot = null;
        lastLockedSlot = null;
        offerCount = 0;
        
        presence.enter(cafeLocationId);
        
        setTimeout(() => {
            // Exit before 2s
            presence.exit(cafeLocationId);
            
            setTimeout(() => {
                assert(offerCount === 0, '4a: No offer fired after early exit');
                
                console.log('\nTest 5: Re-enter café - locked chip shows again, then bugfix offered (repeatable)');
                lastOfferedSlot = null;
                lastLockedSlot = null;
                offerCount = 0;
                
                presence.enter(cafeLocationId);
                
                setTimeout(() => {
                    assert(lastLockedSlot && lastLockedSlot.id === 'cafe-feature-1', '5a: Locked chip shown again on second entry');
                    
                    setTimeout(() => {
                        assert(lastOfferedSlot && lastOfferedSlot.id === 'cafe-bugfix-1', '5b: Bugfix offered again (repeatable)');
                        assert(offerCount === 1, '5c: Only one offer (no stacking from quick re-entry)');
                        
                        console.log('\nTest 6: Add design XP to 10, re-enter');
                        skillsStub.addXp('design', 5);
                        assert(skillsStub.getXp('design') === 10, '6a: Design XP is now 10');
                        
                        presence.exit(cafeLocationId);
                        lastOfferedSlot = null;
                        lastLockedSlot = null;
                        
                        setTimeout(() => {
                            presence.enter(cafeLocationId);
                            
                            // Feature should be offered immediately (no locked chip, no 2s delay)
                            setTimeout(() => {
                                assert(lastLockedSlot === null, '6b: No locked chip (feature unlocked)');
                                assert(lastOfferedSlot && lastOfferedSlot.id === 'cafe-feature-1', '6c: Feature offered at $120 (priority=10 > 0)');
                                
                                console.log('\nTest 7: Accept and pay feature gig');
                                freelanceSystem.acceptJob();
                                freelanceSystem.currentRun.state = 'inProgress';
                                freelanceSystem.completeJob();
                                const result2 = freelanceSystem.payoutJob();
                                assert(result2.payout.amount === 120, '7a: Feature paid $120');
                                assert(result2.xp.amount === 15, '7b: Feature gave +15 coding XP');
                                assert(freelanceSystem.cashBalance === 170, '7c: Total cash: $50 + $120 = $170');
                                assert(skillsStub.getXp('coding') === 25, '7d: Total coding XP: 10 + 15 = 25');
                                
                                console.log('\nTest 8: Exit and re-enter - feature is one-shot, bugfix offered');
                                presence.exit(cafeLocationId);
                                lastOfferedSlot = null;
                                lastLockedSlot = null;
                                
                                setTimeout(() => {
                                    presence.enter(cafeLocationId);
                                    
                                    setTimeout(() => {
                                        assert(lastLockedSlot === null, '8a: No locked chip (feature already paid)');
                                        assert(lastOfferedSlot && lastOfferedSlot.id === 'cafe-bugfix-1', '8b: Bugfix offered (feature one-shot)');
                                        
                                        console.log('\n=== Summary ===');
                                        console.log(`Passed: ${passed}`);
                                        console.log(`Failed: ${failed}`);
                                        console.log(`Total: ${passed + failed}`);
                                        
                                        if (failed === 0) {
                                            console.log('\n✅ All tests passed!');
                                            console.log('\nUsing REAL FreelanceSystem from src/systems/freelance-system.js');
                                            console.log('Using REAL CityModule from src/core/city-module.js');
                                            console.log('Using REAL slot configs from src/city/city-generator.js');
                                            process.exit(0);
                                        } else {
                                            console.log(`\n❌ ${failed} test(s) failed`);
                                            process.exit(1);
                                        }
                                    }, 300);
                                }, 100);
                            }, 300);
                        }, 100);
                    }, 2200);
                }, 100);
            }, 2500);
        }, 500);
    }, 2200);
}, 100);

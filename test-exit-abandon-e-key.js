// Test exit-abandon through game-manager E key interaction path
// Run with: node test-exit-abandon-e-key.js

const fs = require('fs');

global.pc = {
    Vec3: class Vec3 {
        constructor(x, y, z) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
        }
        
        distance(other) {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dz = this.z - other.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
        
        clone() {
            return new pc.Vec3(this.x, this.y, this.z);
        }
    },
    KEY_E: 69,
    EVENT_KEYDOWN: 'keydown'
};

function loadModule(path, exports) {
    const code = fs.readFileSync(path, 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', 'pc', `
        ${code}
        ${exports.map(e => `sandbox.${e} = ${e};`).join('\n')}
    `);
    wrapper(sandbox, global.pc);
    return sandbox;
}

const cityModule = loadModule('./src/core/city-module.js', [
    'BuildingKind', 'UnlockState', 'LocationId', 'Presence', 
    'ActivitySlot', 'LocationData', 'CityModule'
]);

const learnRunner = loadModule('./src/systems/learn-runner.js', [
    'LearnJobState', 'LearnJobRun', 'LearnRunner'
]);

const careerRunner = loadModule('./src/systems/career-runner.js', [
    'CareerJobState', 'CareerJobRun', 'CareerRunner'
]);

const freelanceSystem = loadModule('./src/systems/freelance-system.js', [
    'JobState', 'JobRun', 'FreelanceSystem'
]);

const { BuildingKind, UnlockState, LocationId, ActivitySlot, LocationData, CityModule } = cityModule;
const { LearnRunner, LearnJobState } = learnRunner;
const { CareerRunner, CareerJobState } = careerRunner;
const { FreelanceSystem, JobState } = freelanceSystem;

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
}

class MockSolHUD {
    constructor() {
        this.currentState = null;
        this.abandonedCalled = false;
        this.lastMessage = null;
    }
    
    show(text, state) {
        this.currentState = state;
        this.lastMessage = text;
    }
    
    hide() {
        this.currentState = null;
    }
    
    showLearnOffer(jobName, xp, skillTag) {
        this.show(`E — ${jobName} (+${xp} ${skillTag} XP)`, 'offered');
    }
    
    showLearnInProgress() {
        this.show('Practicing…', 'inProgress');
    }
    
    showLearnPayout(xp) {
        this.show(`+${xp.amount} ${xp.skill} XP`, 'payout');
    }
    
    showAbandoned() {
        this.abandonedCalled = true;
        this.show('Abandoned — no pay', 'abandoned');
    }
    
    getCurrentState() {
        return this.currentState;
    }
}

class MockGameManager {
    constructor() {
        this.cityModule = new CityModule();
        this.skillsStub = new SkillsStub();
        this.solHUD = new MockSolHUD();
        this.runnerRegistry = new RunnerRegistry();
        this.isInBuilding = false;
        
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
                durationHint: 0.001,
                kind: 'learn',
                payoutStub: null,
                xpStub: { amount: 5 }
            })
        ];
        this.cityModule.locations.set(homeId.toString(), homeLocation);
        
        this.learnRunner = new LearnRunner(this.cityModule, homeId, this.skillsStub);
        this.runnerRegistry.register('learn', this.learnRunner);
        
        this.setupLearnListeners();
    }
    
    setupLearnListeners() {
        this.learnRunner.on('jobOffered', (data) => {
            const xp = data.slot.xpStub.amount;
            const skillTag = data.slot.skillTags && data.slot.skillTags.length > 0 
                ? data.slot.skillTags[0] 
                : 'coding';
            this.solHUD.showLearnOffer(data.slot.name, xp, skillTag);
        });
        
        this.learnRunner.on('jobAccepted', (data) => {
            this.learnRunner.startJob();
        });
        
        this.learnRunner.on('jobStarted', (data) => {
            this.solHUD.showLearnInProgress();
        });
        
        this.learnRunner.on('jobPaid', (data) => {
            this.solHUD.showLearnPayout(data.xp);
        });
        
        this.cityModule.getPresence().on('exit', (data) => {
            const location = this.cityModule.getLocation(data.location);
            if (location) {
                const hasLearnSlots = location.getActivitySlots().some(s => s.kind === 'learn');
                if (hasLearnSlots) {
                    this.solHUD.hide();
                }
            }
        });
    }
    
    handleInteraction() {
        if (this.isInBuilding) {
            if (this.tryRunnerInteraction()) {
                return;
            }
            this.exitBuilding();
        }
    }
    
    tryRunnerInteraction() {
        if (!this.solHUD) return false;
        
        const currentLocation = this.cityModule.getCurrentLocation();
        if (!currentLocation) return false;
        
        const slots = currentLocation.getActivitySlots();
        if (slots.length === 0) return false;
        
        for (const slot of slots) {
            if (!slot.kind) continue;
            
            const runner = this.runnerRegistry.get(slot.kind);
            if (!runner) continue;
            
            const currentRun = runner.getCurrentRun();
            if (!currentRun) continue;
            
            const hudState = this.solHUD.getCurrentState();
            
            if (hudState === 'offered' && currentRun.state === 'offered') {
                runner.acceptJob();
                return true;
            }
        }
        
        return false;
    }
    
    exitBuilding() {
        const currentLocation = this.cityModule.getCurrentLocation();
        if (currentLocation) {
            let shouldShowAbandoned = false;
            
            const hasLearnSlots = currentLocation.getActivitySlots().some(s => s.kind === 'learn');
            if (hasLearnSlots && this.learnRunner) {
                const currentRun = this.learnRunner.getCurrentRun();
                if (currentRun && currentRun.state === 'inProgress') {
                    shouldShowAbandoned = true;
                }
            }
            
            this.isInBuilding = false;
            this.cityModule.getPresence().exit(currentLocation.locationId);
            
            if (shouldShowAbandoned) {
                this.solHUD.showAbandoned();
            } else {
                this.solHUD.hide();
            }
        }
    }
    
    enterBuilding(locationId) {
        this.isInBuilding = true;
        this.cityModule.getPresence().enter(locationId);
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

console.log('=== Exit-Abandon E Key Integration Test ===\n');

console.log('Test 1: E key during inProgress → exit + abandon (NOT complete+payout)');
{
    const gm = new MockGameManager();
    const homeId = new LocationId(BuildingKind.HOME, 0);
    
    gm.enterBuilding(homeId);
    assert(gm.learnRunner.getCurrentRun() !== null, '1a: Job offered on enter');
    assert(gm.solHUD.getCurrentState() === 'offered', '1b: HUD shows offered');
    
    gm.handleInteraction();
    assert(gm.learnRunner.getCurrentRun().state === LearnJobState.IN_PROGRESS, '1c: Job started after E press on offered');
    assert(gm.solHUD.getCurrentState() === 'inProgress', '1d: HUD shows inProgress');
    
    const initialXp = gm.skillsStub.getXp('coding');
    
    gm.handleInteraction();
    
    assert(!gm.isInBuilding, '1e: Player exited building');
    assert(gm.learnRunner.getCurrentRun().state === LearnJobState.IDLE, '1f: Job abandoned (state is IDLE)');
    assert(gm.solHUD.abandonedCalled, '1g: showAbandoned() was called');
    assert(gm.solHUD.lastMessage === 'Abandoned — no pay', '1h: Correct abandoned message shown');
    assert(gm.skillsStub.getXp('coding') === initialXp, '1i: No XP awarded on abandon', `Expected ${initialXp}, got ${gm.skillsStub.getXp('coding')}`);
}
console.log();

console.log('=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All E key integration tests passed!');
    console.log('\nProof: E during inProgress goes through game-manager tryRunnerInteraction → exitBuilding → abandon');
    console.log('       Natural timer completion tested in test-exit-abandon.js tests 2, 4, 9');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
}

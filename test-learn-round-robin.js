// Unit test for LearnRunner round-robin rotation
// Run with: node test-learn-round-robin.js

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

class LocationId {
    constructor(districtId, buildingId) {
        this.districtId = districtId;
        this.buildingId = buildingId;
    }
    
    toString() {
        return `${this.districtId}:${this.buildingId}`;
    }
}

class ActivitySlot {
    constructor(id, config = {}) {
        this.id = id;
        this.name = config.name || id;
        this.skillTags = config.skillTags || [];
        this.unlockRule = config.unlockRule || null;
        this.kind = config.kind || 'activity';
        this.durationHint = config.durationHint || 60;
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

class LocationData {
    constructor(locationId, buildingKind, config = {}) {
        this.locationId = locationId;
        this.buildingKind = buildingKind;
        this.activitySlots = config.activitySlots || [];
    }
    
    getActivitySlots() {
        return [...this.activitySlots];
    }
}

class Presence {
    constructor() {
        this.currentLocation = null;
        this.listeners = {
            enter: [],
            exit: []
        };
    }
    
    enter(locationId) {
        this.currentLocation = locationId;
        this.notifyListeners('enter', { location: locationId });
    }
    
    exit(locationId) {
        this.currentLocation = null;
        this.notifyListeners('exit', { location: locationId });
    }
    
    getCurrentLocation() {
        return this.currentLocation;
    }
    
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
    
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

class CityModule {
    constructor() {
        this.locations = new Map();
        this.presence = new Presence();
    }
    
    registerLocation(locationData) {
        const key = locationData.locationId.toString();
        this.locations.set(key, locationData);
    }
    
    getLocation(locationId) {
        const key = typeof locationId === 'string' ? locationId : locationId.toString();
        return this.locations.get(key);
    }
    
    getPresence() {
        return this.presence;
    }
    
    getCurrentLocation() {
        const currentLocId = this.presence.getCurrentLocation();
        return currentLocId ? this.getLocation(currentLocId) : null;
    }
    
    enterLocation(locationId) {
        this.presence.enter(locationId);
    }
    
    exitLocation(locationId) {
        this.presence.exit(locationId);
    }
}

const LearnJobState = {
    IDLE: 'idle',
    OFFERED: 'offered',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    PAID: 'paid'
};

class LearnJobRun {
    constructor(slotId) {
        this.slotId = slotId;
        this.state = LearnJobState.IDLE;
        this.startTime = null;
    }
}

class LearnRunner {
    constructor(cityModule, homeLocationId, skillsStub) {
        this.cityModule = cityModule;
        this.homeLocationId = homeLocationId;
        this.skillsStub = skillsStub;
        this.currentRun = null;
        this.lastPaidSlotIndexByLocation = new Map();
        this.listeners = {
            jobOffered: [],
            jobAccepted: [],
            jobStarted: [],
            jobCompleted: [],
            jobPaid: []
        };
        
        this.setupPresenceListeners();
    }
    
    getSlot(slotId) {
        const currentLocation = this.cityModule.getCurrentLocation();
        if (!currentLocation) return null;
        
        const slots = currentLocation.getActivitySlots();
        return slots.find(s => s.id === slotId);
    }
    
    getAvailableSlots() {
        const currentLocation = this.cityModule.getCurrentLocation();
        if (!currentLocation) return [];
        
        const slots = currentLocation.getActivitySlots();
        return slots.filter(slot => {
            if (slot.kind !== 'learn') return false;
            
            const isUnlocked = slot.isUnlocked(this.skillsStub);
            return isUnlocked;
        });
    }
    
    getNextOfferable() {
        const available = this.getAvailableSlots();
        if (available.length === 0) return null;
        
        const currentLocation = this.cityModule.getCurrentLocation();
        if (!currentLocation) return null;
        
        const locationKey = currentLocation.locationId.toString();
        const lastPaidIndex = this.lastPaidSlotIndexByLocation.get(locationKey);
        
        if (lastPaidIndex === undefined) {
            return available[0];
        }
        
        const allSlots = currentLocation.getActivitySlots().filter(s => s.kind === 'learn');
        const lastPaidSlotId = allSlots[lastPaidIndex]?.id;
        
        let nextIndex = (lastPaidIndex + 1) % allSlots.length;
        let attempts = 0;
        
        while (attempts < allSlots.length) {
            const candidateSlot = allSlots[nextIndex];
            if (candidateSlot && candidateSlot.isUnlocked(this.skillsStub)) {
                return candidateSlot;
            }
            nextIndex = (nextIndex + 1) % allSlots.length;
            attempts++;
        }
        
        return available[0];
    }
    
    setupPresenceListeners() {
        const presence = this.cityModule.getPresence();
        
        presence.on('enter', (data) => {
            const location = this.cityModule.getLocation(data.location);
            if (location) {
                const hasLearnSlots = location.getActivitySlots().some(s => s.kind === 'learn');
                if (hasLearnSlots) {
                    this.checkAndOfferJob();
                }
            }
        });
        
        presence.on('exit', (data) => {
            const location = this.cityModule.getLocation(data.location);
            if (location) {
                const hasLearnSlots = location.getActivitySlots().some(s => s.kind === 'learn');
                if (hasLearnSlots) {
                    if (this.currentRun && this.currentRun.state === LearnJobState.OFFERED) {
                        this.currentRun.state = LearnJobState.IDLE;
                    }
                    if (this.currentRun && this.currentRun.state === LearnJobState.IN_PROGRESS) {
                        this.completeJob();
                        this.payoutJob();
                    }
                }
            }
        });
    }
    
    checkAndOfferJob() {
        const currentLocation = this.cityModule.getCurrentLocation();
        const isIdle = !this.currentRun || this.currentRun.state === LearnJobState.IDLE || this.currentRun.state === LearnJobState.PAID;
        
        if (!isIdle || !currentLocation) return;
        
        const hasLearnSlots = currentLocation.getActivitySlots().some(s => s.kind === 'learn');
        if (!hasLearnSlots) return;
        
        const slot = this.getNextOfferable();
        if (slot) {
            this.currentRun = new LearnJobRun(slot.id);
            this.currentRun.state = LearnJobState.OFFERED;
            this.notifyListeners('jobOffered', { slotId: slot.id, slot });
        }
    }
    
    acceptJob() {
        if (!this.currentRun || this.currentRun.state !== LearnJobState.OFFERED) return false;
        
        this.currentRun.state = LearnJobState.ACCEPTED;
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobAccepted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    startJob() {
        if (!this.currentRun || this.currentRun.state !== LearnJobState.ACCEPTED) return false;
        
        this.currentRun.state = LearnJobState.IN_PROGRESS;
        this.currentRun.startTime = Date.now();
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobStarted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    completeJob() {
        if (!this.currentRun || this.currentRun.state !== LearnJobState.IN_PROGRESS) return false;
        
        this.currentRun.state = LearnJobState.COMPLETED;
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobCompleted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    payoutJob() {
        if (!this.currentRun || this.currentRun.state !== LearnJobState.COMPLETED) return null;
        
        const slot = this.getSlot(this.currentRun.slotId);
        if (!slot) return null;
        
        this.currentRun.state = LearnJobState.PAID;
        
        const xpStub = slot.xpStub;
        const skillTag = slot.skillTags && slot.skillTags.length > 0 ? slot.skillTags[0] : null;
        
        let xp = null;
        if (xpStub && xpStub.amount && skillTag && this.skillsStub) {
            this.skillsStub.addXp(skillTag, xpStub.amount);
            xp = { skill: skillTag, amount: xpStub.amount };
        }
        
        const currentLocation = this.cityModule.getCurrentLocation();
        if (currentLocation) {
            const locationKey = currentLocation.locationId.toString();
            const allSlots = currentLocation.getActivitySlots().filter(s => s.kind === 'learn');
            const paidSlotIndex = allSlots.findIndex(s => s.id === this.currentRun.slotId);
            if (paidSlotIndex !== -1) {
                this.lastPaidSlotIndexByLocation.set(locationKey, paidSlotIndex);
            }
        }
        
        this.notifyListeners('jobPaid', { 
            slotId: this.currentRun.slotId,
            slot,
            payout: null,
            xp
        });
        
        this.currentRun.state = LearnJobState.IDLE;
        
        return { payout: null, xp };
    }
    
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
    
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

// Test Suite
console.log('=== LearnRunner Round-Robin Tests ===\n');

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

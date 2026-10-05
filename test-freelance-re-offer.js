// Regression test for freelance re-offer after PAID
// Tests: repeatable flag, offerPriority, locked chip every entry, 2s delay, timeout cancellation
// Run with: node test-freelance-re-offer.js

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
        this.skillTags = config.skillTags || [];
        this.unlockRule = config.unlockRule || null;
        this.durationHint = config.durationHint || 60;
        this.name = config.name || id;
        this.kind = config.kind || 'activity';
        this.payoutStub = config.payoutStub || null;
        this.xpStub = config.xpStub || null;
        this.repeatable = config.repeatable !== undefined ? config.repeatable : false;
        this.offerPriority = config.offerPriority !== undefined ? config.offerPriority : 0;
    }
    
    isUnlocked(skillsStub = null) {
        if (!this.unlockRule) return true;
        if (!skillsStub) return false;
        
        const { skill, minXp } = this.unlockRule;
        return skillsStub.getXp(skill) >= minXp;
    }
}

class MockPresence {
    constructor() {
        this.currentLocation = null;
        this.listeners = { enter: [], exit: [] };
    }
    
    isAt(locationId) {
        return this.currentLocation && this.currentLocation.toString() === locationId.toString();
    }
    
    enter(locationId) {
        this.currentLocation = locationId;
        this.listeners.enter.forEach(cb => cb({ location: locationId }));
    }
    
    exit(locationId) {
        this.currentLocation = null;
        this.listeners.exit.forEach(cb => cb({ location: locationId }));
    }
    
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
}

class MockCityModule {
    constructor(presence) {
        this.locations = new Map();
        this.presence = presence;
    }
    
    registerLocation(id, slots) {
        this.locations.set(id.toString(), { getActivitySlots: () => slots });
    }
    
    getLocation(id) {
        return this.locations.get(id.toString());
    }
    
    getPresence() {
        return this.presence;
    }
}

// Minimal FreelanceSystem with data-driven re-offer logic
class FreelanceSystem {
    constructor(cityModule, cafeLocationId, skillsStub) {
        this.cityModule = cityModule;
        this.cafeLocationId = cafeLocationId;
        this.skillsStub = skillsStub;
        this.currentRun = null;
        this.cashBalance = 0;
        this.slotHistory = new Map();
        this.lockedChipTimeout = null;
        this.listeners = { jobOffered: [], jobPaid: [], jobLocked: [] };
        
        const presence = this.cityModule.getPresence();
        presence.on('enter', (data) => {
            if (data.location.toString() === this.cafeLocationId.toString()) {
                this.checkAndOfferJob();
            }
        });
        
        presence.on('exit', (data) => {
            if (data.location.toString() === this.cafeLocationId.toString()) {
                // Cancel pending locked chip timeout
                if (this.lockedChipTimeout) {
                    clearTimeout(this.lockedChipTimeout);
                    this.lockedChipTimeout = null;
                }
                
                if (this.currentRun && this.currentRun.state === JobState.OFFERED) {
                    this.currentRun.state = JobState.IDLE;
                }
                if (this.currentRun && this.currentRun.state === JobState.IN_PROGRESS) {
                    this.currentRun.state = JobState.IDLE;
                }
            }
        });
    }
    
    getSlot(slotId) {
        const location = this.cityModule.getLocation(this.cafeLocationId);
        if (!location) return null;
        return location.getActivitySlots().find(s => s.id === slotId);
    }
    
    getAvailableSlots() {
        const location = this.cityModule.getLocation(this.cafeLocationId);
        if (!location) return [];
        
        return location.getActivitySlots().filter(slot => {
            if (slot.kind !== 'freelance') return false;
            if (!slot.isUnlocked(this.skillsStub)) return false;
            
            // One-shot slots (repeatable=false) are excluded after being paid
            if (!slot.repeatable) {
                const history = this.slotHistory.get(slot.id);
                if (history && history.state === JobState.PAID) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    getNextOfferable() {
        const available = this.getAvailableSlots();
        if (available.length === 0) return null;
        
        // Sort by offerPriority (higher first)
        available.sort((a, b) => {
            if (a.offerPriority !== b.offerPriority) {
                return b.offerPriority - a.offerPriority;
            }
            return 0;
        });
        
        return available[0];
    }
    
    getNextLockedSlot() {
        const location = this.cityModule.getLocation(this.cafeLocationId);
        if (!location) return null;
        
        const slots = location.getActivitySlots();
        for (const slot of slots) {
            if (slot.kind !== 'freelance') continue;
            
            // Don't show one-shot slots as locked if already paid
            if (!slot.repeatable) {
                const history = this.slotHistory.get(slot.id);
                if (history && history.state === JobState.PAID) {
                    continue;
                }
            }
            
            // Return first locked slot (has unlockRule but not met)
            if (slot.unlockRule && !slot.isUnlocked(this.skillsStub)) {
                return slot;
            }
        }
        
        return null;
    }
    
    checkAndOfferJob() {
        const presence = this.cityModule.getPresence();
        const isAtLocation = presence.isAt(this.cafeLocationId);
        const isIdle = !this.currentRun || this.currentRun.state === JobState.IDLE;
        
        if (!isIdle || !isAtLocation) return;
        
        // Cancel any pending locked chip timeout
        if (this.lockedChipTimeout) {
            clearTimeout(this.lockedChipTimeout);
            this.lockedChipTimeout = null;
        }
        
        // Check if any gated slot is locked
        const nextLockedSlot = this.getNextLockedSlot();
        if (nextLockedSlot) {
            // Show locked chip for 2s, then offer next available gig
            this.notifyListeners('jobLocked', { slot: nextLockedSlot });
            
            this.lockedChipTimeout = setTimeout(() => {
                this.lockedChipTimeout = null;
                
                // Re-check presence and idle state
                const stillAtLocation = presence.isAt(this.cafeLocationId);
                const stillIdle = !this.currentRun || this.currentRun.state === JobState.IDLE;
                
                if (stillAtLocation && stillIdle) {
                    const slot = this.getNextOfferable();
                    if (slot) {
                        this.currentRun = new JobRun(slot.id);
                        this.currentRun.state = JobState.OFFERED;
                        this.notifyListeners('jobOffered', { slotId: slot.id, slot });
                    }
                }
            }, 2000);
            return;
        }
        
        const slot = this.getNextOfferable();
        if (slot) {
            this.currentRun = new JobRun(slot.id);
            this.currentRun.state = JobState.OFFERED;
            this.notifyListeners('jobOffered', { slotId: slot.id, slot });
        }
    }
    
    acceptJob() {
        if (!this.currentRun || this.currentRun.state !== JobState.OFFERED) return false;
        this.currentRun.state = JobState.ACCEPTED;
        return true;
    }
    
    completeJob() {
        if (!this.currentRun || this.currentRun.state !== JobState.ACCEPTED && this.currentRun.state !== JobState.IN_PROGRESS) return false;
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
        
        this.notifyListeners('jobPaid', { 
            slotId: this.currentRun.slotId,
            slot,
            payout,
            xp,
            newBalance: this.cashBalance 
        });
        
        // After payout, reset to IDLE so next gig can be offered
        this.currentRun.state = JobState.IDLE;
        
        return { payout, xp };
    }
    
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
    
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
    
    getCurrentRun() {
        return this.currentRun;
    }
}

// Test execution
console.log('=== Freelance Re-Offer Regression Test ===\n');

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
const presence = new MockPresence();
const cityModule = new MockCityModule(presence);
const cafeLocationId = 'the-bean-cafe';

const bugfixSlot = new ActivitySlot('cafe-bugfix-1', {
    name: 'Quick bugfix',
    skillTags: ['coding'],
    unlockRule: null,
    durationHint: 30,
    kind: 'freelance',
    payoutStub: { currency: 'cash', amount: 50 },
    xpStub: { amount: 10 },
    repeatable: true
});

const featureSlot = new ActivitySlot('cafe-feature-1', {
    name: 'Small feature patch',
    skillTags: ['coding'],
    unlockRule: { skill: 'design', minXp: 10 },
    durationHint: 45,
    kind: 'freelance',
    payoutStub: { currency: 'cash', amount: 120 },
    xpStub: { amount: 15 },
    offerPriority: 10
});

cityModule.registerLocation(cafeLocationId, [bugfixSlot, featureSlot]);

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

console.log('Test 1: Enter cafe at design XP=5 shows locked chip');
skillsStub.addXp('design', 5);
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
        freelanceSystem.currentRun.state = JobState.IN_PROGRESS;
        freelanceSystem.completeJob();
        const result1 = freelanceSystem.payoutJob();
        assert(result1.payout.amount === 50, '3a: Bugfix paid $50');
        assert(result1.xp.amount === 10, '3b: Bugfix gave +10 coding XP');
        assert(freelanceSystem.currentRun.state === JobState.IDLE, '3c: After payout, state is IDLE');
        
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
                
                console.log('\nTest 5: Re-enter cafe - locked chip shows again, then bugfix offered (repeatable)');
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
                                freelanceSystem.currentRun.state = JobState.IN_PROGRESS;
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

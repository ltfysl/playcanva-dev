const ProductJobState = {
    IDLE: 'idle',
    OFFERED: 'offered',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    PAID: 'paid'
};

class ProductJobRun {
    constructor(slotId) {
        this.slotId = slotId;
        this.state = ProductJobState.IDLE;
        this.startTime = null;
    }
    
    getProgress(durationHint) {
        if (this.state !== ProductJobState.IN_PROGRESS || !this.startTime) {
            return 0;
        }
        const elapsed = Date.now() - this.startTime;
        const durationMs = durationHint * 1000;
        return Math.min(1, elapsed / durationMs);
    }
}

class ProductRegistry {
    constructor() {
        this.products = new Map();
    }
    
    upsert(product) {
        this.products.set(product.id, product);
    }
    
    get(id) {
        return this.products.get(id);
    }
    
    has(id) {
        return this.products.has(id);
    }
    
    getAll() {
        return Array.from(this.products.values());
    }
    
    getLive() {
        return Array.from(this.products.values()).filter(p => p.status === 'live');
    }
}

class MockSkillsStub {
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

class MockCityModule {
    constructor() {
        this.locations = new Map();
        this.presence = {
            currentLocation: null,
            listeners: { enter: [], exit: [] },
            enter(locationId) {
                this.currentLocation = locationId;
                this.listeners.enter.forEach(cb => cb({ location: locationId }));
            },
            exit(locationId) {
                this.listeners.exit.forEach(cb => cb({ location: locationId }));
                this.currentLocation = null;
            },
            isAt(locationId) {
                return this.currentLocation === locationId;
            },
            on(event, callback) {
                this.listeners[event].push(callback);
            }
        };
    }
    
    registerLocation(id, data) {
        this.locations.set(id, data);
    }
    
    getLocation(id) {
        return this.locations.get(id);
    }
    
    getPresence() {
        return this.presence;
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
        this.productStub = config.productStub || null;
    }
    
    isUnlocked(skillsStub = null) {
        if (!this.unlockRule) return true;
        if (!skillsStub) return false;
        
        const { skill, minXp } = this.unlockRule;
        return skillsStub.getXp(skill) >= minXp;
    }
}

class MockLocationData {
    constructor(slots) {
        this.activitySlots = slots;
    }
    
    getActivitySlots() {
        return [...this.activitySlots];
    }
}

class ProductRunner {
    constructor(cityModule, homeLocationId, skillsStub, productRegistry) {
        this.cityModule = cityModule;
        this.homeLocationId = homeLocationId;
        this.skillsStub = skillsStub;
        this.productRegistry = productRegistry;
        this.currentRun = null;
        this.slotHistory = new Map();
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
        const homeLocation = this.cityModule.getLocation(this.homeLocationId);
        if (!homeLocation) return null;
        
        const slots = homeLocation.getActivitySlots();
        return slots.find(s => s.id === slotId);
    }
    
    getAvailableSlots() {
        const homeLocation = this.cityModule.getLocation(this.homeLocationId);
        if (!homeLocation) return [];
        
        const slots = homeLocation.getActivitySlots();
        return slots.filter(slot => {
            if (slot.kind !== 'product') return false;
            
            const isUnlocked = slot.isUnlocked(this.skillsStub);
            if (!isUnlocked) return false;
            
            const history = this.slotHistory.get(slot.id);
            if (!history || history.state !== ProductJobState.PAID) {
                return true;
            }
            
            return false;
        });
    }
    
    getNextOfferable() {
        const available = this.getAvailableSlots();
        return available.length > 0 ? available[0] : null;
    }
    
    setupPresenceListeners() {
        const presence = this.cityModule.getPresence();
        
        presence.on('enter', (data) => {
            if (data.location.toString() === this.homeLocationId.toString()) {
                this.checkAndOfferJob();
            }
        });
        
        presence.on('exit', (data) => {
            if (data.location.toString() === this.homeLocationId.toString()) {
                if (this.currentRun && this.currentRun.state === ProductJobState.OFFERED) {
                    this.currentRun.state = ProductJobState.IDLE;
                }
            }
        });
    }
    
    checkAndOfferJob() {
        const presence = this.cityModule.getPresence();
        const isAtLocation = presence.isAt(this.homeLocationId);
        const isIdle = !this.currentRun || this.currentRun.state === ProductJobState.IDLE || this.currentRun.state === ProductJobState.PAID;
        
        if (!isIdle || !isAtLocation) return;
        
        const slot = this.getNextOfferable();
        if (slot) {
            this.currentRun = new ProductJobRun(slot.id);
            this.currentRun.state = ProductJobState.OFFERED;
            this.notifyListeners('jobOffered', { slotId: slot.id, slot });
        }
    }
    
    acceptJob() {
        if (!this.currentRun || this.currentRun.state !== ProductJobState.OFFERED) return false;
        
        this.currentRun.state = ProductJobState.ACCEPTED;
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobAccepted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    startJob() {
        if (!this.currentRun || this.currentRun.state !== ProductJobState.ACCEPTED) return false;
        
        this.currentRun.state = ProductJobState.IN_PROGRESS;
        this.currentRun.startTime = Date.now();
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobStarted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    completeJob() {
        if (!this.currentRun || this.currentRun.state !== ProductJobState.IN_PROGRESS) return false;
        
        this.currentRun.state = ProductJobState.COMPLETED;
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobCompleted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    payoutJob() {
        if (!this.currentRun || this.currentRun.state !== ProductJobState.COMPLETED) return null;
        
        const slot = this.getSlot(this.currentRun.slotId);
        if (!slot) return null;
        
        this.currentRun.state = ProductJobState.PAID;
        
        this.slotHistory.set(this.currentRun.slotId, {
            state: ProductJobState.PAID,
            completedAt: Date.now()
        });
        
        const payout = slot.payoutStub;
        let cashAmount = 0;
        if (payout) {
            cashAmount = payout.amount;
        }
        
        const xpStub = slot.xpStub;
        const skillTag = slot.skillTags && slot.skillTags.length > 0 ? slot.skillTags[0] : null;
        
        let xp = null;
        if (xpStub && xpStub.amount && skillTag && this.skillsStub) {
            this.skillsStub.addXp(skillTag, xpStub.amount);
            xp = { skill: skillTag, amount: xpStub.amount };
        }
        
        if (slot.productStub && this.productRegistry) {
            const product = {
                id: slot.productStub.id,
                name: slot.productStub.name,
                status: 'live',
                mrrStub: slot.productStub.mrrStub
            };
            this.productRegistry.upsert(product);
        }
        
        this.notifyListeners('jobPaid', { 
            slotId: this.currentRun.slotId,
            slot,
            payout,
            xp,
            cashAmount,
            product: slot.productStub
        });
        
        return { payout, xp, product: slot.productStub };
    }
    
    getCurrentRun() {
        return this.currentRun;
    }
    
    getCurrentSlot() {
        if (!this.currentRun) return null;
        return this.getSlot(this.currentRun.slotId);
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

function assert(condition, message) {
    if (!condition) {
        console.error('❌ FAILED:', message);
        process.exit(1);
    }
    console.log('✅ PASSED:', message);
}

function runTests() {
    console.log('\n=== Dev Tycoon Product Logic Tests ===\n');
    
    const cityModule = new MockCityModule();
    const skillsStub = new MockSkillsStub();
    const productRegistry = new ProductRegistry();
    const homeLocationId = 'home-1';
    
    const mvpSlot = new ActivitySlot('home-ship-mvp-1', {
        name: 'Ship MVP',
        skillTags: ['coding'],
        unlockRule: { skill: 'coding', minXp: 30 },
        durationHint: 50,
        kind: 'product',
        payoutStub: { currency: 'cash', amount: 80 },
        xpStub: { amount: 15 },
        productStub: { id: 'mvp-1', name: 'Side Project MVP', mrrStub: 10 }
    });
    
    cityModule.registerLocation(homeLocationId, new MockLocationData([mvpSlot]));
    
    const runner = new ProductRunner(cityModule, homeLocationId, skillsStub, productRegistry);
    
    console.log('Test 1: Unlock gate - slot locked at coding XP 0');
    assert(!mvpSlot.isUnlocked(skillsStub), 'Slot should be locked at 0 XP');
    
    console.log('\nTest 2: Unlock gate - slot locked at coding XP 29');
    skillsStub.addXp('coding', 29);
    assert(!mvpSlot.isUnlocked(skillsStub), 'Slot should be locked at 29 XP');
    
    console.log('\nTest 3: Unlock gate - slot unlocked at coding XP 30');
    skillsStub.addXp('coding', 1);
    assert(mvpSlot.isUnlocked(skillsStub), 'Slot should be unlocked at 30 XP');
    assert(skillsStub.getXp('coding') === 30, 'Coding XP should be 30');
    
    console.log('\nTest 4: Job offer on home entry');
    let offered = false;
    runner.on('jobOffered', (data) => {
        offered = true;
        assert(data.slot.id === 'home-ship-mvp-1', 'Offered job should be home-ship-mvp-1');
    });
    
    cityModule.getPresence().enter(homeLocationId);
    assert(offered, 'Job should be offered');
    assert(runner.currentRun.state === ProductJobState.OFFERED, 'State should be OFFERED');
    
    console.log('\nTest 5: Accept and start job');
    let accepted = false;
    let started = false;
    
    runner.on('jobAccepted', () => { accepted = true; });
    runner.on('jobStarted', () => { started = true; });
    
    runner.acceptJob();
    assert(accepted, 'Job should be accepted');
    assert(runner.currentRun.state === ProductJobState.ACCEPTED, 'State should be ACCEPTED');
    
    runner.startJob();
    assert(started, 'Job should be started');
    assert(runner.currentRun.state === ProductJobState.IN_PROGRESS, 'State should be IN_PROGRESS');
    
    console.log('\nTest 6: Complete and payout job');
    let completed = false;
    let paid = false;
    let payoutData = null;
    
    runner.on('jobCompleted', () => { completed = true; });
    runner.on('jobPaid', (data) => {
        paid = true;
        payoutData = data;
    });
    
    runner.completeJob();
    assert(completed, 'Job should be completed');
    assert(runner.currentRun.state === ProductJobState.COMPLETED, 'State should be COMPLETED');
    
    const payout = runner.payoutJob();
    assert(paid, 'Job should be paid');
    assert(runner.currentRun.state === ProductJobState.PAID, 'State should be PAID');
    assert(payoutData.cashAmount === 80, 'Cash should be $80');
    assert(payoutData.xp.amount === 15, 'XP should be 15');
    assert(payoutData.xp.skill === 'coding', 'XP skill should be coding');
    assert(skillsStub.getXp('coding') === 45, 'Total coding XP should be 45 (30 + 15)');
    
    console.log('\nTest 7: Product set to live in registry');
    assert(productRegistry.has('mvp-1'), 'Product mvp-1 should exist in registry');
    const product = productRegistry.get('mvp-1');
    assert(product.status === 'live', 'Product status should be live');
    assert(product.name === 'Side Project MVP', 'Product name should match');
    assert(product.mrrStub === 10, 'Product MRR stub should be 10');
    
    console.log('\nTest 8: One-shot after paid - slot not re-offered');
    cityModule.getPresence().exit(homeLocationId);
    
    let reoffered = false;
    runner.on('jobOffered', () => { reoffered = true; });
    
    cityModule.getPresence().enter(homeLocationId);
    assert(!reoffered, 'Job should NOT be re-offered after paid');
    assert(runner.currentRun.state === ProductJobState.PAID, 'State should remain PAID');
    
    const history = runner.slotHistory.get('home-ship-mvp-1');
    assert(history && history.state === ProductJobState.PAID, 'Slot history should record PAID state');
    
    console.log('\n=== All Product Logic Tests Passed! ===\n');
}

runTests();

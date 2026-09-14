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
                if (this.currentRun && this.currentRun.state === ProductJobState.IN_PROGRESS) {
                    this.completeJob();
                    this.payoutJob();
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
    
    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }
    
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    
    update(dt) {
        if (this.currentRun && this.currentRun.state === ProductJobState.IN_PROGRESS) {
            const slot = this.getSlot(this.currentRun.slotId);
            if (!slot) return;
            
            const progress = this.currentRun.getProgress(slot.durationHint);
            if (progress >= 1.0) {
                this.completeJob();
                this.payoutJob();
            }
        }
    }
}

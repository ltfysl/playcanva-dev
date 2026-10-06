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
        this.lockedChipTimeout = null;
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

class ProductRunner {
    constructor(cityModule, homeLocationId, skillsStub) {
        this.cityModule = cityModule;
        this.homeLocationId = homeLocationId;
        this.skillsStub = skillsStub;
        this.currentRun = null;
        this.cashBalance = 0;
        this.slotHistory = new Map();
        this.listeners = {
            jobOffered: [],
            jobAccepted: [],
            jobStarted: [],
            jobCompleted: [],
            jobPaid: [],
            jobLocked: [],
            product: []
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
            
            const history = this.slotHistory.get(slot.id);
            if (history && history.state === ProductJobState.PAID) {
                return false;
            }
            
            const isUnlocked = slot.isUnlocked(this.skillsStub);
            return isUnlocked;
        });
    }
    
    getNextOfferable() {
        const available = this.getAvailableSlots();
        return available.length > 0 ? available[0] : null;
    }
    
    getNextLockedSlot() {
        const homeLocation = this.cityModule.getLocation(this.homeLocationId);
        if (!homeLocation) return null;
        
        const slots = homeLocation.getActivitySlots();
        for (const slot of slots) {
            if (slot.kind !== 'product') continue;
            
            const history = this.slotHistory.get(slot.id);
            if (history && history.state === ProductJobState.PAID) {
                continue;
            }
            
            if (!slot.isUnlocked(this.skillsStub)) {
                return slot;
            }
        }
        
        return null;
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
                if (this.currentRun && this.currentRun.lockedChipTimeout) {
                    clearTimeout(this.currentRun.lockedChipTimeout);
                    this.currentRun.lockedChipTimeout = null;
                }
                if (this.currentRun && this.currentRun.state === ProductJobState.OFFERED) {
                    this.currentRun.state = ProductJobState.IDLE;
                }
                if (this.currentRun && this.currentRun.state === ProductJobState.IN_PROGRESS) {
                    this.currentRun.state = ProductJobState.IDLE;
                }
            }
        });
    }
    
    checkAndOfferJob() {
        const presence = this.cityModule.getPresence();
        const isAtLocation = presence.isAt(this.homeLocationId);
        const isIdle = !this.currentRun || this.currentRun.state === ProductJobState.IDLE;
        
        if (!isIdle || !isAtLocation) return;
        
        const slot = this.getNextOfferable();
        if (slot) {
            this.currentRun = new ProductJobRun(slot.id);
            this.currentRun.state = ProductJobState.OFFERED;
            this.notifyListeners('jobOffered', { slotId: slot.id, slot });
        } else {
            const nextLockedSlot = this.getNextLockedSlot();
            if (nextLockedSlot) {
                this.currentRun = new ProductJobRun(nextLockedSlot.id);
                this.currentRun.state = ProductJobState.IDLE;
                this.currentRun.lockedChipTimeout = setTimeout(() => {
                    if (this.currentRun) {
                        this.currentRun.lockedChipTimeout = null;
                    }
                }, 2000);
                this.notifyListeners('jobLocked', { slot: nextLockedSlot });
            }
        }
    }
    
    hasPendingLockedWindow() {
        return this.currentRun && this.currentRun.lockedChipTimeout !== null;
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
        
        let product = null;
        if (slot.productStub) {
            product = {
                id: slot.productStub.id,
                name: slot.productStub.name,
                status: 'live',
                mrrStub: slot.productStub.mrrStub
            };
            if (typeof productRegistry !== 'undefined') {
                productRegistry.upsert(product);
            }
        }
        
        this.notifyListeners('jobPaid', { 
            slotId: this.currentRun.slotId,
            slot,
            payout,
            xp,
            newBalance: this.cashBalance 
        });
        
        if (product !== null) {
            this.notifyListeners('product', product);
        }
        
        this.currentRun.state = ProductJobState.IDLE;
        
        return { payout, xp, product };
    }
    
    getCurrentRun() {
        return this.currentRun;
    }
    
    getCurrentSlot() {
        if (!this.currentRun) return null;
        return this.getSlot(this.currentRun.slotId);
    }
    
    getCashBalance() {
        return this.cashBalance;
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

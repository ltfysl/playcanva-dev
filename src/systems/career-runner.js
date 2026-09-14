const CareerJobState = {
    IDLE: 'idle',
    OFFERED: 'offered',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    PAID: 'paid'
};

class CareerJobRun {
    constructor(slotId) {
        this.slotId = slotId;
        this.state = CareerJobState.IDLE;
        this.startTime = null;
    }
    
    getProgress(durationHint) {
        if (this.state !== CareerJobState.IN_PROGRESS || !this.startTime) {
            return 0;
        }
        const elapsed = Date.now() - this.startTime;
        const durationMs = durationHint * 1000;
        return Math.min(1, elapsed / durationMs);
    }
}

class CareerRunner {
    constructor(cityModule, officeLocationId, skillsStub) {
        this.cityModule = cityModule;
        this.officeLocationId = officeLocationId;
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
            jobLocked: []
        };
        
        this.setupPresenceListeners();
    }
    
    getSlot(slotId) {
        const officeLocation = this.cityModule.getLocation(this.officeLocationId);
        if (!officeLocation) return null;
        
        const slots = officeLocation.getActivitySlots();
        return slots.find(s => s.id === slotId);
    }
    
    getAvailableSlots() {
        const officeLocation = this.cityModule.getLocation(this.officeLocationId);
        if (!officeLocation) return [];
        
        const slots = officeLocation.getActivitySlots();
        return slots.filter(slot => {
            if (slot.kind !== 'career') return false;
            
            const isUnlocked = slot.isUnlocked(this.skillsStub);
            if (!isUnlocked) return false;
            
            const history = this.slotHistory.get(slot.id);
            if (!history || history.state !== CareerJobState.PAID) {
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
            if (data.location.toString() === this.officeLocationId.toString()) {
                this.checkAndOfferJob();
            }
        });
        
        presence.on('exit', (data) => {
            if (data.location.toString() === this.officeLocationId.toString()) {
                if (this.currentRun && this.currentRun.state === CareerJobState.OFFERED) {
                    this.currentRun.state = CareerJobState.IDLE;
                }
                if (this.currentRun && this.currentRun.state === CareerJobState.IN_PROGRESS) {
                    this.completeJob();
                    this.payoutJob();
                }
            }
        });
    }
    
    checkAndOfferJob() {
        const presence = this.cityModule.getPresence();
        const isAtLocation = presence.isAt(this.officeLocationId);
        const isIdle = !this.currentRun || this.currentRun.state === CareerJobState.IDLE;
        
        if (!isIdle || !isAtLocation) return;
        
        const slot = this.getNextOfferable();
        if (slot) {
            this.currentRun = new CareerJobRun(slot.id);
            this.currentRun.state = CareerJobState.OFFERED;
            this.notifyListeners('jobOffered', { slotId: slot.id, slot });
        } else {
            const nextLockedSlot = this.getNextLockedSlot();
            if (nextLockedSlot) {
                this.notifyListeners('jobLocked', { slot: nextLockedSlot });
            }
        }
    }
    
    getNextLockedSlot() {
        const officeLocation = this.cityModule.getLocation(this.officeLocationId);
        if (!officeLocation) return null;
        
        const slots = officeLocation.getActivitySlots();
        for (const slot of slots) {
            if (slot.kind !== 'career') continue;
            
            const history = this.slotHistory.get(slot.id);
            if (history && history.state === CareerJobState.PAID) {
                continue;
            }
            
            if (!slot.isUnlocked(this.skillsStub)) {
                return slot;
            }
        }
        
        return null;
    }
    
    acceptJob() {
        if (!this.currentRun || this.currentRun.state !== CareerJobState.OFFERED) return false;
        
        this.currentRun.state = CareerJobState.ACCEPTED;
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobAccepted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    startJob() {
        if (!this.currentRun || this.currentRun.state !== CareerJobState.ACCEPTED) return false;
        
        this.currentRun.state = CareerJobState.IN_PROGRESS;
        this.currentRun.startTime = Date.now();
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobStarted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    completeJob() {
        if (!this.currentRun || this.currentRun.state !== CareerJobState.IN_PROGRESS) return false;
        
        this.currentRun.state = CareerJobState.COMPLETED;
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobCompleted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    payoutJob() {
        if (!this.currentRun || this.currentRun.state !== CareerJobState.COMPLETED) return null;
        
        const slot = this.getSlot(this.currentRun.slotId);
        if (!slot) return null;
        
        this.currentRun.state = CareerJobState.PAID;
        
        this.slotHistory.set(this.currentRun.slotId, {
            state: CareerJobState.PAID,
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
        
        return { payout, xp };
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
        if (this.currentRun && this.currentRun.state === CareerJobState.IN_PROGRESS) {
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

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
    
    getProgress(durationHint) {
        if (this.state !== JobState.IN_PROGRESS || !this.startTime) {
            return 0;
        }
        const elapsed = Date.now() - this.startTime;
        const durationMs = durationHint * 1000;
        return Math.min(1, elapsed / durationMs);
    }
}

class FreelanceSystem {
    constructor(cityModule, cafeLocationId, skillsStub) {
        this.cityModule = cityModule;
        this.cafeLocationId = cafeLocationId;
        this.skillsStub = skillsStub;
        this.currentRun = null;
        this.cashBalance = 0;
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
        const cafeLocation = this.cityModule.getLocation(this.cafeLocationId);
        if (!cafeLocation) return null;
        
        const slots = cafeLocation.getActivitySlots();
        return slots.find(s => s.id === slotId);
    }
    
    getCafeSlotId() {
        const cafeLocation = this.cityModule.getLocation(this.cafeLocationId);
        if (!cafeLocation) return null;
        
        const slots = cafeLocation.getActivitySlots();
        return slots.length > 0 ? slots[0].id : null;
    }
    
    setupPresenceListeners() {
        const presence = this.cityModule.getPresence();
        
        presence.on('enter', (data) => {
            if (data.location.toString() === this.cafeLocationId.toString()) {
                this.checkAndOfferJob();
            }
        });
        
        presence.on('exit', (data) => {
            if (data.location.toString() === this.cafeLocationId.toString()) {
                if (this.currentRun && this.currentRun.state === JobState.OFFERED) {
                    this.currentRun.state = JobState.IDLE;
                }
            }
        });
    }
    
    checkAndOfferJob() {
        const slotId = this.getCafeSlotId();
        if (!slotId) return;
        
        const slot = this.getSlot(slotId);
        if (!slot) return;
        
        const presence = this.cityModule.getPresence();
        const isUnlocked = slot.unlockRule === null;
        const isAtLocation = presence.isAt(this.cafeLocationId);
        const isIdle = !this.currentRun || this.currentRun.state === JobState.IDLE;
        
        if (isIdle && isUnlocked && isAtLocation) {
            this.currentRun = new JobRun(slotId);
            this.currentRun.state = JobState.OFFERED;
            this.notifyListeners('jobOffered', { slotId, slot });
        }
    }
    
    acceptJob() {
        if (!this.currentRun || this.currentRun.state !== JobState.OFFERED) return false;
        
        this.currentRun.state = JobState.ACCEPTED;
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobAccepted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    startJob() {
        if (!this.currentRun || this.currentRun.state !== JobState.ACCEPTED) return false;
        
        this.currentRun.state = JobState.IN_PROGRESS;
        this.currentRun.startTime = Date.now();
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobStarted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    completeJob() {
        if (!this.currentRun || this.currentRun.state !== JobState.IN_PROGRESS) return false;
        
        this.currentRun.state = JobState.COMPLETED;
        const slot = this.getSlot(this.currentRun.slotId);
        this.notifyListeners('jobCompleted', { slotId: this.currentRun.slotId, slot });
        return true;
    }
    
    payoutJob() {
        if (!this.currentRun || this.currentRun.state !== JobState.COMPLETED) return null;
        
        const slot = this.getSlot(this.currentRun.slotId);
        if (!slot) return null;
        
        this.currentRun.state = JobState.PAID;
        
        const payout = slot.payoutStub;
        if (payout) {
            this.cashBalance += payout.amount;
        }
        
        const xp = slot.xpStub;
        if (xp && this.skillsStub) {
            this.skillsStub.addXp(xp.skill, xp.amount);
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
        if (this.currentRun && this.currentRun.state === JobState.IN_PROGRESS) {
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

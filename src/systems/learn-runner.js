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
    
    getProgress(durationHint) {
        if (this.state !== LearnJobState.IN_PROGRESS || !this.startTime) {
            return 0;
        }
        const elapsed = Date.now() - this.startTime;
        const durationMs = durationHint * 1000;
        return Math.min(1, elapsed / durationMs);
    }
}

class LearnRunner {
    constructor(cityModule, homeLocationId, skillsStub) {
        this.cityModule = cityModule;
        this.homeLocationId = homeLocationId;
        this.skillsStub = skillsStub;
        this.currentRun = null;
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
        return available.length > 0 ? available[0] : null;
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
        
        this.notifyListeners('jobPaid', { 
            slotId: this.currentRun.slotId,
            slot,
            payout: null,
            xp
        });
        
        this.currentRun.state = LearnJobState.IDLE;
        
        return { payout: null, xp };
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
        if (this.currentRun && this.currentRun.state === LearnJobState.IN_PROGRESS) {
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

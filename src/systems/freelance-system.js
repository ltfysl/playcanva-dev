const JobState = {
    IDLE: 'idle',
    OFFERED: 'offered',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    PAID: 'paid'
};

class FreelanceJob {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.skillTags = config.skillTags || [];
        this.unlockRule = config.unlockRule || null;
        this.durationHint = config.durationHint || 30;
        this.kind = config.kind || 'freelance';
        this.payoutStub = config.payoutStub || { currency: 'cash', amount: 0 };
        this.state = JobState.IDLE;
        this.startTime = null;
    }
    
    isUnlocked() {
        return this.unlockRule === null;
    }
    
    canOffer(presence, locationId) {
        return this.state === JobState.IDLE && 
               this.isUnlocked() && 
               presence.isAt(locationId);
    }
    
    offer() {
        if (this.state === JobState.IDLE) {
            this.state = JobState.OFFERED;
            return true;
        }
        return false;
    }
    
    accept() {
        if (this.state === JobState.OFFERED) {
            this.state = JobState.ACCEPTED;
            return true;
        }
        return false;
    }
    
    start() {
        if (this.state === JobState.ACCEPTED) {
            this.state = JobState.IN_PROGRESS;
            this.startTime = Date.now();
            return true;
        }
        return false;
    }
    
    complete() {
        if (this.state === JobState.IN_PROGRESS) {
            this.state = JobState.COMPLETED;
            return true;
        }
        return false;
    }
    
    payout() {
        if (this.state === JobState.COMPLETED) {
            this.state = JobState.PAID;
            return this.payoutStub;
        }
        return null;
    }
    
    getState() {
        return this.state;
    }
    
    getProgress() {
        if (this.state !== JobState.IN_PROGRESS || !this.startTime) {
            return 0;
        }
        const elapsed = Date.now() - this.startTime;
        const durationMs = this.durationHint * 1000;
        return Math.min(1, elapsed / durationMs);
    }
}

class FreelanceSystem {
    constructor(cityModule, cafeLocationId) {
        this.cityModule = cityModule;
        this.cafeLocationId = cafeLocationId;
        this.currentJob = null;
        this.cashBalance = 0;
        this.listeners = {
            jobOffered: [],
            jobAccepted: [],
            jobStarted: [],
            jobCompleted: [],
            jobPaid: []
        };
        
        this.initializeCafeJob();
        this.setupPresenceListeners();
    }
    
    initializeCafeJob() {
        const cafeLocation = this.cityModule.getLocation(this.cafeLocationId);
        if (!cafeLocation) {
            console.warn('Cafe location not found');
            return;
        }
        
        const activitySlots = cafeLocation.getActivitySlots();
        if (activitySlots.length === 0) {
            console.warn('No activity slots found in cafe');
            return;
        }
        
        const slot = activitySlots[0];
        this.currentJob = new FreelanceJob({
            id: slot.id,
            name: slot.name,
            skillTags: slot.skillTags || [],
            unlockRule: slot.unlockRule || null,
            durationHint: slot.durationHint || 30,
            kind: slot.kind || 'freelance',
            payoutStub: slot.payoutStub || { currency: 'cash', amount: 0 }
        });
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
                if (this.currentJob && this.currentJob.state === JobState.OFFERED) {
                    this.currentJob.state = JobState.IDLE;
                }
            }
        });
    }
    
    checkAndOfferJob() {
        if (!this.currentJob) return;
        
        const presence = this.cityModule.getPresence();
        if (this.currentJob.canOffer(presence, this.cafeLocationId)) {
            this.currentJob.offer();
            this.notifyListeners('jobOffered', { job: this.currentJob });
        }
    }
    
    acceptJob() {
        if (!this.currentJob) return false;
        
        if (this.currentJob.accept()) {
            this.notifyListeners('jobAccepted', { job: this.currentJob });
            return true;
        }
        return false;
    }
    
    startJob() {
        if (!this.currentJob) return false;
        
        if (this.currentJob.start()) {
            this.notifyListeners('jobStarted', { job: this.currentJob });
            return true;
        }
        return false;
    }
    
    completeJob() {
        if (!this.currentJob) return false;
        
        if (this.currentJob.complete()) {
            this.notifyListeners('jobCompleted', { job: this.currentJob });
            return true;
        }
        return false;
    }
    
    payoutJob() {
        if (!this.currentJob) return null;
        
        const payout = this.currentJob.payout();
        if (payout) {
            this.cashBalance += payout.amount;
            this.notifyListeners('jobPaid', { 
                job: this.currentJob, 
                payout: payout,
                newBalance: this.cashBalance 
            });
            return payout;
        }
        return null;
    }
    
    getCurrentJob() {
        return this.currentJob;
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
        if (this.currentJob && this.currentJob.state === JobState.IN_PROGRESS) {
            const progress = this.currentJob.getProgress();
            if (progress >= 1.0) {
                this.completeJob();
                this.payoutJob();
            }
        }
    }
}

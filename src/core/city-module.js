const BuildingKind = {
    HOME: 'home',
    CAFE: 'cafe',
    COWORK: 'cowork',
    OFFICE: 'office',
    CAMPUS: 'campus',
    SERVER_ROOM: 'serverRoom',
    AGENCY: 'agency',
    STORE: 'store',
    GYM: 'gym',
    LIBRARY: 'library'
};

const UnlockState = {
    LOCKED: 'locked',
    AVAILABLE: 'available',
    OWNED: 'owned'
};

class LocationId {
    constructor(districtId, buildingId) {
        this.districtId = districtId;
        this.buildingId = buildingId;
    }
    
    toString() {
        return `${this.districtId}:${this.buildingId}`;
    }
    
    static fromString(str) {
        const [districtId, buildingId] = str.split(':');
        return new LocationId(districtId, buildingId);
    }
}

class Presence {
    constructor(locationId = null) {
        this.currentLocation = locationId;
        this.previousLocation = null;
        this.enterTime = null;
        this.listeners = {
            enter: [],
            exit: []
        };
    }
    
    enter(locationId) {
        this.previousLocation = this.currentLocation;
        this.currentLocation = locationId;
        this.enterTime = Date.now();
        
        this.notifyListeners('enter', {
            location: locationId,
            previousLocation: this.previousLocation,
            timestamp: this.enterTime
        });
    }
    
    exit(locationId) {
        const exitTime = Date.now();
        const duration = this.enterTime ? exitTime - this.enterTime : 0;
        
        this.notifyListeners('exit', {
            location: locationId,
            duration: duration,
            timestamp: exitTime
        });
        
        this.previousLocation = this.currentLocation;
        this.currentLocation = null;
        this.enterTime = null;
    }
    
    getCurrentLocation() {
        return this.currentLocation;
    }
    
    isAt(locationId) {
        return this.currentLocation && 
               this.currentLocation.toString() === locationId.toString();
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
}

class ActivitySlot {
    constructor(id, config = {}) {
        this.id = id;
        this.skillTags = config.skillTags || [];
        this.unlockRule = config.unlockRule || null;
        this.durationHint = config.durationHint || 60;
        this.name = config.name || id;
        this.description = config.description || '';
        this.kind = config.kind || 'activity';
        this.payoutStub = config.payoutStub || null;
        this.xpStub = config.xpStub || null;
    }
    
    isUnlocked(skillsStub = null) {
        if (!this.unlockRule) return true;
        if (!skillsStub) return false;
        
        const { skill, minXp } = this.unlockRule;
        return skillsStub.getXp(skill) >= minXp;
    }
    
    getSkillTags() {
        return [...this.skillTags];
    }
}

class ReputationSurface {
    constructor(districtId = null, visibility = 0) {
        this.districtId = districtId;
        this.visibility = visibility;
    }
    
    getDistrictId() {
        return this.districtId;
    }
    
    getVisibility() {
        return this.visibility;
    }
    
    setVisibility(value) {
        this.visibility = Math.max(0, Math.min(1, value));
    }
}

class LocationData {
    constructor(locationId, buildingKind, config = {}) {
        this.locationId = locationId;
        this.buildingKind = buildingKind;
        this.name = config.name || buildingKind;
        this.unlockState = config.unlockState || UnlockState.LOCKED;
        this.activitySlots = config.activitySlots || [];
        this.reputationSurface = config.reputationSurface || null;
        this.position = config.position || { x: 0, y: 0, z: 0 };
    }
    
    isLocked() {
        return this.unlockState === UnlockState.LOCKED;
    }
    
    isAvailable() {
        return this.unlockState === UnlockState.AVAILABLE;
    }
    
    isOwned() {
        return this.unlockState === UnlockState.OWNED;
    }
    
    canEnter() {
        return this.unlockState === UnlockState.AVAILABLE || 
               this.unlockState === UnlockState.OWNED;
    }
    
    getActivitySlots() {
        return [...this.activitySlots];
    }
    
    addActivitySlot(slot) {
        this.activitySlots.push(slot);
    }
}

class CityModule {
    constructor() {
        this.locations = new Map();
        this.presence = new Presence();
        this.districts = new Map();
    }
    
    registerLocation(locationData) {
        const key = locationData.locationId.toString();
        this.locations.set(key, locationData);
    }
    
    getLocation(locationId) {
        const key = typeof locationId === 'string' ? locationId : locationId.toString();
        return this.locations.get(key);
    }
    
    getAllLocations() {
        return Array.from(this.locations.values());
    }
    
    getLocationsByKind(buildingKind) {
        return Array.from(this.locations.values())
            .filter(loc => loc.buildingKind === buildingKind);
    }
    
    getPresence() {
        return this.presence;
    }
    
    enterLocation(locationId) {
        const location = this.getLocation(locationId);
        if (location && location.canEnter()) {
            this.presence.enter(locationId);
            return true;
        }
        return false;
    }
    
    exitLocation(locationId) {
        this.presence.exit(locationId);
    }
    
    getCurrentLocation() {
        const currentLocId = this.presence.getCurrentLocation();
        return currentLocId ? this.getLocation(currentLocId) : null;
    }
}

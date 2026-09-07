class GameManager {
    constructor(app) {
        this.app = app;
        this.player = null;
        this.cityGenerator = null;
        this.lightingSystem = null;
        this.minimap = null;
        this.currentLocation = 'Downtown District';
        this.isInBuilding = false;
        this.currentBuilding = null;
        this.districts = [];
        this.buildings = [];
        this.freelanceSystem = null;
        this.learnRunner = null;
        this.solHUD = null;
        this.skillsStub = new SkillsStub();
    }
    
    initialize() {
        try {
            this.setupScene();
            this.createCamera();
            this.createPlayer();
            this.generateCity();
            this.setupLighting();
            this.setupUI();
            this.setupInputHandlers();
            
            console.log('Game Manager initialized');
        } catch (error) {
            console.error('GameManager initialization failed:', error.message);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }
    
    setupScene() {
        this.app.scene.ambientLight = new pc.Color(0.35, 0.4, 0.5);
        this.app.scene.fog.type = pc.FOG_LINEAR;
        this.app.scene.fog.start = 50;
        this.app.scene.fog.end = 200;
        this.app.scene.fog.color = new pc.Color(0.58, 0.68, 0.78);
        this.app.scene.fog.density = 0.002;
        
        this.createSkyGradient();
    }
    
    createSkyGradient() {
        const skybox = new pc.Entity('skybox');
        skybox.addComponent('render', {
            type: 'sphere',
            material: this.createSkyMaterial()
        });
        skybox.setLocalScale(400, 400, 400);
        skybox.setLocalPosition(0, 0, 0);
        this.app.root.addChild(skybox);
    }
    
    createSkyMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.45, 0.55, 0.7);
        material.emissive = new pc.Color(0.3, 0.4, 0.55);
        material.cull = pc.CULLFACE_FRONT;
        material.useLighting = false;
        material.update();
        return material;
    }
    
    createCamera() {
        const cameraEntity = new pc.Entity('camera');
        cameraEntity.addComponent('camera', {
            clearColor: new pc.Color(0.5, 0.6, 0.8),
            farClip: 500,
            fov: 75
        });
        cameraEntity.setLocalPosition(0, 10, 20);
        cameraEntity.lookAt(0, 0, 0);
        this.app.root.addChild(cameraEntity);
        this.camera = cameraEntity;
    }
    
    createPlayer() {
        this.player = new PlayerController(this.app, this.camera);
        this.player.setPosition(0, 0, 0);
    }
    
    generateCity() {
        this.cityGenerator = new CityGenerator(this.app, this);
        this.cityGenerator.generate();
    }
    
    setupLighting() {
        this.lightingSystem = new LightingSystem(this.app);
        this.lightingSystem.initialize();
    }
    
    setupUI() {
        this.minimap = new Minimap(this);
        this.solHUD = new SolHUD();
        this.setupFreelanceListeners();
        this.setupLearnListeners();
    }
    
    setupFreelanceListeners() {
        const checkFreelanceSystem = () => {
            if (this.freelanceSystem) {
                runnerRegistry.register('freelance', this.freelanceSystem);
                
                this.freelanceSystem.on('jobOffered', (data) => {
                    const payout = data.slot.payoutStub.amount;
                    this.solHUD.showJobOffer(data.slot.name, payout);
                });
                
                this.freelanceSystem.on('jobAccepted', (data) => {
                    this.freelanceSystem.startJob();
                });
                
                this.freelanceSystem.on('jobStarted', (data) => {
                    this.solHUD.showInProgress();
                });
                
                this.freelanceSystem.on('jobPaid', (data) => {
                    this.solHUD.showPayout(data.payout.amount, data.xp);
                    console.log('Job paid:', data.payout.amount, 'XP awarded:', data.xp, 'New balance:', data.newBalance);
                    
                    setTimeout(() => {
                        this.freelanceSystem.checkAndOfferJob();
                    }, 1600);
                });
                
                this.freelanceSystem.on('jobLocked', (data) => {
                    if (data.slot.unlockRule) {
                        this.solHUD.showLocked(data.slot.unlockRule, this.skillsStub);
                    }
                });
                
                this.cityModule.getPresence().on('enter', (data) => {
                    if (data.location.toString() === this.freelanceSystem.cafeLocationId.toString()) {
                        this.updateSolHUDForLocation();
                    }
                });
                
                this.cityModule.getPresence().on('exit', (data) => {
                    if (data.location.toString() === this.freelanceSystem.cafeLocationId.toString()) {
                        this.solHUD.hide();
                    }
                });
            } else {
                setTimeout(checkFreelanceSystem, 100);
            }
        };
        
        checkFreelanceSystem();
    }
    
    setupLearnListeners() {
        const checkLearnRunner = () => {
            if (this.learnRunner) {
                runnerRegistry.register('learn', this.learnRunner);
                
                this.learnRunner.on('jobOffered', (data) => {
                    const xp = data.slot.xpStub.amount;
                    this.solHUD.showLearnOffer(data.slot.name, xp);
                });
                
                this.learnRunner.on('jobAccepted', (data) => {
                    this.learnRunner.startJob();
                });
                
                this.learnRunner.on('jobStarted', (data) => {
                    this.solHUD.showLearnInProgress();
                });
                
                this.learnRunner.on('jobPaid', (data) => {
                    this.solHUD.showLearnPayout(data.xp);
                    console.log('Learn XP awarded:', data.xp);
                    
                    setTimeout(() => {
                        this.learnRunner.checkAndOfferJob();
                    }, 1600);
                });
                
                this.cityModule.getPresence().on('exit', (data) => {
                    if (data.location.toString() === this.learnRunner.homeLocationId.toString()) {
                        this.solHUD.hide();
                    }
                });
            } else {
                setTimeout(checkLearnRunner, 100);
            }
        };
        
        checkLearnRunner();
    }
    
    setupCareerListeners() {
        const checkCareerRunner = () => {
            if (this.careerRunner) {
                runnerRegistry.register('career', this.careerRunner);
                
                this.careerRunner.on('jobOffered', (data) => {
                    const payout = data.slot.payoutStub.amount;
                    this.solHUD.showJobOffer(data.slot.name, payout);
                });
                
                this.careerRunner.on('jobAccepted', (data) => {
                    this.careerRunner.startJob();
                });
                
                this.careerRunner.on('jobStarted', (data) => {
                    this.solHUD.showCareerInProgress();
                });
                
                this.careerRunner.on('jobPaid', (data) => {
                    this.solHUD.showPayout(data.payout.amount, data.xp);
                    console.log('Career job paid:', data.payout.amount, 'XP awarded:', data.xp, 'New balance:', data.newBalance);
                });
                
                this.careerRunner.on('jobLocked', (data) => {
                    if (data.slot.unlockRule) {
                        this.solHUD.showLocked(data.slot.unlockRule, this.skillsStub);
                    }
                });
                
                this.cityModule.getPresence().on('enter', (data) => {
                    if (data.location.toString() === this.careerRunner.officeLocationId.toString()) {
                        this.careerRunner.checkAndOfferJob();
                    }
                });
                
                this.cityModule.getPresence().on('exit', (data) => {
                    if (data.location.toString() === this.careerRunner.officeLocationId.toString()) {
                        this.solHUD.hide();
                    }
                });
            } else {
                setTimeout(checkCareerRunner, 100);
            }
        };
        
        checkCareerRunner();
    }
    
    updateSolHUDForLocation() {
        if (!this.freelanceSystem || !this.solHUD) return;
        
        const currentRun = this.freelanceSystem.getCurrentRun();
        if (currentRun && currentRun.state !== 'idle') {
            return;
        }
        
        const cafeLocation = this.cityModule.getLocation(this.freelanceSystem.cafeLocationId);
        if (!cafeLocation) return;
        
        const slots = cafeLocation.getActivitySlots();
        const freelanceSlots = slots.filter(s => s.kind === 'freelance');
        
        for (const slot of freelanceSlots) {
            const history = this.freelanceSystem.slotHistory.get(slot.id);
            if (history && history.state === 'paid') {
                continue;
            }
            
            if (!slot.isUnlocked(this.skillsStub)) {
                this.solHUD.showLocked(slot.unlockRule, this.skillsStub);
                return;
            }
        }
    }
    
    setupInputHandlers() {
        this.app.keyboard.on(pc.EVENT_KEYDOWN, (event) => {
            if (event.key === pc.KEY_E) {
                this.handleInteraction();
            }
        });
    }
    
    handleInteraction() {
        if (this.isInBuilding) {
            if (this.tryRunnerInteraction()) {
                return;
            }
            this.exitBuilding();
        } else {
            if (this.tryRunnerInteraction()) {
                return;
            }
            this.tryEnterBuilding();
        }
    }
    
    tryRunnerInteraction() {
        if (!this.solHUD) return false;
        
        const currentLocation = this.cityModule.getCurrentLocation();
        if (!currentLocation) return false;
        
        const slots = currentLocation.getActivitySlots();
        if (slots.length === 0) return false;
        
        for (const slot of slots) {
            if (!slot.kind) continue;
            
            const runner = runnerRegistry.get(slot.kind);
            if (!runner) continue;
            
            const currentRun = runner.getCurrentRun();
            if (!currentRun) continue;
            
            const hudState = this.solHUD.getCurrentState();
            
            if (hudState === 'offered' && currentRun.state === 'offered') {
                runner.acceptJob();
                return true;
            }
            
            if (hudState === 'inProgress' && currentRun.state === 'inProgress') {
                runner.completeJob();
                runner.payoutJob();
                return true;
            }
        }
        
        return false;
    }
    
    tryEnterBuilding() {
        const playerPos = this.player.getPosition();
        
        for (const building of this.buildings) {
            if (building.isNearby(playerPos, GameConfig.player.interactionDistance)) {
                const locationId = new LocationId(building.districtId, building.id);
                const location = this.cityModule.getLocation(locationId);
                
                if (location && location.canEnter() && building.interior) {
                    this.enterBuilding(building);
                    return;
                }
            }
        }
    }
    
    enterBuilding(building) {
        console.log('Entering building:', building.name);
        this.isInBuilding = true;
        this.currentBuilding = building;
        building.enter(this.player);
        this.updateLocationIndicator(building.name + ' (Interior)');
        
        if (this.cityModule) {
            const locationId = new LocationId(building.districtId, building.id);
            this.cityModule.enterLocation(locationId);
            
            if (this.learnRunner && locationId.toString() === this.learnRunner.homeLocationId.toString()) {
                this.learnRunner.checkAndOfferJob();
            }
            
            if (this.freelanceSystem && locationId.toString() === this.freelanceSystem.cafeLocationId.toString()) {
                this.freelanceSystem.checkAndOfferJob();
            }
            
            if (this.careerRunner && locationId.toString() === this.careerRunner.officeLocationId.toString()) {
                this.careerRunner.checkAndOfferJob();
            }
        }
    }
    
    exitBuilding() {
        if (!this.currentBuilding) return;
        
        console.log('Exiting building');
        
        if (this.cityModule) {
            const locationId = new LocationId(this.currentBuilding.districtId, this.currentBuilding.id);
            this.cityModule.exitLocation(locationId);
        }
        
        this.currentBuilding.exit(this.player);
        this.isInBuilding = false;
        this.currentBuilding = null;
        this.updateLocationIndicator('Downtown District');
    }
    
    updateLocationIndicator(location) {
        this.currentLocation = location;
        const indicator = document.getElementById('location-indicator');
        if (indicator) {
            indicator.textContent = location;
        }
    }
    
    update(dt) {
        if (this.player) {
            this.player.update(dt);
        }
        
        if (this.lightingSystem) {
            this.lightingSystem.update(dt);
        }
        
        if (this.minimap) {
            this.minimap.update();
        }
        
        if (this.freelanceSystem) {
            this.freelanceSystem.update(dt);
        }
        
        if (this.learnRunner) {
            this.learnRunner.update(dt);
        }
        
        this.checkDistrictTransition();
    }
    
    checkDistrictTransition() {
        if (this.isInBuilding) return;
        
        const playerPos = this.player.getPosition();
        
        for (const district of this.districts) {
            const dx = playerPos.x - district.position.x;
            const dz = playerPos.z - district.position.z;
            const distSq = dx * dx + dz * dz;
            
            if (distSq < 3600) {
                if (this.currentLocation !== district.name) {
                    this.updateLocationIndicator(district.name);
                }
                return;
            }
        }
    }
    
    registerDistrict(district) {
        this.districts.push(district);
    }
    
    registerBuilding(building) {
        this.buildings.push(building);
    }
}

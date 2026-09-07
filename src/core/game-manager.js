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
    }
    
    setupFreelanceListeners() {
        const checkFreelanceSystem = () => {
            if (this.freelanceSystem) {
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
                });
            } else {
                setTimeout(checkFreelanceSystem, 100);
            }
        };
        
        checkFreelanceSystem();
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
            if (this.tryFreelanceInteraction()) {
                return;
            }
            this.exitBuilding();
        } else {
            if (this.tryFreelanceInteraction()) {
                return;
            }
            this.tryEnterBuilding();
        }
    }
    
    tryFreelanceInteraction() {
        if (!this.freelanceSystem || !this.solHUD) return false;
        
        const currentRun = this.freelanceSystem.getCurrentRun();
        if (!currentRun) return false;
        
        const hudState = this.solHUD.getCurrentState();
        
        if (hudState === 'offered' && currentRun.state === 'offered') {
            this.freelanceSystem.acceptJob();
            return true;
        }
        
        if (hudState === 'inProgress' && currentRun.state === 'inProgress') {
            this.freelanceSystem.completeJob();
            this.freelanceSystem.payoutJob();
            return true;
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

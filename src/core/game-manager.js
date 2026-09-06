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
    }
    
    initialize() {
        this.setupScene();
        this.createCamera();
        this.createPlayer();
        this.generateCity();
        this.setupLighting();
        this.setupUI();
        this.setupInputHandlers();
        
        console.log('Game Manager initialized');
    }
    
    setupScene() {
        this.app.scene.ambientLight = new pc.Color(0.3, 0.3, 0.4);
        this.app.scene.fog = pc.FOG_LINEAR;
        this.app.scene.fogColor = new pc.Color(0.6, 0.7, 0.8);
        this.app.scene.fogStart = 50;
        this.app.scene.fogEnd = 300;
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
            this.exitBuilding();
        } else {
            this.tryEnterBuilding();
        }
    }
    
    tryEnterBuilding() {
        const playerPos = this.player.getPosition();
        
        for (const building of this.buildings) {
            if (building.isNearby(playerPos, GameConfig.player.interactionDistance)) {
                const locationId = new LocationId('downtown', building.id);
                const location = this.cityModule.getLocation(locationId);
                
                if (location && location.canEnter()) {
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
            const locationId = new LocationId('downtown', building.id);
            this.cityModule.enterLocation(locationId);
        }
    }
    
    exitBuilding() {
        if (!this.currentBuilding) return;
        
        console.log('Exiting building');
        
        if (this.cityModule) {
            const locationId = new LocationId('downtown', this.currentBuilding.id);
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

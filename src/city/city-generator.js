class CityGenerator {
    constructor(app, gameManager) {
        this.app = app;
        this.gameManager = gameManager;
        this.districts = [];
        this.cityModule = new CityModule();
        this.gameManager.cityModule = this.cityModule;
    }
    
    generate() {
        console.log('Generating city...');
        
        this.createGlobalGround();
        this.createDistricts();
        this.createStarterHome();
        this.createCafe();
        this.createCoworkSpace();
        
        console.log(`City generated with ${this.districts.length} districts`);
    }
    
    createGlobalGround() {
        const groundSize = 1000;
        const ground = new pc.Entity('global-ground');
        
        ground.addComponent('render', {
            type: 'plane',
            material: this.createGroundMaterial()
        });
        
        ground.setLocalScale(groundSize, 1, groundSize);
        ground.setLocalPosition(0, -0.5, 0);
        ground.setLocalEulerAngles(-90, 0, 0);
        
        this.app.root.addChild(ground);
    }
    
    createGroundMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.12, 0.18, 0.12);
        material.specular = new pc.Color(0.05, 0.05, 0.05);
        material.shininess = 5;
        material.update();
        return material;
    }
    
    createDistricts() {
        for (const districtConfig of GameConfig.districts) {
            const district = new District(this.app, this.gameManager, districtConfig);
            this.districts.push(district);
        }
    }
    
    createStarterHome() {
        const downtownDistrict = this.districts.find(d => d.id === 'downtown');
        if (!downtownDistrict) return;
        
        const homePosition = new pc.Vec3(
            GameConfig.city.blockSize,
            0,
            GameConfig.city.blockSize
        );
        
        const locationId = new LocationId('downtown', 'starter-home');
        
        const home = new Building(
            this.app,
            this.gameManager,
            'starter-home',
            'Your Apartment',
            homePosition,
            'home',
            UnlockState.OWNED
        );
        
        home.setEnterable(true);
        
        const interior = new HomeInterior(this.app, this.gameManager, home);
        home.setInterior(interior);
        
        const homeLocation = new LocationData(locationId, BuildingKind.HOME, {
            name: 'Your Apartment',
            unlockState: UnlockState.OWNED,
            position: homePosition,
            activitySlots: [
                new ActivitySlot('work-desk', {
                    name: 'Work at Desk',
                    skillTags: [],
                    durationHint: 120
                }),
                new ActivitySlot('rest', {
                    name: 'Rest',
                    skillTags: [],
                    durationHint: 30
                })
            ]
        });
        
        this.cityModule.registerLocation(homeLocation);
        
        console.log('Starter home created at', homePosition);
    }
    
    createCafe() {
        const cafePosition = new pc.Vec3(
            -GameConfig.city.blockSize,
            0,
            GameConfig.city.blockSize * 1.5
        );
        
        const locationId = new LocationId('downtown', 'the-bean-cafe');
        
        const cafe = new Building(
            this.app,
            this.gameManager,
            'the-bean-cafe',
            'The Bean Café',
            cafePosition,
            'cafe',
            UnlockState.AVAILABLE
        );
        
        cafe.setEnterable(false);
        
        const cafeLocation = new LocationData(locationId, BuildingKind.CAFE, {
            name: 'The Bean Café',
            unlockState: UnlockState.AVAILABLE,
            position: cafePosition,
            activitySlots: [
                new ActivitySlot('coffee-networking', {
                    name: 'Network over Coffee',
                    skillTags: [],
                    durationHint: 60
                })
            ]
        });
        
        this.cityModule.registerLocation(cafeLocation);
    }
    
    createCoworkSpace() {
        const coworkPosition = new pc.Vec3(
            GameConfig.city.blockSize * 2,
            0,
            -GameConfig.city.blockSize
        );
        
        const locationId = new LocationId('downtown', 'hub-cowork');
        
        const cowork = new Building(
            this.app,
            this.gameManager,
            'hub-cowork',
            'Hub Cowork',
            coworkPosition,
            'cowork',
            UnlockState.LOCKED
        );
        
        cowork.setEnterable(false);
        
        const coworkLocation = new LocationData(locationId, BuildingKind.COWORK, {
            name: 'Hub Cowork',
            unlockState: UnlockState.LOCKED,
            position: coworkPosition,
            activitySlots: [
                new ActivitySlot('focus-work', {
                    name: 'Focus Work',
                    skillTags: [],
                    durationHint: 180
                }),
                new ActivitySlot('collaboration', {
                    name: 'Collaborate',
                    skillTags: [],
                    durationHint: 90
                })
            ]
        });
        
        this.cityModule.registerLocation(coworkLocation);
    }
}

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
        this.createSkylineProps();
        
        console.log(`City generated with ${this.districts.length} districts`);
    }
    
    createGlobalGround() {
        const groundSize = 1000;
        const ground = new pc.Entity('global-ground');
        
        ground.addComponent('render', {
            type: 'plane',
            material: this.createGroundMaterial()
        });
        
        ground.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(0.5, 0.5, 0.5)
        });
        
        ground.addComponent('rigidbody', {
            type: 'static'
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
        
        const districtId = downtownDistrict.id;
        const locationId = new LocationId(districtId, 'starter-home');
        
        const home = new Building(
            this.app,
            this.gameManager,
            'starter-home',
            'Your Apartment',
            homePosition,
            'home',
            UnlockState.OWNED,
            districtId
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
        const downtownDistrict = this.districts.find(d => d.id === 'downtown');
        if (!downtownDistrict) return;
        
        const cafePosition = new pc.Vec3(
            -GameConfig.city.blockSize,
            0,
            GameConfig.city.blockSize * 1.5
        );
        
        const districtId = downtownDistrict.id;
        const locationId = new LocationId(districtId, 'the-bean-cafe');
        
        const cafe = new Building(
            this.app,
            this.gameManager,
            'the-bean-cafe',
            'The Bean Café',
            cafePosition,
            'cafe',
            UnlockState.AVAILABLE,
            districtId
        );
        
        cafe.setEnterable(true);
        
        const interior = new CafeInterior(this.app, this.gameManager, cafe);
        cafe.setInterior(interior);
        
        const cafeLocation = new LocationData(locationId, BuildingKind.CAFE, {
            name: 'The Bean Café',
            unlockState: UnlockState.AVAILABLE,
            position: cafePosition,
            activitySlots: [
                new ActivitySlot('cafe-bugfix-1', {
                    name: 'Quick bugfix',
                    skillTags: ['coding'],
                    unlockRule: null,
                    durationHint: 30,
                    kind: 'freelance',
                    payoutStub: { currency: 'cash', amount: 50 },
                    xpStub: { skill: 'coding', amount: 10 }
                })
            ]
        });
        
        this.cityModule.registerLocation(cafeLocation);
        
        this.freelanceSystem = new FreelanceSystem(
            this.cityModule, 
            locationId, 
            this.gameManager.skillsStub
        );
        this.gameManager.freelanceSystem = this.freelanceSystem;
    }
    
    createCoworkSpace() {
        const downtownDistrict = this.districts.find(d => d.id === 'downtown');
        if (!downtownDistrict) return;
        
        const coworkPosition = new pc.Vec3(
            GameConfig.city.blockSize * 2,
            0,
            -GameConfig.city.blockSize
        );
        
        const districtId = downtownDistrict.id;
        const locationId = new LocationId(districtId, 'hub-cowork');
        
        const cowork = new Building(
            this.app,
            this.gameManager,
            'hub-cowork',
            'Hub Cowork',
            coworkPosition,
            'cowork',
            UnlockState.LOCKED,
            districtId
        );
        
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
    
    createSkylineProps() {
        const skylineBuildings = [
            { pos: new pc.Vec3(-90, 0, 80), scale: { x: 28, y: 45, z: 28 }, color: GameConfig.colors.tech },
            { pos: new pc.Vec3(-75, 0, -85), scale: { x: 22, y: 38, z: 22 }, color: GameConfig.colors.industrial },
            { pos: new pc.Vec3(85, 0, -75), scale: { x: 32, y: 50, z: 32 }, color: GameConfig.colors.commercial },
            { pos: new pc.Vec3(95, 0, 70), scale: { x: 25, y: 42, z: 25 }, color: GameConfig.colors.startup },
            { pos: new pc.Vec3(-105, 0, -40), scale: { x: 30, y: 55, z: 30 }, color: GameConfig.colors.corporate },
            { pos: new pc.Vec3(70, 0, 95), scale: { x: 20, y: 35, z: 20 }, color: GameConfig.colors.creative },
            { pos: new pc.Vec3(-60, 0, 105), scale: { x: 26, y: 40, z: 26 }, color: GameConfig.colors.dev },
            { pos: new pc.Vec3(110, 0, -45), scale: { x: 24, y: 48, z: 24 }, color: GameConfig.colors.residential },
            { pos: new pc.Vec3(-85, 0, 55), scale: { x: 18, y: 32, z: 18 }, color: new pc.Color(0.4, 0.5, 0.65) },
            { pos: new pc.Vec3(60, 0, -100), scale: { x: 28, y: 44, z: 28 }, color: new pc.Color(0.45, 0.35, 0.55) },
            { pos: new pc.Vec3(-100, 0, -70), scale: { x: 22, y: 36, z: 22 }, color: new pc.Color(0.35, 0.45, 0.4) },
            { pos: new pc.Vec3(80, 0, 85), scale: { x: 26, y: 46, z: 26 }, color: new pc.Color(0.5, 0.4, 0.45) },
            { pos: new pc.Vec3(-50, 0, -95), scale: { x: 20, y: 34, z: 20 }, color: GameConfig.colors.tech },
            { pos: new pc.Vec3(100, 0, 50), scale: { x: 24, y: 40, z: 24 }, color: GameConfig.colors.startup },
            { pos: new pc.Vec3(-95, 0, 90), scale: { x: 22, y: 38, z: 22 }, color: GameConfig.colors.creative },
            { pos: new pc.Vec3(75, 0, -60), scale: { x: 26, y: 42, z: 26 }, color: GameConfig.colors.commercial },
            { pos: new pc.Vec3(-70, 0, -50), scale: { x: 18, y: 30, z: 18 }, color: new pc.Color(0.55, 0.45, 0.6) },
            { pos: new pc.Vec3(90, 0, -90), scale: { x: 20, y: 36, z: 20 }, color: GameConfig.colors.dev },
            { pos: new pc.Vec3(-110, 0, 60), scale: { x: 28, y: 48, z: 28 }, color: GameConfig.colors.corporate },
            { pos: new pc.Vec3(65, 0, 75), scale: { x: 22, y: 38, z: 22 }, color: new pc.Color(0.4, 0.6, 0.5) },
            { pos: new pc.Vec3(-80, 0, -105), scale: { x: 24, y: 44, z: 24 }, color: GameConfig.colors.industrial },
            { pos: new pc.Vec3(105, 0, -25), scale: { x: 20, y: 34, z: 20 }, color: new pc.Color(0.5, 0.35, 0.45) },
            { pos: new pc.Vec3(-65, 0, 85), scale: { x: 26, y: 40, z: 26 }, color: GameConfig.colors.residential },
            { pos: new pc.Vec3(85, 0, -105), scale: { x: 18, y: 32, z: 18 }, color: new pc.Color(0.45, 0.5, 0.55) }
        ];
        
        skylineBuildings.forEach((config, idx) => {
            const prop = new pc.Entity(`skyline-prop-${idx}`);
            
            const body = new pc.Entity('body');
            body.addComponent('render', {
                type: 'box',
                material: this.createSkylineMaterial(config.color)
            });
            body.setLocalScale(config.scale.x, config.scale.y, config.scale.z);
            body.setLocalPosition(0, config.scale.y / 2, 0);
            prop.addChild(body);
            
            prop.setPosition(config.pos);
            this.app.root.addChild(prop);
        });
    }
    
    createSkylineMaterial(color) {
        const material = new pc.StandardMaterial();
        material.diffuse = color;
        material.specular = new pc.Color(0.1, 0.1, 0.1);
        material.shininess = 15;
        material.update();
        return material;
    }
}

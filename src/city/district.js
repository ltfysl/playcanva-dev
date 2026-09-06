class District {
    constructor(app, gameManager, config) {
        this.app = app;
        this.gameManager = gameManager;
        this.id = config.id;
        this.name = config.name;
        this.type = config.type;
        this.position = config.position;
        this.entity = null;
        this.buildings = [];
        
        this.create();
    }
    
    create() {
        this.entity = new pc.Entity(`district-${this.id}`);
        this.entity.setPosition(this.position.x, 0, this.position.z);
        this.app.root.addChild(this.entity);
        
        this.createGround();
        this.createStreets();
        
        this.gameManager.registerDistrict(this);
    }
    
    createGround() {
        const size = GameConfig.city.districtSize * GameConfig.city.blockSize;
        
        const ground = new pc.Entity('ground');
        ground.addComponent('render', {
            type: 'box',
            material: this.createMaterial(GameConfig.colors.ground)
        });
        
        ground.setLocalScale(size, 0.2, size);
        ground.setLocalPosition(0, -0.1, 0);
        this.entity.addChild(ground);
    }
    
    createStreets() {
        const districtSize = GameConfig.city.districtSize;
        const blockSize = GameConfig.city.blockSize;
        const streetWidth = GameConfig.city.streetWidth;
        const streetMat = this.createMaterial(GameConfig.colors.street);
        
        for (let i = 0; i <= districtSize; i++) {
            const offset = (i - districtSize / 2) * blockSize;
            
            const streetX = new pc.Entity(`street-x-${i}`);
            streetX.addComponent('render', {
                type: 'box',
                material: streetMat
            });
            streetX.setLocalScale(districtSize * blockSize, 0.1, streetWidth);
            streetX.setLocalPosition(0, 0.05, offset);
            this.entity.addChild(streetX);
            
            const streetZ = new pc.Entity(`street-z-${i}`);
            streetZ.addComponent('render', {
                type: 'box',
                material: streetMat
            });
            streetZ.setLocalScale(streetWidth, 0.1, districtSize * blockSize);
            streetZ.setLocalPosition(offset, 0.05, 0);
            this.entity.addChild(streetZ);
        }
    }
    
    createMaterial(color, opacity = 1.0) {
        const material = new pc.StandardMaterial();
        material.diffuse = color;
        material.specular = new pc.Color(0.2, 0.2, 0.2);
        material.shininess = 30;
        
        if (opacity < 1.0) {
            material.opacity = opacity;
            material.blendType = pc.BLEND_NORMAL;
            material.update();
        }
        
        material.update();
        return material;
    }
    
    getRandomBuildingPosition() {
        if (this.buildings.length === 0) return null;
        const building = this.buildings[Math.floor(Math.random() * this.buildings.length)];
        return building.position.clone();
    }
}

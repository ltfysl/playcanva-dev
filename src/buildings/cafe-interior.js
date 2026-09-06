class CafeInterior {
    constructor(app, gameManager, building) {
        this.app = app;
        this.gameManager = gameManager;
        this.building = building;
        this.entity = null;
        
        this.create();
    }
    
    create() {
        this.entity = new pc.Entity('cafe-interior');
        this.entity.setPosition(500, 0, 600);
        this.entity.enabled = false;
        this.app.root.addChild(this.entity);
        
        this.createWalls();
        this.createFloor();
        this.createCeiling();
        this.createMinimalFurniture();
        this.createLighting();
    }
    
    createWalls() {
        const wallMaterial = this.createWallMaterial();
        const wallHeight = 3;
        const wallThickness = 0.2;
        
        const walls = [
            { pos: [0, wallHeight/2, -7], scale: [14, wallHeight, wallThickness] },
            { pos: [0, wallHeight/2, 7], scale: [14, wallHeight, wallThickness] },
            { pos: [-7, wallHeight/2, 0], scale: [wallThickness, wallHeight, 14] },
            { pos: [7, wallHeight/2, 0], scale: [wallThickness, wallHeight, 14] }
        ];
        
        walls.forEach((wallData, i) => {
            const wall = new pc.Entity(`wall-${i}`);
            wall.addComponent('render', {
                type: 'box',
                material: wallMaterial
            });
            wall.setLocalPosition(...wallData.pos);
            wall.setLocalScale(...wallData.scale);
            this.entity.addChild(wall);
        });
    }
    
    createFloor() {
        const floor = new pc.Entity('floor');
        floor.addComponent('render', {
            type: 'box',
            material: this.createFloorMaterial()
        });
        floor.setLocalScale(14, 0.1, 14);
        floor.setLocalPosition(0, 0, 0);
        this.entity.addChild(floor);
    }
    
    createCeiling() {
        const ceiling = new pc.Entity('ceiling');
        ceiling.addComponent('render', {
            type: 'box',
            material: this.createCeilingMaterial()
        });
        ceiling.setLocalScale(14, 0.1, 14);
        ceiling.setLocalPosition(0, 3, 0);
        this.entity.addChild(ceiling);
    }
    
    createMinimalFurniture() {
        const deskTop = new pc.Entity('work-desk-top');
        deskTop.addComponent('render', {
            type: 'box',
            material: this.createFurnitureMaterial(new pc.Color(0.45, 0.35, 0.25))
        });
        deskTop.setLocalPosition(-3, 0.85, -3);
        deskTop.setLocalScale(2, 0.1, 1);
        this.entity.addChild(deskTop);
        
        const legPositions = [
            [-3.7, 0.4, -3.3],
            [-2.3, 0.4, -3.3],
            [-3.7, 0.4, -2.7],
            [-2.3, 0.4, -2.7]
        ];
        
        legPositions.forEach((pos, i) => {
            const leg = new pc.Entity(`desk-leg-${i}`);
            leg.addComponent('render', {
                type: 'box',
                material: this.createFurnitureMaterial(new pc.Color(0.4, 0.3, 0.2))
            });
            leg.setLocalPosition(...pos);
            leg.setLocalScale(0.1, 0.8, 0.1);
            this.entity.addChild(leg);
        });
    }
    
    createLighting() {
        const warmLight = new pc.Entity('warm-light');
        warmLight.addComponent('light', {
            type: 'point',
            color: new pc.Color(1, 0.85, 0.6),
            intensity: 2.5,
            range: 20,
            castShadows: true,
            shadowResolution: 1024
        });
        warmLight.setLocalPosition(0, 2.5, 0);
        this.entity.addChild(warmLight);
        
        const accentLight = new pc.Entity('accent-light');
        accentLight.addComponent('light', {
            type: 'point',
            color: new pc.Color(0.9, 0.75, 0.5),
            intensity: 1.2,
            range: 12,
            castShadows: false
        });
        accentLight.setLocalPosition(-3, 1.5, -3);
        this.entity.addChild(accentLight);
    }
    
    createWallMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.82, 0.75, 0.68);
        material.specular = new pc.Color(0.08, 0.08, 0.08);
        material.shininess = 15;
        material.update();
        return material;
    }
    
    createFloorMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.35, 0.28, 0.22);
        material.specular = new pc.Color(0.15, 0.15, 0.15);
        material.shininess = 40;
        material.update();
        return material;
    }
    
    createCeilingMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.9, 0.88, 0.85);
        material.specular = new pc.Color(0.05, 0.05, 0.05);
        material.update();
        return material;
    }
    
    createFurnitureMaterial(color) {
        const material = new pc.StandardMaterial();
        material.diffuse = color;
        material.specular = new pc.Color(0.12, 0.12, 0.12);
        material.shininess = 25;
        material.update();
        return material;
    }
    
    show() {
        this.entity.enabled = true;
    }
    
    hide() {
        this.entity.enabled = false;
    }
    
    teleportPlayer(player) {
        const interiorY = GameConfig.player.height / 2;
        player.entity.rigidbody.teleport(500, interiorY, 600);
        player.rotation.set(0, 0);
    }
}

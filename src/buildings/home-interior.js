class HomeInterior {
    constructor(app, gameManager, building) {
        this.app = app;
        this.gameManager = gameManager;
        this.building = building;
        this.entity = null;
        this.rooms = [];
        
        this.create();
    }
    
    create() {
        this.entity = new pc.Entity('home-interior');
        this.entity.setPosition(500, 0, 500);
        this.entity.enabled = false;
        this.app.root.addChild(this.entity);
        
        this.createWalls();
        this.createFloor();
        this.createCeiling();
        this.createFurniture();
        this.createLighting();
        this.createFocalWall();
    }
    
    createWalls() {
        const wallMaterial = this.createWallMaterial();
        const wallHeight = 3;
        const wallThickness = 0.2;
        
        const walls = [
            { pos: [0, wallHeight/2, -8], scale: [16, wallHeight, wallThickness] },
            { pos: [0, wallHeight/2, 8], scale: [16, wallHeight, wallThickness] },
            { pos: [-8, wallHeight/2, 0], scale: [wallThickness, wallHeight, 16] },
            { pos: [8, wallHeight/2, 0], scale: [wallThickness, wallHeight, 16] }
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
        
        const baseboard = new pc.Entity('baseboard');
        baseboard.addComponent('render', {
            type: 'box',
            material: this.createMaterial(new pc.Color(0.3, 0.25, 0.2))
        });
        baseboard.setLocalScale(16.2, 0.15, 16.2);
        baseboard.setLocalPosition(0, 0.075, 0);
        this.entity.addChild(baseboard);
    }
    
    createFloor() {
        const floor = new pc.Entity('floor');
        floor.addComponent('render', {
            type: 'box',
            material: this.createFloorMaterial()
        });
        floor.setLocalScale(16, 0.1, 16);
        floor.setLocalPosition(0, 0, 0);
        this.entity.addChild(floor);
    }
    
    createCeiling() {
        const ceiling = new pc.Entity('ceiling');
        ceiling.addComponent('render', {
            type: 'box',
            material: this.createCeilingMaterial()
        });
        ceiling.setLocalScale(16, 0.1, 16);
        ceiling.setLocalPosition(0, 3, 0);
        this.entity.addChild(ceiling);
    }
    
    createFurniture() {
        this.createDesk();
        this.createChair();
        this.createBed();
        this.createBookshelf();
        this.createTable();
        this.createRug();
        this.createPlant();
    }
    
    createDesk() {
        const deskTop = new pc.Entity('desk-top');
        deskTop.addComponent('render', {
            type: 'box',
            material: this.createFurnitureMaterial(new pc.Color(0.42, 0.35, 0.25))
        });
        deskTop.setLocalPosition(-5, 0.85, -5);
        deskTop.setLocalScale(2.5, 0.1, 1.2);
        this.entity.addChild(deskTop);
        
        const legPositions = [
            [-5.9, 0.4, -5.4],
            [-4.1, 0.4, -5.4],
            [-5.9, 0.4, -4.6],
            [-4.1, 0.4, -4.6]
        ];
        
        legPositions.forEach((pos, i) => {
            const leg = new pc.Entity(`desk-leg-${i}`);
            leg.addComponent('render', {
                type: 'box',
                material: this.createFurnitureMaterial(new pc.Color(0.38, 0.31, 0.22))
            });
            leg.setLocalPosition(...pos);
            leg.setLocalScale(0.12, 0.8, 0.12);
            this.entity.addChild(leg);
        });
        
        const shadow = new pc.Entity('desk-shadow');
        shadow.addComponent('render', {
            type: 'cylinder',
            material: this.createShadowMaterial()
        });
        shadow.setLocalScale(3, 0.02, 1.5);
        shadow.setLocalPosition(-5, 0.06, -5);
        shadow.setLocalEulerAngles(-90, 0, 0);
        this.entity.addChild(shadow);
    }
    
    createChair() {
        const chair = new pc.Entity('chair');
        chair.addComponent('render', {
            type: 'box',
            material: this.createFurnitureMaterial(new pc.Color(0.25, 0.25, 0.35))
        });
        chair.setLocalPosition(-5, 0.4, -3.5);
        chair.setLocalScale(0.7, 0.9, 0.7);
        this.entity.addChild(chair);
    }
    
    createBed() {
        const bed = new pc.Entity('bed');
        bed.addComponent('render', {
            type: 'box',
            material: this.createFurnitureMaterial(new pc.Color(0.55, 0.45, 0.4))
        });
        bed.setLocalPosition(5, 0.5, -5.5);
        bed.setLocalScale(2.5, 1, 3.5);
        this.entity.addChild(bed);
        
        const shadow = new pc.Entity('bed-shadow');
        shadow.addComponent('render', {
            type: 'cylinder',
            material: this.createShadowMaterial()
        });
        shadow.setLocalScale(3, 0.02, 4.2);
        shadow.setLocalPosition(5, 0.06, -5.5);
        shadow.setLocalEulerAngles(-90, 0, 0);
        this.entity.addChild(shadow);
    }
    
    createBookshelf() {
        const bookshelf = new pc.Entity('bookshelf');
        bookshelf.addComponent('render', {
            type: 'box',
            material: this.createFurnitureMaterial(new pc.Color(0.35, 0.28, 0.18))
        });
        bookshelf.setLocalPosition(-7, 1.2, 5);
        bookshelf.setLocalScale(1.8, 2.4, 0.4);
        this.entity.addChild(bookshelf);
    }
    
    createTable() {
        const table = new pc.Entity('table');
        table.addComponent('render', {
            type: 'box',
            material: this.createFurnitureMaterial(new pc.Color(0.48, 0.38, 0.28))
        });
        table.setLocalPosition(2, 0.6, 5.5);
        table.setLocalScale(2, 1.2, 2);
        this.entity.addChild(table);
        
        const shadow = new pc.Entity('table-shadow');
        shadow.addComponent('render', {
            type: 'cylinder',
            material: this.createShadowMaterial()
        });
        shadow.setLocalScale(2.4, 0.02, 2.4);
        shadow.setLocalPosition(2, 0.06, 5.5);
        shadow.setLocalEulerAngles(-90, 0, 0);
        this.entity.addChild(shadow);
    }
    
    createRug() {
        const rug = new pc.Entity('rug');
        rug.addComponent('render', {
            type: 'box',
            material: this.createFurnitureMaterial(new pc.Color(0.5, 0.35, 0.3))
        });
        rug.setLocalPosition(0, 0.05, 0);
        rug.setLocalScale(10, 0.05, 10);
        this.entity.addChild(rug);
    }
    
    createPlant() {
        const plant = new pc.Entity('plant');
        plant.addComponent('render', {
            type: 'box',
            material: this.createFurnitureMaterial(new pc.Color(0.2, 0.5, 0.25))
        });
        plant.setLocalPosition(6, 0.6, 6);
        plant.setLocalScale(0.4, 1.2, 0.4);
        this.entity.addChild(plant);
    }
    
    createFocalWall() {
        const focalBoard = new pc.Entity('focal-board');
        focalBoard.addComponent('render', {
            type: 'box',
            material: this.createFocalBoardMaterial()
        });
        focalBoard.setLocalScale(3, 2, 0.1);
        focalBoard.setLocalPosition(-5, 1.8, -7.85);
        this.entity.addChild(focalBoard);
        
        const boardLight = new pc.Entity('board-light');
        boardLight.addComponent('light', {
            type: 'spot',
            color: new pc.Color(1, 0.95, 0.85),
            intensity: 0.8,
            range: 6,
            innerConeAngle: 20,
            outerConeAngle: 35,
            castShadows: false
        });
        boardLight.setLocalPosition(-5, 2.7, -6);
        boardLight.setLocalEulerAngles(45, 0, 0);
        this.entity.addChild(boardLight);
    }
    
    createFocalBoardMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.25, 0.3, 0.35);
        material.specular = new pc.Color(0.05, 0.05, 0.05);
        material.emissive = new pc.Color(0.05, 0.06, 0.07);
        material.update();
        return material;
    }
    
    createShadowMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0, 0, 0);
        material.opacity = 0.25;
        material.blendType = pc.BLEND_NORMAL;
        material.update();
        return material;
    }
    
    createLighting() {
        const mainLight = new pc.Entity('main-light');
        mainLight.addComponent('light', {
            type: 'point',
            color: new pc.Color(1, 0.9, 0.7),
            intensity: 2,
            range: 25,
            castShadows: true,
            shadowResolution: 1024
        });
        mainLight.setLocalPosition(0, 2.5, 0);
        this.entity.addChild(mainLight);
        
        const fillLight = new pc.Entity('fill-light');
        fillLight.addComponent('light', {
            type: 'point',
            color: new pc.Color(0.7, 0.75, 0.8),
            intensity: 0.8,
            range: 15,
            castShadows: false
        });
        fillLight.setLocalPosition(5, 2, 5);
        this.entity.addChild(fillLight);
        
        const ambientLight = new pc.Entity('ambient-light');
        ambientLight.addComponent('light', {
            type: 'directional',
            color: new pc.Color(0.4, 0.35, 0.3),
            intensity: 0.4,
            castShadows: false
        });
        ambientLight.setLocalEulerAngles(50, 30, 0);
        this.entity.addChild(ambientLight);
    }
    
    createWallMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.85, 0.82, 0.75);
        material.specular = new pc.Color(0.08, 0.08, 0.08);
        material.shininess = 15;
        material.update();
        return material;
    }
    
    createFloorMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.38, 0.32, 0.26);
        material.specular = new pc.Color(0.15, 0.15, 0.15);
        material.shininess = 40;
        material.update();
        return material;
    }
    
    createCeilingMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.92, 0.90, 0.88);
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
    
    createMaterial(color) {
        const material = new pc.StandardMaterial();
        material.diffuse = color;
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
        player.setPosition(500, 0, 500);
        player.rotation.set(0, 0);
    }
}

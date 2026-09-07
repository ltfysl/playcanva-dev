class OfficeInterior {
    constructor(app, gameManager, building) {
        this.app = app;
        this.gameManager = gameManager;
        this.building = building;
        this.entity = null;
        this.playerSpawnPoint = null;
        this.create();
    }
    
    create() {
        this.entity = new pc.Entity('office-interior');
        
        const floor = new pc.Entity('floor');
        floor.addComponent('render', {
            type: 'box',
            material: this.createFloorMaterial()
        });
        floor.setLocalScale(14, 0.2, 14);
        floor.setLocalPosition(0, -0.1, 0);
        this.entity.addChild(floor);
        
        const walls = this.createWalls();
        walls.forEach(wall => this.entity.addChild(wall));
        
        const ceiling = new pc.Entity('ceiling');
        ceiling.addComponent('render', {
            type: 'box',
            material: this.createCeilingMaterial()
        });
        ceiling.setLocalScale(14, 0.2, 14);
        ceiling.setLocalPosition(0, 4.1, 0);
        this.entity.addChild(ceiling);
        
        const desk = this.createDesk();
        this.entity.addChild(desk);
        
        this.addLighting();
        
        this.playerSpawnPoint = new pc.Vec3(0, 0.9, 4);
        
        this.entity.enabled = false;
        this.app.root.addChild(this.entity);
    }
    
    createWalls() {
        const walls = [];
        const wallHeight = 4;
        const wallThickness = 0.2;
        const roomSize = 14;
        
        const wallMaterial = this.createWallMaterial();
        
        const backWall = new pc.Entity('back-wall');
        backWall.addComponent('render', {
            type: 'box',
            material: wallMaterial
        });
        backWall.setLocalScale(roomSize, wallHeight, wallThickness);
        backWall.setLocalPosition(0, wallHeight / 2, -roomSize / 2);
        walls.push(backWall);
        
        const leftWall = new pc.Entity('left-wall');
        leftWall.addComponent('render', {
            type: 'box',
            material: wallMaterial
        });
        leftWall.setLocalScale(wallThickness, wallHeight, roomSize);
        leftWall.setLocalPosition(-roomSize / 2, wallHeight / 2, 0);
        walls.push(leftWall);
        
        const rightWall = new pc.Entity('right-wall');
        rightWall.addComponent('render', {
            type: 'box',
            material: wallMaterial
        });
        rightWall.setLocalScale(wallThickness, wallHeight, roomSize);
        rightWall.setLocalPosition(roomSize / 2, wallHeight / 2, 0);
        walls.push(rightWall);
        
        const frontWall = new pc.Entity('front-wall');
        frontWall.addComponent('render', {
            type: 'box',
            material: wallMaterial
        });
        frontWall.setLocalScale(roomSize, wallHeight, wallThickness);
        frontWall.setLocalPosition(0, wallHeight / 2, roomSize / 2);
        walls.push(frontWall);
        
        return walls;
    }
    
    createDesk() {
        const desk = new pc.Entity('desk');
        
        const deskTop = new pc.Entity('desk-top');
        deskTop.addComponent('render', {
            type: 'box',
            material: this.createDeskMaterial()
        });
        deskTop.setLocalScale(3, 0.1, 1.5);
        deskTop.setLocalPosition(0, 1.5, -3);
        desk.addChild(deskTop);
        
        const leg1 = new pc.Entity('leg1');
        leg1.addComponent('render', {
            type: 'box',
            material: this.createDeskMaterial()
        });
        leg1.setLocalScale(0.1, 1.4, 0.1);
        leg1.setLocalPosition(-1.3, 0.7, -3.6);
        desk.addChild(leg1);
        
        const leg2 = new pc.Entity('leg2');
        leg2.addComponent('render', {
            type: 'box',
            material: this.createDeskMaterial()
        });
        leg2.setLocalScale(0.1, 1.4, 0.1);
        leg2.setLocalPosition(1.3, 0.7, -3.6);
        desk.addChild(leg2);
        
        const leg3 = new pc.Entity('leg3');
        leg3.addComponent('render', {
            type: 'box',
            material: this.createDeskMaterial()
        });
        leg3.setLocalScale(0.1, 1.4, 0.1);
        leg3.setLocalPosition(-1.3, 0.7, -2.4);
        desk.addChild(leg3);
        
        const leg4 = new pc.Entity('leg4');
        leg4.addComponent('render', {
            type: 'box',
            material: this.createDeskMaterial()
        });
        leg4.setLocalScale(0.1, 1.4, 0.1);
        leg4.setLocalPosition(1.3, 0.7, -2.4);
        desk.addChild(leg4);
        
        return desk;
    }
    
    addLighting() {
        const ambientLight = new pc.Entity('ambient-light');
        ambientLight.addComponent('light', {
            type: 'directional',
            color: new pc.Color(0.95, 0.88, 0.75),
            intensity: 0.6
        });
        ambientLight.setLocalEulerAngles(45, 30, 0);
        this.entity.addChild(ambientLight);
        
        const deskLight = new pc.Entity('desk-light');
        deskLight.addComponent('light', {
            type: 'point',
            color: new pc.Color(1.0, 0.9, 0.7),
            intensity: 1.2,
            range: 8
        });
        deskLight.setLocalPosition(0, 2.5, -3);
        this.entity.addChild(deskLight);
    }
    
    createFloorMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.25, 0.22, 0.20);
        material.specular = new pc.Color(0.1, 0.1, 0.1);
        material.shininess = 20;
        material.update();
        return material;
    }
    
    createWallMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.85, 0.83, 0.80);
        material.specular = new pc.Color(0.05, 0.05, 0.05);
        material.shininess = 10;
        material.update();
        return material;
    }
    
    createCeilingMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.95, 0.95, 0.92);
        material.specular = new pc.Color(0.05, 0.05, 0.05);
        material.shininess = 10;
        material.update();
        return material;
    }
    
    createDeskMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.35, 0.25, 0.18);
        material.specular = new pc.Color(0.15, 0.15, 0.15);
        material.shininess = 30;
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
        const x = this.playerSpawnPoint.x;
        const y = this.playerSpawnPoint.y;
        const z = this.playerSpawnPoint.z;
        
        player.entity.rigidbody.teleport(x, y, z);
    }
}

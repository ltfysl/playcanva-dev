class Building {
    constructor(app, gameManager, id, name, position, kind, unlockState) {
        this.app = app;
        this.gameManager = gameManager;
        this.id = id;
        this.name = name;
        this.position = position;
        this.kind = kind;
        this.unlockState = unlockState;
        this.entity = null;
        this.interior = null;
        this.doorPosition = null;
        this.kindConfig = GameConfig.buildingKinds[kind] || GameConfig.buildingKinds.office;
        
        this.create();
        this.gameManager.registerBuilding(this);
    }
    
    create() {
        this.entity = new pc.Entity(`building-${this.id}`);
        
        const baseScale = this.kindConfig.baseScale;
        const color = this.kindConfig.color;
        const accentColor = this.kindConfig.accentColor;
        
        const mainBody = new pc.Entity('main-body');
        mainBody.addComponent('render', {
            type: 'box',
            material: this.createMaterial(color)
        });
        mainBody.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(baseScale.x / 2, baseScale.y / 2, baseScale.z / 2)
        });
        mainBody.addComponent('rigidbody', {
            type: 'static'
        });
        mainBody.setLocalScale(baseScale.x, baseScale.y, baseScale.z);
        mainBody.setLocalPosition(0, baseScale.y / 2, 0);
        this.entity.addChild(mainBody);
        
        if (this.kindConfig.roofType === 'pitched') {
            this.createPitchedRoof(baseScale, accentColor);
        } else {
            this.createFlatRoof(baseScale, accentColor);
        }
        
        this.createWindows(baseScale, this.kindConfig.windowDensity);
        
        this.createShadowCatcher(baseScale);
        
        this.entity.setPosition(this.position);
        this.app.root.addChild(this.entity);
        
        this.doorPosition = new pc.Vec3(
            this.position.x,
            0,
            this.position.z + baseScale.z / 2 + 1.5
        );
    }
    
    createPitchedRoof(baseScale, color) {
        const roof = new pc.Entity('roof');
        roof.addComponent('render', {
            type: 'cone',
            material: this.createMaterial(color)
        });
        
        const roofHeight = baseScale.y * 0.3;
        roof.setLocalScale(baseScale.x * 0.7, roofHeight, baseScale.z * 0.7);
        roof.setLocalPosition(0, baseScale.y + roofHeight / 2, 0);
        roof.setLocalEulerAngles(0, 45, 0);
        this.entity.addChild(roof);
    }
    
    createFlatRoof(baseScale, color) {
        const roof = new pc.Entity('roof');
        roof.addComponent('render', {
            type: 'box',
            material: this.createMaterial(color, 0.9)
        });
        
        roof.setLocalScale(baseScale.x * 1.05, 0.5, baseScale.z * 1.05);
        roof.setLocalPosition(0, baseScale.y + 0.25, 0);
        this.entity.addChild(roof);
    }
    
    createWindows(baseScale, density) {
        const windowMaterial = this.createWindowMaterial();
        const windowSize = 1.2;
        const spacing = 2.5;
        
        const windowsPerSide = Math.floor(baseScale.x / spacing * density);
        const floors = Math.floor(baseScale.y / 3);
        
        for (let floor = 0; floor < floors; floor++) {
            const y = (floor + 0.5) * 3 + 1;
            
            for (let i = 0; i < windowsPerSide; i++) {
                const offset = (i - windowsPerSide / 2) * spacing;
                
                this.createWindow(windowMaterial, offset, y, baseScale.z / 2 + 0.05, windowSize);
                this.createWindow(windowMaterial, offset, y, -baseScale.z / 2 - 0.05, windowSize);
                this.createWindow(windowMaterial, baseScale.x / 2 + 0.05, y, offset, windowSize);
                this.createWindow(windowMaterial, -baseScale.x / 2 - 0.05, y, offset, windowSize);
            }
        }
    }
    
    createWindow(material, x, y, z, size) {
        const window = new pc.Entity('window');
        window.addComponent('render', {
            type: 'box',
            material: material
        });
        window.setLocalScale(size, size * 1.2, 0.1);
        window.setLocalPosition(x, y, z);
        
        if (Math.abs(z) > Math.abs(x)) {
            window.setLocalEulerAngles(0, 0, 0);
        } else {
            window.setLocalEulerAngles(0, 90, 0);
        }
        
        this.entity.addChild(window);
    }
    
    createWindowMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.2, 0.3, 0.4);
        material.emissive = new pc.Color(0.3, 0.35, 0.4);
        material.opacity = 0.7;
        material.blendType = pc.BLEND_NORMAL;
        material.update();
        return material;
    }
    
    createShadowCatcher(baseScale) {
        const shadow = new pc.Entity('shadow-ao');
        shadow.addComponent('render', {
            type: 'cylinder',
            material: this.createAOMaterial()
        });
        
        shadow.setLocalScale(baseScale.x * 1.1, 0.05, baseScale.z * 1.1);
        shadow.setLocalPosition(0, 0.05, 0);
        shadow.setLocalEulerAngles(-90, 0, 0);
        this.entity.addChild(shadow);
    }
    
    createAOMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0, 0, 0);
        material.opacity = 0.3;
        material.blendType = pc.BLEND_NORMAL;
        material.update();
        return material;
    }
    
    createMaterial(color, opacity = 1.0) {
        const material = new pc.StandardMaterial();
        material.diffuse = color;
        material.specular = new pc.Color(0.15, 0.15, 0.15);
        material.shininess = 25;
        
        if (opacity < 1.0) {
            material.opacity = opacity;
            material.blendType = pc.BLEND_NORMAL;
        }
        
        material.update();
        return material;
    }
    
    setEnterable(enterable) {
        if (enterable) {
            this.createDoor();
            this.createPorch();
        }
    }
    
    createDoor() {
        const door = new pc.Entity('door');
        door.addComponent('render', {
            type: 'box',
            material: this.createDoorMaterial()
        });
        
        door.setLocalScale(2.5, 3.5, 0.2);
        door.setPosition(
            this.doorPosition.x,
            1.75,
            this.doorPosition.z - 0.5
        );
        this.entity.addChild(door);
        
        const doorFrame = new pc.Entity('door-frame');
        doorFrame.addComponent('render', {
            type: 'box',
            material: this.createMaterial(this.kindConfig.accentColor)
        });
        doorFrame.setLocalScale(3, 4, 0.3);
        doorFrame.setPosition(
            this.doorPosition.x,
            2,
            this.doorPosition.z - 0.6
        );
        this.entity.addChild(doorFrame);
    }
    
    createPorch() {
        const porch = new pc.Entity('porch');
        porch.addComponent('render', {
            type: 'box',
            material: this.createMaterial(new pc.Color(0.4, 0.35, 0.3))
        });
        
        porch.setLocalScale(4, 0.3, 2);
        porch.setPosition(
            this.doorPosition.x,
            0.15,
            this.doorPosition.z
        );
        this.entity.addChild(porch);
    }
    
    createDoorMaterial() {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(0.35, 0.25, 0.15);
        material.emissive = new pc.Color(0.15, 0.12, 0.08);
        material.specular = new pc.Color(0.1, 0.1, 0.1);
        material.shininess = 40;
        material.update();
        return material;
    }
    
    setInterior(interior) {
        this.interior = interior;
    }
    
    isNearby(playerPos, distance) {
        if (!this.doorPosition) return false;
        
        const dx = playerPos.x - this.doorPosition.x;
        const dz = playerPos.z - this.doorPosition.z;
        const distSq = dx * dx + dz * dz;
        
        return distSq < distance * distance;
    }
    
    enter(player) {
        if (!this.interior) return;
        
        this.entity.enabled = false;
        
        this.interior.show();
        this.interior.teleportPlayer(player);
    }
    
    exit(player) {
        if (!this.interior) return;
        
        this.interior.hide();
        
        this.entity.enabled = true;
        
        player.setPosition(
            this.doorPosition.x,
            0,
            this.doorPosition.z + 2
        );
    }
}

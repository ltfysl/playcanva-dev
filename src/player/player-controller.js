class PlayerController {
    constructor(app, camera) {
        this.app = app;
        this.camera = camera;
        this.entity = null;
        this.velocity = new pc.Vec3();
        this.rotation = new pc.Vec2(0, 0);
        this.isLocked = false;
        this.isSprinting = false;
        this.isGrounded = true;
        
        this.createEntity();
        this.setupMouseLock();
        this.setupInput();
    }
    
    createEntity() {
        this.entity = new pc.Entity('player');
        this.entity.addComponent('collision', {
            type: 'capsule',
            radius: 0.5,
            height: GameConfig.player.height
        });
        
        this.entity.addComponent('rigidbody', {
            type: 'dynamic',
            mass: 70,
            friction: 0.5,
            restitution: 0,
            linearDamping: 0.99,
            angularDamping: 0.99,
            angularFactor: new pc.Vec3(0, 0, 0),
            linearFactor: new pc.Vec3(1, 0, 1)
        });
        
        this.app.root.addChild(this.entity);
        
        this.camera.reparent(this.entity);
        this.camera.setLocalPosition(0, GameConfig.player.height - 0.2, 0);
        this.camera.setLocalEulerAngles(0, 0, 0);
    }
    
    setupMouseLock() {
        const canvas = this.app.graphicsDevice.canvas;
        let hasLockedOnce = false;
        
        canvas.addEventListener('click', () => {
            if (!this.isLocked) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === canvas;
            
            if (this.isLocked && !hasLockedOnce) {
                hasLockedOnce = true;
                const controlsHint = document.getElementById('controls-hint');
                if (controlsHint) {
                    controlsHint.style.transition = 'opacity 0.5s ease-out';
                    controlsHint.style.opacity = '0';
                    setTimeout(() => {
                        controlsHint.style.display = 'none';
                    }, 500);
                }
            }
        });
        
        document.addEventListener('pointerlockerror', () => {
            console.error('Pointer lock error');
        });
    }
    
    setupInput() {
        this.app.mouse.on(pc.EVENT_MOUSEMOVE, (event) => {
            if (!this.isLocked) return;
            
            this.rotation.x -= event.dy * GameConfig.player.mouseSensitivity;
            this.rotation.y -= event.dx * GameConfig.player.mouseSensitivity;
            
            this.rotation.x = pc.math.clamp(this.rotation.x, -85, 85);
        });
        
        this.app.keyboard.on(pc.EVENT_KEYDOWN, (event) => {
            if (event.key === pc.KEY_SHIFT) {
                this.isSprinting = true;
            }
        });
        
        this.app.keyboard.on(pc.EVENT_KEYUP, (event) => {
            if (event.key === pc.KEY_SHIFT) {
                this.isSprinting = false;
            }
        });
    }
    
    update(dt) {
        this.updateRotation();
        this.updateMovement(dt);
    }
    
    updateRotation() {
        this.entity.setLocalEulerAngles(0, this.rotation.y, 0);
        this.camera.setLocalEulerAngles(this.rotation.x, 0, 0);
    }
    
    updateMovement(dt) {
        const keyboard = this.app.keyboard;
        const moveDir = new pc.Vec3();
        
        if (keyboard.isPressed(pc.KEY_W)) {
            moveDir.z -= 1;
        }
        if (keyboard.isPressed(pc.KEY_S)) {
            moveDir.z += 1;
        }
        if (keyboard.isPressed(pc.KEY_A)) {
            moveDir.x -= 1;
        }
        if (keyboard.isPressed(pc.KEY_D)) {
            moveDir.x += 1;
        }
        
        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            
            const forward = this.entity.forward.clone();
            const right = this.entity.right.clone();
            
            forward.y = 0;
            right.y = 0;
            forward.normalize();
            right.normalize();
            
            const worldMoveDir = new pc.Vec3();
            worldMoveDir.add2(
                forward.mulScalar(-moveDir.z),
                right.mulScalar(moveDir.x)
            );
            
            const speed = this.isSprinting ? GameConfig.player.sprintSpeed : GameConfig.player.moveSpeed;
            this.velocity.copy(worldMoveDir.mulScalar(speed));
            
            const rigidbody = this.entity.rigidbody;
            const currentVel = rigidbody.linearVelocity;
            const targetVel = new pc.Vec3(this.velocity.x, currentVel.y, this.velocity.z);
            rigidbody.linearVelocity = targetVel;
        } else {
            const rigidbody = this.entity.rigidbody;
            const currentVel = rigidbody.linearVelocity;
            rigidbody.linearVelocity = new pc.Vec3(0, currentVel.y, 0);
        }
        
        const pos = this.entity.getPosition();
        if (pos.y < GameConfig.player.height / 2) {
            this.entity.rigidbody.teleport(pos.x, GameConfig.player.height / 2, pos.z);
            const rigidbody = this.entity.rigidbody;
            const vel = rigidbody.linearVelocity;
            vel.y = 0;
            rigidbody.linearVelocity = vel;
        }
    }
    
    setPosition(x, y, z) {
        this.entity.rigidbody.teleport(x, y + GameConfig.player.height / 2, z);
    }
    
    getPosition() {
        return this.entity.getPosition().clone();
    }
    
    lookAt(x, y, z) {
        const target = new pc.Vec3(x, y, z);
        const pos = this.entity.getPosition();
        const dir = target.clone().sub(pos).normalize();
        
        this.rotation.y = Math.atan2(dir.x, dir.z) * pc.math.RAD_TO_DEG;
    }
}

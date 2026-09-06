class LightingSystem {
    constructor(app) {
        this.app = app;
        this.sunLight = null;
        this.moonLight = null;
        this.timeOfDay = 0.5;
        this.daySpeed = 1.0 / GameConfig.lighting.dayDuration;
        this.isDay = true;
    }
    
    initialize() {
        this.createSunLight();
        this.createMoonLight();
        this.updateLighting();
        
        console.log('Lighting system initialized');
    }
    
    createSunLight() {
        this.sunLight = new pc.Entity('sun');
        this.sunLight.addComponent('light', {
            type: 'directional',
            color: new pc.Color(1.0, 0.95, 0.85),
            intensity: GameConfig.lighting.sunIntensity,
            castShadows: true,
            shadowResolution: GameConfig.graphics.shadowResolution,
            shadowDistance: 100
        });
        
        this.sunLight.setEulerAngles(50, 45, 0);
        this.app.root.addChild(this.sunLight);
    }
    
    createMoonLight() {
        this.moonLight = new pc.Entity('moon');
        this.moonLight.addComponent('light', {
            type: 'directional',
            color: new pc.Color(0.5, 0.6, 0.8),
            intensity: 0.25,
            castShadows: false
        });
        
        this.moonLight.setEulerAngles(135, 210, 0);
        this.moonLight.enabled = false;
        this.app.root.addChild(this.moonLight);
        
        this.fillLight = new pc.Entity('fill');
        this.fillLight.addComponent('light', {
            type: 'directional',
            color: new pc.Color(0.4, 0.5, 0.7),
            intensity: 0.35,
            castShadows: false
        });
        this.fillLight.setEulerAngles(30, 225, 0);
        this.app.root.addChild(this.fillLight);
    }
    
    update(dt) {
        this.timeOfDay += this.daySpeed * dt;
        
        if (this.timeOfDay >= 1.0) {
            this.timeOfDay = 0.0;
        }
        
        this.updateLighting();
    }
    
    updateLighting() {
        const angle = this.timeOfDay * 360;
        
        this.sunLight.setEulerAngles(angle - 90, 30, 0);
        
        const wasDay = this.isDay;
        this.isDay = this.timeOfDay < 0.5;
        
        if (this.isDay) {
            const dayProgress = this.timeOfDay * 2;
            const intensity = this.getSunIntensity(dayProgress);
            
            this.sunLight.light.intensity = intensity;
            this.sunLight.enabled = true;
            this.moonLight.enabled = false;
            
            this.updateAmbientLight(dayProgress);
            this.updateFogColor(dayProgress);
        } else {
            const nightProgress = (this.timeOfDay - 0.5) * 2;
            
            this.sunLight.enabled = false;
            this.moonLight.enabled = true;
            this.moonLight.light.intensity = 0.3;
            
            this.updateAmbientLight(0);
            this.updateFogColor(0);
        }
        
        if (wasDay !== this.isDay) {
            console.log(this.isDay ? 'Daytime' : 'Nighttime');
        }
    }
    
    getSunIntensity(dayProgress) {
        if (dayProgress < 0.1) {
            return pc.math.lerp(0.2, GameConfig.lighting.sunIntensity, dayProgress / 0.1);
        } else if (dayProgress > 0.9) {
            return pc.math.lerp(GameConfig.lighting.sunIntensity, 0.2, (dayProgress - 0.9) / 0.1);
        }
        return GameConfig.lighting.sunIntensity;
    }
    
    updateAmbientLight(dayProgress) {
        const ambientIntensity = pc.math.lerp(
            0.08,
            GameConfig.lighting.ambientIntensity,
            dayProgress
        );
        
        const ambientColor = new pc.Color().lerp(
            new pc.Color(0.15, 0.18, 0.25),
            new pc.Color(0.65, 0.68, 0.75),
            dayProgress
        );
        
        ambientColor.scale(ambientIntensity);
        this.app.scene.ambientLight = ambientColor;
    }
    
    updateFogColor(dayProgress) {
        const fogColor = new pc.Color().lerp(
            new pc.Color(0.12, 0.14, 0.22),
            new pc.Color(0.58, 0.65, 0.75),
            dayProgress
        );
        
        this.app.scene.fogColor = fogColor;
    }
    
    setTimeOfDay(time) {
        this.timeOfDay = pc.math.clamp(time, 0, 1);
        this.updateLighting();
    }
    
    getTimeOfDay() {
        return this.timeOfDay;
    }
}
